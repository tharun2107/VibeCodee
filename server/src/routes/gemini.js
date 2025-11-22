const express = require('express');
const { generateCode, fixCode, editCode } = require('../services/gemini');

const router = express.Router();

// Generate code from prompt (no authentication)
router.post('/generate', async (req, res) => {
  const { prompt, model, styleMode } = req.body;
  try {
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const code = await generateCode(prompt, model, { styleMode });
    res.json({ code });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: 'Gemini API error', details: err.message });
  }
});

// Fix code using error (no authentication)
router.post('/fix', async (req, res) => {
  const { code, error, model, styleMode } = req.body;
  try {
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Code is required' });
    }
    const fixedCode = await fixCode(code, error || 'Unknown error', model, { styleMode });
    res.json({ code: fixedCode });
  } catch (err) {
    console.error('Fix error:', err);
    res.status(500).json({ error: 'Gemini API error', details: err.message });
  }
});

// Edit code using chat prompt (new endpoint for iterative editing)
router.post('/edit', async (req, res) => {
  const { prompt, code, model, styleMode } = req.body;
  try {
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Code is required' });
    }
    const editedCode = await editCode(prompt, code, model, { styleMode });
    res.json({ code: editedCode });
  } catch (err) {
    console.error('Edit error:', err);
    res.status(500).json({ error: 'Gemini API error', details: err.message });
  }
});

module.exports = router;