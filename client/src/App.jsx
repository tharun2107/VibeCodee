import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';

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
    const bootstrap = `\n      <script>\n        (function(){\n          function send(level, args){\n            try {\n              parent.postMessage({ type: 'console', level, args: Array.from(args).map(a => {\n                try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e){ return String(a); }\n              }) }, '*');\n            } catch(_){}\n          }\n          ['log','warn','error','info'].forEach(k=>{\n            const orig = console[k];\n            console[k] = function(){ send(k, arguments); try{ orig && orig.apply(console, arguments); }catch(_){} };\n          });\n          window.addEventListener('error', function(e){\n            send('error', [ (e && e.message) + ' @ ' + (e && e.filename) + ':' + (e && e.lineno) ]);\n          });\n          window.addEventListener('unhandledrejection', function(e){\n            const r = e && e.reason;\n            send('error', ['UnhandledRejection: ' + (r && (r.stack || r.message) || r)]);\n          });\n\n          function executeUserCode(code){\n            try {\n              console.log('About to execute code (first 200 chars):', String(code || '').slice(0, 200));\n              const s = document.createElement('script');\n              s.type = 'module';\n              s.textContent = String(code || '');\n              s.addEventListener('error', (ev) => {\n                console.error('Module script error:', ev && (ev.message || ev.type));\n              });\n              document.body.appendChild(s);\n            } catch (err) {\n              console.error('Injection error:', err && (err.stack || err.message) || err);\n            }\n          }\n\n          window.addEventListener('message', function(e){\n            try {\n              if (e && e.data && e.data.type === 'execute') {\n                executeUserCode(e.data.code || '');\n              }\n            } catch(err){\n              console.error('Message handling error:', err && (err.stack || err.message) || err);\n            }\n          });\n        })();\n      <\/script>\n    `;
    return `<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>\n      <style>html,body,#app{height:100%;margin:0}</style>\n    </head><body>\n      <div id=\"app\"></div>\n      ${bootstrap}\n    </body></html>`;
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
        body: JSON.stringify({ prompt, model: model || undefined }),
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
  }, [apiBase, clearLogs, jwt, model, prompt]);

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
        body: JSON.stringify({ code, error: errMsg, model: model || undefined }),
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
  }, [apiBase, code, jwt, model, logs]);

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
      </div>

      <div className="h-40 border-t bg-white overflow-auto">
        <div className="px-3 py-2 text-xs font-semibold bg-slate-100 border-b flex items-center justify-between">
          <span>Console Output</span>
          <button className="text-xs underline" onClick={clearLogs}>Clear</button>
        </div>
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
      </div>
    </div>
  );
}

export default App;
