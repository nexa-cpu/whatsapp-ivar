// handlers/whatsappHandler.js — Galvaniq Group IVAR
// Fixed: state machine, actual sending, real pitch generation

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
  formatConversationHistory,
} = require('./aiResponse');
const { executeHandover } = require('./humanHandover');
const database = require('./database/mongodb');
const config = require('./config/client');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ══════════════════════════════════════════════════════════════
// ADMIN PHONES
// ══════════════════════════════════════════════════════════════

const MICHAEL_PHONE = normalizePhone(config.admins.michael.phone);
const ASHELL_PHONE = normalizePhone(config.admins.ashell.phone);

// ══════════════════════════════════════════════════════════════
// STATE MACHINE
// Tracks exactly where Michael is in a flow
// States: IDLE | HAVE_PHONE | DRAFT_SHOWN | MEETING_PENDING | QUESTION_PENDING
// ══════════════════════════════════════════════════════════════

const adminState = {};

function getState(adminPhone) {
  const key = normalizePhone(adminPhone);
  const state = adminState[key];
  if (!state) return { state: 'IDLE' };
  // Expire after 30 minutes of inactivity
  if (Date.now() - state.updatedAt > 30 * 60 * 1000) {
    delete adminState[key];
    return { state: 'IDLE' };
  }
  return state;
}

function setState(adminPhone, data) {
  const key = normalizePhone(adminPhone);
  adminState[key] = { ...data, updatedAt: Date.now() };
}

function clearState(adminPhone) {
  delete adminState[normalizePhone(adminPhone)];
}

// ══════════════════════════════════════════════════════════════
// PHONE EXTRACTOR
// ══════════════════════════════════════════════════════════════

function extractPhone(text) {
  // Match Zimbabwe numbers in any format
  const match = text.match(
    /(\+?263\s?7\d[\s\-]?\d{3}[\s\-]?\d{4}|07\d[\s\-]?\d{3}[\s\-]?\d{4})/
  );
  if (!match) return null;
  let phone = match[0].replace(/[\s\-\+]/g, '');
  if (phone.startsWith('0')) phone = '263' + phone.slice(1);
  return phone;
}

// ══════════════════════════════════════════════════════════════
// INTENT DETECTOR
// ══════════════════════════════════════════════════════════════

function detectIntent(message) {
  const msg = message.toLowerCase().trim();

  if (/^(yes|send it|send|go ahead|do it|confirm|proceed|ok|okay|sure|yep|yup|ja|send that|just send)/.test(msg) ||
      /\b(send it|go ahead|confirmed|yes send|send now|do it)\b/.test(msg)) {
    return 'CONFIRM';
  }

  if (/^(no|cancel|stop|abort|don'?t send|nope|never mind|forget it)/.test(msg) ||
      /\b(cancel|abort|don'?t send|never mind)\b/.test(msg)) {
    return 'CANCEL';
  }

  if (/\b(report|update|pipeline|status|weekly|today'?s update|what'?s happening|how many|prospects)\b/.test(msg)) {
    return 'REPORT';
  }

  const phone = extractPhone(message);
  if (phone) return 'HAS_PHONE';

  if (/\b(send|message|tell|contact|reach out|whatsapp|text)\b/.test(msg)) {
    return 'SEND_INSTRUCTION';
  }

  return 'GENERAL';
}

// ══════════════════════════════════════════════════════════════
// GPT MESSAGE GENERATOR
// Writes the actual WhatsApp message to send to a prospect
// IVAR writes it — not generic templates
// ══════════════════════════════════════════════════════════════

async function generateProspectMessage(instruction, prospectName = null) {
  const firstName = prospectName ? prospectName.split(' ')[0] : null;

  const prompt = `You are writing a WhatsApp message FROM Galvaniq Group TO a cold prospect.

COMPANY: Galvaniq Group
PRODUCTS:
1. BEC (Bespoke Enterprise Core) — an on-premise AI operating system. Organisations own their intelligence infrastructure. No cloud. No foreign servers. 100% data sovereignty. Handles accounting, operations, customer service, and more. 24/7, 100% accurate.
2. IVAR — AI receptionist on WhatsApp. Handles customer enquiries, qualifies leads, books meetings, works in any language, 24/7.

ROI: Clients save USD 389,000 in Year 1. Payback in 22 months. 
MARKET: USD 1.2T global market. By 2030, data residency will be legally required for regulated industries.

INSTRUCTION FROM MICHAEL: ${instruction}

PROSPECT NAME: ${firstName || 'Unknown (use "Hi there")'}

RULES FOR THE MESSAGE:
- This is WhatsApp — casual, warm, human. NOT email.
- NO sign-offs. No "Best regards", "Yours sincerely", "IVAR", "Michael Mukahanana", nothing.
- NO subject line. Just the message body.
- Short — 4 to 6 sentences maximum. They haven't heard of us.
- Open with a genuine greeting not "I hope this message finds you well"
- Make them curious, not sold to
- End with ONE simple question or call to action
- Sound like a real person, not a marketing brochure
- Do NOT use words like: innovative, solutions, tailored, leverage, synergy, cutting-edge

Write only the message. Nothing else. No labels, no "Here's the draft:", just the message itself.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.8,
  });

  return completion.choices[0].message.content.trim();
}

// ══════════════════════════════════════════════════════════════
// ADMIN MESSAGE PROCESSOR — STATE MACHINE
// ══════════════════════════════════════════════════════════════

async function processAdminMessage(from, messageText, messageId) {
  const admin = detectAdmin(from);
  console.log(`\n👔 ${admin.name} (${admin.role}): "${messageText}"`);

  await markAsRead(messageId);

  const current = getState(from);
  const intent = detectIntent(messageText);

  console.log(`📊 State: ${current.state} | Intent: ${intent}`);

  // ══════════════════════════════════════════════════════════
  // STATE: MEETING_PENDING
  // Waiting for Michael to confirm or decline a meeting
  // ══════════════════════════════════════════════════════════

  if (current.state === 'MEETING_PENDING') {
    const availability = detectAvailabilityResponse(messageText);

    if (availability?.confirmed) {
      const prospect = getProspectByPhone(current.clientPhone);
      const clientFirst = prospect?.name?.split(' ')[0] || '';

      await sendWhatsAppMessage(
        current.clientPhone,
        `${clientFirst ? `${clientFirst}, great news — ` : 'Great news — '}Michael is available at the time you mentioned. He'll be in touch with the details shortly.`
      );

      await sendWhatsAppMessage(from, `✅ Confirmed. ${prospect?.name || current.clientPhone} has been notified.`);
      updateProspect(current.clientPhone, { stage: 'meeting_scheduled' });
      clearState(from);
      return;
    }

    if (availability?.confirmed === false) {
      if (availability.alternativeTime) {
        const prospect = getProspectByPhone(current.clientPhone);
        const clientFirst = prospect?.name?.split(' ')[0] || '';
        await sendWhatsAppMessage(
          current.clientPhone,
          `Hi${clientFirst ? ` ${clientFirst}` : ''}, Michael isn't free at that time but he can do ${availability.alternativeTime} — does that work?`
        );
        await sendWhatsAppMessage(from, `✅ Alternative time offered.`);
        clearState(from);
        return;
      }
      await sendWhatsAppMessage(from, `What time should I offer them instead?`);
      return;
    }

    // Not a clear yes/no — fall through to general handling below
  }

  // ══════════════════════════════════════════════════════════
  // STATE: QUESTION_PENDING
  // Michael or Ashell answering a client question
  // ══════════════════════════════════════════════════════════

  if (current.state === 'QUESTION_PENDING') {
    // Whatever they say is the answer — relay it
    const prospect = getProspectByPhone(current.clientPhone);
    const clientFirst = prospect?.name?.split(' ')[0] || '';

    await sendWhatsAppMessage(
      current.clientPhone,
      `${clientFirst ? `${clientFirst}, ` : ''}just got clarity on that — ${messageText}`
    );
    await sendWhatsAppMessage(from, `✅ Relayed to ${prospect?.name || current.clientPhone}.`);
    clearState(from);
    return;
  }

  // ══════════════════════════════════════════════════════════
  // STATE: DRAFT_SHOWN
  // Michael has seen the draft. Waiting for confirm, cancel, or feedback.
  // ══════════════════════════════════════════════════════════

  if (current.state === 'DRAFT_SHOWN') {

    // CONFIRM — actually send the message
    if (intent === 'CONFIRM') {
      try {
        // SEND THE MESSAGE — this is the only place where sending happens
        await sendWhatsAppMessage(current.clientPhone, current.draft);

        console.log(`📤 Outbound message sent to prospect ${current.clientPhone}`);

        // Tell Michael it was sent AFTER it's actually sent
        await sendWhatsAppMessage(
          from,
          `✅ Sent to +${current.clientPhone}. I'll notify you when they reply.`
        );

        // Log to database
        await database.saveMessage({
          from: current.clientPhone,
          userMessage: '[Outbound — sent by IVAR on behalf of ' + admin.name + ']',
          aiResponse: current.draft,
          messageId: `outbound_${Date.now()}`,
          handoverTriggered: false,
          sentByAdmin: true,
          adminName: admin.name,
        }).catch(err => console.warn('Log failed (non-critical):', err.message));

        updateProspect(current.clientPhone, {
          stage: 'contacted',
          last_contact: new Date().toISOString(),
          notes: `Contacted by ${admin.name} via IVAR`,
        });

        clearState(from);
        return;
      } catch (error) {
        console.error(`❌ Failed to send to ${current.clientPhone}:`, error.message);
        await sendWhatsAppMessage(
          from,
          `❌ Send failed — ${error.message}. Want me to try again?`
        );
        return;
      }
    }

    // CANCEL
    if (intent === 'CANCEL') {
      clearState(from);
      await sendWhatsAppMessage(from, `Cancelled. Nothing was sent to +${current.clientPhone}.`);
      return;
    }

    // FEEDBACK/INSTRUCTION — regenerate the draft
    try {
      await sendWhatsAppMessage(from, `Rewriting...`);

      const prospect = getProspectByPhone(current.clientPhone);
      const newDraft = await generateProspectMessage(
        messageText,
        prospect?.name
      );

      setState(from, {
        state: 'DRAFT_SHOWN',
        clientPhone: current.clientPhone,
        draft: newDraft,
      });

      await sendWhatsAppMessage(
        from,
        `Here's the updated message:\n\n${newDraft}\n\nReply *send it* to confirm or give me more feedback.`
      );
      return;
    } catch (error) {
      await sendWhatsAppMessage(from, `Couldn't regenerate — ${error.message}. Try again.`);
      return;
    }
  }

  // ══════════════════════════════════════════════════════════
  // STATE: HAVE_PHONE
  // Have a phone number, waiting for message instruction
  // ══════════════════════════════════════════════════════════

  if (current.state === 'HAVE_PHONE') {
    // If they just said "send" or "pitch" with no extra content, use default pitch
    const isPitchRequest = /\b(pitch|services|products|introduce|tell them about us|what we do)\b/i.test(messageText);
    const instruction = isPitchRequest
      ? 'Introduce Galvaniq Group and make them want to learn more about BEC and IVAR. Keep it conversational.'
      : messageText;

    try {
      await sendWhatsAppMessage(from, `Got it, writing now...`);

      const prospect = getProspectByPhone(current.clientPhone);
      const draft = await generateProspectMessage(instruction, prospect?.name);

      setState(from, {
        state: 'DRAFT_SHOWN',
        clientPhone: current.clientPhone,
        draft,
      });

      await sendWhatsAppMessage(
        from,
        `Here's what I'll send to +${current.clientPhone}:\n\n${draft}\n\nReply *send it* to confirm, *cancel* to abort, or tell me what to change.`
      );
      return;
    } catch (error) {
      await sendWhatsAppMessage(from, `Couldn't generate the message — ${error.message}. Try again.`);
      return;
    }
  }

  // ══════════════════════════════════════════════════════════
  // STATE: IDLE — Fresh commands
  // ══════════════════════════════════════════════════════════

  // Report
  if (intent === 'REPORT') {
    await sendWhatsAppMessage(from, generateWeeklyReport());
    return;
  }

  // Phone number in message
  if (intent === 'HAS_PHONE') {
    const phone = extractPhone(messageText);
    if (phone) {
      const prospect = getProspectByPhone(phone);

      // Check if they also gave a send instruction in the same message
      const hasSendInstruction = /\b(send|message|tell|contact|reach out|introduce)\b/i.test(messageText);

      if (hasSendInstruction) {
        // They gave a phone AND an instruction in one message
        // Extract the instruction (strip the phone number out)
        const instruction = messageText.replace(/\+?263\s?7\d[\s\-]?\d{3}[\s\-]?\d{4}|07\d[\s\-]?\d{3}[\s\-]?\d{4}/g, '').trim();

        setState(from, { state: 'HAVE_PHONE', clientPhone: phone });

        try {
          await sendWhatsAppMessage(from, `Writing message for +${phone}...`);

          const draft = await generateProspectMessage(
            instruction.length > 10 ? instruction : 'Introduce Galvaniq Group and make them curious about BEC and IVAR.',
            prospect?.name
          );

          setState(from, { state: 'DRAFT_SHOWN', clientPhone: phone, draft });

          await sendWhatsAppMessage(
            from,
            `Here's what I'll send to +${phone}:\n\n${draft}\n\nReply *send it* to confirm, *cancel* to abort, or tell me what to change.`
          );
        } catch (error) {
          await sendWhatsAppMessage(from, `Couldn't generate the message — ${error.message}`);
        }
      } else {
        // Just a phone number — ask what to do
        setState(from, { state: 'HAVE_PHONE', clientPhone: phone });
        await sendWhatsAppMessage(
          from,
          `Got +${phone}${prospect?.name ? ` (${prospect.name})` : ''}. What should I say to them? Or reply *pitch* and I'll write a Galvaniq intro.`
        );
      }
      return;
    }
  }

  // Send instruction without a phone
  if (intent === 'SEND_INSTRUCTION') {
    await sendWhatsAppMessage(from, `Which number should I send to?`);
    return;
  }

  // ══════════════════════════════════════════════════════════
  // Everything else — GPT handles general admin queries
  // ══════════════════════════════════════════════════════════

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
    console.error(`❌ Admin error:`, error.message);
    await sendWhatsAppMessage(from, `Something went wrong — ${error.message}`);
  }
}

// ══════════════════════════════════════════════════════════════
// CLIENT MESSAGE PROCESSOR
// ══════════════════════════════════════════════════════════════

async function processClientMessage(from, messageText, messageId) {
  console.log(`\n🔄 Client message from ${from}: "${messageText}"`);

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
      `📊 handover=${result.handover} | notifyMichael=${result.notifyMichael} | notifyAshell=${result.notifyAshell}`
    );

    await database.saveMessage({
      from,
      userMessage: messageText,
      aiResponse: result.reply,
      messageId,
      handoverTriggered: result.handover,
      handoverReason: result.handoverReason,
    });

    await sendWhatsAppMessage(from, result.reply);

    // Meeting request — notify Michael
    if (result.meetingRequest) {
      const prospect = getProspectByPhone(from);
      await sendWhatsAppMessage(
        MICHAEL_PHONE,
        buildMichaelAlert(
          prospect,
          from,
          `📅 *Meeting Request*\n${result.meetingRequest}\n\nReply *yes* to confirm or give an alternative time.`
        )
      );
      setState(MICHAEL_PHONE, {
        state: 'MEETING_PENDING',
        clientPhone: from,
        meetingDetails: result.meetingRequest,
      });
    }

    // Notify Michael (non-meeting)
    if (result.notifyMichael && !result.meetingRequest) {
      const prospect = getProspectByPhone(from);
      await sendWhatsAppMessage(
        MICHAEL_PHONE,
        buildMichaelAlert(
          prospect,
          from,
          result.notificationMessage || `New signal. Their message: "${messageText}"`
        )
      );
      if (/uncertain/i.test(result.notificationMessage || '')) {
        setState(MICHAEL_PHONE, {
          state: 'QUESTION_PENDING',
          clientPhone: from,
          question: messageText,
        });
      }
    }

    // Notify Ashell
    if (result.notifyAshell) {
      const prospect = getProspectByPhone(from);
      await sendWhatsAppMessage(
        ASHELL_PHONE,
        buildAshellAlert(
          prospect,
          from,
          result.notificationMessage || `Technical question: "${messageText}"`
        )
      );
      setState(ASHELL_PHONE, {
        state: 'QUESTION_PENDING',
        clientPhone: from,
        question: messageText,
      });
    }

    // Full handover
    if (result.handover && result.handoverReason) {
      const escalateTo = result.escalateTo || 'michael';

      if (status !== 'handed_over') {
        console.log(`🚨 Handover → ${escalateTo}`);
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
        const prospect = getProspectByPhone(from);
        await sendWhatsAppMessage(
          MICHAEL_PHONE,
          `🔁 *Follow-up Signal*\n${prospect?.name || from} (${prospect?.company || 'Unknown'}) — new signal: ${result.handoverReason}\n"${messageText}"`
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
      console.error('❌ Fallback failed:', e.message);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATION BUILDERS
// ══════════════════════════════════════════════════════════════

function buildMichaelAlert(prospect, clientPhone, body) {
  return [
    `📩 *IVAR Alert*`,
    ``,
    `*Who:* ${prospect?.name || 'Unknown'} (${prospect?.company || 'Unknown'})`,
    `*Phone:* +${clientPhone}`,
    `*Stage:* ${prospect?.stage || 'inquiry'}`,
    ``,
    body,
    ``,
    `Reply here and I'll relay it to them.`,
  ].join('\n');
}

function buildAshellAlert(prospect, clientPhone, body) {
  return [
    `🔧 *IVAR Technical Escalation*`,
    ``,
    `*Who:* ${prospect?.name || 'Unknown'} (${prospect?.company || 'Unknown'})`,
    `*Phone:* +${clientPhone}`,
    ``,
    body,
    ``,
    `Reply with the answer and I'll send it straight to them.`,
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
