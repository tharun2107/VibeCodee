import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFolder, FiFile, FiPlay, FiSend, FiSettings, FiPlus, FiChevronLeft, FiChevronRight, FiX, FiCode, FiEye, FiTerminal, FiSave, FiDownload, FiTrash2, FiMessageCircle, FiEdit2, FiRefreshCw, FiGlobe, FiExternalLink, FiCopy, FiMic, FiImage, FiBarChart2, FiPackage } from 'react-icons/fi';
import Editor from '@monaco-editor/react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import ProjectDashboard from './components/ProjectDashboard';
import VoiceToCode from './components/features/VoiceToCode';
import ImageToCode from './components/features/ImageToCode';
import AIMentor from './components/features/AIMentor';
import PerformanceAnalytics from './components/features/PerformanceAnalytics';
import ComponentMarketplace from './components/features/ComponentMarketplace';

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

// Collect all files from file tree recursively
const collectAllFiles = (nodes, basePath = '') => {
  const files = [];
  
  for (const node of nodes) {
    if (node.type === 'file') {
      const filePath = basePath ? `${basePath}/${node.name}` : node.name;
      files.push({
        path: filePath,
        name: node.name,
        content: node.content || ''
      });
    } else if (node.type === 'folder' && node.children) {
      const folderPath = basePath ? `${basePath}/${node.name}` : node.name;
      const folderFiles = collectAllFiles(node.children, folderPath);
      files.push(...folderFiles);
    }
  }
  
  return files;
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
  // Routing and Auth State
  const [view, setView] = useState('landing'); // 'landing', 'auth', 'dashboard', 'editor'
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);

  // Editor State
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
  const [showChat, setShowChat] = useState(false); // Chat modal closed by default
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [previewError, setPreviewError] = useState(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false); // Hide code editor by default
  const [showFileExplorer, setShowFileExplorer] = useState(false); // Hide file explorer by default
  const [conversationHistory, setConversationHistory] = useState([]); // Store all conversations
  const [editingNodeId, setEditingNodeId] = useState(null); // For renaming files
  const [editingNodeName, setEditingNodeName] = useState(''); // For renaming files
  const [deploying, setDeploying] = useState(false); // Deployment status
  const [deployedUrl, setDeployedUrl] = useState(null); // Deployed site URL
  const [activeFeaturePanel, setActiveFeaturePanel] = useState(null); // 'voice' | 'image' | 'analytics' | 'marketplace' | null
  const iframeRef = useRef(null);
  const chatEndRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  // Initialize view based on auth state
  useEffect(() => {
    if (token && user) {
      setView('dashboard');
    } else {
      setView('landing');
    }
  }, []);

  // Auth Handlers
  const handleAuthSuccess = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setView('landing');
    setCurrentProjectId(null);
  };

  // Project Management
  const handleCreateProject = () => {
    setFileTree(createFileStructure());
    setConversationHistory([]);
    setChatMessages([]);
    setDeployedUrl(null);
    setCurrentProjectId(null);
    setProjectName('Untitled Project');
    setView('editor');
  };

  const handleOpenProject = async (projectId) => {
    try {
      const res = await axios.get(`${apiBase}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const project = res.data;
      
      setFileTree(project.fileStructure || createFileStructure());
      setConversationHistory(project.conversationHistory || []);
      setProjectName(project.name);
      setCurrentProjectId(projectId);
      setDeployedUrl(project.deployedLinks?.[project.deployedLinks.length - 1] || null);
      
      // Restore chat messages from conversation history
      const restoredMessages = [];
      project.conversationHistory?.forEach(conv => {
        restoredMessages.push({ role: 'user', content: conv.user, timestamp: conv.timestamp });
        restoredMessages.push({ role: 'assistant', content: conv.response, timestamp: conv.timestamp });
      });
      setChatMessages(restoredMessages);
      
      setView('editor');
      toast.success('Project loaded');
    } catch (error) {
      toast.error('Failed to load project');
    }
  };

  // Auto-save project
  const saveProject = useCallback(async (silent = false) => {
    if (!token || !currentProjectId) return;

    try {
      await axios.put(
        `${apiBase}/projects/${currentProjectId}`,
        {
          name: projectName,
          fileStructure: fileTree,
          conversationHistory: conversationHistory,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!silent) toast.success('Project saved');
    } catch (error) {
      if (!silent) toast.error('Failed to save project');
    }
  }, [token, currentProjectId, projectName, fileTree, conversationHistory, apiBase]);

  // Create new project in database
  const createProjectInDB = useCallback(async () => {
    if (!token) return null;

    try {
      const res = await axios.post(
        `${apiBase}/projects`,
        {
          name: projectName,
          fileStructure: fileTree,
          conversationHistory: conversationHistory,
          deployedLinks: deployedUrl ? [deployedUrl] : [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentProjectId(res.data._id);
      return res.data._id;
    } catch (error) {
      console.error('Failed to create project:', error);
      return null;
    }
  }, [token, projectName, fileTree, conversationHistory, deployedUrl, apiBase]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!currentProjectId || !token) return;

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      saveProject(true);
    }, 2000); // Auto-save after 2 seconds of inactivity

    setAutoSaveTimer(timer);
    return () => clearTimeout(timer);
  }, [fileTree, conversationHistory, projectName, currentProjectId, token, saveProject]);

  // Save project when creating first time
  useEffect(() => {
    if (view === 'editor' && !currentProjectId && token) {
      createProjectInDB();
    }
  }, [view, currentProjectId, token, createProjectInDB]);

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
      
      // Add to conversation history
      const userMsg = { role: 'user', content: 'Fix the errors in the code', timestamp: new Date().toISOString() };
      const aiMsg = { role: 'assistant', content: 'I\'ve fixed the errors in your code!', timestamp: new Date().toISOString() };
      setChatMessages(prev => [...prev, userMsg, aiMsg]);
      setConversationHistory(prev => [...prev, { type: 'fix', user: 'Fix the errors in the code', response: 'Code fixed successfully', timestamp: new Date().toISOString() }]);
      
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

  // Prepare files for Vite + React deployment
  const prepareFilesForDeployment = useCallback((files) => {
    // Create a map of existing files by path for quick lookup
    const fileMap = new Map();
    files.forEach(file => {
      const cleanPath = file.path.replace(/^project\//, '');
      fileMap.set(cleanPath, file.content || '');
    });

    // Helper to get file content or return default
    const getFile = (path, defaultContent) => {
      return fileMap.get(path) || defaultContent;
    };

    // Find App.jsx content (could be in src/App.jsx or just App.jsx)
    let appContent = getFile('src/App.jsx', '') || getFile('App.jsx', '');
    
    // If App.jsx has window.MainComponent, convert it to proper React export
    if (appContent && appContent.includes('window.MainComponent')) {
      // Extract the component name from window.MainComponent = ComponentName
      const mainComponentMatch = appContent.match(/window\.MainComponent\s*=\s*([A-Z][a-zA-Z0-9]*)/);
      let componentName = null;
      
      if (mainComponentMatch) {
        componentName = mainComponentMatch[1];
      }
      
      if (componentName) {
        // Remove window.MainComponent line
        appContent = appContent
          .replace(/\s*window\.MainComponent\s*=\s*[^;]+;?\s*/g, '')
          .trim();
        
        // Only add export default to the main component function declaration
        // CRITICAL: Use word boundaries and only match "function ComponentName" pattern
        if (!appContent.includes('export default') && !appContent.includes('export {')) {
          // Check if it's a function declaration: function ComponentName() { ... }
          // Use a more precise pattern that only matches function declarations
          const functionPattern = new RegExp(`(^|\\n|\\r)\\s*function\\s+${componentName}\\s*\\(`, 'm');
          if (functionPattern.test(appContent)) {
            // Replace ONLY the function declaration with word boundaries
            appContent = appContent.replace(
              functionPattern,
              `$1export default function ${componentName}(`
            );
          }
        }
      }
    }
    
    // If still no export, try to add it to the last function declaration (likely the main component)
    if (appContent && !appContent.includes('export default') && !appContent.includes('export {')) {
      // Find all function declarations (not const/let/var) - use multiline match
      const functionMatches = [...appContent.matchAll(/(?:^|\n|\r)\s*function\s+([A-Z][a-zA-Z0-9]*)\s*\(/gm)];
      if (functionMatches.length > 0) {
        // Get the last function (likely the main component)
        const lastMatch = functionMatches[functionMatches.length - 1];
        const funcName = lastMatch[1];
        const funcPattern = new RegExp(`(^|\\n|\\r)\\s*function\\s+${funcName}\\s*\\(`, 'm');
        appContent = appContent.replace(
          funcPattern,
          `$1export default function ${funcName}(`
        );
      }
    }

    // If no App.jsx found, create a default one
    if (!appContent) {
      appContent = `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to VibeCode</h1>
        <p className="text-gray-600 mb-8">Your app will appear here</p>
      </div>
    </div>
  );
}`;
    }

    // Get index.html - check root first, then public folder
    let indexHtml = getFile('index.html', '') || getFile('public/index.html', '');
    
    // If index.html is in public folder or doesn't exist, create proper Vite index.html
    if (!indexHtml || indexHtml.includes('public/')) {
      indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VibeCode App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
    } else {
      // Update existing index.html to use Vite's module script
      if (!indexHtml.includes('type="module"') && !indexHtml.includes('/src/main.jsx')) {
        indexHtml = indexHtml
          .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/gi, '')
          .replace('</body>', '    <script type="module" src="/src/main.jsx"></script>\n  </body>');
      }
    }

    // Prepare the complete file list with all required files
    const deploymentFiles = [
      // package.json - Required for npm install and build
      {
        path: 'package.json',
        content: getFile('package.json', `{
  "name": "vibecode-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.7.0",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17"
  }
}`)
      },

      // vite.config.js - Required for Vite build
      {
        path: 'vite.config.js',
        content: getFile('vite.config.js', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
});`)
      },

      // tailwind.config.js - Required for Tailwind CSS
      {
        path: 'tailwind.config.js',
        content: getFile('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`)
      },

      // postcss.config.js - Required for Tailwind CSS processing
      {
        path: 'postcss.config.js',
        content: getFile('postcss.config.js', `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`)
      },

      // index.html - Must be at root for Vite
      {
        path: 'index.html',
        content: indexHtml
      },

      // src/main.jsx - Entry point
      {
        path: 'src/main.jsx',
        content: getFile('src/main.jsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`)
      },

      // src/App.jsx - Main component
      {
        path: 'src/App.jsx',
        content: (() => {
          // Check if code uses React. (like React.useState, React.useCallback, etc.)
          const usesReactDot = /React\.(useState|useEffect|useCallback|useMemo|useRef|useContext|createContext|Component|Fragment)/.test(appContent);
          
          // Check if React is already imported
          const hasReactImport = /^import\s+React[,\s]/.test(appContent) || /^import\s+.*\s+from\s+['"]react['"]/.test(appContent);
          
          // If code uses React. but doesn't import React, add the import
          if (usesReactDot && !hasReactImport) {
            // Add import at the very beginning
            return `import React from 'react';\n\n${appContent}`;
          }
          
          return appContent;
        })()
      },

      // src/index.css - Basic styles with Tailwind directives (if exists, otherwise minimal)
      {
        path: 'src/index.css',
        content: (() => {
          const existingCss = getFile('src/index.css', '');
          // Check if Tailwind directives are already present
          const hasTailwindDirectives = existingCss.includes('@tailwind') || existingCss.includes('@import');
          
          if (hasTailwindDirectives) {
            return existingCss;
          }
          
          // If no existing CSS or no Tailwind directives, add them
          if (existingCss && existingCss.trim().length > 0) {
            // Prepend Tailwind directives to existing CSS
            return `@tailwind base;
@tailwind components;
@tailwind utilities;

${existingCss}`;
          }
          
          // Default CSS with Tailwind directives
          return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}`;
        })()
      }
    ];

    // Add all other files from the project (excluding ones we've already added)
    const addedPaths = new Set(['package.json', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js', 'index.html', 'src/main.jsx', 'src/App.jsx', 'src/index.css']);
    
    files.forEach(file => {
      const cleanPath = file.path.replace(/^project\//, '');
      
      // Skip files we've already added and empty files
      if (!addedPaths.has(cleanPath) && file.content && file.content.trim().length > 0) {
        // Skip public/index.html since we use root index.html for Vite
        if (cleanPath !== 'public/index.html') {
          deploymentFiles.push({
            path: cleanPath,
            content: file.content
          });
        }
      }
    });

    return deploymentFiles;
  }, []);

  // Handle Netlify deployment
  // Helper function to extract h1 text from code
  const extractH1Text = useCallback((code) => {
    if (!code) return null;
    
    // Try to find h1 tags in JSX
    const h1Matches = [
      // Match <h1>text</h1>
      /<h1[^>]*>([^<]+)<\/h1>/i,
      // Match <h1 className="...">text</h1>
      /<h1[^>]*>([^<]+)<\/h1>/i,
      // Match h1 with nested elements: <h1>text {variable}</h1>
      /<h1[^>]*>([^<{]+)/i,
    ];
    
    for (const pattern of h1Matches) {
      const match = code.match(pattern);
      if (match && match[1]) {
        // Clean up the text: remove extra whitespace, quotes, etc.
        let text = match[1].trim();
        // Remove template literals and variables
        text = text.replace(/\{[^}]*\}/g, '').trim();
        // Remove quotes
        text = text.replace(/['"]/g, '').trim();
        // Take first 30 characters
        if (text.length > 0) {
          return text.substring(0, 30);
        }
      }
    }
    
    return null;
  }, []);

  const handleDeployToNetlify = useCallback(async () => {
    // Collect all files from the project
    const allFiles = collectAllFiles(fileTree);
    
    if (allFiles.length === 0) {
      toast.error('No files to deploy! Generate some code first.');
      return;
    }

    // Filter out empty files and clean up paths
    const validFiles = allFiles
      .filter(file => file.content && file.content.trim().length > 0)
      .map(file => ({
        ...file,
        path: file.path.replace(/^project\//, '') // Remove "project/" prefix for Netlify
      }));
    
    if (validFiles.length === 0) {
      toast.error('No valid files to deploy!');
      return;
    }

    // Prepare files for Vite + React deployment (adds required config files)
    const deploymentFiles = prepareFilesForDeployment(validFiles);
    
    console.log('Prepared files for deployment:', deploymentFiles.map(f => f.path));

    setDeploying(true);
    toast.loading('Deploying to Netlify...', { id: 'deploy' });

    try {
      // Generate site name with aetherbuild prefix
      let siteNameBase = '';
      
      // Check if project name is not "Untitled Project" or "untitled"
      const normalizedProjectName = (projectName || '').trim().toLowerCase();
      if (normalizedProjectName && 
          normalizedProjectName !== 'untitled project' && 
          normalizedProjectName !== 'untitled' &&
          normalizedProjectName.length > 0) {
        // Use project name
        siteNameBase = projectName;
      } else {
        // Try to extract h1 from App.jsx
        const appFile = validFiles.find(f => 
          f.path === 'src/App.jsx' || 
          f.path === 'App.jsx' ||
          f.name === 'App.jsx'
        );
        
        if (appFile && appFile.content) {
          const h1Text = extractH1Text(appFile.content);
          if (h1Text) {
            siteNameBase = h1Text;
          }
        }
        
        // If still no name, use a generic name
        if (!siteNameBase) {
          siteNameBase = 'project';
        }
      }
      
      // Sanitize the name: lowercase, replace spaces/special chars with hyphens
      const sanitized = siteNameBase
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 40); // Limit length
      
      // Generate random suffix for uniqueness (4-6 chars)
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      
      // Final site name: aetherbuild-{sanitized-name}-{random}
      const siteName = `aetherbuild-${sanitized}-${randomSuffix}`;
      
      console.log('Generated site name:', siteName);

      const res = await fetch(`${apiBase}/deploy/netlify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: deploymentFiles,
          siteName: siteName
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `HTTP ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success && data.url) {
        setDeployedUrl(data.url);
        
        // Save deployed URL to project
        if (currentProjectId && token) {
          try {
            await axios.post(
              `${apiBase}/projects/${currentProjectId}/deploy`,
              { url: data.url },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (error) {
            console.error('Failed to save deploy URL:', error);
          }
        }
        
        toast.success(
          <div>
            <p className="font-semibold">Deployed successfully! 🚀</p>
            <a 
              href={data.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              {data.url}
            </a>
          </div>,
          { 
            id: 'deploy',
            duration: 10000 
          }
        );
      } else {
        throw new Error('Deployment succeeded but no URL returned');
      }

    } catch (e) {
      const errorMsg = e.message || 'Deployment failed';
      toast.error(`Deployment failed: ${errorMsg}`, { id: 'deploy' });
      console.error('Deploy error:', errorMsg);
    } finally {
      setDeploying(false);
    }
  }, [apiBase, fileTree, prompt, projectName, extractH1Text]);

  // Copy deployed URL to clipboard
  const copyDeployedUrl = useCallback(() => {
    if (deployedUrl) {
      navigator.clipboard.writeText(deployedUrl);
      toast.success('URL copied to clipboard!');
    }
  }, [deployedUrl]);

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
  // Routing Logic
  if (view === 'landing') {
  return (
      <>
        <Toaster position="top-right" />
        <LandingPage onGetStarted={() => setView('auth')} />
      </>
    );
  }

  if (view === 'auth') {
    return (
      <>
        <Toaster position="top-right" />
        <Auth onAuthSuccess={handleAuthSuccess} />
      </>
    );
  }

  if (view === 'dashboard') {
    return (
      <>
        <Toaster position="top-right" />
        <ProjectDashboard
          token={token}
          onCreateProject={handleCreateProject}
          onOpenProject={handleOpenProject}
          onLogout={handleLogout}
        />
      </>
    );
  }

  // Editor view (view === 'editor')
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
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setView('dashboard')}
                className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
                title="Back to Dashboard"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 flex-1">
                <div className="font-semibold text-base text-white">AetherBuild</div>
                <div className="text-xs text-gray-500">•</div>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={() => saveProject()}
                  className="text-sm bg-transparent border-none outline-none text-gray-300 hover:text-white focus:text-white flex-1 max-w-[200px]"
                  placeholder="Project name"
                />
                <div className={`flex items-center gap-1 text-xs ${isServerRunning ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isServerRunning ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  {isServerRunning ? 'Online' : 'Offline'}
                </div>
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

              <button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                onClick={() => saveProject()}
                title="Save Project"
              >
                <FiSave className="w-4 h-4" />
                Save Project
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

              {/* AI Features Section */}
              <div className="pt-2 border-t border-gray-700/50 mt-2">
                <div className="px-2 mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Features</span>
                </div>
                <div className="space-y-2">
                <button
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeFeaturePanel === 'voice'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => setActiveFeaturePanel(activeFeaturePanel === 'voice' ? null : 'voice')}
                  >
                    <FiMic className="w-4 h-4" />
                    Voice to Code
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeFeaturePanel === 'image'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => setActiveFeaturePanel(activeFeaturePanel === 'image' ? null : 'image')}
                  >
                    <FiImage className="w-4 h-4" />
                    Image to Code
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeFeaturePanel === 'analytics'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => setActiveFeaturePanel(activeFeaturePanel === 'analytics' ? null : 'analytics')}
                  >
                    <FiBarChart2 className="w-4 h-4" />
                    Analytics
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeFeaturePanel === 'marketplace'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => setActiveFeaturePanel(activeFeaturePanel === 'marketplace' ? null : 'marketplace')}
                  >
                    <FiPackage className="w-4 h-4" />
                    Marketplace
                </button>
              </div>
              </div>

              {/* Project Chat Button */}
              <button
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  showChat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                }`}
                onClick={() => setShowChat(!showChat)}
              >
                <FiMessageCircle className="w-4 h-4" />
                Project Chat
                {chatMessages.length > 0 && (
                  <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {chatMessages.length}
                  </span>
                )}
              </button>

              {/* Deploy to Netlify Button */}
              <button
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-sm px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onClick={handleDeployToNetlify}
                disabled={deploying || loading}
              >
                <FiGlobe className="w-4 h-4" />
                {deploying ? 'Deploying...' : '🚀 Deploy to Netlify'}
                {deploying && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              </button>

              {/* Deployed URL Display */}
              {deployedUrl && (
                <div className="p-3 bg-teal-900/20 border border-teal-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-teal-300">Live Site</span>
                    <button
                      onClick={copyDeployedUrl}
                      className="p-1 hover:bg-teal-500/20 rounded transition-colors"
                      title="Copy URL"
                    >
                      <FiCopy className="w-3 h-3 text-teal-400" />
                    </button>
                  </div>
                  <a
                    href={deployedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:text-teal-300 text-xs break-all flex items-center gap-1"
                  >
                    {deployedUrl}
                    <FiExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}
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

            </div>
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

        {/* AI Features Panel - Slides in from right when toggled */}
        {activeFeaturePanel && (
          <div className={`absolute right-0 top-0 bottom-0 w-96 bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl z-40 animate-slide-in-right ${showCodeEditor ? 'right-1/2' : ''}`}>
            {/* Feature Panel Header */}
            <div className="flex items-center justify-between bg-gray-800 border-b border-gray-700 px-4 py-3">
              <div className="flex items-center gap-2">
                {activeFeaturePanel === 'voice' && (
                  <>
                    <FiMic className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-semibold">Voice to Code</h3>
                  </>
                )}
                {activeFeaturePanel === 'image' && (
                  <>
                    <FiImage className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-semibold">Image to Code</h3>
                  </>
                )}
                {activeFeaturePanel === 'analytics' && (
                  <>
                    <FiBarChart2 className="w-5 h-5 text-orange-400" />
                    <h3 className="text-white font-semibold">Performance Analytics</h3>
                  </>
                )}
                {activeFeaturePanel === 'marketplace' && (
                  <>
                    <FiPackage className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-white font-semibold">Component Marketplace</h3>
                  </>
                )}
                </div>
              <button
                onClick={() => setActiveFeaturePanel(null)}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                title="Close Panel"
              >
                <FiX className="w-4 h-4" />
              </button>
              </div>

            {/* Feature Panel Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeFeaturePanel === 'voice' && (
                <VoiceToCode 
                  onCodeGenerated={(code) => {
                    updateFileContent(activeFileId, code);
                    setActiveFeaturePanel(null); // Close panel after code generation
                  }} 
                />
              )}
              {activeFeaturePanel === 'image' && (
                <ImageToCode 
                  onCodeGenerated={(code) => {
                    updateFileContent(activeFileId, code);
                    setActiveFeaturePanel(null); // Close panel after code generation
                  }} 
                />
              )}
              {activeFeaturePanel === 'analytics' && (
                <PerformanceAnalytics fileTree={fileTree} activeFileId={activeFileId} />
              )}
              {activeFeaturePanel === 'marketplace' && (
                <ComponentMarketplace 
                  onComponentSelected={(code) => {
                    updateFileContent(activeFileId, code);
                    setActiveFeaturePanel(null); // Close panel after component selection
                  }} 
                />
        )}
      </div>
          </div>
        )}

        {/* AI Mentor - Always available */}
        <AIMentor />

        {/* Project Chat Modal - Opens as a modal */}
        <AnimatePresence>
          {showChat && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowChat(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl h-[80vh] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/95 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <FiMessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Project Chat</h2>
                      <p className="text-xs text-gray-400">Edit and improve your code with AI</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                        <FiMessageCircle className="w-8 h-8 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-300 mb-2">No messages yet</h3>
                      <p className="text-sm text-gray-500 max-w-sm">
                        Start a conversation by asking AI to edit or improve your code. 
                        Try: "Make the buttons more rounded" or "Add a dark mode toggle"
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.role === 'user' 
                              ? 'bg-blue-600' 
                              : msg.error
                              ? 'bg-red-600'
                              : 'bg-purple-600'
                          }`}>
                            {msg.role === 'user' ? (
                              <span className="text-white text-xs font-semibold">U</span>
                            ) : (
                              <span className="text-white text-xs font-semibold">AI</span>
                            )}
                          </div>
                          <div className={`rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white rounded-tr-sm'
                              : msg.error
                              ? 'bg-red-900/30 text-red-300 border border-red-500/30 rounded-tl-sm'
                              : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            {msg.timestamp && (
                              <p className="text-xs mt-1 opacity-70">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/95">
                  <div className="flex gap-3">
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
                      placeholder="Ask AI to edit your code... (e.g., 'Make buttons larger', 'Add animations')"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={loading}
                    />
                    <button
                      onClick={() => {
                        if (chatInput.trim()) {
                          handleChatEdit(chatInput);
                        }
                      }}
                      disabled={loading || !chatInput.trim()}
                      className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <FiSend className="w-5 h-5" />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Tip: Be specific about what you want to change. The AI will update your code accordingly.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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