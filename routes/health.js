const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'IVAR v2.0',
    company: 'Galvaniq',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    ai: 'openai-gpt4o',
    whatsapp: 'connected',
  });
});

module.exports = router;
