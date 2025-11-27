import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiSend, FiUser, FiZap, FiX } from 'react-icons/fi';

const buildIntroMessage = (context) => {
  if (!context) {
    return "Hi! I'm your AI Mentor. I can help explain code, answer project questions, or outline next steps. What would you like to explore?";
  }

  const { projectName, summary, activeFileName } = context;
  return `Hey there! I'm your personal mentor for "${projectName}". Right now we're focusing on ${activeFileName || 'your current file'}. Summary: ${summary || 'No summary yet.'} Ask me anything about this project, its code, or the best next move.`;
};

const AIMentor = ({ projectContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: 'mentor-intro',
      type: 'ai',
      content: buildIntroMessage(projectContext),
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === 'mentor-intro'
          ? { ...message, content: buildIntroMessage(projectContext), timestamp: new Date() }
          : message
      )
    );
  }, [projectContext]);

  const buildContextSummary = () => {
    if (!projectContext) {
      return 'Project context is not available yet.';
    }

    const {
      projectName,
      summary,
      totalFiles,
      totalLines,
      activeFileName,
      activeFilePath,
      activeFileContent,
      recentInteractions,
      deployedUrl,
    } = projectContext;

    const trimmedCode = (activeFileContent || '').slice(0, 1500);
    const formattedHistory = recentInteractions
      .map((entry, index) => {
        const timestamp = entry.timestamp
          ? new Date(entry.timestamp).toLocaleString()
          : `Interaction ${index + 1}`;
        return `[${timestamp}] (${entry.type || 'interaction'}) Asked: "${entry.user || 'N/A'}" | AI: "${
          entry.response || 'N/A'
        }"`;
      })
      .join('\n');

    return `
Project: ${projectName}
Summary: ${summary || 'No summary yet.'}
Files: ${totalFiles} total, ${totalLines} lines of code
Active File: ${activeFileName || 'None selected'} ${activeFilePath ? `(${activeFilePath})` : ''}
Active File Sample:
${trimmedCode || 'No active file selected or file is empty.'}

Recent Activity:
${formattedHistory || 'No interactions recorded yet.'}
${deployedUrl ? `Live URL: ${deployedUrl}` : ''}
`.trim();
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const contextBlock = buildContextSummary();
      const mentorPrompt = `You are an AI mentor dedicated to a single project. Use the context below to provide authoritative, project-aware help.

Context:
${contextBlock}

User question: "${userMessage.content}"

Respond with:
1. A concise explanation referencing project details.
2. If applicable, mention specific files, components, or code blocks.
3. Provide next steps or best-practice suggestions tailored to this project.`;

      const res = await fetch(`${apiBase}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: mentorPrompt,
          model: 'gemini-2.5-flash'
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const aiResponse = data.code || 'I apologize, but I couldn\'t generate a proper response. Please try rephrasing your question.';

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Mentor error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions =
    projectContext?.suggestedQuestions?.length > 0
      ? projectContext.suggestedQuestions
      : [
          'How do I create a React component?',
          'Explain useState hook',
          'How to handle forms in React?',
          'What are React hooks?',
          'How to optimize React performance?',
        ];

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiMessageSquare className="w-6 h-6 text-white" />
        </motion.div>
      </motion.button>

      {/* Mentor Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-40 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <FiZap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Mentor</h3>
                <p className="text-xs text-gray-400">AI coding assistant</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto p-1 hover:bg-gray-700 rounded"
              >
                <FiX className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {projectContext && (
              <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/70 text-xs text-gray-300 space-y-1">
                <p className="text-sm font-semibold text-white">
                  {projectContext.projectName || 'Current Project'}
                </p>
                <p>{projectContext.summary || 'No project summary yet.'}</p>
                {projectContext.activeFileName && (
                  <p className="text-gray-400">
                    Active file: {projectContext.activeFileName}
                    {projectContext.activeFilePath ? ` (${projectContext.activeFilePath})` : ''}
                  </p>
                )}
                <p className="text-gray-500">
                  Files: {projectContext.totalFiles} • Lines: {projectContext.totalLines}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <FiZap className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <FiUser className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <FiZap className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-800 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && quickQuestions.length > 0 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
                <div className="space-y-1">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(question)}
                      className="block w-full text-left text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded px-2 py-1 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask me anything about coding..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg flex items-center justify-center"
                >
                  <FiSend className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIMentor;
