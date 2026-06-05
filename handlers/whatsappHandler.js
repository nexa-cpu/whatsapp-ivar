const { sendWhatsAppMessage, markAsRead } = require('./whatsappSender');
const { getResponse } = require('./aiResponse');
const { executeHandover } = require('./humanHandover');
const database = require('../database/mongodb');
const client = require('../config/client');

/**
 * IVAR WHATSAPP MESSAGE HANDLER — GALVANIQ GROUP
 * ─────────────────────────────────────────────────────────────────────
 * Full pipeline per incoming message:
 * 1. Mark as read (blue ticks)
 * 2. Load conversation history
 * 3. Get AI response + handover detection
 * 4. Save to MongoDB
 * 5. Send reply to customer
 * 6. Execute handover if triggered
 *
 * HANDOVER LOGIC:
 * - First handover: sends handover message to customer + alerts owner + Michael
 * - Subsequent messages with NEW handover triggers: re-alerts owner + Michael
 *   but does NOT resend the handover message to customer (avoids spam)
 * - Already handed over but no new trigger: IVAR keeps conversation warm silently
 * ─────────────────────────────────────────────────────────────────────
 */

async function processMessage(from, messageText, messageId) {
  console.log(`\n🔄 Processing message from ${from}: "${messageText}"`);

  // Mark as read — blue ticks for customer
  await markAsRead(messageId);

  try {
    const lead = await database.getLeadFull(from);
    const status = lead?.status || 'new';
    const conversationHistory = await database.getConversationHistory(from);

    // Get AI response with handover detection + safety net
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

    // Send IVAR reply to customer
    await sendWhatsAppMessage(from, reply);

    if (handover && handoverReason) {

      if (status !== 'handed_over') {
        // FIRST handover — send customer the handover message + full alert sequence
        console.log(`🚨 First handover for ${from} — full sequence`);
        await sendWhatsAppMessage(from, client.handoverMessage);
        await executeHandover({
          customerNumber: from,
          reason: handoverReason,
          conversationHistory: [
            ...conversationHistory,
            { userMessage: messageText, aiResponse: reply },
          ],
        });

      } else {
        // ALREADY handed over but customer sent another buying signal
        // Re-alert owner + Michael — do NOT resend handover message to customer
        console.log(`🔁 Re-alert for already handed over lead ${from} — new signal detected`);
        await executeHandover({
          customerNumber: from,
          reason: `FOLLOW-UP SIGNAL — ${handoverReason}`,
          conversationHistory: [
            ...conversationHistory,
            { userMessage: messageText, aiResponse: reply },
          ],
        });
      }
    }

    console.log(`✅ Pipeline complete for ${from}\n`);

  } catch (error) {
    console.error(`❌ Pipeline error for ${from}:`, error.message);
    try {
      await sendWhatsAppMessage(
        from,
        "Sorry, having a quick technical hiccup. Try again in a moment — or reach us directly on +263 77 407 8220."
      );
    } catch (sendError) {
      console.error('❌ Failed to send error message:', sendError.message);
    }
  }
}

module.exports = { processMessage };
