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
    const preferredOrder = ['javascript', 'js', 'jsx', 'tsx', 'react'];
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
      'STYLING MODE: Plain CSS. Use inline styles or CSS-in-JS. Do NOT use external stylesheets.',
      'Apply styles directly to elements using the style prop or create styled components.',
    ].join('\n')
    : [
      'STYLING MODE: Tailwind CSS. Use Tailwind utility classes for styling.',
      'Use modern Tailwind classes for beautiful, responsive designs.',
    ].join('\n');

  return [
    'You are a React code generator that creates working React functional components.',
    '',
    'CRITICAL REQUIREMENTS:',
    '- Generate ONLY a single React functional component',
    '- Use proper ES6 import syntax: import React, { useState, useEffect } from "react"',
    '- Return JSX syntax, NOT React.createElement',
    '- Component must be exported as default export',
    '- Ensure all React hooks are properly imported',
    '- Make the component self-contained and functional',
    '',
    'CODE STRUCTURE:',
    'import React, { useState, useEffect } from "react";',
    '',
    'function ComponentName() {',
    '  // Component logic here',
    '  const [state, setState] = useState(initialValue);',
    '  ',
    '  return (',
    '    <div className="tailwind-classes">',
    '      {/* Component JSX */}',
    '    </div>',
    '  );',
    '}',
    '',
    'export default ComponentName;',
    '',
    styleBlock,
    '',
    'IMPORTANT NOTES:',
    '- Always use proper JSX syntax',
    '- Ensure proper React hooks import',
    '- Make the UI beautiful, interactive and functional',
    '- Handle all user interactions and state changes properly',
    '- Use semantic HTML elements and proper accessibility',
    '- Component should be production-ready',
    '',
    'User Request:',
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
    'You are fixing a React component that has errors. Fix the code to work properly.',
    '',
    'REQUIREMENTS:',
    '- Fix the specific error mentioned below',
    '- Use proper ES6 import syntax: import React, { useState, useEffect } from "react"',
    '- Return JSX syntax, NOT React.createElement',
    '- Ensure all React hooks are properly imported',
    '- Component must be exported as default export',
    '- Return ONLY the corrected JavaScript code with proper formatting',
    '',
    options.styleMode === 'css'
      ? 'STYLING: Use inline styles or CSS-in-JS.'
      : 'STYLING: Use Tailwind CSS utility classes.',
    '',
    'ORIGINAL CODE:',
    code,
    '',
    'ERROR TO FIX:',
    error,
    '',
    'Return the complete corrected code with proper imports and exports:'
  ].filter(Boolean).join('\n');
  return generateCode(repairPrompt, modelOverride, { styleMode: options.styleMode || 'tailwind' });
}

module.exports = { generateCode, fixCode };