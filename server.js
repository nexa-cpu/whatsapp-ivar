// server.js — Galvaniq Group IVAR
// Entry point. Routes, middleware, startup.

'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const whatsappRoutes = require('./routes/whatsapp');
const healthRoutes = require('./routes/health');
const adminRoutes = require('./routes/admin');
const database = require('./database/mongodb');
const config = require('./config/client');

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ── ROUTES ────────────────────────────────────────────────────
app.use('/webhook', whatsappRoutes);
app.use('/health', healthRoutes);
app.use('/admin', adminRoutes);

// ── ROOT ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'IVAR — AI Receptionist',
    company: config.company.name,
    website: config.company.website,
    products: [
      config.business.products.bec.short,
      config.business.products.ivar.name,
    ],
    version: '2.0.0',
  });
});

// ── STATS ─────────────────────────────────────────────────────
app.get('/stats', async (req, res) => {
  try {
    const stats = await database.getStats();
    res.json({
      company: config.company.name,
      address: config.company.address,
      email: config.company.email_info,
      website: config.company.website,
      ...stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── ERROR HANDLER ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong',
  });
});

// ── START ─────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🚀 IVAR v2.0 — ${config.company.name}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📱 WhatsApp Business API: CONNECTED`);
  console.log(`🤖 AI Engine: OpenAI GPT-4o`);
  console.log(`🏢 Address: ${config.company.address}`);
  console.log(`🌐 Website: ${config.company.website}`);
  console.log(`📧 Email: ${config.company.email_info}`);
  console.log(`📦 Products: ${config.business.products.bec.name} + ${config.business.products.ivar.name}`);
  console.log(`👤 CEO: ${config.admins.michael.name} (${config.admins.michael.phone})`);
  console.log(`👤 CTO: ${config.admins.ashell.name} (${config.admins.ashell.phone})`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Connect to MongoDB
  try {
    await database.connect();
    console.log(`✅ MongoDB connected`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed:`, error.message);
  }
});

module.exports = app;
