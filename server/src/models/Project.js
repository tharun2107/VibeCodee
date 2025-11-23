const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  type: { type: String, enum: ['generate', 'fix', 'chat'], required: true },
  user: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  fileStructure: { type: mongoose.Schema.Types.Mixed, required: true }, // Full file tree
  conversationHistory: { type: [ConversationSchema], default: [] },
  deployedLinks: { type: [String], default: [] }, // Array of deployed URLs
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);
