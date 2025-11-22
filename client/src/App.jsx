import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import { FiFolder, FiFile, FiPlay, FiSend, FiSettings, FiPlus, FiChevronLeft, FiChevronRight, FiX, FiCode, FiEye, FiTerminal, FiSave, FiDownload, FiTrash2, FiMessageCircle, FiEdit2, FiRefreshCw } from 'react-icons/fi';
import Editor from '@monaco-editor/react';
import toast, { Toaster } from 'react-hot-toast';

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
      if (found) {
        let code = found.body;
        // Ensure window.MainComponent assignment
        if (!code.includes('window.MainComponent')) {
          const componentMatch = code.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*[=\(]/);
          if (componentMatch) {
            code += `\n\nwindow.MainComponent = ${componentMatch[1]};`;
          }
        }
        return code;
      }
    }
    blocks.sort((a, b) => b.body.length - a.body.length);
    let code = blocks[0].body;
    if (!code.includes('window.MainComponent')) {
      const componentMatch = code.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*[=\(]/);
      if (componentMatch) {
        code += `\n\nwindow.MainComponent = ${componentMatch[1]};`;
      }
    }
    return code;
  }
  const lines = str.split(/\r?\n/);
  const idx = lines.findIndex((ln) => /^(const |let |var |function |import |export |document\.|window\.|\()/.test(ln.trim()));
  if (idx >= 0) {
    let code = lines.slice(idx).join('\n').trim();
    if (!code.includes('window.MainComponent')) {
      const componentMatch = code.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*[=\(]/);
      if (componentMatch) {
        code += `\n\nwindow.MainComponent = ${componentMatch[1]};`;
      }
    }
    return code;
  }
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
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [previewError, setPreviewError] = useState(null);
  const iframeRef = useRef(null);
  const chatEndRef = useRef(null);

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

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
  const addNewFile = (parentId, fileName = null) => {
    const name = fileName || `new-file-${Date.now()}.jsx`;
    const ext = name.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown'
    };
    
    const newFile = {
      id: `file-${Date.now()}`,
      name: name,
      type: 'file',
      language: languageMap[ext] || 'javascript',
      content: getDefaultContent(name, ext)
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
    toast.success(`Created ${name}`);
  };

  // Get default content based on file type
  const getDefaultContent = (fileName, ext) => {
    if (ext === 'jsx' || ext === 'js') {
      return `function ${fileName.split('.')[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">${fileName}</h1>
    </div>
  );
}

window.MainComponent = ${fileName.split('.')[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')};`;
    } else if (ext === 'html') {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName}</title>
</head>
<body>
  <h1>${fileName}</h1>
</body>
</html>`;
    } else if (ext === 'css') {
      return `/* ${fileName} */`;
    } else if (ext === 'json') {
      return `{\n  "name": "${fileName}"\n}`;
    }
    return `// ${fileName}`;
  };

  // Rename file/folder
  const renameNode = (nodeId, newName) => {
    const updateTree = (tree) => {
      return tree.map(node => {
        if (node.id === nodeId) {
          return { ...node, name: newName };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setFileTree(prev => updateTree(prev));
    // Update open tabs if needed
    if (openTabs.includes(nodeId)) {
      // Tab name will update automatically since it reads from fileTree
    }
    toast.success(`Renamed to ${newName}`);
  };

  // Add new folder
  const addNewFolder = (parentId) => {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: `new-folder-${Date.now()}`,
      type: 'folder',
      children: []
    };

    const addToTree = (tree) => {
      return tree.map(node => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...(node.children || []), newFolder]
          };
        }
        if (node.children) {
          return { ...node, children: addToTree(node.children) };
        }
        return node;
      });
    };

    setFileTree(prev => addToTree(prev));
    setExpandedFolders(prev => [...prev, newFolder.id]);
    toast.success(`Created folder ${newFolder.name}`);
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
      toast.error('Please enter a prompt describing what you want to build!');
      return;
    }
    
    setLoading(true); 
    setErrorText('');
    setPreviewError(null);
    setConsoleLogs([]);
    toast.loading('Generating code...', { id: 'generate' });
    
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
        throw new Error(errorData.error || errorData.details || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const cleaned = extractCodeBlock(data.code || '');
      
      if (!cleaned || cleaned.trim().length === 0) {
        throw new Error('Received empty code from server');
      }
      
      // Update the active file with new code
      updateFileContent(activeFileId, cleaned);
      setActiveTab('preview');
      toast.success('Code generated successfully!', { id: 'generate' });
      
      // Add to chat history
      setChatMessages(prev => [
        ...prev,
        { role: 'user', content: prompt },
        { role: 'assistant', content: 'I\'ve generated the code for you. Check the preview!' }
      ]);
      
    } catch (e) {
      const errorMsg = e.message || 'Generation failed';
      setErrorText(errorMsg);
      toast.error(`Generation failed: ${errorMsg}`, { id: 'generate' });
      console.error('Generation error:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [apiBase, model, prompt, activeFileId]);

  // Fix code with Gemini
  const handleFix = useCallback(async () => {
    const currentContent = getCurrentFileContent();
    if (!currentContent.trim()) {
      toast.error('No code to fix! Generate some code first.');
      return;
    }
    
    setLoading(true); 
    setErrorText('');
    toast.loading('Fixing code...', { id: 'fix' });
    
    try {
      // Collect errors from multiple sources
      let errorMessages = [];
      
      // Get preview error if available
      if (previewError) {
        errorMessages.push(`Preview Error: ${previewError}`);
      }
      
      // Get console errors
      const consoleErrors = consoleLogs
        .filter(log => log.type === 'error')
        .map(log => log.message)
        .slice(-3); // Get last 3 errors
      
      if (consoleErrors.length > 0) {
        errorMessages.push(`Console Errors:\n${consoleErrors.join('\n')}`);
      }
      
      // If no specific errors found, provide a general message
      const errorMessage = errorMessages.length > 0 
        ? errorMessages.join('\n\n')
        : 'Code has errors. Please analyze and fix any syntax errors, undefined variables, or runtime issues.';
      
      const res = await fetch(`${apiBase}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: currentContent,
          error: errorMessage,
          model
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const cleaned = extractCodeBlock(data.code || '');
      
      if (!cleaned || cleaned.trim().length === 0) {
        throw new Error('Received empty code from server');
      }
      
      updateFileContent(activeFileId, cleaned);
      setPreviewError(null);
      setConsoleLogs([]); // Clear console logs after fix
      setActiveTab('preview');
      toast.success('Code fixed successfully!', { id: 'fix' });
      
    } catch (e) {
      const errorMsg = e.message || 'Fix failed';
      setErrorText(errorMsg);
      toast.error(`Fix failed: ${errorMsg}`, { id: 'fix' });
      console.error('Fix error:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [apiBase, model, activeFileId, getCurrentFileContent, previewError, consoleLogs]);

  // Handle AI chat edit
  const handleChatEdit = useCallback(async (message) => {
    if (!message.trim()) return;
    
    const currentContent = getCurrentFileContent();
    if (!currentContent.trim()) {
      toast.error('No code to edit! Generate some code first.');
      return;
    }

    // Add user message to chat
    const userMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);
    toast.loading('Editing code...', { id: 'edit' });

    try {
      const res = await fetch(`${apiBase}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          code: currentContent,
          model
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const cleaned = extractCodeBlock(data.code || '');

      if (!cleaned || cleaned.trim().length === 0) {
        throw new Error('Received empty code from server');
      }

      updateFileContent(activeFileId, cleaned);
      setPreviewError(null); // Clear any previous errors
      
      // Add AI response to chat
      const aiMessage = { 
        role: 'assistant', 
        content: 'I\'ve updated the code according to your request. Check the preview to see the changes!' 
      };
      setChatMessages(prev => [...prev, aiMessage]);
      toast.success('Code updated!', { id: 'edit' });
      setActiveTab('preview');

    } catch (e) {
      const errorMsg = e.message || 'Edit failed';
      const errorMessage = { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${errorMsg}. Please try again or rephrase your request.`, 
        error: true 
      };
      setChatMessages(prev => [...prev, errorMessage]);
      toast.error(`Edit failed: ${errorMsg}`, { id: 'edit' });
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
                <div className="flex gap-2 mt-1 ml-1">
                  <button
                    className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      addNewFile(node.id);
                    }}
                  >
                    <FiPlus className="w-3 h-3" /> File
                  </button>
                  <button
                    className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      addNewFolder(node.id);
                    }}
                  >
                    <FiPlus className="w-3 h-3" /> Folder
                  </button>
                </div>
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
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <script>
    // Suppress Tailwind CDN warning
    window.tailwindConfig = { darkMode: false };
  </script>
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
    // Override console methods to send logs to parent
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    
    function sendLog(type, ...args) {
      try {
        window.parent.postMessage({
          type: 'console',
          logType: type,
          message: args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          }).join(' '),
          timestamp: new Date().toISOString()
        }, '*');
      } catch (e) {
        // Ignore postMessage errors
      }
    }
    
    console.log = function(...args) {
      originalLog.apply(console, args);
      sendLog('log', ...args);
    };
    
    console.error = function(...args) {
      originalError.apply(console, args);
      sendLog('error', ...args);
    };
    
    console.warn = function(...args) {
      originalWarn.apply(console, args);
      sendLog('warn', ...args);
    };
    
    console.info = function(...args) {
      originalInfo.apply(console, args);
      sendLog('info', ...args);
    };
    
    // Error handler
    window.addEventListener('error', (event) => {
      sendLog('error', \`\${event.message} at \${event.filename}:\${event.lineno}:\${event.colno}\`);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      sendLog('error', \`Unhandled Promise Rejection: \${event.reason}\`);
    });
    
    try {
      // Clear previous MainComponent
      window.MainComponent = null;
      
      // User code - Babel will transpile JSX automatically
      ${file.content}
      
      // Mount the component if MainComponent exists
      if (window.MainComponent && typeof window.MainComponent === 'function') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(window.MainComponent));
        sendLog('log', 'Component rendered successfully');
      } else {
        throw new Error('No MainComponent found. Make sure to assign your component to window.MainComponent. Current value: ' + typeof window.MainComponent);
      }
    } catch (error) {
      const errorMsg = error.toString();
      sendLog('error', errorMsg);
      console.error('Preview Error:', error);
      document.getElementById('root').innerHTML = \`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <h2 class="text-lg font-bold mb-2">Preview Error</h2>
          <pre class="text-sm overflow-auto mb-4 whitespace-pre-wrap">\${errorMsg}</pre>
          <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
            Retry Preview
          </button>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
    
    return htmlContent;
  }, [fileTree, activeFileId, previewKey]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'console') {
        setConsoleLogs(prev => [...prev, {
          type: event.data.logType,
          message: event.data.message,
          timestamp: event.data.timestamp
        }]);
        
        // Update preview error if it's an error
        if (event.data.logType === 'error') {
          setPreviewError(event.data.message);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1e2e',
            color: '#fff',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
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
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast, Recommended)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Best Quality)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Alternative)</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Lightweight)</option>
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

              <button
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                onClick={() => setShowChat(!showChat)}
              >
                <FiMessageCircle className="w-4 h-4" />
                {showChat ? 'Hide Chat' : 'AI Chat'}
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

      {/* AI Chat Panel */}
      {showChat && (
        <div className="w-80 bg-black/40 backdrop-blur-sm border-r border-purple-500/20 flex flex-col">
          <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
            <h3 className="font-semibold text-purple-300 flex items-center gap-2">
              <FiMessageCircle className="w-4 h-4" />
              AI Assistant
            </h3>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 hover:bg-purple-500/20 rounded transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-purple-300/50 text-sm py-8">
                <FiMessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Start a conversation to edit your code!</p>
                <p className="text-xs mt-2">Try: "Add a dark mode toggle" or "Make the buttons larger"</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : msg.error
                        ? 'bg-red-900/30 text-red-300 border border-red-500/30'
                        : 'bg-purple-500/20 text-purple-200'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-purple-500/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (chatInput.trim()) {
                      handleChatEdit(chatInput);
                    }
                  }
                }}
                placeholder="Ask AI to edit your code..."
                className="flex-1 bg-black/40 border border-purple-500/30 rounded-lg px-3 py-2 text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={() => {
                  if (chatInput.trim()) {
                    handleChatEdit(chatInput);
                  }
                }}
                disabled={loading || !chatInput.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="relative w-full h-full">
                  <iframe 
                    ref={iframeRef}
                    key={previewKey}
                    srcDoc={previewSource}
                    title="preview"
                    className="w-full h-full bg-white" 
                    sandbox="allow-scripts allow-same-origin"
                  />
                  <button
                    onClick={() => {
                      setPreviewKey(prev => prev + 1);
                      setConsoleLogs([]);
                      setPreviewError(null);
                      toast.success('Preview refreshed');
                    }}
                    className="absolute top-2 right-2 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-colors z-10"
                    title="Refresh Preview"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}
              {activeTab === 'console' && (
                <div className="h-full bg-black/80 p-4 font-mono text-sm overflow-auto">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-semibold">Console Output</span>
                    <button
                      onClick={() => {
                        setConsoleLogs([]);
                        setPreviewError(null);
                      }}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                  {consoleLogs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      No console output yet. Run your code to see logs here.
                    </div>
                  ) : (
                      <div className="space-y-1">
                        {consoleLogs.map((log, index) => {
                          const logColors = {
                            error: 'bg-red-900/20 text-red-400 border-l-2 border-red-500',
                            warn: 'bg-yellow-900/20 text-yellow-400 border-l-2 border-yellow-500',
                            info: 'bg-blue-900/20 text-blue-400 border-l-2 border-blue-500',
                            log: 'bg-gray-800/20 text-green-400 border-l-2 border-green-500'
                          };
                          return (
                            <div key={index} className={`p-2 rounded ${logColors[log.type] || logColors.log}`}>
                              <span className="text-gray-500 text-xs">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                              <span className="font-semibold text-xs uppercase mr-2">{log.type}:</span>
                              <span className="whitespace-pre-wrap break-words">{log.message}</span>
                            </div>
                          );
                        })}
                      </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default App;