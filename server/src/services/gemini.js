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
function buildGenerationInstruction(userPrompt) {
  return [
    'You are an expert React developer using Tailwind CSS.',
    'Generate complete, production-ready code that runs directly in the browser.',
    'STRICT RULES:',
    '- Generate the ENTIRE component in a SINGLE response',
    '- DO NOT use import statements - React is already global',
    '- DO NOT use export statements - assign to window instead',
    '- Use functional components with React hooks',
    '- Assign main component to: window.MainComponent = MyComponent',
    '- Use Tailwind utility classes for all styling',
    '- Include ALL necessary logic in the component',
    '- Add detailed comments explaining complex logic',
    '- Ensure the UI is responsive and mobile-friendly',
    '',
    'COMPONENT STRUCTURE EXAMPLE:',
    'function MyComponent() {',
    '  // State and hooks',
    '  // Event handlers',
    '  // JSX with Tailwind classes',
    '}',
    'window.MainComponent = MyComponent;',
    '',
    'TASK:',
    userPrompt,
  ].join('\n');
}

async function generateCode(prompt, modelOverride) {
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  const url = buildGenerateUrl(modelOverride);
  const finalPrompt = buildGenerationInstruction(prompt);
  
  const response = await axios.post(
    url,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: finalPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 8192, // Increased token limit
      }
    },
    {
      params: { key: GEMINI_API_KEY },
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  const raw = extractTextFromCandidates(response.data);
  return sanitizeToCode(raw);
}
// services/gemini.js
async function fixCode(code, error, modelOverride) {
  const repairPrompt = [
    'Fix the following React code that uses Tailwind CSS.',
    'The code has the following error:',
    error,
    '',
    'IMPORTANT RULES:',
    '- Use ES modules syntax ONLY (NO require(), NO module.exports)',
    '- Use React and ReactDOM from global window object',
    '- Export the main component as: "window.MainComponent = MyComponent"',
    '- Do NOT use any Node.js-specific features',
    '',
    'Code to fix:',
    code,
    '',
    'Return ONLY the fixed JavaScript code:',
  ].join('\n');
  
  return generateCode(repairPrompt, modelOverride);
}

module.exports = { generateCode, fixCode };