// handlers/humanHandover.js — Galvaniq Group IVAR
// Intelligent escalation routing between Michael (CEO) and Ashell (CTO)
// Every handover is context-rich, named, and actionable.

'use strict';

const { sendWhatsAppMessage } = require('./whatsappSender');
const { sendHandoverEmail } = require('./emailNotifier');
const database = require('../database/mongodb');
const config = require('../config/client');
const { getProspectByPhone, normalizePhone } = require('./aiResponse');

// ══════════════════════════════════════════════════════════════
// ADMIN CONTACTS — FROM CONFIG
// ══════════════════════════════════════════════════════════════

const MICHAEL = {
  name: config.admins.michael.name,
  role: config.admins.michael.role,
  phone: normalizePhone(config.admins.michael.phone),
  responsibilities: config.admins.michael.responsibilities,
};

const ASHELL = {
  name: config.admins.ashell.name,
  role: config.admins.ashell.role,
  phone: normalizePhone(config.admins.ashell.phone),
  responsibilities: config.admins.ashell.responsibilities,
};

// ══════════════════════════════════════════════════════════════
// ESCALATION ROUTER
// Determines who handles what based on reason + context
// ══════════════════════════════════════════════════════════════

const TECHNICAL_SIGNALS = [
  /\b(api|integration|server|database|architecture|deploy|infrastructure|code|security|ssl|endpoint|webhook|install|configure|technical|system|network|firewall|cloud|on.premise|hardware|specs|requirements|bandwidth|latency|uptime|sla)\b/i,
];

const COMMERCIAL_SIGNALS = [
  /\b(price|cost|budget|contract|payment|invoice|sign|negotiate|deal|proposal|quote|purchase|invest|board|executive|ceo|cfo|director|partner|equity|roi|return|savings|payback)\b/i,
];

function determineHandler(reason, escalateTo) {
  // Explicit override from aiResponse.js
  if (escalateTo === 'ashell') return ASHELL;
  if (escalateTo === 'michael') return MICHAEL;

  // Auto-detect from reason text
  const isTechnical = TECHNICAL_SIGNALS.some(p => p.test(reason));
  const isCommercial = COMMERCIAL_SIGNALS.some(p => p.test(reason));

  if (isTechnical && !isCommercial) return ASHELL;
  return MICHAEL; // Default: Michael handles everything commercial
}

// ══════════════════════════════════════════════════════════════
// CONVERSATION SUMMARIZER
// Condenses history into a readable briefing
// ══════════════════════════════════════════════════════════════

function summarizeConversation(conversationHistory) {
  if (!conversationHistory || conversationHistory.length === 0) {
    return 'No conversation history available.';
  }

  const recent = conversationHistory.slice(-6); // Last 6 exchanges
  return recent
    .map((msg, i) => {
      const customer = msg.userMessage || msg.content || '';
      const ivar = msg.aiResponse || '';
      return `[${i + 1}] Customer: "${customer}"\n    IVAR: "${ivar}"`;
    })
    .join('\n\n');
}

function extractKeyIntel(conversationHistory, prospect) {
  const intel = [];

  if (prospect?.company) intel.push(`Company: ${prospect.company}`);
  if (prospect?.stage) intel.push(`Stage: ${prospect.stage}`);
  if (prospect?.budget_range) intel.push(`Budget: ${prospect.budget_range}`);
  if (prospect?.decision_timeline) intel.push(`Timeline: ${prospect.decision_timeline}`);
  if (prospect?.decision_maker) intel.push(`Decision maker: ${prospect.decision_maker}`);
  if (prospect?.needs?.length) intel.push(`Needs: ${prospect.needs.join(', ')}`);
  if (prospect?.interest_level) intel.push(`Interest level: ${prospect.interest_level}/10`);

  return intel.length > 0 ? intel.join('\n') : 'No additional intel yet.';
}

// ══════════════════════════════════════════════════════════════
// MAIN HANDOVER EXECUTOR
// ══════════════════════════════════════════════════════════════

async function executeHandover({
  customerNumber,
  reason,
  conversationHistory = [],
  escalateTo = null,
}) {
  console.log(`\n🚨 Handover triggered`);
  console.log(`   Customer: ${customerNumber}`);
  console.log(`   Reason: ${reason}`);
  console.log(`   Escalate to: ${escalateTo || 'auto-detect'}`);

  // Resolve prospect data
  const prospect = getProspectByPhone(customerNumber);
  const handler = determineHandler(reason, escalateTo);
  const isAshellHandling = handler.phone === ASHELL.phone;

  console.log(`   Handler: ${handler.name} (${handler.role})`);

  // Run all handover actions in parallel
  const results = await Promise.allSettled([
    // Primary handler alert (Michael or Ashell)
    alertPrimaryHandler({
      handler,
      customerNumber,
      reason,
      prospect,
      conversationHistory,
    }),

    // Secondary alert (always keep Michael in the loop even on Ashell handovers)
    isAshellHandling
      ? alertSecondaryHandler({
          customerNumber,
          reason,
          prospect,
          handlerName: ASHELL.name,
        })
      : Promise.resolve(),

    // Email with full context
    sendHandoverEmail({
      customerNumber,
      reason,
      conversationHistory,
      prospect,
      handler,
    }),

    // Update MongoDB
    database.updateLeadStatus(customerNumber, 'handed_over', reason),
  ]);

  // Log any failures (non-blocking)
  results.forEach((result, index) => {
    const labels = ['Primary alert', 'Secondary alert', 'Email', 'Database'];
    if (result.status === 'rejected') {
      console.error(`❌ ${labels[index]} failed:`, result.reason?.message);
    } else {
      console.log(`✅ ${labels[index]} complete`);
    }
  });

  console.log(`✅ Handover sequence complete for ${customerNumber}\n`);

  return {
    handler,
    success: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
  };
}

// ══════════════════════════════════════════════════════════════
// PRIMARY HANDLER ALERT
// Rich, context-full notification to Michael or Ashell
// ══════════════════════════════════════════════════════════════

async function alertPrimaryHandler({
  handler,
  customerNumber,
  reason,
  prospect,
  conversationHistory,
}) {
  const time = new Date().toLocaleString('en-ZW', { timeZone: 'Africa/Harare' });
  const clientName = prospect?.name || 'Unknown contact';
  const clientCompany = prospect?.company || 'Unknown company';
  const keyIntel = extractKeyIntel(conversationHistory, prospect);
  const conversationSummary = summarizeConversation(conversationHistory);
  const isAshellHandling = handler.phone === ASHELL.phone;

  const message = [
    isAshellHandling
      ? `🔧 *IVAR Technical Handover*`
      : `🚨 *IVAR Handover — Action Required*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `*Contact:* ${clientName}`,
    `*Company:* ${clientCompany}`,
    `*Phone:* +${customerNumber}`,
    `*Time:* ${time}`,
    ``,
    `*Reason for handover:*`,
    reason,
    ``,
    `*What we know:*`,
    keyIntel,
    ``,
    `*Recent conversation:*`,
    conversationSummary,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    isAshellHandling
      ? `Ashell — they need technical clarity. Reply here with the answer and I'll send it to them.`
      : `Michael — they're ready for you. Message them directly or reply here and I'll relay it.`,
    ``,
    `📱 Contact directly: +${customerNumber}`,
  ]
    .join('\n');

  try {
    await sendWhatsAppMessage(handler.phone, message);
    console.log(`📱 Primary alert sent to ${handler.name}`);
  } catch (error) {
    console.error(`❌ Primary alert to ${handler.name} failed:`, error.message);
    throw error;
  }
}

// ══════════════════════════════════════════════════════════════
// SECONDARY HANDLER ALERT
// Brief FYI to Michael when Ashell is handling
// ══════════════════════════════════════════════════════════════

async function alertSecondaryHandler({
  customerNumber,
  reason,
  prospect,
  handlerName,
}) {
  const clientName = prospect?.name || 'Unknown contact';
  const clientCompany = prospect?.company || 'Unknown company';

  const message = [
    `ℹ️ *IVAR — FYI*`,
    ``,
    `Technical handover for *${clientName}* (${clientCompany}).`,
    `Phone: +${customerNumber}`,
    `Reason: ${reason}`,
    ``,
    `${handlerName} is handling the technical side.`,
    `I'll keep you posted if it escalates to commercial.`,
  ]
    .join('\n');

  try {
    await sendWhatsAppMessage(MICHAEL.phone, message);
    console.log(`📱 FYI alert sent to Michael`);
  } catch (error) {
    console.error(`❌ Secondary alert to Michael failed:`, error.message);
    // Non-critical — don't throw
  }
}

// ══════════════════════════════════════════════════════════════
// RE-ALERT (Already handed over, new signal detected)
// ══════════════════════════════════════════════════════════════

async function reAlertHandover({
  customerNumber,
  reason,
  lastMessage,
  escalateTo = null,
}) {
  const prospect = getProspectByPhone(customerNumber);
  const handler = determineHandler(reason, escalateTo);
  const time = new Date().toLocaleString('en-ZW', { timeZone: 'Africa/Harare' });

  const clientName = prospect?.name || 'Unknown';
  const clientCompany = prospect?.company || 'Unknown company';

  const message = [
    `🔁 *IVAR Re-Alert*`,
    ``,
    `*${clientName}* (${clientCompany}) has sent a new buying signal.`,
    `Phone: +${customerNumber}`,
    ``,
    `*New signal:* ${reason}`,
    `*Their message:* "${lastMessage}"`,
    `*Time:* ${time}`,
    ``,
    `This contact was already handed over. They may need a follow-up.`,
  ]
    .join('\n');

  try {
    await sendWhatsAppMessage(handler.phone, message);
    console.log(`🔁 Re-alert sent to ${handler.name}`);
  } catch (error) {
    console.error(`❌ Re-alert failed:`, error.message);
  }
}

// ══════════════════════════════════════════════════════════════
// URGENT ESCALATION
// When a client is frustrated, angry, or threatening action
// ══════════════════════════════════════════════════════════════

async function urgentEscalation({
  customerNumber,
  reason,
  conversationHistory,
}) {
  const prospect = getProspectByPhone(customerNumber);
  const clientName = prospect?.name || 'Unknown contact';
  const clientCompany = prospect?.company || 'Unknown company';
  const time = new Date().toLocaleString('en-ZW', { timeZone: 'Africa/Harare' });

  const message = [
    `🔴 *URGENT — IVAR Escalation*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `*${clientName}* (${clientCompany}) needs immediate attention.`,
    `Phone: +${customerNumber}`,
    `Time: ${time}`,
    ``,
    `*Reason:* ${reason}`,
    ``,
    `*Recent conversation:*`,
    summarizeConversation(conversationHistory),
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `⚠️ This needs your direct attention now.`,
    `📱 Contact: +${customerNumber}`,
  ]
    .join('\n');

  // Alert both Michael AND Ashell on urgent escalations
  await Promise.allSettled([
    sendWhatsAppMessage(MICHAEL.phone, message),
    sendWhatsAppMessage(ASHELL.phone, `⚠️ Urgent client issue — Michael is handling. FYI: ${clientName} (${clientCompany})`),
    database.updateLeadStatus(customerNumber, 'urgent', reason),
  ]);

  console.log(`🔴 Urgent escalation sent to Michael and Ashell for ${customerNumber}`);
}

// ══════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════

module.exports = {
  executeHandover,
  reAlertHandover,
  urgentEscalation,
  determineHandler,
  MICHAEL,
  ASHELL,
};
