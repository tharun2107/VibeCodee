const mongoose = require('mongoose');

const PromptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prompt: { type: String, required: true },
  code: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prompt', PromptSchema);
