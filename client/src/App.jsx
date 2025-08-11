import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview, SandpackConsole } from '@codesandbox/sandpack-react';
import { githubLight } from '@codesandbox/sandpack-themes';

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
        code: `<!doctype html>\n<html><head>\n<meta charset=\"utf-8\"/>\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n<script src=\"https://cdn.tailwindcss.com\"><\/script>\n<title>VibeCode Preview<\/title>\n</head><body>\n<!-- Provide both containers for compatibility -->\n<div id=\"root\"></div>\n<div id=\"app\"></div>\n</body></html>`
      },
      '/index.js': {
        code: `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App.jsx';\nconst mountEl = document.getElementById('root') || document.getElementById('app');\nconst root = createRoot(mountEl);\nroot.render(React.createElement(App));\n`,
      },
      '/prelude.js': {
        code: `import React from 'react';\nimport * as ReactDOMClient from 'react-dom/client';\n// Expose globals so generated code that references window.React/ReactDOM works\nif (typeof window !== 'undefined') {\n  window.React = React;\n  window.ReactDOM = ReactDOMClient;\n}\nexport {};\n`
      },
      '/__raw.js': { code: rawModule },
      '/App.jsx': {
        code: `import React, { useEffect } from 'react';\nimport './prelude.js';\nimport raw from './__raw.js';\n\nexport default function App(){\n  useEffect(() => {\n    try {\n      const ensure = (id) => { let el = document.getElementById(id); if (!el) { el = document.createElement('div'); el.id = id; document.body.appendChild(el); } return el; };\n      ensure('root'); ensure('app');\n      if (!window.ReactDOM) { console.warn('ReactDOM global missing; ensure prelude loaded.'); }\n      const fn = new Function(raw);\n      fn();\n    } catch(e){ console.error('Runtime error while executing raw code:', e); }\n  }, []);\n  return React.createElement('div', { className: 'p-4 text-sm text-slate-700' }, 'Running generated script...');\n}\n`,
      },
      '/UserCode.jsx': { code: userCode },
    };
  }, [code]);

  return (
    <div className="h-screen w-screen grid grid-rows-[auto,1fr,auto] bg-slate-50 text-slate-900">
      <div className="flex items-center gap-2 p-3 border-b bg-white">
        <div className="font-bold">VibeCode AI</div>
        <input
          className="ml-4 flex-1 border rounded px-3 py-2 text-sm"
          placeholder="Describe the app/component you want..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <input
          className="w-72 border rounded px-3 py-2 text-xs"
          placeholder="Paste JWT token"
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
        />
        <input
          className="w-56 border rounded px-3 py-2 text-xs"
          placeholder="Model (optional, e.g., gemini-2.5-pro)"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <label className="text-xs flex items-center gap-1 px-2"><input type="checkbox" checked={useSandpack} onChange={(e) => setUseSandpack(e.target.checked)} /> Use Sandpack</label>
        <select className="text-xs border rounded px-2 py-1" value={styleMode} onChange={(e) => setStyleMode(e.target.value)}>
          <option value="tailwind">Tailwind</option>
          <option value="css">Plain CSS</option>
        </select>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded disabled:opacity-60"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Code'}
        </button>
        <button
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded disabled:opacity-60"
          onClick={handleFix}
          disabled={loading}
        >
          {loading ? 'Fixing...' : 'AI Error Fix'}
        </button>
      </div>

      <div className="grid grid-cols-2 min-h-0">
        {useSandpack ? (
          <div className="col-span-2 flex flex-col min-h-0">
            <SandpackProvider template="react" theme={githubLight} files={sandpackFiles} options={{ activeFile: '/UserCode.jsx' }}>
              <SandpackLayout style={{ height: '100%' }}>
                <div className="flex-1 min-h-0">
                  <SandpackCodeEditor showTabs={true} showLineNumbers={true} wrapContent={true} style={{ height: '50vh' }} />
                </div>
                <div className="flex-1 min-h-0">
                  <SandpackPreview style={{ height: '40vh' }} />
                </div>
              </SandpackLayout>
              <div className="border-t">
                <SandpackConsole maxMessageCount={200} />
              </div>
            </SandpackProvider>
          </div>
        ) : (
          <>
              <div className="flex flex-col min-h-0 border-r">
                <div className="px-3 py-2 text-xs font-semibold bg-slate-100 border-b">Editor (JS)</div>
                <textarea
                  className="flex-1 p-3 font-mono text-sm outline-none"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="flex flex-col min-h-0">
                <div className="px-3 py-2 text-xs font-semibold bg-slate-100 border-b">Live Preview</div>
                <iframe ref={iframeRef} title="preview" className="flex-1 bg-white"></iframe>
              </div>
          </>
        )}
      </div>

      <div className="h-40 border-t bg-white overflow-auto">
        <div className="px-3 py-2 text-xs font-semibold bg-slate-100 border-b flex items-center justify-between">
          <span>Console Output</span>
          <button className="text-xs underline" onClick={clearLogs}>Clear</button>
        </div>
        {!useSandpack ? (
          <div className="p-3 space-y-1 text-xs font-mono">
            {errorText && (
              <div className="text-red-600">Error: {errorText}</div>
            )}
            {logs.map((l, i) => (
              <div key={i} className={l.level === 'error' ? 'text-red-600' : l.level === 'warn' ? 'text-amber-600' : 'text-slate-800'}>
                [{l.level}] {l.args.join(' ')}
              </div>
            ))}
            {!logs.length && !errorText && (
              <div className="text-slate-500">No console output yet.</div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-600 p-2">Using Sandpack console above.</div>
        )}
      </div>
    </div>
  );
}

export default App;
