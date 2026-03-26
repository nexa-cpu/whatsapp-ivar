const nodemailer = require('nodemailer');
const client = require('../config/client');

/**
 * Creates a nodemailer transport using Gmail SMTP.
 * Uses app password — NOT your regular Gmail password.
 * Generate one at: myaccount.google.com/apppasswords
 */
function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Sends a handover alert email to the business owner.
 * Includes customer number, reason, and last few messages.
 */
async function sendHandoverEmail({ customerNumber, reason, conversationHistory }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log('⚠️  Email not configured — skipping email alert');
    return;
  }

  try {
    const transporter = createTransport();

    // Format conversation history for email
    const historyText = conversationHistory.slice(-6).map(msg =>
      `Customer: ${msg.userMessage}\nIVAR: ${msg.aiResponse}`
    ).join('\n\n---\n\n');

    const emailBody = `
IVAR HANDOVER ALERT — ${client.business.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A customer needs a human response. Please follow up immediately.

CUSTOMER NUMBER: +${customerNumber}
REASON: ${reason}
TIME: ${new Date().toLocaleString('en-ZW', { timeZone: 'Africa/Harare' })}

━━━ RECENT CONVERSATION ━━━
${historyText || 'No history available.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sent by IVAR — Galvaniq
    `.trim();

    const mailOptions = {
      from: `"IVAR — ${client.business.name}" <${process.env.EMAIL_USER}>`,
      to: client.owner.email,
      cc: client.owner.backupEmail || '',
      subject: `🔔 IVAR Handover — Customer +${customerNumber} needs you`,
      text: emailBody,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Handover email sent to ${client.owner.email}`);

  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    // Don't throw — email failure should not break the handover flow
  }
}

module.exports = { sendHandoverEmail };
