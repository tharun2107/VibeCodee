const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function buildGenerateUrl(modelName) {
  const model = modelName || DEFAULT_MODEL;
  return `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
}

function extractTextFromCandidates(apiResponseData) {
  const candidates = apiResponseData?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return '';
  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((p) => (typeof p.text === 'string' ? p.text : ''))
    .filter(Boolean)
    .join('\n');
}

function sanitizeToCode(text) {
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
  const codeStartIdx = lines.findIndex((ln) => /^(const |let |var |function |import |export |document\.|window\.|\()/.test(ln.trim()));
  if (codeStartIdx >= 0) {
    return lines.slice(codeStartIdx).join('\n').trim();
  }
  return str.trim();
}

function buildGenerationInstruction(userPrompt, styleMode) {
  const styleBlock = styleMode === 'css'
    ? [
      'STYLING MODE: Plain CSS. Do NOT use Tailwind. Define CSS rules and inject them via a <style> element appended to <head> from your JS code.',
      'You may create class names and apply them to your elements. Ensure all CSS needed is present in the injected <style> string.',
    ].join('\n')
    : [
      'STYLING MODE: Tailwind. Use Tailwind utility classes. No custom CSS unless absolutely necessary.',
    ].join('\n');

  return [
    'You generate code for a browser sandbox that injects code into <script> with React (UMD globals) and Tailwind available.',
    'RUNTIME AVAILABLE:',
    '- window.React and window.ReactDOM (React 18 UMD), no imports.',
    '- TailwindCSS via CDN, no build step.',
    styleBlock,
    '',
    'STRICT FORMAT REQUIREMENTS:',
    '- Return ONLY raw JavaScript. No Markdown, no explanations, no code fences.',
    '- Prefer React.createElement or JSX. If JSX is used, still return just the code.',
    '- If you define a component, also MOUNT it by calling ReactDOM.createRoot(document.getElementById("app")).render(<Component/> or React.createElement(Component)).',
    '- Do not reference files, bundlers, or external assets that require imports.',
    '',
    'Task:',
    userPrompt,
  ].join('\n');
}

async function generateCode(prompt, modelOverride, options = {}) {
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  const url = buildGenerateUrl(modelOverride);
  const finalPrompt = buildGenerationInstruction(prompt, options.styleMode || 'tailwind');
  const response = await axios.post(
    url,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: finalPrompt }],
        },
      ],
    },
    {
      params: { key: GEMINI_API_KEY },
      headers: { 'Content-Type': 'application/json' },
      validateStatus: (status) => status >= 200 && status < 300,
    }
  );
  const raw = extractTextFromCandidates(response.data);
  return sanitizeToCode(raw);
}

async function fixCode(code, error, modelOverride, options = {}) {
  const repairPrompt = [
    'You fix code for the same browser sandbox environment with React (UMD globals) and Tailwind available.',
    options.styleMode === 'css'
      ? 'STYLING MODE: Plain CSS. Avoid Tailwind; inject CSS via <style> if needed.'
      : 'STYLING MODE: Tailwind utilities preferred.',
    'Return ONLY the corrected JavaScript and ensure it MOUNTS to #app with ReactDOM.createRoot(...) if React is used.',
    '',
    'Code:',
    code,
    '',
    'Error:',
    error,
  ].filter(Boolean).join('\n');
  return generateCode(repairPrompt, modelOverride, { styleMode: options.styleMode || 'tailwind' });
}

module.exports = { generateCode, fixCode };
