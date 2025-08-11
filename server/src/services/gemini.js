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
  // Prefer fenced code blocks first
  const fenceRegex = /```\s*([a-zA-Z0-9+-]*)\n([\s\S]*?)```/g;
  let match;
  const blocks = [];
  while ((match = fenceRegex.exec(str)) !== null) {
    const lang = (match[1] || '').toLowerCase();
    const body = match[2] || '';
    blocks.push({ lang, body });
  }
  if (blocks.length > 0) {
    // Prefer javascript/js/jsx/html in that order, else the largest block
    const preferredOrder = ['javascript', 'js', 'jsx', 'html'];
    for (const pref of preferredOrder) {
      const found = blocks.find((b) => b.lang.includes(pref));
      if (found) return found.body.trim();
    }
    blocks.sort((a, b) => b.body.length - a.body.length);
    return blocks[0].body.trim();
  }

  // Strip leading prose like "Of course!" etc by finding first semicolon or newline that starts code-y tokens
  const lines = str.split(/\r?\n/);
  const codeStartIdx = lines.findIndex((ln) => /^(const |let |var |function |import |export |document\.|window\.|\()/.test(ln.trim()));
  if (codeStartIdx >= 0) {
    return lines.slice(codeStartIdx).join('\n').trim();
  }
  return str.trim();
}

function buildGenerationInstruction(userPrompt) {
  return [
    'You are generating code for a browser sandbox that injects code into <script type="module">.',
    'STRICT FORMAT REQUIREMENTS:',
    '- Return ONLY raw JavaScript code that runs in a browser without a bundler.',
    '- Do NOT return Markdown, explanations, or code fences.',
    '- Avoid JSX and imports; use plain DOM APIs or inline CSS/HTML created via JS.',
    '',
    'Task:',
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

async function fixCode(code, error, modelOverride) {
  const repairPrompt = [
    'You are an expert React + JavaScript + TailwindCSS code fixer working for a browser sandbox that injects code into <script type="module">.',
    'Fix the following code based on the runtime error.',
    'Return ONLY the corrected raw JavaScript code. No Markdown, no explanations, no code fences, no JSX.',
    '',
    'Code:',
    code,
    '',
    'Error:',
    error,
  ].join('\n');
  return generateCode(repairPrompt, modelOverride);
}

module.exports = { generateCode, fixCode };
