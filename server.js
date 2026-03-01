const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const whatsappRoutes = require('./routes/whatsapp');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/webhook', whatsappRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'WhatsApp IVAR - AI Receptionist',
    company: 'Galvaniq',
    version: '1.0.0',
    message: 'WhatsApp AI is running. Send messages to configured number.'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp IVAR running on port ${PORT}`);
  console.log(`📱 Business: Galvaniq`);
  console.log(`⚡ WhatsApp Business API: CONNECTED`);
  console.log(`🤖 AI: OpenAI GPT-4o`);
});

module.exports = app;
