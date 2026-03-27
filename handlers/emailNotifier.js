const { Resend } = require('resend');
const client = require('../config/client');

/**
 * Sends a handover alert email via Resend API.
 * Uses HTTPS (port 443) — works on Railway, no SMTP blocks.
 * Free tier: 3,000 emails/month.
 */
async function sendHandoverEmail({ customerNumber, reason, conversationHistory }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️  RESEND_API_KEY not set — skipping email alert');
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const historyText = conversationHistory.slice(-6).map(msg =>
      `Customer: ${msg.userMessage}\nIVAR: ${msg.aiResponse}`
    ).join('\n\n---\n\n');

    const emailBody = `
IVAR HANDOVER ALERT — ${client.business.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A customer needs a human response. Please follow up immediately.

CUSTOMER NUMBER: +${customerNumber}
REASON: ${reason}
TIME: ${new Date().toLocaleString('en-ZW', { timeZone: 'Africa/Harare' })}

━━━ RECENT CONVERSATION ━━━
${historyText || 'No history available.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sent by IVAR — Galvaniq Group
    `.trim();

    await resend.emails.send({
      from: 'IVAR <onboarding@resend.dev>',
      to: client.owner.email,
      subject: `IVAR Handover — Customer +${customerNumber} needs you`,
      text: emailBody,
    });

    console.log(`📧 Handover email sent to ${client.owner.email}`);

  } catch (error) {
    console.error('❌ Email send failed:', error.message);
  }
}

module.exports = { sendHandoverEmail };
