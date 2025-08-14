const express = require('express');
const { generateCode, fixCode } = require('../services/gemini');

const router = express.Router();

// Generate code from prompt (no authentication)
router.post('/generate', async (req, res) => {
  const { prompt, model, styleMode } = req.body;
  try {
    const code = await generateCode(prompt, model, { styleMode });
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: 'Gemini API error', details: err.message });
  }
});

// Fix code using error (no authentication)
router.post('/fix', async (req, res) => {
  const { code, error, model, styleMode } = req.body;
  try {
    const fixedCode = await fixCode(code, error, model, { styleMode });
    res.json({ code: fixedCode });
  } catch (err) {
    res.status(500).json({ error: 'Gemini API error', details: err.message });
  }
});

module.exports = router;