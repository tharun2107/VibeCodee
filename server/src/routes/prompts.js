const express = require('express');
const Prompt = require('../models/Prompt');
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

// Log a prompt
router.post('/', auth, async (req, res) => {
  const { prompt, code } = req.body;
  try {
    const log = new Prompt({ userId: req.userId, prompt, code });
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
