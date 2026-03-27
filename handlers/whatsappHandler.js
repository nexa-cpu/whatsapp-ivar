const { sendWhatsAppMessage, markAsRead } = require('./whatsappSender');
const { getResponse } = require('./aiResponse');
const { executeHandover } = require('./humanHandover');
const database = require('../database/mongodb');
const client = require('../config/client');

// How long before IVAR re-engages a handed-over lead
const HANDOVER_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Minimum gap between holding messages to same customer
const HOLDING_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

async function processMessage(from, messageText, messageId) {
  console.log(`\n🔄 Processing message from ${from}: "${messageText}"`);

  await markAsRead(messageId);

  try {
    const lead = await database.getLeadFull(from);
    const status = lead?.status || 'new';

    if (status === 'handed_over') {
      const handoverAge = lead?.handoverAt
        ? Date.now() - new Date(lead.handoverAt).getTime()
        : Infinity;

      if (handoverAge > HANDOVER_EXPIRY_MS) {
        console.log(`⏰ Handover expired for ${from} — resetting`);
        await database.updateLeadStatus(from, 'active');
        // Fall through to AI response
      } else {
        const lastHolding = lead?.lastHoldingMessageAt
          ? Date.now() - new Date(lead.lastHoldingMessageAt).getTime()
          : Infinity;

        if (lastHolding > HOLDING_COOLDOWN_MS) {
          await sendWhatsAppMessage(
            from,
            `Our team has been notified and will be with you shortly. If it's urgent, you can reach us directly at ${client.owner.directLine}.`
          );
          await database.updateLeadMeta(from, { lastHoldingMessageAt: new Date() });
          console.log(`📨 Holding message sent to ${from}`);
        } else {
          console.log(`⏭️  Holding cooldown active for ${from} — skipping`);
        }
        return;
      }
    }

    const conversationHistory = await database.getConversationHistory(from);
    const { reply, handover, handoverReason } = await getResponse(messageText, conversationHistory);

    console.log(`🤖 IVAR: "${reply}"`);
    if (handover) console.log(`🚨 Handover triggered: ${handoverReason}`);

    await database.saveMessage({ from, userMessage: messageText, aiResponse: reply, messageId, handoverTriggered: handover });
    await sendWhatsAppMessage(from, reply);

    if (handover && handoverReason) {
      await sendWhatsAppMessage(from, client.handoverMessage);
      await executeHandover({
        customerNumber: from,
        reason: handoverReason,
        conversationHistory: [...conversationHistory, { userMessage: messageText, aiResponse: reply }],
      });
    }

    console.log(`✅ Pipeline complete for ${from}\n`);

  } catch (error) {
    console.error(`❌ Pipeline error for ${from}:`, error.message);
    try {
      await sendWhatsAppMessage(from, "I'm having a brief technical issue. Please try again in a moment.");
    } catch (e) {
      console.error('❌ Failed to send error message:', e.message);
    }
  }
}

module.exports = { processMessage };
