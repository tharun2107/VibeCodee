import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import { FiFolder, FiFile, FiPlay, FiSend, FiSettings, FiPlus, FiChevronLeft, FiChevronRight, FiX, FiCode, FiEye, FiTerminal, FiSave, FiDownload, FiTrash2, FiMessageCircle, FiEdit2, FiRefreshCw } from 'react-icons/fi';
import Editor from '@monaco-editor/react';
import toast, { Toaster } from 'react-hot-toast';

// File structure helper - Start with empty project
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
            content: `function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to VibeCode</h1>
        <p className="text-gray-600 mb-8">Start by describing what you want to build in the prompt area.</p>
        <div className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
          <p className="text-sm">✨ Your app will appear here</p>
        </div>
      </div>
    </div>
  );
}

window.MainComponent = App;`
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
  const [prompt, setPrompt] = useState('');
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
  const [showChat, setShowChat] = useState(true); // Show chat by default
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [previewError, setPreviewError] = useState(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false); // Hide code editor by default
  const [showFileExplorer, setShowFileExplorer] = useState(false); // Hide file explorer by default
  const [conversationHistory, setConversationHistory] = useState([]); // Store all conversations
  const [editingNodeId, setEditingNodeId] = useState(null); // For renaming files
  const [editingNodeName, setEditingNodeName] = useState(''); // For renaming files
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
    if (!newName || !newName.trim()) {
      setEditingNodeId(null);
      return;
    }
    const updateTree = (tree) => {
      return tree.map(node => {
        if (node.id === nodeId) {
          return { ...node, name: newName.trim() };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setFileTree(prev => updateTree(prev));
    setEditingNodeId(null);
    toast.success(`Renamed to ${newName.trim()}`);
  };

  // Start editing node name
  const startEditingNode = (nodeId, currentName) => {
    setEditingNodeId(nodeId);
    setEditingNodeName(currentName);
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
      
      // Add to chat history and conversation history
      const userMsg = { role: 'user', content: prompt, timestamp: new Date().toISOString() };
      const aiMsg = { role: 'assistant', content: 'I\'ve generated the code for you. Check the preview!', timestamp: new Date().toISOString() };
      setChatMessages(prev => [...prev, userMsg, aiMsg]);
      setConversationHistory(prev => [...prev, { type: 'generate', user: prompt, response: 'Code generated successfully', timestamp: new Date().toISOString() }]);
      
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
    const userMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
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
      
      // Add AI response to chat and conversation history
      const aiMessage = { 
        role: 'assistant', 
        content: 'I\'ve updated the code according to your request. Check the preview to see the changes!',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, aiMessage]);
      setConversationHistory(prev => [...prev, { type: 'edit', user: message, response: 'Code updated successfully', timestamp: new Date().toISOString() }]);
      toast.success('Code updated!', { id: 'edit' });
      setActiveTab('preview');

    } catch (e) {
      const errorMsg = e.message || 'Edit failed';
      const errorMessage = { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${errorMsg}. Please try again or rephrase your request.`, 
        error: true,
        timestamp: new Date().toISOString()
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
              onClick={() => !editingNodeId && toggleFolder(node.id)}
            >
              <FiChevronRight
                className={`w-4 h-4 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
              />
              <FiFolder className="w-4 h-4 text-yellow-400" />
              {editingNodeId === node.id ? (
                <input
                  type="text"
                  value={editingNodeName}
                  onChange={(e) => setEditingNodeName(e.target.value)}
                  onBlur={() => renameNode(node.id, editingNodeName)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      renameNode(node.id, editingNodeName);
                    } else if (e.key === 'Escape') {
                      setEditingNodeId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-black/40 border border-purple-500/30 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  autoFocus
                />
              ) : (
                <span 
                  className="text-sm truncate flex-1"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEditingNode(node.id, node.name);
                  }}
                  title="Double-click to rename"
                >
                  {node.name}
                </span>
              )}
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
          onClick={() => !editingNodeId && handleFileSelect(node.id)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FiFile className="w-4 h-4 flex-shrink-0" />
            {editingNodeId === node.id ? (
              <input
                type="text"
                value={editingNodeName}
                onChange={(e) => setEditingNodeName(e.target.value)}
                onBlur={() => renameNode(node.id, editingNodeName)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    renameNode(node.id, editingNodeName);
                  } else if (e.key === 'Escape') {
                    setEditingNodeId(null);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-black/40 border border-purple-500/30 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                autoFocus
              />
            ) : (
              <span 
                className="text-sm truncate flex-1"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditingNode(node.id, node.name);
                }}
                title="Double-click to rename"
              >
                {node.name}
              </span>
            )}
          </div>
          {!editingNodeId && (
            <button 
              className="p-1 hover:bg-purple-500/30 rounded flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
              }}
            >
              <FiTrash2 className="w-3 h-3" />
            </button>
          )}
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
      {/* Left Sidebar - Lovable Style */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-96'} transition-all duration-300 bg-gray-900 border-r border-gray-800 flex flex-col`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="font-semibold text-base text-white">VibeCode</div>
              <div className={`flex items-center gap-1 text-xs ${isServerRunning ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isServerRunning ? 'bg-green-400' : 'bg-red-400'}`}></div>
                {isServerRunning ? 'Online' : 'Offline'}
              </div>
            </div>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
          >
            {sidebarCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Conversation History - Show recent edits/fixes */}
            {conversationHistory.length > 0 && (
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {conversationHistory.slice(-3).reverse().map((conv, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (conv.type === 'generate') {
                        setPrompt(conv.user);
                        toast.info('Prompt loaded. Click Generate Code to use it.');
                      }
                    }}
                  >
                    <div className="text-white text-sm mb-1 line-clamp-2">{conv.user}</div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                        {conv.type === 'generate' ? 'Generated' : 'Edited'}
                      </span>
                      <span>{new Date(conv.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons - Like Lovable */}
            <div className="px-4 pb-2 space-y-2">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
              >
                <span>{loading ? 'Generating...' : 'Generate Code'}</span>
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              </button>

              <button 
                className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                onClick={handleFix}
                disabled={loading}
              >
                <span>{loading ? 'Fixing...' : 'AI Fix'}</span>
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              </button>

              <div className="flex gap-2">
                <button
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  onClick={() => setShowCodeEditor(!showCodeEditor)}
                >
                  <FiCode className="w-4 h-4" />
                  {showCodeEditor ? 'Hide' : 'Code'}
                </button>
                <button
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  onClick={() => setShowFileExplorer(!showFileExplorer)}
                >
                  <FiFolder className="w-4 h-4" />
                  Files
                </button>
              </div>
            </div>

            {/* File Explorer - Collapsible */}
            {showFileExplorer && (
              <div className="px-4 pb-2 max-h-48 overflow-auto border-t border-gray-700/50 pt-2">
                <div className="space-y-1">
                  {renderFileTree(fileTree)}
                </div>
              </div>
            )}

            {/* Error Display */}
            {errorText && (
              <div className="mx-4 mb-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="text-red-400 text-xs">
                  <strong>Error:</strong> {errorText}
                </div>
              </div>
            )}

            {/* Main Prompt Input - "Ask VibeCode..." like Lovable */}
            <div className="p-4 border-t border-gray-700/50 bg-gray-900/50">
              <div className="relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="Ask VibeCode..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  onClick={() => {
                    if (prompt.trim()) {
                      handleGenerate();
                    }
                  }}
                  disabled={loading || !prompt.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
              
              {/* Model Selection - Compact */}
              <select
                className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              </select>

              {/* Chat Toggle */}
              <div className="flex gap-2 mt-2">
                <button
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    showChat 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setShowChat(!showChat)}
                >
                  Chat
                </button>
                <button
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                >
                  Visual edits
                </button>
              </div>
            </div>

            {/* Chat Messages - Show when chat is active */}
            {showChat && chatMessages.length > 0 && (
              <div className="flex-1 overflow-auto p-4 space-y-3 border-t border-gray-700/50 bg-gray-900/30">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : msg.error
                          ? 'bg-red-900/30 text-red-300 border border-red-500/30'
                          : 'bg-gray-700 text-gray-200'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Chat Input - Only show when chat is active */}
            {showChat && (
              <div className="p-4 border-t border-gray-700/50 bg-gray-900/50">
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
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) {
                        handleChatEdit(chatInput);
                      }
                    }}
                    disabled={loading || !chatInput.trim()}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSend className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area - Preview First */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-white">
        {/* Top Toolbar - Clean Lovable Style */}
        <div className="px-4 py-2.5 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-700">Preview</div>
            <div className="text-xs text-gray-500">Last saved version</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('preview')}
            >
              <FiEye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'console'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('console')}
            >
              <FiTerminal className="w-3.5 h-3.5" />
              Console
              {consoleLogs.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {consoleLogs.length > 9 ? '9+' : consoleLogs.length}
                </span>
              )}
            </button>
            <button
              className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
                showCodeEditor
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setShowCodeEditor(!showCodeEditor)}
            >
              <FiCode className="w-3.5 h-3.5" />
              Code
            </button>
            <button
              onClick={() => {
                setPreviewKey(prev => prev + 1);
                setConsoleLogs([]);
                setPreviewError(null);
                toast.success('Preview refreshed');
              }}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600"
              title="Refresh Preview"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Area - Full Screen by Default */}
        <div className="flex-1 min-h-0 relative">
          {activeTab === 'preview' && (
            <div className="absolute inset-0">
              <iframe 
                ref={iframeRef}
                key={previewKey}
                srcDoc={previewSource}
                title="preview"
                className="w-full h-full bg-white" 
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          )}
          {activeTab === 'console' && (
            <div className="absolute inset-0 bg-black/80 p-4 font-mono text-sm overflow-auto">
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
                  <FiTerminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No console output yet.</p>
                  <p className="text-xs mt-2">Console logs from your code will appear here automatically.</p>
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
                      <div key={index} className={`p-2 rounded ${logColors[log.type] || logColors.log} hover:opacity-80 transition-opacity`}>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 text-xs flex-shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span className="font-semibold text-xs uppercase mr-2 flex-shrink-0">{log.type}:</span>
                          <span className="whitespace-pre-wrap break-words flex-1">{log.message}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Code Editor - Slides in from right when toggled */}
        {showCodeEditor && (
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl z-50 animate-slide-in-right">
            {/* Code Editor Header */}
            <div className="flex items-center bg-gray-800 border-b border-gray-700 px-4 py-2">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 flex">
                {openTabs.map(tabId => {
                  const tab = findFileById(fileTree, tabId);
                  if (!tab) return null;
                  return (
                    <div
                      key={tabId}
                      className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-gray-700 transition-colors ${activeFileId === tabId
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-750 hover:text-white'
                        }`}
                      onClick={() => setActiveFileId(tabId)}
                    >
                      <FiFile className="w-3 h-3" />
                      <span className="text-sm">{tab.name}</span>
                      {openTabs.length > 1 && (
                        <button 
                          className="ml-2 hover:bg-gray-700 rounded p-1"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFileExplorer(!showFileExplorer)}
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                  title="Toggle File Explorer"
                >
                  <FiFolder className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCodeEditor(false)}
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                  title="Close Code Editor"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* File Explorer - Inside Code Editor */}
            {showFileExplorer && (
              <div className="border-b border-gray-700 bg-gray-800/50 p-2 max-h-40 overflow-auto">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-purple-300">Files</label>
                  <button
                    className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                    onClick={() => setShowFileExplorer(false)}
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1">
                  {renderFileTree(fileTree)}
                </div>
              </div>
            )}

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
        )}
      </div>
    </div>
    </>
  );
}

export default App;