const { sendWhatsAppMessage, markAsRead } = require('./whatsappSender');
const { getResponse } = require('./aiResponse');
const { executeHandover } = require('./humanHandover');
const database = require('../database/mongodb');
const client = require('../config/client');

async function processMessage(from, messageText, messageId) {
  console.log(`\n🔄 Processing message from ${from}: "${messageText}"`);

  await markAsRead(messageId);

  try {
    const lead = await database.getLeadFull(from);
    const status = lead?.status || 'new';

    // Get conversation history
    const conversationHistory = await database.getConversationHistory(from);

    // Get AI response regardless of handover status
    // IVAR keeps the conversation warm — Michael already got the alert
    const { reply, handover, handoverReason } = await getResponse(messageText, conversationHistory);

    console.log(`🤖 IVAR: "${reply}"`);

    // Save to DB
    await database.saveMessage({
      from,
      userMessage: messageText,
      aiResponse: reply,
      messageId,
      handoverTriggered: handover,
    });

    // Send reply to customer
    await sendWhatsAppMessage(from, reply);

    // Only fire handover alert once — don't re-alert if already handed over
    if (handover && handoverReason && status !== 'handed_over') {
      await sendWhatsAppMessage(from, client.handoverMessage);
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
    try {
      await sendWhatsAppMessage(
        from,
        "Sorry, having a quick technical issue. Try again in a moment."
      );
    } catch (e) {
      console.error('❌ Failed to send error message:', e.message);
    }
  }
}

module.exports = { processMessage };
