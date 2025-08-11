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
    const libs = `\n      <!-- Tailwind via CDN -->\n      <script src=\"https://cdn.tailwindcss.com\"><\/script>\n      <!-- React 18 UMD -->\n      <script crossorigin src=\"https://unpkg.com/react@18/umd/react.development.js\"><\/script>\n      <script crossorigin src=\"https://unpkg.com/react-dom@18/umd/react-dom.development.js\"><\/script>\n      <!-- Babel standalone for JSX support -->\n      <script src=\"https://unpkg.com/@babel/standalone/babel.min.js\"><\/script>\n    `;

    const bootstrap = `\n      <script>\n        (function(){\n          function send(level, args){\n            try {\n              parent.postMessage({ type: 'console', level, args: Array.from(args).map(a => {\n                try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e){ return String(a); }\n              }) }, '*');\n            } catch(_){}\n          }\n          ['log','warn','error','info'].forEach(k=>{\n            const orig = console[k];\n            console[k] = function(){ send(k, arguments); try{ orig && orig.apply(console, arguments); }catch(_){} };\n          });\n          window.addEventListener('error', function(e){\n            send('error', [ (e && e.message) + ' @ ' + (e && e.filename) + ':' + (e && e.lineno) ]);\n          });\n          window.addEventListener('unhandledrejection', function(e){\n            const r = e && e.reason;\n            send('error', ['UnhandledRejection: ' + (r && (r.stack || r.message) || r)]);\n          });\n\n          function stripImportsExports(src){\n            try {\n              return String(src)\n                .replace(/^\s*import\s+[^;]+;?\s*$/gm, '')\n                .replace(/^\s*export\s+default\s+/gm, 'window.__defaultExport = ')\n                .replace(/^\s*export\s+\{[^}]*\};?\s*$/gm, '');\n            } catch(_) { return String(src); }\n          }\n\n          function executeUserCode(code){\n            try {\n              console.log('About to execute code (first 200 chars):', String(code || '').slice(0, 200));\n              var finalCode = String(code || '');\n              var usedBabel = false;\n              try {\n                if (window.Babel) {\n                  finalCode = stripImportsExports(finalCode);\n                  const result = window.Babel.transform(finalCode, { presets: ['react'] });\n                  finalCode = result.code || finalCode;\n                  usedBabel = true;\n                  console.log('Transpiled with Babel');\n                }\n              } catch (babelErr) {\n                console.warn('Babel transform failed, running raw:', babelErr && (babelErr.message || babelErr));\n              }\n              const s = document.createElement('script');\n              s.type = usedBabel ? 'text/javascript' : 'module';\n              s.textContent = String(finalCode || '');\n              s.addEventListener('error', (ev) => {\n                console.error('Script error:', ev && (ev.message || ev.type));\n              });\n              document.body.appendChild(s);\n            } catch (err) {\n              console.error('Injection error:', err && (err.stack || err.message) || err);\n            }\n          }\n\n          window.addEventListener('message', function(e){\n            try {\n              if (e && e.data && e.data.type === 'execute') {\n                executeUserCode(e.data.code || '');\n              }\n            } catch(err){\n              console.error('Message handling error:', err && (err.stack || err.message) || err);\n            }\n          });\n        })();\n      <\/script>\n    `;
    return `<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>\n      <style>html,body,#app{height:100%;margin:0}</style>\n      ${libs}\n    </head><body class=\"p-2\">\n      <div id=\"app\"></div>\n      ${bootstrap}\n    </body></html>`;
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e?.data?.type === 'console') {
        setLogs((prev) => [...prev, { level: e.data.level, args: e.data.args }]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    setLogs([]);
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(iframeHtml);
    doc.close();
    const cw = iframe.contentWindow;
    if (cw) {
      cw.postMessage({ type: 'execute', code: htmlSource || '' }, '*');
    }
  }, [iframeHtml, htmlSource]);

  return { iframeRef, logs, clearLogs: () => setLogs([]) };
}

function App() {
  const [prompt, setPrompt] = useState('Create a React button component with TailwindCSS');
  const [code, setCode] = useState(`const root = document.getElementById('app');\nroot.innerHTML = '<h1>Hello VibeCode</h1>';`);
  const [jwt, setJwt] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [useSandpack, setUseSandpack] = useState(true);
  const [styleMode, setStyleMode] = useState('tailwind'); // 'tailwind' | 'css'

  const { iframeRef, logs, clearLogs } = useSandbox(code);

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  const handleGenerate = useCallback(async () => {
    if (!jwt) { alert('Please paste your JWT token'); return; }
    setLoading(true); setErrorText(''); clearLogs();
    try {
      const res = await fetch(`${apiBase}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ prompt, model: model || undefined, styleMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generate failed');
      const raw = data.code || '';
      const cleaned = extractCodeBlock(raw);
      if (cleaned !== raw) {
        console.log('Sanitized generated code from markdown to raw JS.');
      }
      console.log('Received code (first 200 chars):', String(cleaned).slice(0, 200));
      setCode(cleaned);
    } catch (e) {
      setErrorText(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, [apiBase, clearLogs, jwt, model, prompt, styleMode]);

  const handleFix = useCallback(async () => {
    if (!jwt) { alert('Please paste your JWT token'); return; }
    setLoading(true); setErrorText('');
    try {
      const lastError = [...logs].reverse().find(l => l.level === 'error');
      const errMsg = lastError ? lastError.args.join(' ') : 'No explicit error captured; improve code robustness.';
      const res = await fetch(`${apiBase}/fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ code, error: errMsg, model: model || undefined, styleMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fix failed');
      const raw = data.code || '';
      const cleaned = extractCodeBlock(raw);
      if (cleaned !== raw) {
        console.log('Sanitized fixed code from markdown to raw JS.');
      }
      console.log('Received fixed code (first 200 chars):', String(cleaned).slice(0, 200));
      setCode(cleaned);
    } catch (e) {
      setErrorText(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, [apiBase, code, jwt, model, logs, styleMode]);

  const sandpackFiles = useMemo(() => {
    const userCode = code || '';
    const rawModule = `export default atob('${btoa(unescape(encodeURIComponent(userCode)))}')`;
    return {
      '/index.html': {
        code: `<!doctype html>\n<html><head>\n<meta charset=\"utf-8\"/>\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n<script src=\"https://cdn.tailwindcss.com\"><\/script>\n<style>\n/* Fallback Tailwind classes for common utilities */\n.bg-blue-500 { background-color: #3b82f6; }\n.bg-blue-600 { background-color: #2563eb; }\n.bg-blue-700 { background-color: #1d4ed8; }\n.bg-green-500 { background-color: #10b981; }\n.bg-red-500 { background-color: #ef4444; }\n.bg-yellow-500 { background-color: #eab308; }\n.bg-purple-500 { background-color: #8b5cf6; }\n.bg-pink-500 { background-color: #ec4899; }\n.bg-slate-900 { background-color: #0f172a; }\n.bg-white { background-color: #ffffff; }\n.bg-black { background-color: #000000; }\n.text-white { color: #ffffff; }\n.text-black { color: #000000; }\n.text-blue-600 { color: #2563eb; }\n.text-purple-400 { color: #c084fc; }\n.text-red-400 { color: #f87171; }\n.text-yellow-400 { color: #facc15; }\n.font-bold { font-weight: 700; }\n.font-semibold { font-weight: 600; }\n.p-2 { padding: 0.5rem; }\n.p-4 { padding: 1rem; }\n.p-6 { padding: 1.5rem; }\n.p-8 { padding: 2rem; }\n.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }\n.px-4 { padding-left: 1rem; padding-right: 1rem; }\n.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }\n.px-8 { padding-left: 2rem; padding-right: 2rem; }\n.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }\n.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }\n.py-4 { padding-top: 1rem; padding-bottom: 1rem; }\n.m-2 { margin: 0.5rem; }\n.m-4 { margin: 1rem; }\n.m-6 { margin: 1.5rem; }\n.mx-auto { margin-left: auto; margin-right: auto; }\n.my-4 { margin-top: 1rem; margin-bottom: 1rem; }\n.rounded { border-radius: 0.25rem; }\n.rounded-lg { border-radius: 0.5rem; }\n.rounded-xl { border-radius: 0.75rem; }\n.rounded-2xl { border-radius: 1rem; }\n.rounded-full { border-radius: 9999px; }\n.border { border-width: 1px; }\n.border-2 { border-width: 2px; }\n.border-solid { border-style: solid; }\n.border-blue-500 { border-color: #3b82f6; }\n.border-purple-500 { border-color: #8b5cf6; }\n.border-red-500 { border-color: #ef4444; }\n.border-yellow-500 { border-color: #eab308; }\n.shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }\n.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }\n.shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }\n.shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }\n.hover\\:bg-blue-700:hover { background-color: #1d4ed8; }\n.hover\\:bg-purple-700:hover { background-color: #7c3aed; }\n.hover\\:bg-emerald-700:hover { background-color: #047857; }\n.hover\\:bg-teal-700:hover { background-color: #0f766e; }\n.hover\\:scale-105:hover { transform: scale(1.05); }\n.hover\\:shadow-xl:hover { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }\n.focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }\n.focus\\:ring-2:focus { box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5); }\n.focus\\:ring-purple-500:focus { box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5); }\n.focus\\:border-transparent:focus { border-color: transparent; }\n.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }\n.transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }\n.duration-200 { transition-duration: 200ms; }\n.duration-300 { transition-duration: 300ms; }\n.disabled\\:opacity-50:disabled { opacity: 0.5; }\n.disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }\n.flex { display: flex; }\n.inline-flex { display: inline-flex; }\n.grid { display: grid; }\n.hidden { display: none; }\n.block { display: block; }\n.inline-block { display: inline-block; }\n.items-center { align-items: center; }\n.justify-center { justify-content: center; }\n.justify-between { justify-content: space-between; }\n.flex-col { flex-direction: column; }\n.flex-row { flex-direction: row; }\n.flex-wrap { flex-wrap: wrap; }\n.gap-2 { gap: 0.5rem; }\n.gap-3 { gap: 0.75rem; }\n.gap-4 { gap: 1rem; }\n.gap-6 { gap: 1.5rem; }\n.w-full { width: 100%; }\n.w-10 { width: 2.5rem; }\n.w-72 { width: 18rem; }\n.w-56 { width: 14rem; }\n.h-10 { height: 2.5rem; }\n.h-40 { height: 10rem; }\n.h-48 { height: 12rem; }\n.h-screen { height: 100vh; }\n.w-screen { width: 100vw; }\n.min-h-0 { min-height: 0px; }\n.text-sm { font-size: 0.875rem; line-height: 1.25rem; }\n.text-xs { font-size: 0.75rem; line-height: 1rem; }\n.text-lg { font-size: 1.125rem; line-height: 1.75rem; }\n.text-2xl { font-size: 1.5rem; line-height: 2rem; }\n.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }\n.font-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace; }\n.space-y-2 > * + * { margin-top: 0.5rem; }\n.space-y-1 > * + * { margin-top: 0.25rem; }\n.overflow-auto { overflow: auto; }\n.overflow-hidden { overflow: hidden; }\n.resize-none { resize: none; }\n.backdrop-blur-sm { backdrop-filter: blur(4px); }\n.bg-clip-text { background-clip: text; }\n.text-transparent { color: transparent; }\n.animate-spin { animation: spin 1s linear infinite; }\n.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }\n@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }\n<\/style>\n<title>VibeCode Preview<\/title>\n</head><body>\n<!-- Provide both containers for compatibility -->\n<div id=\"root\"></div>\n<div id=\"app\"></div>\n<script>\n// Debug Tailwind loading\nconsole.log('Tailwind CDN script loaded:', typeof window.tailwind !== 'undefined');\nif (typeof window.tailwind === 'undefined') {\n  console.warn('Tailwind CDN not loaded, using fallback CSS');\n}\n<\/script>\n</body></html>`
      },
      '/index.js': {
        code: `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App.jsx';\nconst mountEl = document.getElementById('root') || document.getElementById('app');\nconst root = createRoot(mountEl);\nroot.render(React.createElement(App));\n`,
      },
      '/prelude.js': {
        code: `import React from 'react';\nimport * as ReactDOMClient from 'react-dom/client';\n// Expose globals so generated code that references window.React/ReactDOM works\nif (typeof window !== 'undefined') {\n  window.React = React;\n  window.ReactDOM = ReactDOMClient;\n}\nexport {};\n`
      },
      '/__raw.js': { code: rawModule },
      '/App.jsx': {
        code: `import React, { useEffect } from 'react';\nimport './prelude.js';\nimport raw from './__raw.js';\n\nexport default function App(){\n  useEffect(() => {\n    try {\n      const ensure = (id) => { let el = document.getElementById(id); if (!el) { el = document.createElement('div'); el.id = id; document.body.appendChild(el); } return el; };\n      ensure('root'); ensure('app');\n      if (!window.ReactDOM) { console.warn('ReactDOM global missing; ensure prelude loaded.'); }\n      console.log('About to execute user code with Tailwind available:', typeof window.tailwind !== 'undefined');\n      const fn = new Function(raw);\n      fn();\n    } catch(e){ console.error('Runtime error while executing raw code:', e); }\n  }, []);\n  return React.createElement('div', { className: 'p-4 text-sm text-slate-700' }, 'Running generated script...');\n}\n`,
      },
      '/UserCode.jsx': { code: userCode },
    };
  }, [code]);

  return (
    <div className="h-screen w-screen grid grid-rows-[auto,1fr,auto] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Professional Header */}
      <div className="flex items-center gap-6 p-6 border-b border-purple-700/50 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">VC</span>
          </div>
          <div className="font-bold text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            VibeCode AI
          </div>
        </div>

        <div className="flex-1 flex items-center gap-4">
          <input
            className="flex-1 bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-sm placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            placeholder="Describe what you want to build..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <input
            className="w-72 bg-black/30 border border-purple-500/30 rounded-xl px-4 py-2 text-xs placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            placeholder="JWT Token"
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
          />

          <input
            className="w-56 bg-black/30 border border-purple-500/30 rounded-xl px-4 py-2 text-xs placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            placeholder="Model (optional)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-xs flex items-center gap-2 px-3 py-2 bg-black/30 border border-purple-500/30 rounded-xl">
            <input type="checkbox" checked={useSandpack} onChange={(e) => setUseSandpack(e.target.checked)} className="rounded" />
            Sandpack
          </label>

          <select
            className="text-xs bg-black/30 border border-purple-500/30 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            value={styleMode}
            onChange={(e) => setStyleMode(e.target.value)}
          >
            <option value="tailwind">Tailwind</option>
            <option value="css">Plain CSS</option>
          </select>

          <button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm px-8 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Generating...
              </div>
            ) : (
              'Generate Code'
            )}
          </button>

          <button
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={handleFix}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Fixing...
              </div>
            ) : (
              'AI Fix'
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 min-h-0 gap-6 p-6">
        {useSandpack ? (
          <div className="col-span-2 flex flex-col min-h-0 bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
            <SandpackProvider template="react" theme={nightOwl} files={sandpackFiles} options={{ activeFile: '/UserCode.jsx' }}>
              <SandpackLayout style={{ height: '100%' }}>
                <div className="flex-1 min-h-0">
                  <SandpackCodeEditor showTabs={true} showLineNumbers={true} wrapContent={true} style={{ height: '50vh' }} />
                </div>
                <div className="flex-1 min-h-0">
                  <SandpackPreview style={{ height: '40vh' }} />
                </div>
              </SandpackLayout>
              <div className="border-t border-purple-500/20">
                <SandpackConsole maxMessageCount={200} />
              </div>
            </SandpackProvider>
          </div>
        ) : (
          <>
              <div className="flex flex-col min-h-0 bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-2xl">
                <div className="px-6 py-4 text-sm font-semibold bg-black/30 border-b border-purple-500/20 rounded-t-2xl flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-2">Code Editor</span>
                </div>
                <textarea
                  className="flex-1 p-6 font-mono text-sm bg-transparent text-white outline-none resize-none rounded-b-2xl"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Your generated code will appear here..."
                />
              </div>

              <div className="flex flex-col min-h-0 bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-2xl">
                <div className="px-6 py-4 text-sm font-semibold bg-black/30 border-b border-purple-500/20 rounded-t-2xl flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-2">Live Preview</span>
                </div>
                <iframe ref={iframeRef} title="preview" className="flex-1 bg-white rounded-b-2xl" />
              </div>
          </>
        )}
      </div>

      {/* Console Output */}
      <div className="h-48 border-t border-purple-700/50 bg-black/20 backdrop-blur-sm overflow-auto">
        <div className="px-6 py-4 text-sm font-semibold bg-black/30 border-b border-purple-500/20 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Console Output
          </span>
          <button className="text-xs text-purple-300 hover:text-purple-100 underline transition-colors" onClick={clearLogs}>Clear</button>
        </div>
        {!useSandpack ? (
          <div className="p-6 space-y-2 text-xs font-mono">
            {errorText && (
              <div className="text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                <strong>Error:</strong> {errorText}
              </div>
            )}
            {logs.map((l, i) => (
              <div key={i} className={`p-2 rounded-lg ${l.level === 'error'
                ? 'text-red-400 bg-red-900/20 border border-red-500/30'
                : l.level === 'warn'
                  ? 'text-yellow-400 bg-yellow-900/20 border border-yellow-500/30'
                  : 'text-purple-300 bg-purple-900/20 border border-purple-500/30'
                }`}>
                <span className="font-semibold">[{l.level}]</span> {l.args.join(' ')}
              </div>
            ))}
            {!logs.length && !errorText && (
              <div className="text-purple-400/60 text-center py-8">No console output yet. Generate some code to see logs here.</div>
            )}
          </div>
        ) : (
            <div className="text-xs text-purple-400/60 p-6 text-center">Using Sandpack console above.</div>
        )}
      </div>
    </div>
  );
}

export default App;
