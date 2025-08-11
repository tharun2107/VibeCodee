import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview, SandpackConsole } from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';

function extractCodeBlock(text) {
  if (!text) return '';
  const str = String(text);
  const fenceRegex = /```\s*([a-zA-Z0-9+-]*)\n([\s\S]*?)```/g;
  let match;
  const blocks = [];
  while ((match = fenceRegex.exec(str)) !== null) {
    const lang = (match[1] || '').toLowerCase();
    const body = match[2] || '';
    blocks.push({ lang, body });
  }
  if (blocks.length > 0) {
    const preferredOrder = ['javascript', 'js', 'jsx', 'html'];
    for (const pref of preferredOrder) {
      const found = blocks.find((b) => b.lang.includes(pref));
      if (found) return found.body.trim();
    }
    blocks.sort((a, b) => b.body.length - a.body.length);
    return blocks[0].body.trim();
  }
  const lines = str.split(/\r?\n/);
  const idx = lines.findIndex((ln) => /^(const |let |var |function |import |export |document\.|window\.|\()/.test(ln.trim()));
  if (idx >= 0) return lines.slice(idx).join('\n').trim();
  return str.trim();
}

function useSandbox(htmlSource) {
  const iframeRef = useRef(null);
  const [logs, setLogs] = useState([]);

  const iframeHtml = useMemo(() => {
    const libs = `
      <!-- Tailwind via CDN -->
      <script src="https://cdn.tailwindcss.com"></script>
      <!-- React 18 UMD -->
      <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
      <!-- Babel standalone for JSX support -->
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    `;

    const bootstrap = `
      <script>
        (function(){
          function send(level, args){
            try {
              parent.postMessage({ 
                type: 'console', 
                level, 
                args: Array.from(args).map(a => {
                  try { 
                    return typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a); 
                  } catch(e){ 
                    return String(a); 
                  }
                }),
                timestamp: Date.now()
              }, '*');
            } catch(_){}
          }
          
          ['log','warn','error','info'].forEach(k=>{
            const orig = console[k];
            console[k] = function(){ 
              send(k, arguments); 
              try{ orig && orig.apply(console, arguments); }catch(_){} 
            };
          });
          
          window.addEventListener('error', function(e){
            send('error', ['Runtime Error: ' + e.message + ' @ ' + e.filename + ':' + e.lineno]);
          });
          
          window.addEventListener('unhandledrejection', function(e){
            const r = e && e.reason;
            send('error', ['Unhandled Promise Rejection: ' + (r && (r.stack || r.message) || r)]);
          });

          function executeUserCode(code){
            try {
              console.log('Executing user code...');
              
              // Clear previous content
              const rootEl = document.getElementById('root');
              const appEl = document.getElementById('app');
              if (rootEl) rootEl.innerHTML = '';
              if (appEl) appEl.innerHTML = '';
              
              // Ensure React is available
              if (!window.React || !window.ReactDOM) {
                console.error('React or ReactDOM not available');
                return;
              }
              
              let finalCode = String(code || '');
              
              try {
                // Transform JSX using Babel
                if (window.Babel) {
                  const result = window.Babel.transform(finalCode, { 
                    presets: ['react'],
                    plugins: ['transform-react-jsx']
                  });
                  finalCode = result.code || finalCode;
                  console.log('Code transpiled with Babel');
                }
              } catch (babelErr) {
                console.warn('Babel transform failed:', babelErr.message);
              }
              
              // Execute the code in a safe context
              try {
                // Create a new script element to execute the code
                const script = document.createElement('script');
                script.textContent = finalCode;
                document.head.appendChild(script);
                console.log('Code executed successfully');
              } catch (execError) {
                console.error('Code execution failed:', execError.message);
                // Show error in DOM
                const target = document.getElementById('root') || document.getElementById('app');
                if (target) {
                  target.innerHTML = '<div style="color: red; padding: 20px; font-family: monospace; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 20px;">' +
                    '<h3 style="margin: 0 0 10px 0; color: #dc2626;">Execution Error</h3>' +
                    '<pre style="margin: 0; white-space: pre-wrap;">' + execError.message + '</pre>' +
                  '</div>';
                }
              }
              
            } catch (err) {
              console.error('Code injection error:', err.message);
              const target = document.getElementById('root') || document.getElementById('app');
              if (target) {
                target.innerHTML = '<div style="color: red; padding: 20px; font-family: monospace; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 20px;">' +
                  '<h3 style="margin: 0 0 10px 0; color: #dc2626;">Execution Error</h3>' +
                  '<pre style="margin: 0; white-space: pre-wrap;">' + err.message + '</pre>' +
                '</div>';
              }
            }
          }

          window.addEventListener('message', function(e){
            try {
              if (e && e.data && e.data.type === 'execute') {
                executeUserCode(e.data.code || '');
              }
            } catch(err){
              console.error('Message handling error:', err.message);
            }
          });
        })();
      </script>
    `;
    
    return `<!doctype html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <style>
    html, body { height: 100%; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
    #app, #root { min-height: 100%; }
    * { box-sizing: border-box; }
  </style>
  ${libs}
</head>
<body>
  <div id="root"></div>
  <div id="app"></div>
  ${bootstrap}
</body>
</html>`;
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e?.data?.type === 'console') {
        setLogs((prev) => [...prev.slice(-99), { 
          level: e.data.level, 
          args: e.data.args, 
          timestamp: e.data.timestamp || Date.now() 
        }]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    setLogs([]);
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(iframeHtml);
      doc.close();
      
      const cw = iframe.contentWindow;
      if (cw) {
        setTimeout(() => {
          cw.postMessage({ type: 'execute', code: htmlSource || '' }, '*');
        }, 100);
      }
    }
  }, [iframeHtml, htmlSource]);

  return { iframeRef, logs, clearLogs: () => setLogs([]) };
}

function App() {
  const [prompt, setPrompt] = useState('Create a beautiful React todo app with drag & drop functionality using Tailwind CSS');
  const [code, setCode] = useState(`import React, { useState } from 'react';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Todo App</h1>
        
        <div className="flex mb-4">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new todo..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTodo}
            className="px-6 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {todos.map(todo => (
            <div key={todo.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="mr-3 h-4 w-4 text-blue-600 rounded"
              />
              <span className={\`flex-1 \${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}\`}>
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="ml-3 px-3 py-1 text-red-500 hover:bg-red-50 rounded"
              >
                ×
              </button>
            </div>
          ))}
          {todos.length === 0 && (
            <p className="text-gray-500 text-center py-8">No todos yet. Add one above!</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Render the component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(TodoApp));

export default TodoApp;`);
  
  const [jwt, setJwt] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [useSandpack, setUseSandpack] = useState(true); // Default to Sandpack
  const [styleMode, setStyleMode] = useState('tailwind');
  const [activeTab, setActiveTab] = useState('preview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { iframeRef, logs, clearLogs } = useSandbox(code);
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  const handleGenerate = useCallback(async () => {
    if (!jwt) { 
      alert('Please enter your JWT token first!'); 
      return; 
    }
    
    if (!prompt.trim()) {
      alert('Please enter a prompt describing what you want to build!');
      return;
    }
    
    setLoading(true); 
    setErrorText(''); 
    clearLogs();
    
    try {
      const res = await fetch(`${apiBase}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ 
          prompt, 
          model: model || undefined, 
          styleMode 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const raw = data.code || '';
      const cleaned = extractCodeBlock(raw);
      
      if (cleaned !== raw) {
        console.log('Extracted code from markdown fences');
      }
      
      setCode(cleaned);
      setActiveTab('preview');
      
    } catch (e) {
      const errorMsg = e.message || 'Generation failed';
      setErrorText(errorMsg);
      console.error('Generation error:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [apiBase, clearLogs, jwt, model, prompt, styleMode]);

  const handleFix = useCallback(async () => {
    if (!jwt) { 
      alert('Please enter your JWT token first!'); 
      return; 
    }
    
    if (!code.trim()) {
      alert('No code to fix! Generate some code first.');
      return;
    }
    
    setLoading(true); 
    setErrorText('');
    
    try {
      const lastError = [...logs].reverse().find(l => l.level === 'error');
      const errMsg = lastError ? 
        lastError.args.join(' ') : 
        'No explicit error found. Please improve code quality and fix any potential issues.';
      
      const res = await fetch(`${apiBase}/fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ 
          code, 
          error: errMsg, 
          model: model || undefined, 
          styleMode 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const raw = data.code || '';
      const cleaned = extractCodeBlock(raw);
      
      if (cleaned !== raw) {
        console.log('Extracted fixed code from markdown fences');
      }
      
      setCode(cleaned);
      setActiveTab('preview');
      
    } catch (e) {
      const errorMsg = e.message || 'Fix failed';
      setErrorText(errorMsg);
      console.error('Fix error:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [apiBase, code, jwt, model, logs, styleMode]);

  // Transform code for Sandpack
  const sandpackFiles = useMemo(() => {
    let transformedCode = code;
    
    // Ensure proper imports
    if (!transformedCode.includes('import React')) {
      transformedCode = `import React, { useState, useEffect } from 'react';\n\n${transformedCode}`;
    }
    
    // Remove any rendering code at the end for Sandpack
    transformedCode = transformedCode.replace(/\/\/ Render the component[\s\S]*$/, '');
    transformedCode = transformedCode.replace(/const root = ReactDOM\.createRoot[\s\S]*$/, '');
    transformedCode = transformedCode.replace(/ReactDOM\.render[\s\S]*$/, '');
    
    // Ensure proper export
    if (!transformedCode.includes('export default')) {
      // Find the main component name
      const componentMatch = transformedCode.match(/function\s+(\w+)/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        if (!transformedCode.includes(`export default ${componentName}`)) {
          transformedCode += `\n\nexport default ${componentName};`;
        }
      } else {
        // If no function component found, wrap the code
        transformedCode = `import React, { useState, useEffect } from 'react';

export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Generated App</h1>
      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
        {${JSON.stringify(code)}}
      </pre>
    </div>
  );
}`;
      }
    }
    
    return {
      '/App.js': {
        code: transformedCode
      },
      '/index.js': {
        code: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(<App />);`
      },
      '/public/index.html': {
        code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VibeCode Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
</body>
</html>`
      }
    };
  }, [code]);

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Left Sidebar - Prompt & Controls */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-black/30 backdrop-blur-sm border-r border-purple-500/20 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-purple-500/20 flex items-center gap-3">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            <div className="w-5 h-5 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-purple-300"></div>
              <div className="w-full h-0.5 bg-purple-300"></div>
              <div className="w-full h-0.5 bg-purple-300"></div>
            </div>
          </button>
          {!sidebarCollapsed && (
            <>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VC</span>
              </div>
              <div className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                VibeCode
              </div>
            </>
          )}
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Prompt Section */}
            <div className="p-4 border-b border-purple-500/20">
              <label className="block text-sm font-semibold text-purple-300 mb-2">
                Describe your app
              </label>
              <textarea
                className="w-full h-24 bg-black/40 border border-purple-500/30 rounded-xl px-3 py-2 text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="e.g., Create a modern todo app with drag & drop..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {/* API Configuration */}
            <div className="p-4 space-y-3 border-b border-purple-500/20">
              <div>
                <label className="block text-xs font-semibold text-purple-300 mb-1">
                  JWT Token *
                </label>
                <input
                  type="password"
                  className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-3 py-2 text-xs placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your JWT token"
                  value={jwt}
                  onChange={(e) => setJwt(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    Model
                  </label>
                  <input
                    className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-3 py-2 text-xs placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Optional"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    Style
                  </label>
                  <select
                    className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={styleMode}
                    onChange={(e) => setStyleMode(e.target.value)}
                  >
                    <option value="tailwind">Tailwind</option>
                    <option value="css">Plain CSS</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="sandpack" 
                  checked={useSandpack} 
                  onChange={(e) => setUseSandpack(e.target.checked)} 
                  className="rounded"
                />
                <label htmlFor="sandpack" className="text-xs text-purple-300">
                  Use Sandpack (CodeSandbox)
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 space-y-3">
              <button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </div>
                ) : (
                  '✨ Generate Code'
                )}
              </button>

              <button
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={handleFix}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Fixing...
                  </div>
                ) : (
                  '🔧 AI Fix'
                )}
              </button>
            </div>

            {/* Error Display */}
            {errorText && (
              <div className="mx-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="text-red-400 text-xs">
                  <strong>Error:</strong> {errorText}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {useSandpack ? (
          /* Sandpack Layout */
          <div className="flex-1 min-h-0">
            <SandpackProvider 
              template="react" 
              theme={nightOwl} 
              files={sandpackFiles} 
              options={{ 
                activeFile: '/App.js',
                visibleFiles: ['/App.js'],
                externalResources: [
                  "https://cdn.tailwindcss.com"
                ]
              }}
              customSetup={{
                dependencies: {
                  "react": "^18.0.0",
                  "react-dom": "^18.0.0"
                }
              }}
            >
              <SandpackLayout style={{ height: '100%' }}>
                <div className="flex-1 min-h-0 border-r border-purple-500/20">
                  <SandpackCodeEditor
                    showTabs={true}
                    showLineNumbers={true}
                    wrapContent={true}
                    style={{ height: '100%' }}
                    showInlineErrors={true}
                    showNavigator={true}
                  />
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 min-h-0 bg-white">
                    <SandpackPreview
                      style={{
                        height: '100%',
                        border: 'none',
                        borderRadius: '0'
                      }}
                      showNavigator={true}
                      showRefreshButton={true}
                      showOpenInCodeSandbox={true}
                    />
                  </div>
                  <div className="h-48 border-t border-purple-500/20 bg-black/10">
                    <SandpackConsole
                      maxMessageCount={100}
                      showSyntaxError={true}
                      showSetupProgress={false}
                    />
                  </div>
                </div>
              </SandpackLayout>
            </SandpackProvider>
          </div>
        ) : (
          /* Custom Layout */
          <>
            {/* Code Editor */}
            <div className="flex-1 min-h-0 flex">
              <div className="flex-1 min-h-0 bg-black/20 backdrop-blur-sm border-r border-purple-500/20 flex flex-col">
                <div className="px-4 py-3 border-b border-purple-500/20 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-2 text-sm font-semibold">Code Editor</span>
                </div>
                <textarea
                  className="flex-1 p-4 font-mono text-sm bg-transparent text-white outline-none resize-none"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Your generated code will appear here..."
                  spellCheck={false}
                />
              </div>

              {/* Right Panel - Preview & Console */}
              <div className="flex-1 min-h-0 flex flex-col bg-black/20 backdrop-blur-sm">
                {/* Tab Headers */}
                <div className="px-4 py-3 border-b border-purple-500/20 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        activeTab === 'preview' 
                          ? 'bg-purple-500 text-white' 
                          : 'text-purple-300 hover:text-white hover:bg-purple-500/20'
                      }`}
                      onClick={() => setActiveTab('preview')}
                    >
                      Preview
                    </button>
                    <button
                      className={`px-3 py-1 text-xs rounded-lg transition-colors relative ${
                        activeTab === 'console' 
                          ? 'bg-purple-500 text-white' 
                          : 'text-purple-300 hover:text-white hover:bg-purple-500/20'
                      }`}
                      onClick={() => setActiveTab('console')}
                    >
                      Console
                      {logs.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {logs.length > 9 ? '9+' : logs.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-0">
                  {activeTab === 'preview' ? (
                    <iframe 
                      ref={iframeRef} 
                      title="preview" 
                      className="w-full h-full bg-white" 
                    />
                  ) : (
                    <div className="h-full overflow-auto">
                      <div className="p-3 border-b border-purple-500/20 flex items-center justify-between">
                        <span className="text-sm font-semibold flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          Console Output ({logs.length})
                        </span>
                        <button 
                          className="text-xs text-purple-300 hover:text-purple-100 underline transition-colors" 
                          onClick={clearLogs}
                        >
                          Clear
                        </button>
                      </div>
                      <div className="p-3 space-y-2 text-xs font-mono">
                        {logs.length === 0 ? (
                          <div className="text-purple-400/60 text-center py-8">
                            No console output yet. Generate some code to see logs here.
                          </div>
                        ) : (
                          logs.map((log, i) => (
                            <div 
                              key={i} 
                              className={`p-2 rounded-lg border ${
                                log.level === 'error'
                                  ? 'text-red-400 bg-red-900/20 border-red-500/30'
                                  : log.level === 'warn'
                                    ? 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
                                    : 'text-purple-300 bg-purple-900/20 border-purple-500/30'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-semibold uppercase text-xs opacity-70">
                                  [{log.level}]
                                </span>
                                <span className="flex-1">
                                  {log.args.join(' ')}
                                </span>
                                {log.timestamp && (
                                  <span className="text-xs opacity-50">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;