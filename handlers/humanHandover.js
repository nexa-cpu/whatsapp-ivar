const { sendWhatsAppMessage } = require('./whatsappSender');
const { sendHandoverEmail } = require('./emailNotifier');
const database = require('../database/mongodb');
const client = require('../config/client');

/**
 * Executes the full handover sequence:
 * 1. Alerts the owner via WhatsApp
 * 2. Sends a handover email with context
 * 3. Updates the lead status in MongoDB
 */
async function executeHandover({ customerNumber, reason, conversationHistory }) {
  console.log(`🚨 Handover triggered for ${customerNumber} — Reason: ${reason}`);

  // Run WhatsApp alert + email in parallel for speed
  await Promise.allSettled([
    alertOwnerWhatsApp({ customerNumber, reason }),
    sendHandoverEmail({ customerNumber, reason, conversationHistory }),
    database.updateLeadStatus(customerNumber, 'handed_over', reason),
  ]);

  console.log(`✅ Handover complete for ${customerNumber}`);
}

/**
 * Sends a WhatsApp message directly to the business owner
 * with customer context and a quick-reply prompt.
 */
async function alertOwnerWhatsApp({ customerNumber, reason }) {
  if (!client.owner.whatsappNumber) {
    console.log('⚠️  Owner WhatsApp number not set in config — skipping WhatsApp alert');
    return;
  }

  const message =
    `🔔 *IVAR HANDOVER ALERT*\n` +
    `Business: ${client.business.name}\n\n` +
    `A customer needs your attention:\n` +
    `📱 Number: +${customerNumber}\n` +
    `📋 Reason: ${reason}\n` +
    `🕐 Time: ${new Date().toLocaleString('en-ZW', { timeZone: 'Africa/Harare' })}\n\n` +
    `Please message this customer directly on WhatsApp now.`;

  try {
    await sendWhatsAppMessage(client.owner.whatsappNumber, message);
    console.log(`📱 WhatsApp handover alert sent to owner`);
  } catch (error) {
    console.error('❌ Owner WhatsApp alert failed:', error.message);
    // Don't throw — WhatsApp alert failure should not break anything
  }
}

module.exports = { executeHandover };
