const express = require('express');
const { deployToNetlify, getSiteStatus } = require('../services/netlify');

const router = express.Router();

// Deploy project to Netlify
router.post('/deploy/netlify', async (req, res) => {
  const { files, siteName } = req.body;
  
  try {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        error: 'Files are required',
        details: 'Please provide an array of files with path and content'
      });
    }

    console.log('Deploying to Netlify:', {
      fileCount: files.length,
      siteName: siteName || 'auto-generated'
    });

    const result = await deployToNetlify(files, siteName);
    
    res.json({
      success: true,
      ...result,
      message: 'Deployment successful! Your site is live.'
    });
  } catch (err) {
    console.error('Deploy error:', err);
    res.status(500).json({ 
      error: 'Deployment failed', 
      details: err.message 
    });
  }
});

// Get deployment status
router.get('/deploy/status/:siteId', async (req, res) => {
  const { siteId } = req.params;
  
  try {
    const status = await getSiteStatus(siteId);
    res.json({ success: true, ...status });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ 
      error: 'Failed to get deployment status', 
      details: err.message 
    });
  }
});

module.exports = router;

