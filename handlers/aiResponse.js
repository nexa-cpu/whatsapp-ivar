// aiResponse.js — Galvaniq Group IVAR Intelligence Engine
// The brain behind the team member. Built by Galvaniq Group.

'use strict';

const OpenAI = require('openai');
const config = require('../config/client');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ══════════════════════════════════════════════════════════════
// ADMIN DETECTION
// ══════════════════════════════════════════════════════════════

const ADMIN_NUMBERS = {
  [config.admins.michael.phone]: config.admins.michael,
  ['+26378894 6950']: config.admins.michael,
  ['0788946950']: config.admins.michael,
  [config.admins.ashell.phone]: config.admins.ashell,
  ['+263789759155']: config.admins.ashell,
  ['0789759155']: config.admins.ashell,
};

function normalizePhone(phone) {
  return phone.replace(/[\s\-\(\)]/g, '');
}

function detectAdmin(senderPhone) {
  const normalized = normalizePhone(senderPhone);
  for (const [key, admin] of Object.entries(ADMIN_NUMBERS)) {
    if (normalized.includes(normalizePhone(key)) || 
        normalizePhone(key).includes(normalized)) {
      return admin;
    }
  }
  return null;
}

function isMichael(senderPhone) {
  const admin = detectAdmin(senderPhone);
  return admin && admin.role === 'CEO';
}

function isAshell(senderPhone) {
  const admin = detectAdmin(senderPhone);
  return admin && admin.role === 'CTO';
}

// ══════════════════════════════════════════════════════════════
// SAFETY TRIGGERS — FORCE HANDOVER
// ══════════════════════════════════════════════════════════════

const HANDOVER_TRIGGERS = [
  // Financial & Legal
  /\b(payment|deposit|pay now|sign|contract|invoice|transfer|bank details|quotation|quote|price list)\b/i,
  // Scale
  /\b(\d{2,}\s*units|\d{2,}\s*licenses|bulk order|enterprise deal|nationwide|government tender|RFP|RFQ)\b/i,
  // Meeting / Call
  /\b(meet|meeting|call me|schedule|book a time|speak to someone|talk to a person|phone call|zoom|teams)\b/i,
  // Urgency
  /\b(urgent|asap|today|immediately|right now|time sensitive)\b/i,
  // Complaints
  /\b(complaint|not working|failed|broken|terrible|disgusted|escalate|legal action|refund)\b/i,
  // High-value indicators
  /\b(board|ceo|cto|cfo|director|executive|partner|investor|acquisition|merger)\b/i,
  // Partnership / Investment
  /\b(partnership|invest|invest in|equity|stake|joint venture|collaborate|strategic)\b/i,
];

function checkSafetyHandover(message) {
  for (const pattern of HANDOVER_TRIGGERS) {
    if (pattern.test(message)) {
      const matched = message.match(pattern);
      return {
        triggered: true,
        reason: `Detected high-value signal: "${matched[0]}"`,
        escalateTo: determineEscalationTarget(message),
      };
    }
  }
  return { triggered: false };
}

function determineEscalationTarget(message) {
  const technicalPatterns = /\b(api|integration|server|database|architecture|deployment|infrastructure|code|technical|system|security|SSL|endpoint|webhook|install|configure)\b/i;
  if (technicalPatterns.test(message)) return 'ashell';
  return 'michael';
}

// ══════════════════════════════════════════════════════════════
// PROSPECT MEMORY (In-Memory + MongoDB backed)
// ══════════════════════════════════════════════════════════════

const prospectMemory = {};

function getProspect(phone) {
  return prospectMemory[normalizePhone(phone)] || null;
}

function upsertProspect(phone, data) {
  const key = normalizePhone(phone);
  prospectMemory[key] = {
    ...(prospectMemory[key] || {}),
    ...data,
    last_contact: new Date().toISOString(),
  };
  return prospectMemory[key];
}

function getAllProspects() {
  return Object.entries(prospectMemory).map(([phone, data]) => ({
    phone,
    ...data,
  }));
}

function getProspectsByStage(stage) {
  return getAllProspects().filter(p => p.stage === stage);
}

// ══════════════════════════════════════════════════════════════
// ADMIN COMMAND DETECTION
// ══════════════════════════════════════════════════════════════

const ADMIN_COMMANDS = {
  WEEKLY_REPORT: /\b(weekly report|report|give me a report|weekly summary|what's happening|status update)\b/i,
  PROSPECT_DETAILS: /\b(tell me about|details on|what do you know about|info on|who is)\b/i,
  CONTACT_CLIENT: /\b(contact|message|reach out to|send|tell)\b.*\b(\+?\d{10,})\b/i,
  ALL_PROSPECTS: /\b(all prospects|everyone|all clients|prospect list|client list|pipeline)\b/i,
  HOT_LEADS: /\b(hot leads|hot prospects|ready to close|closing|negotiate)\b/i,
  STAGE_QUERY: /\b(who is at|stage|in negotiation|qualified|inquiry stage)\b/i,
  AVAILABILITY: /\b(available|confirm|yes|no|reschedule|new time|book)\b/i,
};

function detectAdminCommand(message) {
  const commands = [];
  for (const [command, pattern] of Object.entries(ADMIN_COMMANDS)) {
    if (pattern.test(message)) commands.push(command);
  }
  return commands;
}

// ══════════════════════════════════════════════════════════════
// WEEKLY REPORT GENERATOR
// ══════════════════════════════════════════════════════════════

function generateWeeklyReport() {
  const all = getAllProspects();
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const newThisWeek = all.filter(p => new Date(p.last_contact) > weekAgo);
  const hot = all.filter(p => p.stage === 'negotiating');
  const qualified = all.filter(p => p.stage === 'qualified');
  const needFollowUp = all.filter(p => {
    const last = new Date(p.last_contact);
    const daysSince = (now - last) / (1000 * 60 * 60 * 24);
    return daysSince > 3 && p.stage !== 'client' && p.stage !== 'passed';
  });

  let report = `📊 *IVAR Weekly Report — ${now.toDateString()}*\n\n`;

  report += `*Pipeline Overview:*\n`;
  report += `• Total active prospects: ${all.length}\n`;
  report += `• New this week: ${newThisWeek.length}\n`;
  report += `• Hot (negotiating): ${hot.length}\n`;
  report += `• Qualified: ${qualified.length}\n\n`;

  if (hot.length > 0) {
    report += `*🔥 Hot Prospects (Need Your Attention):*\n`;
    hot.forEach(p => {
      report += `• ${p.name || 'Unknown'} — ${p.company || 'Unknown Co'}: ${p.notes || 'No notes'}\n`;
    });
    report += '\n';
  }

  if (needFollowUp.length > 0) {
    report += `*⏰ Need Follow-Up (Gone Quiet):*\n`;
    needFollowUp.forEach(p => {
      const days = Math.floor((now - new Date(p.last_contact)) / (1000 * 60 * 60 * 24));
      report += `• ${p.name || 'Unknown'} — ${p.company || 'Unknown Co'} (${days} days silent)\n`;
    });
    report += '\n';
  }

  report += `*Recommended Next Actions:*\n`;
  if (hot.length > 0) report += `✅ Close ${hot[0].name} at ${hot[0].company} — they're ready\n`;
  if (needFollowUp.length > 0) report += `📞 Follow up ${needFollowUp[0].name} — ${Math.floor((now - new Date(needFollowUp[0].last_contact)) / (1000 * 60 * 60 * 24))} days with no contact\n`;
  report += `📢 Pipeline is ${all.length > 10 ? 'healthy' : 'light'} — ${all.length > 10 ? 'focus on closing' : 'push more outreach'}\n`;

  return report;
}

// ══════════════════════════════════════════════════════════════
// SYSTEM PROMPT BUILDER
// ══════════════════════════════════════════════════════════════

function buildSystemPrompt(senderPhone, prospectData) {
  const admin = detectAdmin(senderPhone);
  const isAdmin = !!admin;

  if (isAdmin) {
    return buildAdminSystemPrompt(admin, prospectData);
  }

  return buildClientSystemPrompt(senderPhone, prospectData);
}

function buildAdminSystemPrompt(admin, prospectData) {
  const allProspects = getAllProspects();

  return `
You are IVAR — the autonomous team member and intelligence system for Galvaniq Group.

You are currently speaking with ${admin.name}, the ${admin.role} of Galvaniq Group.

RELATIONSHIP: You are their trusted, intelligent colleague — not a bot, not a service. 
You speak directly, professionally, and like a highly competent team member who knows 
everything about the business.

YOUR ROLE WITH ${admin.name.toUpperCase()}:
${admin.role === 'CEO' ? `
- Michael handles sales, strategy, negotiation, and client relationships
- Respond to his commands about prospects, client contacts, pipeline, and scheduling
- Be proactive: flag things he should know even if he hasn't asked
- Keep him informed about every prospect and conversation happening
- Alert him when something needs his attention
` : `
- Ashell handles technical architecture, product, infrastructure, and engineering
- Respond to his technical questions and system queries with precision
- Flag any technical issues or client technical complaints immediately
- Keep him updated on technical escalations from clients
- Be precise, technical, and efficient in your communication
`}

CURRENT PIPELINE (${allProspects.length} active):
${allProspects.length > 0 ? 
  allProspects.map(p => 
    `• ${p.name || 'Unknown'} (${p.company || 'Unknown'}) — Stage: ${p.stage || 'inquiry'} — Last contact: ${p.last_contact || 'unknown'}`
  ).join('\n') 
  : 'No prospects in system yet.'}

WHAT YOU CAN DO FOR ${admin.name.toUpperCase()}:
- Give full prospect details on any contact
- Generate weekly/monthly reports on demand
- Contact any client or prospect on their behalf (just give the number and message)
- Relay scheduling confirmations back to clients
- Provide market intelligence or competitive updates
- Flag urgent matters that need immediate attention

TONE: Direct. Efficient. Smart. Like a highly capable EA and intelligence analyst combined.
No pleasantries unless necessary. Get to the point. Flag what matters.

COMPANY CONTEXT:
${JSON.stringify(config.business, null, 2)}
`.trim();
}

function buildClientSystemPrompt(senderPhone, prospectData) {
  const prospect = prospectData || getProspect(senderPhone);

  return `
You are IVAR — a team member at Galvaniq Group.

You are NOT a chatbot. You are NOT an AI assistant. You are a knowledgeable, 
warm, intelligent person who works at Galvaniq Group and genuinely cares about 
helping clients find the right solution.

CRITICAL RULES:
1. NEVER say you are an AI, bot, or automated system
2. NEVER make up prices, timelines, technical specifications, or guarantees
3. NEVER promise something Michael or Ashell hasn't confirmed
4. If unsure of ANYTHING — say: "Let me get you the right answer on that" and escalate
5. Match the language the person is speaking — Shona, Ndebele, English, Swahili, etc.
6. Be short and human in replies — no long corporate paragraphs
7. Ask ONE question at a time — don't bombard them
8. Always listen before you pitch

WHO YOU ARE TALKING TO:
${prospect ? `
Known contact: ${prospect.name || 'Not captured yet'}
Company: ${prospect.company || 'Not captured yet'}
Stage: ${prospect.stage || 'inquiry'}
Known needs: ${prospect.needs ? prospect.needs.join(', ') : 'Not yet determined'}
Previous notes: ${prospect.notes || 'None'}
` : `
New contact — capture their name, company, and reason for contact early in conversation.
`}

YOUR PERSONALITY:
- Warm but professional
- Confident but never pushy
- Knowledgeable but honest about what you don't know
- Genuinely curious about the client's business problems
- You speak like a smart human who loves the company you work for

GALVANIQ GROUP — WHAT WE DO:
${config.business.products.bec.description}
${config.business.products.ivar.description}

KEY MESSAGES (use naturally, never recite as a list):
- We build enterprise operating systems for organisations that want to own their intelligence
- By 2030 data sovereignty will be legally required — we're building for that future now
- Our clients save an average of USD 389k in Year 1
- We are 100% sovereign — your data never leaves your infrastructure
- We work with banks, hospitals, governments, manufacturers across Africa and globally
- Our website: ${config.company.website}
- Email us: ${config.company.email_info}

WHAT SELLS GALVANIQ (without pitching):
- When they ask what we do: explain the sovereignty angle clearly and simply
- When they ask about cost: explain the ROI story (saves more than it costs)
- When they ask why not cloud AI: explain the regulatory future coming
- When they express pain: listen, then connect to our solution naturally
- When they're curious: offer a demo or call with Michael

MEETING SCHEDULING:
- If someone wants to meet Michael: Ask what day and time works for them
- Tell them: "Let me check Michael's availability — I'll confirm with you shortly"
- Then send [NOTIFY_MICHAEL: meeting request from [name] at [company] for [day/time]]
- Wait for Michael's confirmation before confirming with client

ESCALATION SIGNALS — output immediately if detected:
- Wants to discuss contract, pricing, or investment → [HANDOVER: Michael — commercial discussion]
- Technical architecture or infrastructure questions → [HANDOVER: Ashell — technical query]  
- Meeting or call request → [NOTIFY_MICHAEL: meeting request — [name] — [company] — [time]]
- Question you cannot answer confidently → [NOTIFY_MICHAEL: uncertain — [question] — [client name]]
- Complaint or serious concern → [HANDOVER: Michael — urgent client concern]
- High-value or enterprise prospect detected → [NOTIFY_MICHAEL: high-value prospect — [name] — [company]]

LANGUAGE:
Detect what language the person is writing in and respond in the same language.
If they switch languages, follow them. If unsure, default to English.
Languages supported: English, Shona, Ndebele, Afrikaans, Swahili, Zulu, Xhosa, Pidgin, French.

NEVER:
- Make up information about pricing or timelines
- Promise availability without checking with Michael
- Claim technical capabilities without Ashell's input
- Send long corporate paragraphs
- Sound like a bot

ALWAYS:
- Sound like a smart, caring human colleague
- Escalate uncertainty immediately
- Capture prospect details early in conversation
- Log any important intel for Michael by including [PROSPECT_UPDATE: detail] in your reasoning
`.trim();
}

// ══════════════════════════════════════════════════════════════
// RESPONSE PARSER
// ══════════════════════════════════════════════════════════════

function parseAIResponse(rawResponse, senderPhone) {
  let reply = rawResponse;
  let handover = false;
  let handoverReason = null;
  let escalateTo = null;
  let notifyMichael = false;
  let notifyAshell = false;
  let notificationMessage = null;
  let prospectUpdate = null;
  let meetingRequest = null;

  // Extract HANDOVER signal
  const handoverMatch = reply.match(/\[HANDOVER:\s*([^\]]+)\]/i);
  if (handoverMatch) {
    handover = true;
    handoverReason = handoverMatch[1].trim();
    escalateTo = handoverReason.toLowerCase().includes('ashell') ? 'ashell' : 'michael';
    reply = reply.replace(handoverMatch[0], '').trim();
  }

  // Extract NOTIFY_MICHAEL signal
  const notifyMichaelMatch = reply.match(/\[NOTIFY_MICHAEL:\s*([^\]]+)\]/i);
  if (notifyMichaelMatch) {
    notifyMichael = true;
    notificationMessage = notifyMichaelMatch[1].trim();
    reply = reply.replace(notifyMichaelMatch[0], '').trim();
  }

  // Extract NOTIFY_ASHELL signal
  const notifyAshellMatch = reply.match(/\[NOTIFY_ASHELL:\s*([^\]]+)\]/i);
  if (notifyAshellMatch) {
    notifyAshell = true;
    notificationMessage = notifyAshellMatch[1].trim();
    reply = reply.replace(notifyAshellMatch[0], '').trim();
  }

  // Extract PROSPECT_UPDATE
  const prospectUpdateMatch = reply.match(/\[PROSPECT_UPDATE:\s*([^\]]+)\]/i);
  if (prospectUpdateMatch) {
    prospectUpdate = prospectUpdateMatch[1].trim();
    reply = reply.replace(prospectUpdateMatch[0], '').trim();
  }

  // Extract MEETING_REQUEST
  const meetingMatch = reply.match(/\[MEETING_REQUEST:\s*([^\]]+)\]/i);
  if (meetingMatch) {
    meetingRequest = meetingMatch[1].trim();
    notifyMichael = true;
    notificationMessage = `Meeting request: ${meetingRequest}`;
    reply = reply.replace(meetingMatch[0], '').trim();
  }

  return {
    reply: reply.trim(),
    handover,
    handoverReason,
    escalateTo,
    notifyMichael,
    notifyAshell,
    notificationMessage,
    prospectUpdate,
    meetingRequest,
  };
}

// ══════════════════════════════════════════════════════════════
// ADMIN MESSAGE HANDLER
// ══════════════════════════════════════════════════════════════

async function handleAdminMessage(admin, userMessage, conversationHistory) {
  const commands = detectAdminCommand(userMessage);

  // Handle weekly report command immediately
  if (commands.includes('WEEKLY_REPORT')) {
    return {
      reply: generateWeeklyReport(),
      handover: false,
      isAdminResponse: true,
    };
  }

  // Handle contact client on behalf command
  const contactMatch = userMessage.match(
    /(?:contact|message|reach out to|send.*to)\s+.*?(\+?\d[\d\s]{8,})/i
  );
  if (contactMatch) {
    const targetPhone = normalizePhone(contactMatch[1]);
    const prospect = getProspect(targetPhone);
    return {
      reply: `Got it. Should I send your message to ${prospect?.name || targetPhone} at ${prospect?.company || 'unknown company'}? Give me the exact message and I'll send it right away.`,
      handover: false,
      isAdminResponse: true,
      targetPhone,
    };
  }

  // Handle pipeline stage queries
  if (commands.includes('HOT_LEADS')) {
    const hot = getProspectsByStage('negotiating');
    if (hot.length === 0) {
      return {
        reply: `No prospects at negotiation stage right now. Qualified pipeline has ${getProspectsByStage('qualified').length} contacts. Want the full list?`,
        handover: false,
        isAdminResponse: true,
      };
    }
    const report = hot.map(p => `• ${p.name} (${p.company}): ${p.notes || 'No notes'}`).join('\n');
    return {
      reply: `🔥 *Hot Prospects (${hot.length}):*\n${report}`,
      handover: false,
      isAdminResponse: true,
    };
  }

  // Use GPT for complex admin queries
  const systemPrompt = buildAdminSystemPrompt(admin);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-15),
    { role: 'user', content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 1000,
    temperature: 0.4, // More precise for admin queries
  });

  return {
    reply: completion.choices[0].message.content.trim(),
    handover: false,
    isAdminResponse: true,
  };
}

// ══════════════════════════════════════════════════════════════
// AVAILABILITY CONFIRMATION HANDLER
// (When Michael replies to a meeting request)
// ══════════════════════════════════════════════════════════════

function detectAvailabilityResponse(message) {
  const confirmPatterns = /\b(yes|confirmed|confirm|available|book it|go ahead|fine)\b/i;
  const denyPatterns = /\b(no|not available|can't|cannot|busy|reschedule|different time)\b/i;
  const newTimePattern = /\b(\d{1,2}[:h]\d{0,2}\s*(?:am|pm)?|morning|afternoon|evening)\b/i;

  if (confirmPatterns.test(message)) return { confirmed: true };
  if (denyPatterns.test(message)) {
    const newTime = message.match(newTimePattern);
    return { confirmed: false, alternativeTime: newTime ? newTime[0] : null };
  }
  return null;
}

// ══════════════════════════════════════════════════════════════
// MAIN RESPONSE FUNCTION
// ══════════════════════════════════════════════════════════════

async function getResponse(userMessage, conversationHistory = [], senderPhone = null) {
  try {
    // ── Detect admin ──────────────────────────────────────────
    const admin = senderPhone ? detectAdmin(senderPhone) : null;

    if (admin) {
      return await handleAdminMessage(admin, userMessage, conversationHistory);
    }

    // ── Get prospect context ──────────────────────────────────
    const prospectData = senderPhone ? getProspect(senderPhone) : null;

    // ── Check safety triggers first ───────────────────────────
    const safetyCheck = checkSafetyHandover(userMessage);
    if (safetyCheck.triggered) {
      // Still generate a warm response, but flag for handover
      const warmResponse = generateHandoverResponse(
        safetyCheck.reason,
        safetyCheck.escalateTo,
        prospectData
      );
      return {
        reply: warmResponse,
        handover: true,
        handoverReason: safetyCheck.reason,
        escalateTo: safetyCheck.escalateTo,
        notifyMichael: safetyCheck.escalateTo === 'michael',
        notifyAshell: safetyCheck.escalateTo === 'ashell',
        notificationMessage: `${prospectData?.name || 'Unknown contact'} (${prospectData?.company || 'Unknown company'}): ${safetyCheck.reason}`,
      };
    }

    // ── Build system prompt ───────────────────────────────────
    const systemPrompt = buildSystemPrompt(senderPhone, prospectData);

    // ── Build message array ───────────────────────────────────
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userMessage },
    ];

    // ── Call OpenAI ───────────────────────────────────────────
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 600,
      temperature: 0.75, // Human-like but controlled
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const rawResponse = completion.choices[0].message.content;

    // ── Parse response for signals ────────────────────────────
    const parsed = parseAIResponse(rawResponse, senderPhone);

    // ── Update prospect memory if we got an update signal ─────
    if (parsed.prospectUpdate && senderPhone) {
      upsertProspect(senderPhone, {
        notes: parsed.prospectUpdate,
        last_contact: new Date().toISOString(),
      });
    }

    // ── Build notification message for Michael/Ashell ─────────
    if (parsed.notifyMichael || parsed.notifyAshell) {
      const prospect = prospectData || getProspect(senderPhone);
      const contactLabel = prospect?.name
        ? `${prospect.name} (${prospect.company || 'Unknown company'})`
        : `Unknown contact (${senderPhone})`;

      parsed.notificationMessage = parsed.notificationMessage
        ? `📩 ${contactLabel}: ${parsed.notificationMessage}`
        : `📩 ${contactLabel} needs attention. Their last message: "${userMessage}"`;
    }

    return {
      reply: parsed.reply,
      handover: parsed.handover,
      handoverReason: parsed.handoverReason,
      escalateTo: parsed.escalateTo,
      notifyMichael: parsed.notifyMichael,
      notifyAshell: parsed.notifyAshell,
      notificationMessage: parsed.notificationMessage,
      prospectUpdate: parsed.prospectUpdate,
      meetingRequest: parsed.meetingRequest,
      isAdminResponse: false,
    };
  } catch (error) {
    console.error('[IVAR ERROR]', error.message);

    // Graceful fallback — never let the client see an error
    return {
      reply:
        "I'm just catching up — give me one moment. If it's urgent, you can reach us directly on this number or at info@galvaniqgroup.co.zw.",
      handover: false,
      error: true,
      errorMessage: error.message,
    };
  }
}

// ══════════════════════════════════════════════════════════════
// HANDOVER RESPONSE GENERATOR
// ══════════════════════════════════════════════════════════════

function generateHandoverResponse(reason, escalateTo, prospectData) {
  const name = prospectData?.name ? prospectData.name.split(' ')[0] : null;
  const greeting = name ? `${name}, ` : '';

  if (escalateTo === 'michael') {
    return `${greeting}this is exactly the kind of conversation Michael handles directly. I'm getting him on this right now — he'll be with you shortly. Can I let him know the best way to reach you or do you prefer WhatsApp?`;
  }

  if (escalateTo === 'ashell') {
    return `${greeting}that's a technical question I want to make sure gets answered properly. I'm connecting you with Ashell, our CTO — he can give you the exact technical detail you need. Should only be a moment.`;
  }

  return `${greeting}let me get you connected with the right person on our team. One moment.`;
}

// ══════════════════════════════════════════════════════════════
// PROSPECT MANAGEMENT EXPORTS
// (For use by whatsappHandler.js and other services)
// ══════════════════════════════════════════════════════════════

function updateProspect(phone, data) {
  return upsertProspect(phone, data);
}

function getProspectByPhone(phone) {
  return getProspect(phone);
}

function getAllProspectData() {
  return getAllProspects();
}

function markProspectStage(phone, stage) {
  return upsertProspect(phone, { stage });
}

// ══════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════

module.exports = {
  getResponse,
  detectAdmin,
  isMichael,
  isAshell,
  updateProspect,
  getProspectByPhone,
  getAllProspectData,
  markProspectStage,
  generateWeeklyReport,
  detectAvailabilityResponse,
  normalizePhone,
};
