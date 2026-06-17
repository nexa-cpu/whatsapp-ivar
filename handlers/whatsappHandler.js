// handlers/whatsappHandler.js — Galvaniq Group IVAR
// Fixed: relay flow, actual message sending, phone detection

'use strict';

const { sendWhatsAppMessage, markAsRead } = require('./whatsappSender');
const {
  getResponse,
  detectAdmin,
  updateProspect,
  getProspectByPhone,
  detectAvailabilityResponse,
  normalizePhone,
  generateWeeklyReport,
} = require('./aiResponse');
const { executeHandover } = require('./humanHandover');
const database = require('../database/mongodb');
const config = require('../config/client');

// ══════════════════════════════════════════════════════════════
// ADMIN PHONES
// ══════════════════════════════════════════════════════════════

const MICHAEL_PHONE = normalizePhone(config.admins.michael.phone);
const ASHELL_PHONE = normalizePhone(config.admins.ashell.phone);

// ══════════════════════════════════════════════════════════════
// PENDING ACTIONS
// State machine for admin flows
// ══════════════════════════════════════════════════════════════

const pendingActions = {};

function setPending(adminPhone, action) {
  pendingActions[normalizePhone(adminPhone)] = {
    ...action,
    timestamp: Date.now(),
  };
}

function getPending(adminPhone) {
  const key = normalizePhone(adminPhone);
  const action = pendingActions[key];
  if (!action) return null;
  // Expire after 30 minutes
  if (Date.now() - action.timestamp > 30 * 60 * 1000) {
    delete pendingActions[key];
    return null;
  }
  return action;
}

function clearPending(adminPhone) {
  delete pendingActions[normalizePhone(adminPhone)];
}

// ══════════════════════════════════════════════════════════════
// PHONE NUMBER EXTRACTOR
// Pulls any phone number out of a message
// ══════════════════════════════════════════════════════════════

function extractPhone(text) {
  const match = text.match(/(\+?2637\d{8}|07\d{8}|2637\d{8})/);
  if (!match) return null;
  let phone = match[0].replace(/[\s\-]/g, '');
  // Normalize to 263XXXXXXXXX format
  if (phone.startsWith('0')) phone = '263' + phone.slice(1);
  if (phone.startsWith('+')) phone = phone.slice(1);
  return phone;
}

// ══════════════════════════════════════════════════════════════
// MESSAGE INTENT DETECTOR
// Determines what Michael is trying to do
// ══════════════════════════════════════════════════════════════

function detectIntent(message) {
  const msg = message.toLowerCase();

  // Confirmation signals
  if (/\b(send it|send|yes|confirm|go ahead|do it|proceed|ok|okay|sure)\b/.test(msg)) {
    return 'CONFIRM';
  }

  // Cancellation
  if (/\b(cancel|stop|abort|don't send|no)\b/.test(msg)) {
    return 'CANCEL';
  }

  // Report request
  if (/\b(report|update|pipeline|status|weekly|today's update|what's happening)\b/.test(msg)) {
    return 'REPORT';
  }

  // Meeting availability response
  if (/\b(yes|no|available|not available|confirm|reschedule|busy)\b/.test(msg)) {
    return 'AVAILABILITY';
  }

  // Contact a prospect
  if (extractPhone(message)) {
    return 'HAS_PHONE';
  }

  // Message instruction
  if (/\b(message|send|tell|inform|contact|reach out|let them know)\b/.test(msg)) {
    return 'SEND_INSTRUCTION';
  }

  return 'GENERAL';
}

// ══════════════════════════════════════════════════════════════
// GALVANIQ SERVICE PITCH
// What IVAR sends to prospects on Michael's behalf
// ══════════════════════════════════════════════════════════════

function buildProspectPitch(prospectName) {
  const greeting = prospectName ? `Hi ${prospectName.split(' ')[0]}` : 'Hi';

  return `${greeting}, I'm reaching out from Galvaniq Group.

We build sovereign AI infrastructure for organisations that want to own their intelligence — not rent it from cloud providers.

Our two core products:

*BEC (Bespoke Enterprise Core)* — an on-premise AI operating system that handles your accounting, operations, customer service, and more. 100% accurate, 24/7, your data never leaves your infrastructure.

*IVAR* — an AI team member on WhatsApp that handles customer enquiries, qualifies leads, and books meetings around the clock.

A client using BEC saves USD 389k in Year 1 alone.

Would love to show you what this looks like for your business — are you available for a quick chat this week?`;
}

// ══════════════════════════════════════════════════════════════
// ADMIN MESSAGE PROCESSOR
// Full state machine — no GPT making decisions about sending
// ══════════════════════════════════════════════════════════════

async function processAdminMessage(from, messageText, messageId) {
  const admin = detectAdmin(from);
  console.log(`\n👔 Admin message from ${admin.name} (${admin.role}): "${messageText}"`);

  await markAsRead(messageId);

  const pending = getPending(from);
  const intent = detectIntent(messageText);

  // ── PENDING: Waiting for meeting confirmation ──────────────
  if (pending?.type === 'MEETING_CONFIRM') {
    const availability = detectAvailabilityResponse(messageText);

    if (availability?.confirmed) {
      // Send confirmation to client
      const prospect = getProspectByPhone(pending.clientPhone);
      const clientFirstName = prospect?.name?.split(' ')[0] || '';

      await sendWhatsAppMessage(
        pending.clientPhone,
        `${clientFirstName ? `Great news, ${clientFirstName}! ` : ''}Michael is available at the time you requested. He'll reach out to confirm the details shortly.`
      );

      await sendWhatsAppMessage(
        from,
        `✅ Done. ${prospect?.name || pending.clientPhone} has been told you're available.`
      );

      updateProspect(pending.clientPhone, { stage: 'meeting_scheduled' });
      clearPending(from);
      return;
    }

    if (availability?.confirmed === false) {
      if (availability.alternativeTime) {
        const prospect = getProspectByPhone(pending.clientPhone);
        const clientFirstName = prospect?.name?.split(' ')[0] || '';

        await sendWhatsAppMessage(
          pending.clientPhone,
          `Hi ${clientFirstName}, Michael isn't available at that time — he can do ${availability.alternativeTime} instead. Does that work for you?`
        );

        await sendWhatsAppMessage(
          from,
          `✅ Offered ${availability.alternativeTime} to ${prospect?.name || pending.clientPhone}.`
        );

        clearPending(from);
        return;
      }

      await sendWhatsAppMessage(
        from,
        `What alternative time should I offer them?`
      );
      return;
    }
  }

  // ── PENDING: Waiting for message content ───────────────────
  if (pending?.type === 'AWAITING_MESSAGE') {
    let message = messageText.trim();

    // Remove formal sign-offs if present
    message = message
      .replace(/\n*(best regards|regards|sincerely|yours faithfully)[^]*$/i, '')
      .replace(/\n*[-—]\s*(michael|ashell|galvaniq)[^]*/i, '')
      .trim();

    // Store the message and ask for confirmation
    setPending(from, {
      type: 'AWAITING_CONFIRM',
      clientPhone: pending.clientPhone,
      prospectName: pending.prospectName,
      message,
    });

    const prospect = getProspectByPhone(pending.clientPhone);

    await sendWhatsAppMessage(
      from,
      `Sending to ${prospect?.name || pending.clientPhone} (+${pending.clientPhone}):\n\n"${message}"\n\nReply *send it* to confirm or *cancel* to abort.`
    );
    return;
  }

  // ── PENDING: Waiting for send confirmation ─────────────────
  if (pending?.type === 'AWAITING_CONFIRM') {
    if (intent === 'CONFIRM') {
      // ACTUALLY send the message to the prospect
      try {
        await sendWhatsAppMessage(pending.clientPhone, pending.message);

        const prospect = getProspectByPhone(pending.clientPhone);
        await sendWhatsAppMessage(
          from,
          `✅ Sent to ${prospect?.name || pending.clientPhone} (+${pending.clientPhone}). I'll let you know when they reply.`
        );

        // Log it
        await database.saveMessage({
          from: pending.clientPhone,
          userMessage: '[Outbound from Michael via IVAR]',
          aiResponse: pending.message,
          messageId: `admin_relay_${Date.now()}`,
          handoverTriggered: false,
          sentByAdmin: true,
          adminName: admin.name,
        }).catch(() => {});

        updateProspect(pending.clientPhone, {
          stage: 'contacted',
          last_contact: new Date().toISOString(),
          notes: `Contacted via IVAR by ${admin.name}`,
        });

        clearPending(from);
        return;
      } catch (error) {
        console.error('❌ Failed to send to prospect:', error.message);
        await sendWhatsAppMessage(
          from,
          `❌ Failed to send — ${error.message}. Try again?`
        );
        return;
      }
    }

    if (intent === 'CANCEL') {
      clearPending(from);
      await sendWhatsAppMessage(from, `Cancelled. Nothing was sent.`);
      return;
    }

    // They modified the message — update and re-confirm
    let updatedMessage = messageText.trim()
      .replace(/\n*(best regards|regards|sincerely)[^]*$/i, '')
      .replace(/\n*[-—]\s*(michael|ashell|galvaniq)[^]*/i, '')
      .trim();

    setPending(from, {
      ...pending,
      message: updatedMessage,
    });

    await sendWhatsAppMessage(
      from,
      `Updated. Here's what I'll send:\n\n"${updatedMessage}"\n\nReply *send it* to confirm.`
    );
    return;
  }

  // ── NO PENDING — Fresh admin command ───────────────────────

  // Report request
  if (intent === 'REPORT') {
    await sendWhatsAppMessage(from, generateWeeklyReport());
    return;
  }

  // Phone number in message — store as active prospect
  if (intent === 'HAS_PHONE') {
    const targetPhone = extractPhone(messageText);
    if (targetPhone) {
      const prospect = getProspectByPhone(targetPhone);

      // Check if there's also a send instruction in the same message
      const hasSendInstruction =
        /\b(message|send|tell|contact|reach out|inform)\b/i.test(messageText);

      if (hasSendInstruction) {
        // Check if they specified what to say
        const hasContent =
          messageText.replace(/\+?\d[\d\s]{8,}/g, '').replace(/\b(contact|message|send|tell|reach out|inform|them|him|her)\b/gi, '').trim().length > 5;

        if (hasContent) {
          // Extract message content (everything that's not the instruction or phone)
          let msgContent = messageText
            .replace(/\+?\d[\d\s]{8,}/g, '')
            .replace(/\b(contact|message|send|tell|reach out|inform|them|him|her|about|our services|and)\b/gi, '')
            .trim();

          if (msgContent.length < 10) {
            // Too vague — use the default pitch
            msgContent = buildProspectPitch(prospect?.name);
          }

          setPending(from, {
            type: 'AWAITING_CONFIRM',
            clientPhone: targetPhone,
            prospectName: prospect?.name || null,
            message: msgContent,
          });

          await sendWhatsAppMessage(
            from,
            `Sending to ${prospect?.name || `+${targetPhone}`}:\n\n"${msgContent}"\n\nReply *send it* to confirm or *cancel* to abort.`
          );
        } else {
          // They want to send but didn't say what — use pitch or ask
          const pitch = buildProspectPitch(prospect?.name);

          setPending(from, {
            type: 'AWAITING_CONFIRM',
            clientPhone: targetPhone,
            prospectName: prospect?.name || null,
            message: pitch,
          });

          await sendWhatsAppMessage(
            from,
            `Here's what I'll send to ${prospect?.name || `+${targetPhone}`}:\n\n"${pitch}"\n\nReply *send it* to confirm, *cancel* to abort, or send me your own message and I'll use that instead.`
          );
        }
      } else {
        // Phone number with no instruction — store and ask what to do
        setPending(from, {
          type: 'AWAITING_MESSAGE',
          clientPhone: targetPhone,
          prospectName: prospect?.name || null,
        });

        await sendWhatsAppMessage(
          from,
          `Got the number${prospect?.name ? ` — ${prospect.name}` : ''}. What should I send them? Or reply *pitch* and I'll send them our standard intro.`
        );
      }
      return;
    }
  }

  // Send instruction without a stored phone
  if (intent === 'SEND_INSTRUCTION' && !pending) {
    await sendWhatsAppMessage(
      from,
      `Which number should I send to? Send me the contact's WhatsApp number.`
    );
    return;
  }

  // Pitch shortcut
  if (/\bpitch\b/i.test(messageText) && pending?.clientPhone) {
    const pitch = buildProspectPitch(pending?.prospectName);

    setPending(from, {
      type: 'AWAITING_CONFIRM',
      clientPhone: pending.clientPhone,
      prospectName: pending.prospectName,
      message: pitch,
    });

    await sendWhatsAppMessage(
      from,
      `Here's the pitch:\n\n"${pitch}"\n\nReply *send it* to confirm.`
    );
    return;
  }

  // ── Everything else — GPT handles ─────────────────────────
  try {
    const conversationHistory = await database
      .getConversationHistory(from)
      .catch(() => []);

    const result = await getResponse(messageText, conversationHistory, from);

    await sendWhatsAppMessage(from, result.reply);

    await database.saveMessage({
      from,
      userMessage: messageText,
      aiResponse: result.reply,
      messageId,
      isAdminMessage: true,
      adminName: admin.name,
      adminRole: admin.role,
    }).catch(() => {});

    console.log(`✅ Admin pipeline complete for ${admin.name}\n`);
  } catch (error) {
    console.error(`❌ Admin pipeline error:`, error.message);
    await sendWhatsAppMessage(
      from,
      `Something went wrong — ${error.message}. Try again.`
    );
  }
}

// ══════════════════════════════════════════════════════════════
// CLIENT MESSAGE PROCESSOR
// ══════════════════════════════════════════════════════════════

async function processClientMessage(from, messageText, messageId) {
  console.log(`\n🔄 Processing client message from ${from}: "${messageText}"`);

  await markAsRead(messageId);

  try {
    const lead = await database.getLeadFull(from).catch(() => null);
    const status = lead?.status || 'new';
    const conversationHistory = await database
      .getConversationHistory(from)
      .catch(() => []);

    updateProspect(from, { last_contact: new Date().toISOString() });

    const result = await getResponse(messageText, conversationHistory, from);

    console.log(`🤖 IVAR: "${result.reply}"`);
    console.log(
      `📊 Signals: handover=${result.handover} | notifyMichael=${result.notifyMichael} | notifyAshell=${result.notifyAshell}`
    );

    // Save to MongoDB
    await database.saveMessage({
      from,
      userMessage: messageText,
      aiResponse: result.reply,
      messageId,
      handoverTriggered: result.handover,
      handoverReason: result.handoverReason,
    });

    // Send reply to client
    await sendWhatsAppMessage(from, result.reply);

    // Meeting request — notify Michael and store pending
    if (result.meetingRequest) {
      const prospect = getProspectByPhone(from);
      const notification = buildMichaelAlert(
        prospect,
        from,
        `📅 *Meeting Request*\n${result.meetingRequest}\n\nReply *yes* to confirm or tell me an alternative time.`
      );
      await sendWhatsAppMessage(MICHAEL_PHONE, notification);
      setPending(MICHAEL_PHONE, {
        type: 'MEETING_CONFIRM',
        clientPhone: from,
        meetingDetails: result.meetingRequest,
      });
    }

    // Notify Michael (non-meeting)
    if (result.notifyMichael && !result.meetingRequest) {
      const prospect = getProspectByPhone(from);
      const notification = buildMichaelAlert(
        prospect,
        from,
        result.notificationMessage ||
          `New signal. Their message: "${messageText}"`
      );
      await sendWhatsAppMessage(MICHAEL_PHONE, notification);

      // Store pending question so Michael can reply
      if (/uncertain/i.test(result.notificationMessage || '')) {
        setPending(MICHAEL_PHONE, {
          type: 'QUESTION',
          clientPhone: from,
          question: messageText,
        });
      }
    }

    // Notify Ashell
    if (result.notifyAshell) {
      const prospect = getProspectByPhone(from);
      const notification = buildAshellAlert(
        prospect,
        from,
        result.notificationMessage ||
          `Technical question: "${messageText}"`
      );
      await sendWhatsAppMessage(ASHELL_PHONE, notification);
      setPending(ASHELL_PHONE, {
        type: 'QUESTION',
        clientPhone: from,
        question: messageText,
      });
    }

    // Full handover
    if (result.handover && result.handoverReason) {
      const escalateTo = result.escalateTo || 'michael';

      if (status !== 'handed_over') {
        console.log(`🚨 Handover for ${from} → ${escalateTo}`);
        await executeHandover({
          customerNumber: from,
          reason: result.handoverReason,
          escalateTo,
          conversationHistory: [
            ...conversationHistory,
            { userMessage: messageText, aiResponse: result.reply },
          ],
        });
        updateProspect(from, { stage: 'handed_over' });
      } else {
        // Re-alert
        const prospect = getProspectByPhone(from);
        await sendWhatsAppMessage(
          MICHAEL_PHONE,
          `🔁 *Follow-up Signal*\n${prospect?.name || from} (${prospect?.company || 'Unknown'}) sent a new signal.\n\nSignal: ${result.handoverReason}\nMessage: "${messageText}"`
        );
      }
    }

    console.log(`✅ Client pipeline complete for ${from}\n`);
  } catch (error) {
    console.error(`❌ Pipeline error for ${from}:`, error.message);
    try {
      await sendWhatsAppMessage(
        from,
        `I'm just catching up — give me a moment. If it's urgent, email us at ${config.company.email_info}`
      );
    } catch (e) {
      console.error('❌ Failed to send fallback:', e.message);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATION BUILDERS
// ══════════════════════════════════════════════════════════════

function buildMichaelAlert(prospect, clientPhone, body) {
  const name = prospect?.name || 'Unknown contact';
  const company = prospect?.company || 'Unknown company';
  const stage = prospect?.stage || 'inquiry';

  return [
    `📩 *IVAR Alert*`,
    ``,
    `*Who:* ${name} (${company})`,
    `*Phone:* +${clientPhone}`,
    `*Stage:* ${stage}`,
    ``,
    body,
    ``,
    `Reply here and I'll relay your message to them.`,
  ].join('\n');
}

function buildAshellAlert(prospect, clientPhone, body) {
  const name = prospect?.name || 'Unknown contact';
  const company = prospect?.company || 'Unknown company';

  return [
    `🔧 *IVAR Technical Escalation*`,
    ``,
    `*Who:* ${name} (${company})`,
    `*Phone:* +${clientPhone}`,
    ``,
    body,
    ``,
    `Reply with the answer and I'll send it to them.`,
  ].join('\n');
}

// ══════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ══════════════════════════════════════════════════════════════

async function processMessage(from, messageText, messageId) {
  if (detectAdmin(from)) {
    return processAdminMessage(from, messageText, messageId);
  }
  return processClientMessage(from, messageText, messageId);
}

module.exports = { processMessage };
