import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import { FiFolder, FiFile, FiPlay, FiSend, FiSettings, FiPlus, FiChevronLeft, FiChevronRight, FiX, FiCode, FiEye, FiTerminal, FiSave, FiDownload, FiTrash2 } from 'react-icons/fi';
import Editor from '@monaco-editor/react';

// File structure helper
const createFileStructure = () => [
  {
    id: 'root',
    name: 'project',
    type: 'folder',
    children: [
      {
        id: 'src',
        name: 'src',
        type: 'folder',
        children: [
          {
            id: 'App.jsx',
            name: 'App.jsx',
            type: 'file',
            language: 'javascript',
            content: `function TodoApp() {
  const [todos, setTodos] = React.useState([]);
  const [newTodo, setNewTodo] = React.useState('');
  
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
              <span className={'flex-1 ' + (todo.completed ? 'line-through text-gray-500' : 'text-gray-800')}>
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

window.MainComponent = TodoApp;`
          },
          {
            id: 'index.js',
            name: 'index.js',
            type: 'file',
            language: 'javascript',
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`
          }
        ]
      },
      {
        id: 'public',
        name: 'public',
        type: 'folder',
        children: [
          {
            id: 'index.html',
            name: 'index.html',
            type: 'file',
            language: 'html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VibeCode App</title>
  <script>
  // Suppress Tailwind CDN warning
  window.tailwindConfig = { darkMode: false };
</script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
          }
        ]
      }
    ]
  }
];

// Find file by ID
const findFileById = (tree, id) => {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findFileById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Extract code from Gemini response
function extractCodeBlock(text) {
  if (!text) return '';
  const str = String(text);
  const fenceRegex = /```\s*([a-zA-Z0-9+-]*)\n([\s\S]*?)```/g;
  let match;
  const blocks = [];
  while ((match = fenceRegex.exec(str)) !== null) {
    const lang = (match[1] || '').toLowerCase();
    const body = (match[2] || '').trim();
    blocks.push({ lang, body });
  }
  if (blocks.length > 0) {
    const preferredOrder = ['javascript', 'js', 'jsx', 'html'];
    for (const pref of preferredOrder) {
      const found = blocks.find((b) => b.lang.includes(pref));
      if (found) return found.body;
    }
    blocks.sort((a, b) => b.body.length - a.body.length);
    return blocks[0].body;
  }
  const lines = str.split(/\r?\n/);
  const idx = lines.findIndex((ln) => /^(const |let |var |function |import |export |document\.|window\.|\()/.test(ln.trim()));
  if (idx >= 0) return lines.slice(idx).join('\n').trim();
  return str.trim();
}

function App() {
  const [prompt, setPrompt] = useState('Create a beautiful React todo app with drag & drop functionality using Tailwind CSS');
  const [fileTree, setFileTree] = useState(createFileStructure());
  const [model, setModel] = useState('gemini-2.5-flash');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openTabs, setOpenTabs] = useState(['App.jsx']);
  const [activeFileId, setActiveFileId] = useState('App.jsx');
  const [editorRef, setEditorRef] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(['root', 'src', 'public']);
  const [previewKey, setPreviewKey] = useState(0); // To force iframe reload
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isServerRunning, setIsServerRunning] = useState(false);

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  // Check server health
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const response = await fetch(`${apiBase}/health`);
        if (response.ok) {
          setIsServerRunning(true);
        } else {
          setIsServerRunning(false);
        }
      } catch (error) {
        setIsServerRunning(false);
      }
    };

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [apiBase]);

  // Get current file content
  const getCurrentFileContent = () => {
    const file = findFileById(fileTree, activeFileId);
    return file ? file.content : '';
  };

  // Update file content
  const updateFileContent = (fileId, newContent) => {
    const updateTree = (tree) => {
      return tree.map(node => {
        if (node.id === fileId) {
          return { ...node, content: newContent };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };

    setFileTree(prev => updateTree(prev));
    setPreviewKey(prev => prev + 1); // Force preview refresh
  };

  // Handle file selection
  const handleFileSelect = (fileId) => {
    setActiveFileId(fileId);
    if (!openTabs.includes(fileId)) {
      setOpenTabs(prev => [...prev, fileId]);
    }
  };

  // Handle tab close
  const handleTabClose = (fileId) => {
    if (openTabs.length > 1) {
      setOpenTabs(prev => prev.filter(tab => tab !== fileId));
      if (activeFileId === fileId) {
        setActiveFileId(openTabs.find(tab => tab !== fileId));
      }
    }
  };

  // Toggle folder expansion
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  // Add new file
  const addNewFile = (parentId) => {
    const newFile = {
      id: `file-${Date.now()}`,
      name: 'new-file.jsx',
      type: 'file',
      language: 'javascript',
      content: '// New file content'
    };

    const addToTree = (tree) => {
      return tree.map(node => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...(node.children || []), newFile]
          };
        }
        if (node.children) {
          return { ...node, children: addToTree(node.children) };
        }
        return node;
      });
    };

    setFileTree(prev => addToTree(prev));
    handleFileSelect(newFile.id);
  };

  // Delete file/folder
  const deleteNode = (nodeId) => {
    const removeFromTree = (tree) => {
      return tree.filter(node => {
        if (node.id === nodeId) return false;
        if (node.children) {
          return { ...node, children: removeFromTree(node.children) };
        }
        return true;
      });
    };

    setFileTree(prev => removeFromTree(prev));
    handleTabClose(nodeId);
  };

  // Download current file
  const downloadCurrentFile = () => {
    const file = findFileById(fileTree, activeFileId);
    if (!file) return;

    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle code changes
  const handleEditorChange = (value) => {
    updateFileContent(activeFileId, value || '');
  };

  // Handle Monaco Editor mount
  const handleEditorDidMount = (editor) => {
    setEditorRef(editor);
  };

  // Get language for Monaco Editor
  const getMonacoLanguage = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  // Generate code with Gemini
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt describing what you want to build!');
      return;
    }
    
    setLoading(true); 
    setErrorText(''); 
    
    try {
      const res = await fetch(`${apiBase}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          model
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const cleaned = extractCodeBlock(data.code || '');
      
      // Update the active file with new code
      updateFileContent(activeFileId, cleaned);
      setActiveTab('preview');
      
    } catch (e) {
      const errorMsg = e.message || 'Generation failed';
      setErrorText(errorMsg);
      console.error('Generation error:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [apiBase, model, prompt, activeFileId]);

  // Fix code with Gemini
  const handleFix = useCallback(async () => {
    const currentContent = getCurrentFileContent();
    if (!currentContent.trim()) {
      alert('No code to fix! Generate some code first.');
      return;
    }
    
    setLoading(true); 
    setErrorText('');
    
    try {
      const res = await fetch(`${apiBase}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: currentContent,
          model
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const cleaned = extractCodeBlock(data.code || '');
      
      updateFileContent(activeFileId, cleaned);
      setActiveTab('preview');
      
    } catch (e) {
      const errorMsg = e.message || 'Fix failed';
      setErrorText(errorMsg);
      console.error('Fix error:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [apiBase, model, activeFileId, getCurrentFileContent]);

  // Render file tree recursively
  const renderFileTree = (nodes) => {
    return nodes.map(node => {
      if (node.type === 'folder') {
        const isExpanded = expandedFolders.includes(node.id);
        return (
          <div key={node.id} className="pl-3">
            <div
              className="flex items-center gap-2 py-1 cursor-pointer hover:bg-purple-500/10 rounded"
              onClick={() => toggleFolder(node.id)}
            >
              <FiChevronRight
                className={`w-4 h-4 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
              />
              <FiFolder className="w-4 h-4 text-yellow-400" />
              <span className="text-sm truncate">{node.name}</span>
            </div>

            {isExpanded && node.children && (
              <div className="pl-4">
                {renderFileTree(node.children)}
                <button
                  className="flex items-center gap-1 text-xs text-purple-300 mt-1 ml-1 hover:text-purple-100"
                  onClick={() => addNewFile(node.id)}
                >
                  <FiPlus className="w-3 h-3" /> New File
                </button>
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={node.id}
          className={`flex items-center justify-between gap-2 pl-6 py-1 rounded cursor-pointer transition-colors ${activeFileId === node.id
            ? 'bg-purple-500/30 text-white'
            : 'text-purple-300 hover:bg-purple-500/20 hover:text-white'
            }`}
          onClick={() => handleFileSelect(node.id)}
        >
          <div className="flex items-center gap-2 truncate">
            <FiFile className="w-4 h-4" />
            <span className="text-sm truncate">{node.name}</span>
          </div>
          <button
            className="p-1 hover:bg-purple-500/30 rounded"
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(node.id);
            }}
          >
            <FiTrash2 className="w-3 h-3" />
          </button>
        </div>
      );
    });
  };
  const previewSource = useMemo(() => {
    const file = findFileById(fileTree, activeFileId);
    if (!file) return '';

    if (file.name.endsWith('.html')) {
      return file.content;
    }
    
    // Create a simple HTML template with the code
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background-color: #f3f4f6;
    }
    #root {
      min-height: 100vh;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    try {
      // User code - Babel will transpile JSX automatically
      ${file.content}
      
      // Mount the component if MainComponent exists
      if (window.MainComponent) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(window.MainComponent));
      } else {
        throw new Error('No MainComponent found. Make sure to assign your component to window.MainComponent');
      }
    } catch (error) {
      console.error('Preview Error:', error);
      document.getElementById('root').innerHTML = \`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <h2 class="text-lg font-bold mb-2">Preview Error</h2>
          <pre class="text-sm overflow-auto mb-4">\${error.toString()}</pre>
          <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
            Retry Preview
          </button>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
  }, [fileTree, activeFileId, previewKey]);
  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Left Sidebar - File Explorer & Controls */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-black/30 backdrop-blur-sm border-r border-purple-500/20 flex flex-col`}>
        <div className="p-4 border-b border-purple-500/20 flex items-center gap-3">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
          </button>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                VibeCode
              </div>
              <div className={`flex items-center gap-1 text-xs ${isServerRunning ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isServerRunning ? 'bg-green-400' : 'bg-red-400'}`}></div>
                {isServerRunning ? 'Server Online' : 'Server Offline'}
              </div>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <>
            {/* File Explorer */}
            <div className="p-4 flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-purple-300">
                  Explorer
                </label>
                <button
                  className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                  onClick={() => addNewFile('src')}
                >
                  <FiPlus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {renderFileTree(fileTree)}
              </div>
            </div>

            {/* Prompt Section */}
            <div className="p-4 border-t border-purple-500/20">
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

            {/* Model Selection */}
            <div className="p-4 border-t border-purple-500/20">
              <label className="block text-xs font-semibold text-purple-300 mb-1">
                AI Model
              </label>
              <select
                className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="p-4 space-y-3">
              <button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
        {/* Editor with Tabs */}
        <div className="flex-1 min-h-0 flex">
          {/* Code Editor */}
          <div className="flex-1 min-h-0 bg-black/20 backdrop-blur-sm border-r border-purple-500/20 flex flex-col">
            {/* Tab Bar */}
            <div className="flex items-center bg-black/40 border-b border-purple-500/20">
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>

              {/* File Tabs */}
              <div className="flex-1 flex">
                {openTabs.map(tabId => {
                  const tab = findFileById(fileTree, tabId);
                  if (!tab) return null;

                  return (
                    <div
                      key={tabId}
                      className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-purple-500/20 transition-colors ${activeFileId === tabId
                        ? 'bg-purple-500/30 text-white'
                        : 'bg-black/20 text-purple-300 hover:bg-purple-500/20 hover:text-white'
                        }`}
                      onClick={() => setActiveFileId(tabId)}
                    >
                      <FiFile className="w-3 h-3" />
                      <span className="text-sm">{tab.name}</span>
                      {openTabs.length > 1 && (
                        <button
                          className="ml-2 hover:bg-purple-500/30 rounded p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTabClose(tabId);
                          }}
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Editor Actions */}
              <div className="flex items-center gap-2 px-4">
                <button
                  className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                  title="Save"
                >
                  <FiSave className="w-4 h-4" />
                </button>
                <button
                  className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                  title="Download"
                  onClick={downloadCurrentFile}
                >
                  <FiDownload className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={getMonacoLanguage(findFileById(fileTree, activeFileId)?.name || 'javascript')}
                value={getCurrentFileContent()}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  renderWhitespace: 'all',
                  lineNumbers: 'on',
                  folding: true,
                  showFoldingControls: 'always',
                  matchBrackets: 'always',
                  autoClosingBrackets: 'always',
                  autoIndent: 'full',
                  tabSize: 2,
                  insertSpaces: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  parameterHints: { enabled: true },
                  hover: { enabled: true },
                  contextmenu: true,
                  mouseWheelZoom: true,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true, indentation: true }
                }}
              />
            </div>
          </div>

          {/* Right Panel - Preview */}
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
                  className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'preview'
                    ? 'bg-purple-500 text-white'
                    : 'text-purple-300 hover:text-white hover:bg-purple-500/20'
                    }`}
                  onClick={() => setActiveTab('preview')}
                >
                  <FiEye className="w-3 h-3" />
                  Preview
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'console'
                    ? 'bg-purple-500 text-white'
                    : 'text-purple-300 hover:text-white hover:bg-purple-500/20'
                    }`}
                  onClick={() => setActiveTab('console')}
                >
                  <FiTerminal className="w-3 h-3" />
                  Console
                  {consoleLogs.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
                      {consoleLogs.length > 9 ? '9+' : consoleLogs.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 min-h-0">
              {activeTab === 'preview' && (
                <iframe 
                  key={previewKey}
                  srcDoc={previewSource}
                  title="preview"
                  className="w-full h-full bg-white" 
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
              {activeTab === 'console' && (
                <div className="h-full bg-black/80 text-green-400 p-4 font-mono text-sm overflow-auto">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-semibold">Console Output</span>
                    <button
                      onClick={() => setConsoleLogs([])}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                  {consoleLogs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      No console output yet. Run your code to see logs here.
                    </div>
                  ) : (
                      <div className="space-y-2">
                        {consoleLogs.map((log, index) => (
                          <div key={index} className={`p-2 rounded ${log.type === 'error' ? 'bg-red-900/20 text-red-400' : 'bg-gray-800/20'}`}>
                            <span className="text-gray-500 text-xs">[{log.timestamp}]</span> {log.message}
                          </div>
                        ))}
                      </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;