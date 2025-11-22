const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function buildGenerateUrl(modelName) {
  const model = modelName || DEFAULT_MODEL;
  // Normalize model name - remove 'models/' prefix if present
  let normalizedModel = model.replace(/^models\//, '');
  
  // Map common model names to correct API names (based on available models)
  const modelMap = {
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-2.0-flash-001': 'gemini-2.0-flash-001',
    'gemini-2.5-flash-lite': 'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
    // Legacy mappings for older model names
    'gemini-1.5-flash': 'gemini-2.5-flash',
    'gemini-1.5-pro': 'gemini-2.5-pro',
    'gemini-flash': 'gemini-2.5-flash',
    'gemini-pro': 'gemini-2.5-pro',
  };
  
  const lowerModel = normalizedModel.toLowerCase();
  if (modelMap[lowerModel]) {
    normalizedModel = modelMap[lowerModel];
  }
  
  return `https://generativelanguage.googleapis.com/v1/models/${normalizedModel}:generateContent`;
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
  
  // First, try to extract code blocks
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
      if (found) {
        let code = found.body.trim();
        // Ensure window.MainComponent assignment exists
        if (!code.includes('window.MainComponent') && !code.includes('window.MainComponent =')) {
          // Try to find the component name and add assignment
          const componentMatch = code.match(/(?:function|const|let|var)\s+(\w+)\s*[=\(]/);
          if (componentMatch) {
            const componentName = componentMatch[1];
            code += `\n\nwindow.MainComponent = ${componentName};`;
          } else {
            // Fallback: add a default assignment
            code += `\n\nwindow.MainComponent = window.MainComponent || (() => <div>Component loaded</div>);`;
          }
        }
        return code;
      }
    }
    blocks.sort((a, b) => b.body.length - a.body.length);
    let code = blocks[0].body.trim();
    // Ensure window.MainComponent assignment
    if (!code.includes('window.MainComponent')) {
      const componentMatch = code.match(/(?:function|const|let|var)\s+(\w+)\s*[=\(]/);
      if (componentMatch) {
        code += `\n\nwindow.MainComponent = ${componentMatch[1]};`;
      }
    }
    return code;
  }

  // If no code blocks, try to find code in the text
  const lines = str.split(/\r?\n/);
  const codeStartIdx = lines.findIndex((ln) => /^(const |let |var |function |import |export |document\.|window\.|\()/.test(ln.trim()));
  if (codeStartIdx >= 0) {
    let code = lines.slice(codeStartIdx).join('\n').trim();
    // Ensure window.MainComponent assignment
    if (!code.includes('window.MainComponent')) {
      const componentMatch = code.match(/(?:function|const|let|var)\s+(\w+)\s*[=\(]/);
      if (componentMatch) {
        code += `\n\nwindow.MainComponent = ${componentMatch[1]};`;
      }
    }
    return code;
  }
  
  // Last resort: return trimmed text and add a basic component wrapper
  let code = str.trim();
  if (!code.includes('window.MainComponent')) {
    code = `function App() {
  return (
    <div className="p-4">
      ${code}
    </div>
  );
}
window.MainComponent = App;`;
  }
  return code;
}
function buildGenerationInstruction(userPrompt) {
  return [
    'You are an expert React developer using Tailwind CSS.',
    'Generate complete, production-ready code that runs directly in the browser.',
    '',
    'CRITICAL REQUIREMENTS:',
    '1. Generate the ENTIRE component in a SINGLE response',
    '2. DO NOT use import statements - React and ReactDOM are already available globally',
    '3. DO NOT use export statements - assign to window.MainComponent instead',
    '4. Use functional components with React hooks (useState, useEffect, etc.)',
    '5. ALWAYS end your code with: window.MainComponent = YourComponentName;',
    '6. Use Tailwind utility classes for ALL styling (no custom CSS)',
    '7. Include ALL necessary logic and state management in the component',
    '8. Make the UI responsive and mobile-friendly',
    '9. Add helpful comments for complex logic',
    '10. Use React.createElement or JSX syntax (JSX will be transpiled by Babel)',
    '',
    'REQUIRED CODE FORMAT:',
    '```jsx',
    'function YourComponentName() {',
    '  const [state, setState] = React.useState(initialValue);',
    '  // ... your component logic ...',
    '  return (',
    '    <div className="tailwind-classes">',
    '      {/* Your JSX here */}',
    '    </div>',
    '  );',
    '}',
    '',
    '// THIS LINE IS MANDATORY - DO NOT OMIT IT',
    'window.MainComponent = YourComponentName;',
    '```',
    '',
    'IMPORTANT:',
    '- The component name should be descriptive (e.g., TodoApp, Dashboard, LandingPage)',
    '- Always include the window.MainComponent assignment at the end',
    '- Use React.useState, React.useEffect, etc. (React is global)',
    '- Use ReactDOM.createRoot and root.render for rendering (already handled in preview)',
    '',
    'TASK:',
    userPrompt,
    '',
    'Generate the complete React component code now:',
  ].join('\n');
}

async function generateCode(prompt, modelOverride, options = {}) {
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  const url = buildGenerateUrl(modelOverride);
  const finalPrompt = buildGenerationInstruction(prompt);
  
  try {
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
          maxOutputTokens: 8192, // Increased back since 2.5 models support up to 65536 tokens
        }
      },
      {
        params: { key: GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, // 60 second timeout
      }
    );
    
    const raw = extractTextFromCandidates(response.data);
    if (!raw || raw.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }
    
    const code = sanitizeToCode(raw);
    
    // Final validation: ensure window.MainComponent exists
    if (!code.includes('window.MainComponent')) {
      // Try to extract component name and add assignment
      const componentMatch = code.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*[=\(]/);
      if (componentMatch) {
        return code + `\n\nwindow.MainComponent = ${componentMatch[1]};`;
      }
      // Last resort: wrap in a component
      return `function App() {
  ${code}
  return <div className="p-4">Component rendered</div>;
}
window.MainComponent = App;`;
    }
    
    return code;
  } catch (error) {
    if (error.response) {
      const errorData = error.response.data?.error;
      const errorMessage = errorData?.message || error.message;
      
      // Provide helpful error messages for common issues
      if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
        throw new Error(`Gemini API Quota Error: ${errorMessage}\n\nSolutions:\n1. Check your API quota at https://ai.google.dev/usage\n2. Verify billing is set up in Google Cloud Console\n3. Free tier has rate limits - wait a few minutes or upgrade your plan\n4. Make sure you're using a valid API key`);
      }
      
      if (errorMessage.includes('API key') || errorMessage.includes('permission')) {
        throw new Error(`Gemini API Key Error: ${errorMessage}\n\nSolutions:\n1. Verify your GEMINI_API_KEY in the .env file\n2. Make sure the API key is enabled for Gemini API\n3. Check API key permissions in Google Cloud Console`);
      }
      
      if (errorMessage.includes('model') || errorMessage.includes('not found')) {
        throw new Error(`Gemini Model Error: ${errorMessage}\n\nAvailable models: gemini-1.5-flash, gemini-1.5-pro\nCheck available models at: https://ai.google.dev/models`);
      }
      
      throw new Error(`Gemini API error: ${errorMessage}`);
    }
    throw error;
  }
}

// New function for chat-based code editing
async function editCode(prompt, currentCode, modelOverride, options = {}) {
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  const url = buildGenerateUrl(modelOverride);
  
  const editPrompt = [
    'You are helping edit React code. The user wants to make changes to their existing component.',
    '',
    'CURRENT CODE:',
    '```jsx',
    currentCode,
    '```',
    '',
    'USER REQUEST:',
    prompt,
    '',
    'INSTRUCTIONS:',
    '1. Modify the code according to the user\'s request',
    '2. Keep all existing functionality unless explicitly asked to remove it',
    '3. DO NOT use import statements - React is global',
    '4. ALWAYS end with: window.MainComponent = ComponentName;',
    '5. Use Tailwind CSS for styling',
    '6. Maintain code quality and add comments where helpful',
    '',
    'Return the COMPLETE modified code:',
  ].join('\n');
  
  return generateCode(editPrompt, modelOverride, options);
}

// Fix code with error message
async function fixCode(code, error, modelOverride, options = {}) {
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  const url = buildGenerateUrl(modelOverride);
  const errorMessage = error || 'Unknown error occurred';
  
  const repairPrompt = [
    'You are fixing React code that has an error. The code uses Tailwind CSS and runs in a browser environment.',
    '',
    'ERROR TO FIX:',
    errorMessage,
    '',
    'CURRENT CODE:',
    '```jsx',
    code,
    '```',
    '',
    'CRITICAL FIXING RULES:',
    '1. Fix the error while maintaining the original functionality',
    '2. DO NOT use import statements - React and ReactDOM are global',
    '3. DO NOT use export statements - use window.MainComponent instead',
    '4. ALWAYS end with: window.MainComponent = ComponentName;',
    '5. Use React hooks (React.useState, React.useEffect, etc.)',
    '6. Use Tailwind CSS classes for styling',
    '7. Ensure the code is valid JSX/JavaScript',
    '8. Fix syntax errors, undefined variables, and logic errors',
    '9. Make sure all variables are defined before use',
    '10. Ensure proper JSX syntax and closing tags',
    '',
    'Return the COMPLETE fixed code in a code block:',
  ].join('\n');
  
  return generateCode(repairPrompt, modelOverride, options);
}

module.exports = { generateCode, fixCode, editCode };