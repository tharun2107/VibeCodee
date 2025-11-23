const express = require('express');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT
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

// Create project
router.post('/', auth, async (req, res) => {
  const { name, fileStructure, conversationHistory, deployedLinks } = req.body;
  try {
    const project = new Project({ 
      userId: req.userId, 
      name: name || 'Untitled Project',
      fileStructure: fileStructure || [],
      conversationHistory: conversationHistory || [],
      deployedLinks: deployedLinks || []
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId })
      .select('name createdAt updatedAt deployedLinks')
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  const { name, fileStructure, conversationHistory, deployedLinks } = req.body;
  try {
    const updateData = { updatedAt: Date.now() };
    if (name !== undefined) updateData.name = name;
    if (fileStructure !== undefined) updateData.fileStructure = fileStructure;
    if (conversationHistory !== undefined) updateData.conversationHistory = conversationHistory;
    if (deployedLinks !== undefined) updateData.deployedLinks = deployedLinks;
    
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add deployed link to project
router.post('/:id/deploy', auth, async (req, res) => {
  const { url } = req.body;
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    if (!project.deployedLinks.includes(url)) {
      project.deployedLinks.push(url);
      project.updatedAt = Date.now();
      await project.save();
    }
    
    res.json(project);
  } catch (err) {
    console.error('Add deploy link error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Project.deleteOne({ _id: req.params.id, userId: req.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
