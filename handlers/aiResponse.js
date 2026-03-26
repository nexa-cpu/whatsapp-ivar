const OpenAI = require('openai');
const client = require('../config/client');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Builds a rich, client-specific system prompt from config.
 * This is what makes IVAR actually know the business it works for.
 */
function buildSystemPrompt() {
  const { business, offerings, faqs, tone, qualification, negotiation, handoverTriggers } = client;

  // Format offerings into readable text
  const offeringsList = offerings.map(o =>
    `• ${o.name} — ${o.description} | Price: ${o.price} | ${o.availability}`
  ).join('\n');

  // Format FAQs
  const faqList = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

  // Format qualification questions
  const qualQuestions = qualification.questions.map((q, i) => `${i + 1}. ${q}`).join('\n');

  return `
You are ${tone.name}, the AI receptionist and sales agent for ${business.name}.

━━━ BUSINESS CONTEXT ━━━
Business: ${business.name}
Industry: ${business.industry}
Location: ${business.location}
Description: ${business.description}
Website: ${business.website}
Working Hours: ${business.workingHours}
Currency: ${business.currency}

━━━ WHAT WE OFFER ━━━
${offeringsList}

━━━ FREQUENTLY ASKED QUESTIONS ━━━
${faqList}

━━━ YOUR ROLE & BEHAVIOUR ━━━
Tone: ${tone.style}
Keep responses ${tone.responseLength === 'concise' ? 'short and clear — under 120 words unless a detailed question requires more' : 'detailed and thorough'}.
${tone.useEmojis ? 'You may use emojis sparingly to keep the tone warm.' : 'Do not use emojis.'}
Format for WhatsApp — no markdown, no asterisks for bold, no bullet point symbols (use plain dashes if needed).
Always address the customer respectfully. Never be pushy or desperate.

━━━ LEAD QUALIFICATION ━━━
Your job is to qualify every lead before handing them over. Naturally work these questions into the conversation:
${qualQuestions}
Do not ask all questions at once. Ask one at a time, naturally in the flow of conversation.

━━━ NEGOTIATION RULES ━━━
${negotiation.canOffer}
${negotiation.cannotOffer}
Never make up prices or availability. If you are unsure, say "Let me have our team confirm that for you."

━━━ HANDOVER PROTOCOL ━━━
You MUST trigger a handover when:
1. The customer is clearly ready to pay, book, or commit.
2. The customer uses any of these phrases or close variations: ${handoverTriggers.join(', ')}.
3. The customer has asked the same question 3 times and is not satisfied with your answer.
4. The customer is angry, upset, or making a formal complaint.
5. You genuinely cannot answer what they are asking.

When triggering a handover, end your response with this EXACT tag on a new line:
[HANDOVER: reason_in_one_sentence]

Example:
"I'll connect you with our team right away.
[HANDOVER: Customer is ready to confirm a booking for 3 nights]"

Do not include the HANDOVER tag unless a real handover is needed. Only use it once per handover event.

━━━ WHAT YOU CANNOT DO ━━━
- Cannot confirm bookings (take the request, then hand over)
- Cannot confirm custom pricing or discounts
- Cannot process payments
- Cannot make promises the business has not authorised
- Cannot share the owner's personal phone number or email

When in doubt, qualify more, then hand over.
`.trim();
}

/**
 * Main function — generates IVAR's response.
 * Returns { reply, handover, handoverReason }
 */
async function getResponse(userMessage, conversationHistory = []) {
  try {
    const systemPrompt = buildSystemPrompt();

    // Build the messages array
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add last 8 exchanges for context (keeps conversation coherent)
    const recentHistory = conversationHistory.slice(-8);
    recentHistory.forEach(msg => {
      messages.push({ role: 'user', content: msg.userMessage });
      messages.push({ role: 'assistant', content: msg.aiResponse });
    });

    messages.push({ role: 'user', content: userMessage });

    console.log(`🤖 Querying OpenAI — ${messages.length} messages in context`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 350,
      temperature: 0.65,   // Slightly lower = more consistent, professional
    });

    let rawReply = completion.choices[0].message.content.trim();

    console.log(`✅ OpenAI response (${completion.usage.total_tokens} tokens)`);

    // ─── DETECT HANDOVER SIGNAL ───────────────────────────────────────
    const handoverMatch = rawReply.match(/\[HANDOVER:\s*(.+?)\]/i);
    let handover = false;
    let handoverReason = null;

    if (handoverMatch) {
      handover = true;
      handoverReason = handoverMatch[1].trim();
      // Strip the tag from the message the customer sees
      rawReply = rawReply.replace(/\[HANDOVER:\s*.+?\]/i, '').trim();
    }

    return {
      reply: rawReply,
      handover,
      handoverReason,
    };

  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);
    return {
      reply: "I'm having a brief technical issue. Please try again in a moment, or contact us directly — we're here to help.",
      handover: false,
      handoverReason: null,
    };
  }
}

module.exports = { getResponse };
