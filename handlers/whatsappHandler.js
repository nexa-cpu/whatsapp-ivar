const { sendWhatsAppMessage, markAsRead } = require('./whatsappSender');
const { getResponse } = require('./aiResponse');
const { executeHandover } = require('./humanHandover');
const database = require('../database/mongodb');
const client = require('../config/client');

/**
 * IVAR WHATSAPP MESSAGE HANDLER — GALVANIQ GROUP
 * ─────────────────────────────────────────────────────────────────────
 * Processes every incoming WhatsApp message through the full pipeline:
 * 1. Mark message as read (blue ticks)
 * 2. Load conversation history from MongoDB
 * 3. Get AI response from OpenAI
 * 4. Save message + response to MongoDB
 * 5. Send reply to customer
 * 6. Execute handover if triggered (alerts owner + Michael + email)
 * ─────────────────────────────────────────────────────────────────────
 */

async function processMessage(from, messageText, messageId) {
  console.log(`\n🔄 Processing message from ${from}: "${messageText}"`);

  // Mark as read immediately — customer sees blue ticks
  await markAsRead(messageId);

  try {
    // Load lead status and full conversation history
    const lead = await database.getLeadFull(from);
    const status = lead?.status || 'new';
    const conversationHistory = await database.getConversationHistory(from);

    // Get AI response — includes handover detection + bulk order safety net
    const { reply, handover, handoverReason } = await getResponse(messageText, conversationHistory);

    console.log(`🤖 IVAR: "${reply}"`);

    // Save full exchange to MongoDB
    await database.saveMessage({
      from,
      userMessage: messageText,
      aiResponse: reply,
      messageId,
      handoverTriggered: handover,
    });

    // Send IVAR's reply to customer
    await sendWhatsAppMessage(from, reply);

    // Fire handover sequence — but only once per lead
    // IVAR keeps conversation warm after handover; Michael/owner already alerted
    if (handover && handoverReason && status !== 'handed_over') {

      // Send the client-configured handover message to customer
      await sendWhatsAppMessage(from, client.handoverMessage);

      // Execute full handover: alert owner, alert Michael, send email, update DB
      await executeHandover({
        customerNumber: from,
        reason: handoverReason,
        conversationHistory: [
          ...conversationHistory,
          { userMessage: messageText, aiResponse: reply },
        ],
      });
    }

    console.log(`✅ Pipeline complete for ${from}\n`);

  } catch (error) {
    console.error(`❌ Pipeline error for ${from}:`, error.message);

    // Graceful error message to customer — never show a raw error
    try {
      await sendWhatsAppMessage(
        from,
        "Sorry, having a quick technical hiccup on my end. Try again in a moment — or reach us directly on +263 77 407 8220."
      );
    } catch (sendError) {
      console.error('❌ Failed to send error message:', sendError.message);
    }
  }
}

module.exports = { processMessage };
