// handlers/whatsappHandler.js — Galvaniq Group IVAR
// Full intelligent pipeline with admin detection, 
// prospect tracking, meeting scheduling, and escalation routing.

'use strict';

const { sendWhatsAppMessage, markAsRead } = require('./whatsappSender');
const {
  getResponse,
  detectAdmin,
  isMichael,
  isAshell,
  updateProspect,
  getProspectByPhone,
  detectAvailabilityResponse,
  normalizePhone,
} = require('./aiResponse');
const { executeHandover } = require('./humanHandover');
const database = require('../database/mongodb');
const config = require('../config/client');

// ══════════════════════════════════════════════════════════════
// ADMIN PHONE NUMBERS (normalized)
// ══════════════════════════════════════════════════════════════

const MICHAEL_PHONE = normalizePhone(config.admins.michael.phone);
const ASHELL_PHONE = normalizePhone(config.admins.ashell.phone);

// ══════════════════════════════════════════════════════════════
// PENDING ACTIONS STORE
// Tracks: meeting confirmations, client message relays, 
// uncertain question escalations
// ══════════════════════════════════════════════════════════════

const pendingActions = {
  // Keyed by admin phone number
  // Value: { type, clientPhone, context, timestamp }
  meetings: {},      // Waiting for Michael to confirm a meeting
  relays: {},        // Waiting for admin to approve a message to client
  questions: {},     // Uncertain questions waiting for admin answer
};

function storePendingMeeting(adminPhone, clientPhone, meetingDetails) {
  pendingActions.meetings[normalizePhone(adminPhone)] = {
    type: 'meeting',
    clientPhone,
    meetingDetails,
    timestamp: Date.now(),
  };
}

function storePendingQuestion(adminPhone, clientPhone, question) {
  pendingActions.questions[normalizePhone(adminPhone)] = {
    type: 'question',
    clientPhone,
    question,
    timestamp: Date.now(),
  };
}

function getPendingAction(adminPhone) {
  const normalized = normalizePhone(adminPhone);
  return (
    pendingActions.meetings[normalized] ||
    pendingActions.questions[normalized] ||
    pendingActions.relays[normalized] ||
    null
  );
}

function clearPendingAction(adminPhone) {
  const normalized = normalizePhone(adminPhone);
  delete pendingActions.meetings[normalized];
  delete pendingActions.questions[normalized];
  delete pendingActions.relays[normalized];
}

// ══════════════════════════════════════════════════════════════
// CONTACT ON BEHALF HANDLER
// When Michael says "message [number] and tell them [X]"
// ══════════════════════════════════════════════════════════════

async function handleContactOnBehalf(adminMessage, adminPhone) {
  // Extract target phone number from admin message
  const phoneMatch = adminMessage.match(/(\+?\d[\d\s]{8,14})/);
  if (!phoneMatch) return false;

  const targetPhone = normalizePhone(phoneMatch[1]);

  // Extract message content after the phone number
  const messageMatch = adminMessage.match(
    /(?:and\s+(?:tell|say|send|message)\s+(?:them|him|her))?\s*[:\-]?\s*["']?(.+?)["']?\s*$/i
  );

  if (!messageMatch) {
    // Ask admin for the message content
    pendingActions.relays[normalizePhone(adminPhone)] = {
      type: 'relay',
      clientPhone: targetPhone,
      timestamp: Date.now(),
    };
    const prospect = getProspectByPhone(targetPhone);
    await sendWhatsAppMessage(
      adminPhone,
      `Got it. What message should I send to ${prospect?.name || targetPhone}?`
    );
    return true;
  }

  const messageToSend = messageMatch[1].trim();
  const prospect = getProspectByPhone(targetPhone);

  // Confirm before sending
  await sendWhatsAppMessage(
    adminPhone,
    `Sending to ${prospect?.name || targetPhone} at ${prospect?.company || targetPhone}:\n\n"${messageToSend}"\n\nReply *send* to confirm or *cancel* to abort.`
  );

  pendingActions.relays[normalizePhone(adminPhone)] = {
    type: 'relay_confirm',
    clientPhone: targetPhone,
    message: messageToSend,
    timestamp: Date.now(),
  };

  return true;
}

// ══════════════════════════════════════════════════════════════
// ADMIN PIPELINE
// Handles all messages from Michael or Ashell
// ══════════════════════════════════════════════════════════════

async function processAdminMessage(from, messageText, messageId) {
  console.log(`\n👔 Admin message from ${isMichael(from) ? 'Michael (CEO)' : 'Ashell (CTO)'}: "${messageText}"`);
  
  await markAsRead(messageId);

  const admin = detectAdmin(from);
  const normalizedFrom = normalizePhone(from);

  // ── Check if there's a pending action waiting for this admin ──
  const pending = getPendingAction(from);

  if (pending) {
    // ── Meeting confirmation flow ──────────────────────────────
    if (pending.type === 'meeting') {
      const availability = detectAvailabilityResponse(messageText);

      if (availability) {
        const prospect = getProspectByPhone(pending.clientPhone);
        const clientName = prospect?.name?.split(' ')[0] || 'them';

        if (availability.confirmed) {
          // Michael confirmed — tell the client
          await sendWhatsAppMessage(
            pending.clientPhone,
            `Great news, ${clientName}! Michael is available at the time you requested. Looking forward to connecting — he'll reach out to confirm the details.`
          );
          await sendWhatsAppMessage(
            from,
            `✅ Done. ${prospect?.name || pending.clientPhone} has been notified you're available.`
          );
          updateProspect(pending.clientPhone, {
            stage: 'meeting_scheduled',
            notes: `Meeting confirmed for ${pending.meetingDetails}`,
          });
        } else {
          // Michael not available
          const altTime = availability.alternativeTime
            ? `He suggested ${availability.alternativeTime} instead — should I pass that on?`
            : `What alternative time should I offer them?`;
          await sendWhatsAppMessage(from, altTime);

          if (availability.alternativeTime) {
            await sendWhatsAppMessage(
              pending.clientPhone,
              `Hi ${clientName}, Michael isn't available at that time unfortunately. He can do ${availability.alternativeTime} — does that work for you?`
            );
            clearPendingAction(from);
          }
          return;
        }

        clearPendingAction(from);
        return;
      }
    }

    // ── Relay confirmation flow ────────────────────────────────
    if (pending.type === 'relay_confirm') {
      const confirmed = /\b(send|yes|confirm|go ahead|ok)\b/i.test(messageText);
      const cancelled = /\b(cancel|no|stop|abort)\b/i.test(messageText);

      if (confirmed) {
        await sendWhatsAppMessage(pending.clientPhone, pending.message);
        await sendWhatsAppMessage(from, `✅ Message sent to ${getProspectByPhone(pending.clientPhone)?.name || pending.clientPhone}.`);
        clearPendingAction(from);
        return;
      }

      if (cancelled) {
        await sendWhatsAppMessage(from, `Cancelled. Message was not sent.`);
        clearPendingAction(from);
        return;
      }
    }

    // ── Question answer flow ───────────────────────────────────
    if (pending.type === 'question') {
      // Admin has provided the answer — relay to client
      const prospect = getProspectByPhone(pending.clientPhone);
      const clientName = prospect?.name?.split(' ')[0] || '';

      await sendWhatsAppMessage(
        pending.clientPhone,
        `${clientName ? `${clientName}, ` : ''}just got clarity on that — ${messageText}`
      );
      await sendWhatsAppMessage(
        from,
        `✅ Relayed to ${prospect?.name || pending.clientPhone}.`
      );
      clearPendingAction(from);
      return;
    }
  }

  // ── Check for "contact client on behalf" command ──────────────
  const contactPatterns = /\b(contact|message|reach out|send.*to|tell)\b.*?(\+?\d[\d\s]{8,})/i;
  if (contactPatterns.test(messageText)) {
    const handled = await handleContactOnBehalf(messageText, from);
    if (handled) return;
  }

  // ── Handle relay with stored client phone ─────────────────────
  if (pending?.type === 'relay' && pending.clientPhone) {
    const prospect = getProspectByPhone(pending.clientPhone);
    await sendWhatsAppMessage(
      from,
      `Sending to ${prospect?.name || pending.clientPhone}:\n\n"${messageText}"\n\nReply *send* to confirm or *cancel* to abort.`
    );
    pendingActions.relays[normalizedFrom] = {
      ...pending,
      type: 'relay_confirm',
      message: messageText,
    };
    return;
  }

  // ── Standard admin query — pass to AI ─────────────────────────
  try {
    const conversationHistory = await database.getConversationHistory(from).catch(() => []);

    const result = await getResponse(messageText, conversationHistory, from);

    await sendWhatsAppMessage(from, result.reply);

    // Log admin interaction (non-critical)
    await database.saveMessage({
      from,
      userMessage: messageText,
      aiResponse: result.reply,
      messageId,
      isAdminMessage: true,
      adminName: admin.name,
      adminRole: admin.role,
    }).catch(err => console.warn('Admin message log failed (non-critical):', err.message));

    console.log(`✅ Admin pipeline complete for ${admin.name}\n`);
  } catch (error) {
    console.error(`❌ Admin pipeline error:`, error.message);
    await sendWhatsAppMessage(
      from,
      `Something went wrong on my end — ${error.message}. Try again?`
    );
  }
}

// ══════════════════════════════════════════════════════════════
// CLIENT PIPELINE
// Handles all messages from real prospects/clients
// ══════════════════════════════════════════════════════════════

async function processClientMessage(from, messageText, messageId) {
  console.log(`\n🔄 Processing client message from ${from}: "${messageText}"`);

  await markAsRead(messageId);

  try {
    // ── Load data ───────────────────────────────────────────────
    const lead = await database.getLeadFull(from).catch(() => null);
    const status = lead?.status || 'new';
    const conversationHistory = await database.getConversationHistory(from).catch(() => []);

    // ── Update last seen ────────────────────────────────────────
    updateProspect(from, { last_contact: new Date().toISOString() });

    // ── Get AI response ─────────────────────────────────────────
    const result = await getResponse(messageText, conversationHistory, from);

    console.log(`🤖 IVAR: "${result.reply}"`);
    console.log(`📊 Signals: handover=${result.handover} | notifyMichael=${result.notifyMichael} | notifyAshell=${result.notifyAshell}`);

    // ── Save to MongoDB ─────────────────────────────────────────
    await database.saveMessage({
      from,
      userMessage: messageText,
      aiResponse: result.reply,
      messageId,
      handoverTriggered: result.handover,
      handoverReason: result.handoverReason,
      notifiedMichael: result.notifyMichael,
      notifiedAshell: result.notifyAshell,
    });

    // ── Update prospect data if captured ────────────────────────
    if (result.prospectUpdate) {
      updateProspect(from, { notes: result.prospectUpdate });
    }

    // ── Send reply to client ────────────────────────────────────
    await sendWhatsAppMessage(from, result.reply);

    // ── Handle meeting request ──────────────────────────────────
    if (result.meetingRequest) {
      const prospect = getProspectByPhone(from);
      const notification = buildMichaelNotification(
        prospect,
        from,
        `📅 *Meeting Request*\n${result.meetingRequest}\n\nReply *yes* to confirm or suggest another time.`
      );
      await sendWhatsAppMessage(MICHAEL_PHONE, notification);
      storePendingMeeting(MICHAEL_PHONE, from, result.meetingRequest);
      console.log(`📅 Meeting request sent to Michael for ${from}`);
    }

    // ── Handle notify Michael ───────────────────────────────────
    if (result.notifyMichael && !result.meetingRequest) {
      const prospect = getProspectByPhone(from);
      const notification = buildMichaelNotification(
        prospect,
        from,
        result.notificationMessage || `New signal from prospect. Last message: "${messageText}"`
      );
      await sendWhatsAppMessage(MICHAEL_PHONE, notification);

      // If it's an uncertain question, store it for when Michael replies
      if (result.notificationMessage?.toLowerCase().includes('uncertain')) {
        storePendingQuestion(MICHAEL_PHONE, from, messageText);
      }

      console.log(`📩 Michael notified about ${from}`);
    }

    // ── Handle notify Ashell ────────────────────────────────────
    if (result.notifyAshell) {
      const prospect = getProspectByPhone(from);
      const notification = buildAshellNotification(
        prospect,
        from,
        result.notificationMessage || `Technical question from prospect: "${messageText}"`
      );
      await sendWhatsAppMessage(ASHELL_PHONE, notification);

      // If Michael took too long, also route to Ashell
      storePendingQuestion(ASHELL_PHONE, from, messageText);

      console.log(`🔧 Ashell notified about ${from}`);
    }

    // ── Handle full handover ────────────────────────────────────
    if (result.handover && result.handoverReason) {
      const escalateTo = result.escalateTo || 'michael';

      if (status !== 'handed_over') {
        // First handover — full sequence
        console.log(`🚨 First handover for ${from} → ${escalateTo}`);

        await executeHandover({
          customerNumber: from,
          reason: result.handoverReason,
          escalateTo,
          conversationHistory: [
            ...conversationHistory,
            { userMessage: messageText, aiResponse: result.reply },
          ],
        });

        // Notify the right person
        const prospect = getProspectByPhone(from);
        const handoverNotification = buildHandoverNotification(
          prospect,
          from,
          result.handoverReason,
          escalateTo,
          messageText
        );

        if (escalateTo === 'ashell') {
          await sendWhatsAppMessage(ASHELL_PHONE, handoverNotification);
          await sendWhatsAppMessage(MICHAEL_PHONE, `FYI: Technical handover for ${prospect?.name || from} → Ashell is handling.`);
        } else {
          await sendWhatsAppMessage(MICHAEL_PHONE, handoverNotification);
        }

        // Update prospect stage
        updateProspect(from, { stage: 'handed_over' });

      } else {
        // Re-alert on new signal from already handed over lead
        console.log(`🔁 Re-alert for ${from} — new signal: ${result.handoverReason}`);

        const prospect = getProspectByPhone(from);
        const reAlert = `🔁 *Follow-up Signal*\n${prospect?.name || from} (${prospect?.company || 'Unknown'}) sent a new buying signal.\n\nSignal: ${result.handoverReason}\nMessage: "${messageText}"\n\nThey may need a follow-up.`;

        await sendWhatsAppMessage(MICHAEL_PHONE, reAlert);
      }
    }

    console.log(`✅ Client pipeline complete for ${from}\n`);

  } catch (error) {
    console.error(`❌ Pipeline error for ${from}:`, error.message);

    try {
      await sendWhatsAppMessage(
        from,
        `I'm just catching up — give me a moment. If it's urgent, reach us directly at ${config.company.email_info} or reply here and I'll get right back to you.`
      );
    } catch (sendError) {
      console.error('❌ Failed to send error fallback:', sendError.message);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATION BUILDERS
// Clear, actionable alerts for Michael and Ashell
// ══════════════════════════════════════════════════════════════

function buildMichaelNotification(prospect, clientPhone, body) {
  const name = prospect?.name || 'Unknown contact';
  const company = prospect?.company || 'Unknown company';
  const stage = prospect?.stage || 'inquiry';
  const interest = prospect?.interest_level ? `Interest level: ${prospect.interest_level}/10` : '';

  return [
    `📩 *IVAR Alert — Action Needed*`,
    ``,
    `*Who:* ${name} (${company})`,
    `*Phone:* ${clientPhone}`,
    `*Stage:* ${stage}`,
    interest,
    ``,
    body,
    ``,
    `Reply directly to this message with your response and I'll relay it to ${name?.split(' ')[0] || 'the client'}.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildAshellNotification(prospect, clientPhone, body) {
  const name = prospect?.name || 'Unknown contact';
  const company = prospect?.company || 'Unknown company';

  return [
    `🔧 *IVAR Technical Escalation*`,
    ``,
    `*Who:* ${name} (${company})`,
    `*Phone:* ${clientPhone}`,
    ``,
    body,
    ``,
    `Reply with the technical answer and I'll send it to ${name?.split(' ')[0] || 'the client'} directly.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildHandoverNotification(prospect, clientPhone, reason, escalateTo, lastMessage) {
  const name = prospect?.name || 'Unknown contact';
  const company = prospect?.company || 'Unknown company';
  const stage = prospect?.stage || 'inquiry';
  const handler = escalateTo === 'ashell' ? 'Ashell (technical)' : 'You (sales/commercial)';

  return [
    `🚨 *IVAR Handover — ${escalateTo === 'ashell' ? 'Technical' : 'Commercial'} Required*`,
    ``,
    `*Who:* ${name}`,
    `*Company:* ${company}`,
    `*Phone:* ${clientPhone}`,
    `*Stage:* ${stage}`,
    `*Reason:* ${reason}`,
    ``,
    `*Their last message:*`,
    `"${lastMessage}"`,
    ``,
    `Assigned to: ${handler}`,
    ``,
    `I've let them know someone will be with them shortly. They're expecting your contact.`,
  ]
    .join('\n');
}

// ══════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// Routes every incoming message to the right pipeline
// ══════════════════════════════════════════════════════════════

async function processMessage(from, messageText, messageId) {
  // Route admins vs clients
  if (detectAdmin(from)) {
    return processAdminMessage(from, messageText, messageId);
  }

  return processClientMessage(from, messageText, messageId);
}

module.exports = { processMessage };
