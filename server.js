const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const whatsappRoutes = require('./routes/whatsapp');
const healthRoutes = require('./routes/health');
const adminRoutes = require('./routes/admin');
const database = require('./database/mongodb');
const client = require('./config/client');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.use('/webhook', whatsappRoutes);
app.use('/health', healthRoutes);
app.use('/admin', adminRoutes);

// Root — basic info
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'IVAR — AI Receptionist',
    company: 'Galvaniq',
    client: client.business.name,
    version: '2.0.0',
  });
});

// Stats endpoint — shows lead pipeline data
app.get('/stats', async (req, res) => {
  try {
    const stats = await database.getStats();
    res.json({ business: client.business.name, ...stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── ERROR HANDLING ───────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 IVAR v2.0 — ${client.business.name}`);
  console.log(`📱 WhatsApp Business API: CONNECTED`);
  console.log(`🤖 AI: OpenAI GPT-4o`);
  console.log(`🌍 Industry: ${client.business.industry}`);
  console.log(`📡 Port: ${PORT}\n`);
});

module.exports = app;
