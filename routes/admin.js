const express = require('express');
const router = express.Router();
const database = require('../database/mongodb');

// Simple token check — prevents random people from resetting your leads
function checkAdminToken(req, res, next) {
  const token = req.query.token;
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Reset a single lead — visit /admin/reset-lead/263785477620?token=YOUR_TOKEN
router.get('/reset-lead/:number', checkAdminToken, async (req, res) => {
  const number = req.params.number;
  await database.updateLeadStatus(number, 'new');
  await database.updateLeadMeta(number, { lastHoldingMessageAt: null });
  res.json({ success: true, message: `Lead ${number} reset to new` });
});

// Reset ALL leads — useful during testing
router.get('/reset-all', checkAdminToken, async (req, res) => {
  await database.resetAllLeads();
  res.json({ success: true, message: 'All leads reset' });
});

// View stats
router.get('/stats', checkAdminToken, async (req, res) => {
  const stats = await database.getStats();
  res.json(stats);
});

module.exports = router;
