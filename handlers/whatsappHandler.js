const { sendWhatsAppMessage, markAsRead } = require('./whatsappSender');
const { getResponse } = require('./aiResponse');
const { executeHandover } = require('./humanHandover');
const database = require('../database/mongodb');
const client = require('../config/client');

/**
 * Full message pipeline:
 * 1. Mark message as read (UX)
 * 2. Check if lead is already handed over (skip AI if so)
 * 3. Get conversation history
 * 4. Generate AI response
 * 5. Save message to DB
 * 6. Send reply to customer
 * 7. Execute handover if triggered
 */
async function processMessage(from, messageText, messageId) {
  console.log(`\n🔄 Processing message from ${from}: "${messageText}"`);

  // Mark as read immediately — good UX
  await markAsRead(messageId);

  try {
    // ─── CHECK IF ALREADY HANDED OVER ────────────────────────────────
    // If this lead is already with a human, do not re-engage with AI
    const leadStatus = await database.getLeadStatus(from);

    if (leadStatus === 'handed_over') {
      console.log(`⏭️  Lead ${from} already handed over — AI standing down`);
      // Optionally send a reminder that a human is coming
      // Uncomment if you want this behaviour:
      // await sendWhatsAppMessage(from, "Our team is on their way to you. Please hold on!");
      return;
    }

    // ─── GET CONVERSATION HISTORY ─────────────────────────────────────
    const conversationHistory = await database.getConversationHistory(from);

    // ─── GET AI RESPONSE ──────────────────────────────────────────────
    const { reply, handover, handoverReason } = await getResponse(messageText, conversationHistory);

    console.log(`🤖 IVAR: "${reply}"`);
    if (handover) console.log(`🚨 Handover triggered: ${handoverReason}`);

    // ─── SAVE TO DATABASE ─────────────────────────────────────────────
    await database.saveMessage({
      from,
      userMessage: messageText,
      aiResponse: reply,
      messageId,
      handoverTriggered: handover,
    });

    // ─── SEND REPLY TO CUSTOMER ───────────────────────────────────────
    await sendWhatsAppMessage(from, reply);

    // ─── EXECUTE HANDOVER IF NEEDED ───────────────────────────────────
    if (handover && handoverReason) {
      // Send the handover message to the customer
      await sendWhatsAppMessage(from, client.handoverMessage);

      // Alert the owner
      await executeHandover({
        customerNumber: from,
        reason: handoverReason,
        conversationHistory: [...conversationHistory, { userMessage: messageText, aiResponse: reply }],
      });
    }

    console.log(`✅ Message pipeline complete for ${from}\n`);

  } catch (error) {
    console.error(`❌ Pipeline error for ${from}:`, error.message);

    try {
      await sendWhatsAppMessage(
        from,
        "I'm having a brief technical issue. Please try again in a moment — or our team can assist you directly."
      );
    } catch (sendError) {
      console.error('❌ Failed to send error message to customer:', sendError.message);
    }
  }
}

module.exports = { processMessage };
