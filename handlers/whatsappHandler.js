const axios = require('axios');
const aiResponse = require('./aiResponse');
const database = require('../database/mongodb');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

async function processMessage(from, messageText, messageId) {
  try {
    console.log(`🔄 Processing message from ${from}: ${messageText}`);

    // Get conversation history from database
    const conversationHistory = await database.getConversationHistory(from);

    // Get AI response
    const aiReply = await aiResponse.getResponse(messageText, conversationHistory);

    console.log(`🤖 AI Response: ${aiReply}`);

    // Save message to database
    await database.saveMessage(from, messageText, aiReply, messageId);

    // Send response back to customer via WhatsApp
    await sendWhatsAppMessage(from, aiReply);

    console.log(`✅ Message processed successfully for ${from}`);
  } catch (error) {
    console.error(`❌ Error in processMessage:`, error.message);
    
    // Try to send error message to customer
    try {
      await sendWhatsAppMessage(
        from, 
        "I apologize, I'm having technical difficulties. Please try again in a moment or contact us directly."
      );
    } catch (sendError) {
      console.error(`❌ Failed to send error message:`, sendError.message);
    }
  }
}

async function sendWhatsAppMessage(to, messageText) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('Missing WhatsApp credentials (PHONE_NUMBER_ID or ACCESS_TOKEN)');
  }

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'text',
    text: {
      preview_url: false,
      body: messageText
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📤 Message sent to ${to}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending WhatsApp message:`, error.response?.data || error.message);
    throw error;
  }
}

// Mark message as read (optional - improves user experience)
async function markMessageAsRead(messageId) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId
  };

  try {
    await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Message ${messageId} marked as read`);
  } catch (error) {
    console.error(`⚠️  Error marking message as read:`, error.message);
    // Don't throw - this is not critical
  }
}

module.exports = {
  processMessage,
  sendWhatsAppMessage,
  markMessageAsRead
};
