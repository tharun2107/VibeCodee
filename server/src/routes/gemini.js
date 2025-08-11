const express = require('express');
const { generateCode, fixCode } = require('../services/gemini');
const jwt = require('jsonwebtoken');

const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Generate code from prompt
router.post('/generate', auth, async (req, res) => {
  const { prompt, model } = req.body;
  try {
    const code = await generateCode(prompt, model);
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: 'Gemini API error', details: err.message });
  }
});

// Fix code using error
router.post('/fix', auth, async (req, res) => {
  const { code, error, model } = req.body;
  try {
    const fixedCode = await fixCode(code, error, model);
    res.json({ code: fixedCode });
  } catch (err) {
    res.status(500).json({ error: 'Gemini API error', details: err.message });
  }
});

module.exports = router;
