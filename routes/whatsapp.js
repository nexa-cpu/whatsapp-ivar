const express = require('express');
const router = express.Router();
const { processMessage } = require('../handlers/whatsappHandler');

// ─── WEBHOOK VERIFICATION (GET) ───────────────────────────────────────────────
// Meta calls this once when you set up the webhook to confirm it's yours

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verified by Meta');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed — token mismatch');
    res.sendStatus(403);
  }
});

// ─── INCOMING MESSAGES (POST) ─────────────────────────────────────────────────
// Every WhatsApp message hits this endpoint

router.post('/', async (req, res) => {
  const body = req.body;

  // Respond to Meta immediately — they require a fast 200
  // Processing happens asynchronously after this
  res.status(200).send('EVENT_RECEIVED');

  if (body.object !== 'whatsapp_business_account') return;

  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  // ─── INCOMING MESSAGE ────────────────────────────────────────────────
  if (value?.messages?.[0]) {
    const message = value.messages[0];
    const from = message.from;
    const messageId = message.id;
    const messageText = message.text?.body;

    console.log(`💬 Message from ${from}: "${messageText}"`);

    // Only process text messages for now
    if (messageText) {
      processMessage(from, messageText, messageId).catch(err => {
        console.error('❌ Unhandled processMessage error:', err.message);
      });
    } else {
      console.log(`⚠️  Non-text message from ${from} — ignored`);
    }
  }

  // ─── MESSAGE STATUS UPDATES ──────────────────────────────────────────
  if (value?.statuses?.[0]) {
    const status = value.statuses[0];
    console.log(`📊 Status update: ${status.status} for message ${status.id}`);
  }
});

module.exports = router;
