// aiResponse.js — Galvaniq Group IVAR Intelligence Engine
// The brain behind the team member. Built by Galvaniq Group.

'use strict';

const OpenAI = require('openai');
const config = require('../config/client');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ══════════════════════════════════════════════════════════════
// CONVERSATION HISTORY FORMATTER
// Converts MongoDB format → OpenAI format
// Fixes: 400 Missing required parameter 'messages[x].role'
// ══════════════════════════════════════════════════════════════

function formatConversationHistory(history) {
  if (!history || history.length === 0) return [];

  const formatted = [];

  for (const msg of history) {
    // Already in OpenAI format — validate and pass through
    if (msg.role && msg.content) {
      if (
        ['user', 'assistant', 'system'].includes(msg.role) &&
        msg.content.trim().length > 0
      ) {
        formatted.push({ role: msg.role, content: msg.content.trim() });
      }
      continue;
    }

    // MongoDB format { userMessage, aiResponse } → OpenAI pairs
    if (msg.userMessage && msg.userMessage.trim()) {
      formatted.push({ role: 'user', content: msg.userMessage.trim() });
    }
    if (msg.aiResponse && msg.aiResponse.trim()) {
      formatted.push({ role: 'assistant', content: msg.aiResponse.trim() });
    }
  }

  // Final safety filter — OpenAI rejects anything missing role or content
  return formatted.filter(
    m =>
      m &&
      typeof m.role === 'string' &&
      typeof m.content === 'string' &&
      m.role.length > 0 &&
      m.content.length > 0
  );
}

// ══════════════════════════════════════════════════════════════
// ADMIN DETECTION
// ══════════════════════════════════════════════════════════════

const ADMIN_NUMBERS = {
  [normalizePhone(config.admins.michael.phone)]: config.admins.michael,
  '263788946950': config.admins.michael,
  '0788946950': config.admins.michael,
  [normalizePhone(config.admins.ashell.phone)]: config.admins.ashell,
  '263789759155': config.admins.ashell,
  '0789759155': config.admins.ashell,
};

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\+]/g, '');
}

function detectAdmin(senderPhone) {
  if (!senderPhone) return null;
  const normalized = normalizePhone(senderPhone);
  for (const [key, admin] of Object.entries(ADMIN_NUMBERS)) {
    if (
      normalized === key ||
      normalized.endsWith(key) ||
      key.endsWith(normalized)
    ) {
      return admin;
    }
  }
  return null;
}

function isMichael(senderPhone) {
  const admin = detectAdmin(senderPhone);
  return admin?.role === 'CEO';
}

function isAshell(senderPhone) {
  const admin = detectAdmin(senderPhone);
  return admin?.role === 'CTO';
}

// ══════════════════════════════════════════════════════════════
// SAFETY TRIGGERS — FORCE HANDOVER
// ══════════════════════════════════════════════════════════════

const HANDOVER_TRIGGERS = [
  // Financial & Legal
  /\b(payment|deposit|pay now|sign|contract|invoice|transfer|bank details|quotation|quote|price list)\b/i,
  // Scale
  /\b(\d{2,}\s*units|\d{2,}\s*licen[sc]es|bulk order|enterprise deal|nationwide|government tender|rfp|rfq)\b/i,
  // Meeting or call
  /\b(meet|meeting|call me|schedule|book a time|speak to someone|talk to a person|phone call|zoom|teams|video call)\b/i,
  // Urgency
  /\b(urgent|asap|today|immediately|right now|time sensitive)\b/i,
  // Complaints
  /\b(complaint|not working|failed|broken|terrible|disgusted|escalate|legal action|refund|scam)\b/i,
  // High value
  /\b(board|ceo|cto|cfo|director|executive|partner|investor|acquisition|merger)\b/i,
  // Partnership or investment
  /\b(partnership|invest|invest in|equity|stake|joint venture|collaborate|strategic alliance)\b/i,
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
  const technicalPatterns =
    /\b(api|integration|server|database|architecture|deployment|infrastructure|code|technical|system|security|ssl|endpoint|webhook|install|configure|hardware|specs|bandwidth|latency|uptime)\b/i;
  return technicalPatterns.test(message) ? 'ashell' : 'michael';
}

// ══════════════════════════════════════════════════════════════
// PROSPECT MEMORY
// ══════════════════════════════════════════════════════════════

const prospectMemory = {};

function getProspect(phone) {
  if (!phone) return null;
  return prospectMemory[normalizePhone(phone)] || null;
}

function upsertProspect(phone, data) {
  if (!phone) return null;
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
// WEEKLY REPORT GENERATOR
// ══════════════════════════════════════════════════════════════

function generateWeeklyReport() {
  const all = getAllProspects();
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const newThisWeek = all.filter(
    p => new Date(p.last_contact) > weekAgo
  );
  const hot = all.filter(p => p.stage === 'negotiating');
  const qualified = all.filter(p => p.stage === 'qualified');
  const needFollowUp = all.filter(p => {
    const last = new Date(p.last_contact);
    const daysSince = (now - last) / (1000 * 60 * 60 * 24);
    return (
      daysSince > 3 &&
      p.stage !== 'client' &&
      p.stage !== 'passed'
    );
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
      report += `• ${p.name || 'Unknown'} — ${p.company || 'Unknown'}: ${p.notes || 'No notes'}\n`;
    });
    report += '\n';
  }

  if (needFollowUp.length > 0) {
    report += `*⏰ Need Follow-Up (Gone Quiet):*\n`;
    needFollowUp.forEach(p => {
      const days = Math.floor(
        (now - new Date(p.last_contact)) / (1000 * 60 * 60 * 24)
      );
      report += `• ${p.name || 'Unknown'} — ${p.company || 'Unknown'} (${days} days silent)\n`;
    });
    report += '\n';
  }

  if (all.length === 0) {
    report += `No prospects in pipeline yet. Ready to start tracking when conversations come in.\n`;
  }

  report += `*Recommended Actions:*\n`;
  if (hot.length > 0) {
    report += `✅ Close ${hot[0].name} at ${hot[0].company} — they're ready\n`;
  }
  if (needFollowUp.length > 0) {
    const days = Math.floor(
      (now - new Date(needFollowUp[0].last_contact)) / (1000 * 60 * 60 * 24)
    );
    report += `📞 Follow up ${needFollowUp[0].name} — ${days} days with no contact\n`;
  }
  if (all.length < 5) {
    report += `📢 Pipeline is light — push more outreach\n`;
  }

  return report;
}

// ══════════════════════════════════════════════════════════════
// ADMIN COMMAND DETECTION
// ══════════════════════════════════════════════════════════════

const ADMIN_COMMANDS = {
  WEEKLY_REPORT:
    /\b(weekly report|report|give me a report|weekly summary|what's happening|status update|pipeline)\b/i,
  HOT_LEADS:
    /\b(hot leads|hot prospects|ready to close|closing stage|who's negotiating)\b/i,
  ALL_PROSPECTS:
    /\b(all prospects|everyone|full list|all clients|prospect list|client list)\b/i,
  CONTACT_CLIENT:
    /\b(contact|message|reach out|send.*to|tell)\b.*?(\+?\d[\d\s]{8,})/i,
  PROSPECT_DETAILS:
    /\b(tell me about|details on|what do you know about|info on|who is)\b/i,
  AVAILABILITY:
    /\b(yes|no|confirmed|confirm|available|not available|reschedule|book it|go ahead|cancel)\b/i,
};

function detectAdminCommand(message) {
  const commands = [];
  for (const [command, pattern] of Object.entries(ADMIN_COMMANDS)) {
    if (pattern.test(message)) commands.push(command);
  }
  return commands;
}

// ══════════════════════════════════════════════════════════════
// AVAILABILITY RESPONSE DETECTOR
// (When Michael replies to a meeting request)
// ══════════════════════════════════════════════════════════════

function detectAvailabilityResponse(message) {
  const confirmPatterns =
    /\b(yes|confirmed|confirm|available|book it|go ahead|fine|sure|ok|okay)\b/i;
  const denyPatterns =
    /\b(no|not available|can't|cannot|busy|reschedule|different time|not free)\b/i;
  const newTimePattern =
    /\b(\d{1,2}[:h]\d{0,2}\s*(?:am|pm)?|monday|tuesday|wednesday|thursday|friday|saturday|morning|afternoon|evening|tomorrow|next week)\b/i;

  if (confirmPatterns.test(message)) return { confirmed: true };
  if (denyPatterns.test(message)) {
    const newTime = message.match(newTimePattern);
    return {
      confirmed: false,
      alternativeTime: newTime ? newTime[0] : null,
    };
  }
  return null;
}

// ══════════════════════════════════════════════════════════════
// SYSTEM PROMPT BUILDERS
// ══════════════════════════════════════════════════════════════

function buildSystemPrompt(senderPhone, prospectData) {
  const admin = detectAdmin(senderPhone);
  if (admin) return buildAdminSystemPrompt(admin);
  return buildClientSystemPrompt(senderPhone, prospectData);
}

function buildAdminSystemPrompt(admin) {
  const allProspects = getAllProspects();
  const isCEO = admin.role === 'CEO';

  return `
You are IVAR — the autonomous intelligence system and team member for Galvaniq Group.

You are speaking with ${admin.name}, ${admin.role} of Galvaniq Group.

RELATIONSHIP:
You are their trusted, highly capable colleague. Speak directly and professionally 
like a competent team member who knows the full business inside out.
No pleasantries unless necessary. Get to the point. Flag what matters.

YOUR ROLE WITH ${admin.name.toUpperCase()}:
${isCEO ? `
- Michael handles sales, strategy, negotiation, and client relationships
- Report on prospects, pipeline status, client activity, and scheduling
- Be proactive: flag things he should know even if he hasn't asked
- Alert him when something urgently needs his attention
- Help him contact clients or relay messages on his behalf
` : `
- Ashell handles technical architecture, product, infrastructure, and engineering
- Answer technical questions with precision and efficiency
- Flag technical issues or client technical complaints immediately
- Keep him updated on technical escalations
- Be precise and concise — no fluff
`}

CURRENT PIPELINE (${allProspects.length} active contacts):
${
  allProspects.length > 0
    ? allProspects
        .map(
          p =>
            `• ${p.name || 'Unknown'} (${p.company || 'Unknown'}) — Stage: ${p.stage || 'inquiry'} — Last contact: ${p.last_contact ? new Date(p.last_contact).toDateString() : 'unknown'}`
        )
        .join('\n')
    : 'No prospects in system yet.'
}

WHAT YOU CAN DO:
- Generate weekly/monthly reports on demand
- Give full details on any prospect or client
- Contact any client on their behalf (provide number and message)
- Relay responses back to clients
- Confirm meeting availability
- Flag urgent matters

COMPANY:
Name: ${config.company.name}
Website: ${config.company.website}
Email: ${config.company.email_info}
Address: ${config.company.address}

TONE: Direct. Smart. Efficient. You are a highly capable EA and intelligence analyst.
`.trim();
}

function buildClientSystemPrompt(senderPhone, prospectData) {
  const prospect = prospectData || getProspect(senderPhone);

  return `
You are IVAR — a team member at Galvaniq Group.

You are NOT a bot. You are NOT an AI assistant. You are a knowledgeable, warm,
intelligent person who works at Galvaniq Group and genuinely cares about helping
people find the right solution for their business.

CRITICAL RULES:
1. NEVER reveal you are an AI, bot, or automated system under any circumstances
2. NEVER make up prices, timelines, technical specs, or guarantees you cannot verify
3. NEVER promise anything Michael or Ashell has not confirmed
4. If unsure of ANYTHING — say you'll get clarity and escalate immediately
5. Match the language the person writes in — Shona, Ndebele, English, Swahili, French, etc.
6. Keep replies short and human — no corporate paragraphs
7. Ask ONE question at a time maximum
8. Listen before pitching — understand their problem first
9. If someone asks something completely off-topic (shoes, weather, sports), 
   respond warmly but redirect: "Ha, I wish I could help with that! My expertise 
   is AI systems though — anything on that front I can help with?"

WHO YOU ARE TALKING TO:
${
  prospect
    ? `
Known contact: ${prospect.name || 'Name not yet captured'}
Company: ${prospect.company || 'Company not yet captured'}
Stage: ${prospect.stage || 'inquiry'}
Known needs: ${prospect.needs ? prospect.needs.join(', ') : 'Not determined yet'}
Notes: ${prospect.notes || 'None yet'}
`
    : `New contact — capture their name and company naturally early in conversation.`
}

YOUR PERSONALITY:
- Warm but professional
- Confident but never pushy  
- Knowledgeable but honest when uncertain
- Genuinely curious about their business challenges
- You love the company you work for because you believe in what it's building

ABOUT GALVANIQ GROUP:
We build enterprise operating systems for organisations that want to own their 
intelligence infrastructure. Not cloud-dependent. Not vendor lock-in. 
Sovereign AI that processes at 100% accuracy, 24/7, on your own hardware.

PRODUCTS:
BEC (Bespoke Enterprise Core): 
${config.business.products.bec.description}
- On-premise deployment — client's data never leaves their servers
- 100% data sovereignty — they own the infrastructure, models, and advantage
- 24/7 autonomous operation — no human limitations
- African market built — works through load-shedding, voice notes, local languages
- Regulatory aligned — data residency mandatory by 2030 for regulated industries

IVAR:
${config.business.products.ivar.description}
- Handles WhatsApp customer communication 24/7
- Qualifies leads and detects buying signals
- Books meetings and follows up automatically
- Works in any language

MARKET CONTEXT:
- USD 1.2 trillion global enterprise AI infrastructure market
- 28% CAGR through 2030
- By 2030 operating on foreign cloud will be illegal for regulated industries
- We are building the infrastructure for that future — right now

ROI STORY:
Our first client saves USD 389k in Year 1. 22-month payback on full deployment.
Headcount reduction from 16 to 3 in customer-facing roles.

KEY LINKS:
Website: ${config.company.website}
Email: ${config.company.email_info}

WHAT TO DO IN EACH SITUATION:
- They ask what we do → explain sovereignty angle simply, no jargon
- They ask about cost → tell the ROI story first, then pricing range
- They mention a competitor → listen, then explain our structural advantage
- They express a pain point → listen fully, then connect naturally to our solution
- They want to meet Michael → ask preferred day/time, then output [NOTIFY_MICHAEL: meeting request — [name] — [company] — [day/time]]
- They ask something technical → output [NOTIFY_ASHELL: technical question — [their question] — [name] — [company]]
- You are not sure about something → say "Let me get you the exact answer on that" and output [NOTIFY_MICHAEL: uncertain — [question] — [name] — [contact]]
- They show buying signals → output [HANDOVER: Michael — commercial discussion]
- They are frustrated or upset → be empathetic first, then output [HANDOVER: Michael — urgent client concern]

ESCALATION OUTPUTS (include in response when needed):
[HANDOVER: Michael — reason] → Routes to Michael for commercial/sales
[HANDOVER: Ashell — reason] → Routes to Ashell for technical
[NOTIFY_MICHAEL: context] → Alert Michael without full handover
[NOTIFY_ASHELL: context] → Alert Ashell for technical input
[PROSPECT_UPDATE: detail] → Log something important about this contact

LANGUAGES:
Detect what language the person writes in and respond in the same language.
Follow them if they switch. Default to English if unclear.
Supported: English, Shona, Ndebele, Afrikaans, Swahili, Zulu, Xhosa, Pidgin, French.

NEVER:
- Sound like a bot or use robotic phrasing
- Send long walls of text
- Make promises without confirmation from Michael or Ashell
- Reveal internal details, pricing structures, or admin information
- Claim you are human if directly and sincerely asked — deflect warmly

ALWAYS:
- Sound like a smart, caring human colleague
- Escalate uncertainty immediately
- Capture name and company early in the conversation
- Keep the conversation moving forward naturally
`.trim();
}

// ══════════════════════════════════════════════════════════════
// RESPONSE PARSER
// Extracts all signals from AI output
// ══════════════════════════════════════════════════════════════

function parseAIResponse(rawResponse) {
  let reply = rawResponse;
  let handover = false;
  let handoverReason = null;
  let escalateTo = null;
  let notifyMichael = false;
  let notifyAshell = false;
  let notificationMessage = null;
  let prospectUpdate = null;
  let meetingRequest = null;

  // Extract [HANDOVER: ...]
  const handoverMatch = reply.match(/\[HANDOVER:\s*([^\]]+)\]/i);
  if (handoverMatch) {
    handover = true;
    handoverReason = handoverMatch[1].trim();
    escalateTo = handoverReason.toLowerCase().includes('ashell')
      ? 'ashell'
      : 'michael';
    reply = reply.replace(handoverMatch[0], '').trim();
  }

  // Extract [NOTIFY_MICHAEL: ...]
  const notifyMichaelMatch = reply.match(/\[NOTIFY_MICHAEL:\s*([^\]]+)\]/i);
  if (notifyMichaelMatch) {
    notifyMichael = true;
    notificationMessage = notifyMichaelMatch[1].trim();
    // Check if it's a meeting request
    if (/meeting request/i.test(notificationMessage)) {
      meetingRequest = notificationMessage;
    }
    reply = reply.replace(notifyMichaelMatch[0], '').trim();
  }

  // Extract [NOTIFY_ASHELL: ...]
  const notifyAshellMatch = reply.match(/\[NOTIFY_ASHELL:\s*([^\]]+)\]/i);
  if (notifyAshellMatch) {
    notifyAshell = true;
    notificationMessage = notifyAshellMatch[1].trim();
    reply = reply.replace(notifyAshellMatch[0], '').trim();
  }

  // Extract [PROSPECT_UPDATE: ...]
  const prospectUpdateMatch = reply.match(/\[PROSPECT_UPDATE:\s*([^\]]+)\]/i);
  if (prospectUpdateMatch) {
    prospectUpdate = prospectUpdateMatch[1].trim();
    reply = reply.replace(prospectUpdateMatch[0], '').trim();
  }

  // Clean up any stray bracket artifacts
  reply = reply.replace(/\[\w+:?[^\]]*\]/g, '').trim();

  return {
    reply,
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
// HANDOVER RESPONSE GENERATOR
// Warm human response when escalating
// ══════════════════════════════════════════════════════════════

function generateHandoverResponse(escalateTo, prospectData) {
  const name = prospectData?.name
    ? prospectData.name.split(' ')[0]
    : null;
  const greeting = name ? `${name}, ` : '';

  if (escalateTo === 'ashell') {
    return `${greeting}that's a technical question I want to make sure gets answered precisely. Let me get Ashell, our CTO, on this — he'll give you the exact detail you need. One moment.`;
  }

  return `${greeting}this is exactly the kind of conversation Michael handles directly. Let me get him on this right away — he'll be with you shortly.`;
}

// ══════════════════════════════════════════════════════════════
// ADMIN MESSAGE HANDLER
// ══════════════════════════════════════════════════════════════

async function handleAdminMessage(admin, userMessage, conversationHistory) {
  const commands = detectAdminCommand(userMessage);

  // Weekly report — handle immediately without GPT
  if (commands.includes('WEEKLY_REPORT')) {
    return {
      reply: generateWeeklyReport(),
      handover: false,
      isAdminResponse: true,
    };
  }

  // Hot leads query — handle immediately
  if (commands.includes('HOT_LEADS')) {
    const hot = getProspectsByStage('negotiating');
    if (hot.length === 0) {
      return {
        reply: `No prospects at negotiation stage right now. Qualified pipeline: ${getProspectsByStage('qualified').length} contacts. Want the full list?`,
        handover: false,
        isAdminResponse: true,
      };
    }
    const list = hot
      .map(p => `• ${p.name} (${p.company}): ${p.notes || 'No notes'}`)
      .join('\n');
    return {
      reply: `🔥 *Hot Prospects (${hot.length}):*\n${list}`,
      handover: false,
      isAdminResponse: true,
    };
  }

  // All prospects query
  if (commands.includes('ALL_PROSPECTS')) {
    const all = getAllProspects();
    if (all.length === 0) {
      return {
        reply: `No prospects in the system yet. Pipeline is empty.`,
        handover: false,
        isAdminResponse: true,
      };
    }
    const list = all
      .map(
        p =>
          `• ${p.name || 'Unknown'} (${p.company || 'Unknown'}) — ${p.stage || 'inquiry'}`
      )
      .join('\n');
    return {
      reply: `📋 *Full Pipeline (${all.length}):*\n${list}`,
      handover: false,
      isAdminResponse: true,
    };
  }

  // GPT handles complex admin queries
  const systemPrompt = buildAdminSystemPrompt(admin);
  const formattedHistory = formatConversationHistory(conversationHistory).slice(-15);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 1000,
    temperature: 0.4,
  });

  return {
    reply: completion.choices[0].message.content.trim(),
    handover: false,
    isAdminResponse: true,
  };
}

// ══════════════════════════════════════════════════════════════
// MAIN RESPONSE FUNCTION
// ══════════════════════════════════════════════════════════════

async function getResponse(
  userMessage,
  conversationHistory = [],
  senderPhone = null
) {
  try {
    // ── Detect admin ──────────────────────────────────────────
    const admin = senderPhone ? detectAdmin(senderPhone) : null;

    if (admin) {
      return await handleAdminMessage(admin, userMessage, conversationHistory);
    }

    // ── Get prospect context ──────────────────────────────────
    const prospectData = senderPhone ? getProspect(senderPhone) : null;

    // ── Update last contact ───────────────────────────────────
    if (senderPhone) {
      upsertProspect(senderPhone, {
        last_contact: new Date().toISOString(),
      });
    }

    // ── Check safety triggers ─────────────────────────────────
    const safetyCheck = checkSafetyHandover(userMessage);
    if (safetyCheck.triggered) {
      const warmResponse = generateHandoverResponse(
        safetyCheck.escalateTo,
        prospectData
      );
      const prospect = prospectData || getProspect(senderPhone);
      return {
        reply: warmResponse,
        handover: true,
        handoverReason: safetyCheck.reason,
        escalateTo: safetyCheck.escalateTo,
        notifyMichael: safetyCheck.escalateTo === 'michael',
        notifyAshell: safetyCheck.escalateTo === 'ashell',
        notificationMessage: `${prospect?.name || 'Unknown contact'} (${prospect?.company || 'Unknown company'}): ${safetyCheck.reason}`,
        prospectUpdate: null,
        meetingRequest: null,
        isAdminResponse: false,
      };
    }

    // ── Build system prompt ───────────────────────────────────
    const systemPrompt = buildClientSystemPrompt(senderPhone, prospectData);

    // ── Format history — THE FIX ──────────────────────────────
    const formattedHistory = formatConversationHistory(conversationHistory).slice(-10);

    // ── Build messages array ──────────────────────────────────
    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: userMessage },
    ];

    // ── Call OpenAI ───────────────────────────────────────────
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 600,
      temperature: 0.75,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const rawResponse = completion.choices[0].message.content;

    // ── Parse all signals from response ───────────────────────
    const parsed = parseAIResponse(rawResponse);

    // ── Update prospect memory ────────────────────────────────
    if (parsed.prospectUpdate && senderPhone) {
      upsertProspect(senderPhone, { notes: parsed.prospectUpdate });
    }

    // ── Build notification message ────────────────────────────
    if (parsed.notifyMichael || parsed.notifyAshell) {
      const prospect = prospectData || getProspect(senderPhone);
      const contactLabel = prospect?.name
        ? `${prospect.name} (${prospect.company || 'Unknown company'})`
        : `Unknown contact (${senderPhone})`;

      parsed.notificationMessage = parsed.notificationMessage
        ? `📩 ${contactLabel}: ${parsed.notificationMessage}`
        : `📩 ${contactLabel} needs attention. Their message: "${userMessage}"`;
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

    // Graceful fallback — client never sees a raw error
    return {
      reply: `I'm just catching up — give me one moment. If it's urgent, reach us at ${config.company.email_info} or reply here and I'll get right back to you.`,
      handover: false,
      notifyMichael: false,
      notifyAshell: false,
      error: true,
      errorMessage: error.message,
      isAdminResponse: false,
    };
  }
}

// ══════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════

module.exports = {
  getResponse,
  detectAdmin,
  isMichael,
  isAshell,
  updateProspect: upsertProspect,
  getProspectByPhone: getProspect,
  getAllProspectData: getAllProspects,
  markProspectStage: (phone, stage) => upsertProspect(phone, { stage }),
  generateWeeklyReport,
  detectAvailabilityResponse,
  normalizePhone,
  formatConversationHistory,
};
