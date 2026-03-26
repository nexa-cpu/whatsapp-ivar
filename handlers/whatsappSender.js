const axios = require('axios');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Sends a WhatsApp text message to any number.
 * Used by both the main message handler and the handover alert system.
 */
async function sendWhatsAppMessage(to, messageText) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('Missing WhatsApp credentials in environment variables');
  }

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: String(to),
    type: 'text',
    text: {
      preview_url: false,
      body: messageText,
    },
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(`📤 Message sent to ${to}`);
  return response.data;
}

/**
 * Marks an incoming message as read.
 * Improves UX — customer sees the double blue tick.
 * Non-critical — failure does not throw.
 */
async function markAsRead(messageId) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  try {
    await axios.post(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.warn(`⚠️  Mark as read failed for ${messageId}:`, error.message);
  }
}

module.exports = { sendWhatsAppMessage, markAsRead };
