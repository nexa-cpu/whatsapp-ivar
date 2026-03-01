const express = require('express');
const router = express.Router();
const whatsappHandler = require('../handlers/whatsappHandler');

// Webhook verification (GET) - Meta sends this to verify your webhook
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('✅ Webhook verified');
      res.status(200).send(challenge);
    } else {
      // Token doesn't match
      console.log('❌ Webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook POST endpoint (receives messages from WhatsApp)
router.post('/', async (req, res) => {
  const body = req.body;

  console.log('📨 Incoming webhook:', JSON.stringify(body, null, 2));

  // Return 200 OK immediately (Meta requires fast response)
  res.status(200).send('EVENT_RECEIVED');

  // Check if this is a WhatsApp message event
  if (body.object === 'whatsapp_business_account') {
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0]) {
      const change = body.entry[0].changes[0];
      
      // Check if this is a message
      if (change.value && change.value.messages && change.value.messages[0]) {
        const message = change.value.messages[0];
        const from = message.from; // Customer's phone number
        const messageBody = message.text?.body; // Message text
        const messageId = message.id;
        const timestamp = message.timestamp;

        console.log(`💬 Message from ${from}: ${messageBody}`);

        // Only process text messages
        if (messageBody) {
          try {
            // Process the message and send AI response
            await whatsappHandler.processMessage(from, messageBody, messageId);
          } catch (error) {
            console.error('❌ Error processing message:', error);
          }
        } else {
          console.log('⚠️  Non-text message, ignoring');
        }
      }

      // Check if this is a message status update (delivered, read, etc.)
      if (change.value && change.value.statuses && change.value.statuses[0]) {
        const status = change.value.statuses[0];
        console.log(`📊 Message status: ${status.status} for message ${status.id}`);
      }
    }
  } else {
    console.log('⚠️  Unknown webhook event:', body.object);
  }
});

module.exports = router;
