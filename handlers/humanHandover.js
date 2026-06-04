const { sendWhatsAppMessage } = require('./whatsappSender');
const { sendHandoverEmail } = require('./emailNotifier');
const database = require('../database/mongodb');
const client = require('../config/client');

/**
 * IVAR HANDOVER SYSTEM — GALVANIQ GROUP
 * ─────────────────────────────────────────────────────────────────────
 * Executes the full handover sequence:
 * 1. Alerts the business owner via WhatsApp
 * 2. Alerts Michael (Galvaniq operator) via WhatsApp
 * 3. Sends a handover email with full conversation context
 * 4. Updates the lead status in MongoDB
 * ─────────────────────────────────────────────────────────────────────
 */

async function executeHandover({ customerNumber, reason, conversationHistory }) {
  console.log(`🚨 Handover triggered for ${customerNumber} — Reason: ${reason}`);

  await Promise.allSettled([
    alertOwnerWhatsApp({ customerNumber, reason }),
    alertGalvaniqOperator({ customerNumber, reason }),
    sendHandoverEmail({ customerNumber, reason, conversationHistory }),
    database.updateLeadStatus(customerNumber, 'handed_over', reason),
  ]);

  console.log(`✅ Handover complete for ${customerNumber}`);
}

/**
 * Sends a WhatsApp alert to the business owner (Isaac or whoever
 * is configured as owner in the client config).
 */
async function alertOwnerWhatsApp({ customerNumber, reason }) {
  if (!client.owner?.whatsappNumber) {
    console.log('⚠️  Owner WhatsApp number not set in config — skipping owner alert');
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
    console.log(`📱 Handover alert sent to owner (${client.owner.name})`);
  } catch (error) {
    console.error('❌ Owner WhatsApp alert failed:', error.message);
  }
}

/**
 * Sends a WhatsApp alert to Michael — Galvaniq operator.
 * Michael receives a copy of every handover across ALL client deployments.
 * This is hardcoded to Michael's number — it does not change per client.
 */
async function alertGalvaniqOperator({ customerNumber, reason }) {
  const MICHAEL_NUMBER = '263785477620';

  const message =
    `🔔 *IVAR OPERATOR ALERT*\n` +
    `─────────────────────────\n` +
    `Client: ${client.business.name}\n` +
    `📱 Customer: +${customerNumber}\n` +
    `📋 Reason: ${reason}\n` +
    `🕐 Time: ${new Date().toLocaleString('en-ZW', { timeZone: 'Africa/Harare' })}\n` +
    `─────────────────────────\n` +
    `Action: Message the customer or alert the client owner.`;

  try {
    await sendWhatsAppMessage(MICHAEL_NUMBER, message);
    console.log(`📱 Operator alert sent to Michael`);
  } catch (error) {
    console.error('❌ Galvaniq operator alert failed:', error.message);
  }
}

module.exports = { executeHandover };
