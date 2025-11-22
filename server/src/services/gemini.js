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
  // Handle different response structures
  if (!apiResponseData) {
    console.error('No response data received');
    return '';
  }

  // Check for candidates array
  const candidates = apiResponseData?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    // Check for direct text response
    if (apiResponseData.text) {
      return apiResponseData.text;
    }
    // Check for error in response
    if (apiResponseData.error) {
      throw new Error(`API Error: ${apiResponseData.error.message || JSON.stringify(apiResponseData.error)}`);
    }
    console.error('No candidates found in response:', JSON.stringify(apiResponseData, null, 2));
    return '';
  }

  // Extract text from first candidate
  const firstCandidate = candidates[0];
  
  // Check for finishReason
  if (firstCandidate.finishReason && firstCandidate.finishReason !== 'STOP') {
    console.warn(`Finish reason: ${firstCandidate.finishReason}`);
  }

  // Extract parts
  const parts = firstCandidate?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    // Try alternative structure
    if (firstCandidate.text) {
      return firstCandidate.text;
    }
    console.error('No parts found in candidate:', JSON.stringify(firstCandidate, null, 2));
    return '';
  }

  // Extract text from all parts
  const textParts = parts
    .map((p) => {
      if (typeof p.text === 'string') {
        return p.text;
      }
      // Handle inline data or other formats
      if (p.inlineData) {
        return '';
      }
      return '';
    })
    .filter(Boolean);

  if (textParts.length === 0) {
    console.error('No text found in parts:', JSON.stringify(parts, null, 2));
    return '';
  }

  return textParts.join('\n');
}

function sanitizeToCode(text) {
  if (!text) {
    console.error('sanitizeToCode: No text provided');
    return '';
  }
  
  const str = String(text).trim();
  if (str.length === 0) {
    console.error('sanitizeToCode: Empty string');
    return '';
  }
  
  console.log('sanitizeToCode: Processing text, length:', str.length);
  
  // First, try to extract code blocks (most common format)
  const fenceRegex = /```\s*([a-zA-Z0-9+-]*)\n([\s\S]*?)```/g;
  let match;
  const blocks = [];
  while ((match = fenceRegex.exec(str)) !== null) {
    const lang = (match[1] || '').toLowerCase();
    const body = match[2] || '';
    if (body.trim().length > 0) {
      blocks.push({ lang, body: body.trim() });
    }
  }
  
  if (blocks.length > 0) {
    console.log('Found', blocks.length, 'code blocks');
    // Prefer JSX/JavaScript blocks
    const preferredOrder = ['jsx', 'javascript', 'js', 'html'];
    for (const pref of preferredOrder) {
      const found = blocks.find((b) => b.lang.includes(pref));
      if (found && found.body.length > 50) { // Ensure it's substantial
        console.log('Using preferred block:', pref, 'length:', found.body.length);
        let code = found.body;
        // Ensure window.MainComponent assignment exists
        if (!code.includes('window.MainComponent') && !code.includes('window.MainComponent =')) {
          const componentMatch = code.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*[=\(]/);
          if (componentMatch) {
            const componentName = componentMatch[1];
            code += `\n\nwindow.MainComponent = ${componentName};`;
            console.log('Added window.MainComponent assignment for:', componentName);
          }
        }
        return code;
      }
    }
    // Use the longest block if no preferred match
    blocks.sort((a, b) => b.body.length - a.body.length);
    if (blocks[0].body.length > 50) {
      console.log('Using longest block, length:', blocks[0].body.length);
      let code = blocks[0].body;
      if (!code.includes('window.MainComponent')) {
        const componentMatch = code.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*[=\(]/);
        if (componentMatch) {
          code += `\n\nwindow.MainComponent = ${componentMatch[1]};`;
        }
      }
      return code;
    }
  }

  // If no code blocks, try to find code in the text
  console.log('No code blocks found, searching for code patterns...');
  const lines = str.split(/\r?\n/);
  const codeStartIdx = lines.findIndex((ln) => {
    const trimmed = ln.trim();
    return /^(const |let |var |function |class |import |export |document\.|window\.|\()/.test(trimmed) ||
           trimmed.startsWith('function ') || 
           trimmed.startsWith('const ') ||
           trimmed.startsWith('let ') ||
           trimmed.startsWith('var ');
  });
  
  if (codeStartIdx >= 0) {
    let code = lines.slice(codeStartIdx).join('\n').trim();
    console.log('Found code starting at line', codeStartIdx, 'length:', code.length);
    
    // Ensure window.MainComponent assignment
    if (!code.includes('window.MainComponent')) {
      const componentMatch = code.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*[=\(]/);
      if (componentMatch) {
        code += `\n\nwindow.MainComponent = ${componentMatch[1]};`;
        console.log('Added window.MainComponent for:', componentMatch[1]);
      }
    }
    return code;
  }
  
  // Last resort: check if the entire text looks like code
  if (str.includes('function') || str.includes('const ') || str.includes('return (')) {
    console.log('Text appears to be code, using as-is');
    let code = str;
    if (!code.includes('window.MainComponent')) {
      const componentMatch = code.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*[=\(]/);
      if (componentMatch) {
        code += `\n\nwindow.MainComponent = ${componentMatch[1]};`;
      } else {
        // Wrap in a component
        code = `function App() {
  ${code}
  return <div className="p-4">Component rendered</div>;
}
window.MainComponent = App;`;
      }
    }
    return code;
  }
  
  console.error('sanitizeToCode: Could not extract code from text');
  console.error('Text preview:', str.substring(0, 200));
  return '';
}
function buildGenerationInstruction(userPrompt) {
  return `You are an expert React developer specializing in Tailwind CSS. Your task is to generate COMPLETE, production-ready React component code.

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. Generate the ENTIRE, COMPLETE component in a SINGLE response - DO NOT leave anything incomplete
2. DO NOT use import statements - React and ReactDOM are already available as global variables
3. DO NOT use export statements - you MUST assign your component to window.MainComponent
4. Use functional components with React hooks (React.useState, React.useEffect, etc.)
5. ALWAYS end your code with: window.MainComponent = YourComponentName;
6. Use Tailwind CSS utility classes for ALL styling - NO custom CSS, NO style tags
7. Include ALL necessary logic, state management, and event handlers
8. Make the UI fully responsive and mobile-friendly
9. Add helpful comments for complex logic
10. Ensure all JSX is properly closed and valid
11. Include ALL features requested in the prompt - nothing should be missing

REQUIRED CODE FORMAT (MUST FOLLOW THIS EXACTLY):
\`\`\`jsx
function YourComponentName() {
  // All state declarations
  const [state, setState] = React.useState(initialValue);
  
  // All event handlers and functions
  const handleClick = () => {
    // Implementation
  };
  
  // useEffect hooks if needed
  React.useEffect(() => {
    // Side effects
  }, []);
  
  // Return complete JSX
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Complete component JSX here */}
    </div>
  );
}

// THIS LINE IS ABSOLUTELY MANDATORY - DO NOT FORGET IT
window.MainComponent = YourComponentName;
\`\`\`

IMPORTANT NOTES:
- Component name should be descriptive based on the prompt (e.g., TodoApp, PortfolioPage, Dashboard)
- Use React.useState, React.useEffect, React.useCallback, etc. (React is global)
- All Tailwind classes must be valid and complete
- Ensure all interactive elements work (buttons, inputs, forms, etc.)
- Include error handling where appropriate
- Make sure the component is fully functional and complete

USER REQUEST:
${userPrompt}

Now generate the COMPLETE, FULLY FUNCTIONAL React component code. Make sure it includes everything requested and is ready to run immediately.`;
}

async function generateCode(prompt, modelOverride, options = {}) {
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  const url = buildGenerateUrl(modelOverride);
  const finalPrompt = buildGenerationInstruction(prompt);
  
  try {
    console.log('Generating code with model:', modelOverride || DEFAULT_MODEL);
    console.log('Prompt length:', finalPrompt.length);
  
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
          temperature: 0.3, // Slightly higher for more creative but still focused
        topP: 0.95,
          topK: 40,
          maxOutputTokens: 16384, // Increased for complete code generation
      }
    },
    {
      params: { key: GEMINI_API_KEY },
      headers: { 'Content-Type': 'application/json' },
        timeout: 90000, // 90 second timeout for longer responses
      }
    );
    
    // Log response structure for debugging
    if (!response.data) {
      throw new Error('No response data received from API');
    }
    
    console.log('Response received, extracting text...');
  const raw = extractTextFromCandidates(response.data);
    
    if (!raw || raw.trim().length === 0) {
      console.error('Empty response. Full API response:', JSON.stringify(response.data, null, 2));
      throw new Error('Empty response from Gemini API. The API returned no text content. Please try again or check your API key and quota.');
    }
    
    console.log('Raw response length:', raw.length);
    console.log('Raw response preview:', raw.substring(0, 200));
    
    const code = sanitizeToCode(raw);
    
    if (!code || code.trim().length === 0) {
      console.error('Code extraction failed. Raw text:', raw.substring(0, 500));
      throw new Error('Failed to extract code from API response. Please try again.');
    }
    
    console.log('Extracted code length:', code.length);
    
    // Final validation: ensure window.MainComponent exists
    if (!code.includes('window.MainComponent') && !code.includes('window.MainComponent =')) {
      console.warn('window.MainComponent not found, attempting to add it...');
      // Try to extract component name and add assignment
      const componentMatch = code.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*[=\(]/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        console.log('Found component name:', componentName);
        return code + `\n\nwindow.MainComponent = ${componentName};`;
      }
      // Last resort: wrap in a component
      console.warn('No component name found, wrapping in default App component');
      return `function App() {
  ${code}
  return <div className="p-4">Component rendered</div>;
}
window.MainComponent = App;`;
    }
    
    console.log('Code generation successful');
    return code;
  } catch (error) {
    console.error('Generate code error:', error.message);
    console.error('Error details:', error.response?.data || error);
    
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
        throw new Error(`Gemini Model Error: ${errorMessage}\n\nAvailable models: gemini-2.5-flash, gemini-2.5-pro\nCheck available models at: https://ai.google.dev/models`);
      }
      
      throw new Error(`Gemini API error: ${errorMessage}`);
    }
    
    // Re-throw with more context
    if (error.message.includes('Empty response')) {
      throw error; // Already has good message
    }
    
    throw new Error(`Code generation failed: ${error.message}`);
  }
}

// New function for chat-based code editing
async function editCode(prompt, currentCode, modelOverride, options = {}) {
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  const url = buildGenerateUrl(modelOverride);
  
  const editPrompt = `You are helping edit React code. The user wants to make changes to their existing component.

CURRENT CODE:
\`\`\`jsx
${currentCode}
\`\`\`

USER REQUEST:
${prompt}

INSTRUCTIONS - MUST FOLLOW:
1. Modify the code according to the user's request while keeping ALL existing functionality
2. Only remove features if explicitly asked - otherwise keep everything
3. DO NOT use import statements - React and ReactDOM are global variables
4. ALWAYS end with: window.MainComponent = ComponentName;
5. Use Tailwind CSS utility classes for ALL styling - NO custom CSS
6. Maintain code quality and add helpful comments where needed
7. Ensure the code is complete, functional, and ready to run
8. Make sure all JSX is properly closed and valid
9. Preserve all state management and event handlers unless asked to change them

Return the COMPLETE modified code. Include the entire component with all changes applied.`;
  
  return generateCode(editPrompt, modelOverride, options);
}

// Fix code with error message
async function fixCode(code, error, modelOverride, options = {}) {
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  const url = buildGenerateUrl(modelOverride);
  const errorMessage = error || 'Unknown error occurred';
  
  const repairPrompt = `You are fixing React code that has an error. The code uses Tailwind CSS and runs in a browser environment.

ERROR TO FIX:
${errorMessage}

CURRENT CODE:
\`\`\`jsx
${code}
\`\`\`

CRITICAL FIXING RULES - MUST FOLLOW:
1. Fix ALL errors while maintaining the original functionality completely
2. DO NOT use import statements - React and ReactDOM are global variables
3. DO NOT use export statements - you MUST use window.MainComponent instead
4. ALWAYS end with: window.MainComponent = ComponentName;
5. Use React hooks (React.useState, React.useEffect, etc.) - React is global
6. Use Tailwind CSS utility classes for ALL styling - NO custom CSS
7. Ensure the code is valid JSX/JavaScript with proper syntax
8. Fix ALL syntax errors, undefined variables, and logic errors
9. Make sure ALL variables are defined before use
10. Ensure proper JSX syntax with all tags properly closed
11. Return the COMPLETE, FULLY FUNCTIONAL fixed code
12. Do not remove any features - only fix errors

Return the COMPLETE fixed code in a code block. Make sure it's the entire component, fully functional, and ready to run.`;
  
  return generateCode(repairPrompt, modelOverride, options);
}

module.exports = { generateCode, fixCode, editCode };