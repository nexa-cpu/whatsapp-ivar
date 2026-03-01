const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'WhatsApp IVAR',
    whatsapp_api: 'connected',
    ai: 'openai-gpt4o'
  });
});

module.exports = router;
