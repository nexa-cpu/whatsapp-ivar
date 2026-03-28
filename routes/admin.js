const express = require('express');
const router = express.Router();
const database = require('../database/mongodb');

function checkToken(req, res, next) {
  const token = req.query.token || req.headers['x-admin-token'];
  if (!process.env.ADMIN_TOKEN || token === process.env.ADMIN_TOKEN) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized — add ?token=YOUR_ADMIN_TOKEN' });
}

// Reset a single lead
// GET /admin/reset-lead/263785477620?token=yourtoken
router.get('/reset-lead/:number', checkToken, async (req, res) => {
  try {
    const number = req.params.number;
    await database.updateLeadStatus(number, 'new');
    await database.updateLeadMeta(number, { lastHoldingMessageAt: null, handoverAt: null });
    console.log(`🔄 Lead ${number} manually reset`);
    res.json({ success: true, message: `Lead ${number} reset — IVAR will respond normally now` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset ALL leads
// GET /admin/reset-all?token=yourtoken
router.get('/reset-all', checkToken, async (req, res) => {
  try {
    await database.resetAllLeads();
    res.json({ success: true, message: 'All leads reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats
// GET /admin/stats?token=yourtoken
router.get('/stats', checkToken, async (req, res) => {
  try {
    const stats = await database.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
