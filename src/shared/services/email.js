const nodemailer = require("nodemailer");

let transporter;
let resendClient;

// ─── Resend SDK (preferred) ─────────────────────────────────────
function getResendClient() {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const { Resend } = require("resend");
  resendClient = new Resend(apiKey);
  return resendClient;
}

// ─── Nodemailer SMTP (fallback) ─────────────────────────────────
function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

const from = process.env.EMAIL_FROM || "FitTracker <noreply@fittracker.app>";

async function sendEmail({ to, subject, text, html }) {
  // Try Resend first
  const resend = getResendClient();
  if (resend) {
    const { data, error } = await resend.emails.send({ from, to, subject, text, html });
    if (error) {
      console.error("[email-resend-error]", error);
      throw new Error(`Email delivery failed: ${error.message || "Unknown error"}`);
    }
    return data;
  }

  // Fall back to SMTP
  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV !== "test") {
      console.log(`[email-skipped] No email configured. Would send "${subject}" to ${to}`);
    }
    return null;
  }

  const info = await transport.sendMail({ from, to, subject, text, html });
  return info;
}

// ─── Template helpers ──────────────────────────────────────────

function otpEmail(email, code) {
  return sendEmail({
    to: email,
    subject: `Your FitTracker verification code: ${code}`,
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #111; border-radius: 16px;">
        <h2 style="color: #fff; margin: 0 0 8px;">Verification Code</h2>
        <p style="color: #888; margin: 0 0 24px; font-size: 14px;">Enter this code to verify your email</p>
        <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="color: #fff; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #666; font-size: 12px; margin: 0;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

function sessionApprovedEmail(clientEmail, session) {
  return sendEmail({
    to: clientEmail,
    subject: `Session Approved: ${session.title}`,
    text: `Your session "${session.title}" scheduled for ${session.scheduled_start} has been approved by your trainer.`,
    html: `
      <h2>Session Approved</h2>
      <p>Your session <strong>${session.title}</strong> has been approved.</p>
      <p><strong>When:</strong> ${session.scheduled_start}</p>
      ${session.location ? `<p><strong>Where:</strong> ${session.location}</p>` : ""}
      <p>See you there!</p>
    `,
  });
}

function sessionDeclinedEmail(clientEmail, session) {
  return sendEmail({
    to: clientEmail,
    subject: `Session Declined: ${session.title}`,
    text: `Your session "${session.title}" was declined.${session.decline_reason ? " Reason: " + session.decline_reason : ""}`,
    html: `
      <h2>Session Declined</h2>
      <p>Your session <strong>${session.title}</strong> was declined.</p>
      ${session.decline_reason ? `<p><strong>Reason:</strong> ${session.decline_reason}</p>` : ""}
      <p>Please reach out to your trainer to reschedule.</p>
    `,
  });
}

function sessionRequestEmail(trainerEmail, session, clientName) {
  return sendEmail({
    to: trainerEmail,
    subject: `New Session Request: ${session.title}`,
    text: `${clientName} has requested a session: "${session.title}" at ${session.scheduled_start}`,
    html: `
      <h2>New Session Request</h2>
      <p><strong>${clientName}</strong> has requested a session.</p>
      <p><strong>Title:</strong> ${session.title}</p>
      <p><strong>When:</strong> ${session.scheduled_start}</p>
      <p>Please log in to approve or decline this request.</p>
    `,
  });
}

function sessionReminderEmail(email, session) {
  return sendEmail({
    to: email,
    subject: `Reminder: ${session.title} tomorrow`,
    text: `Reminder: You have a session "${session.title}" scheduled for ${session.scheduled_start}.`,
    html: `
      <h2>Session Reminder</h2>
      <p>You have a session coming up tomorrow.</p>
      <p><strong>Title:</strong> ${session.title}</p>
      <p><strong>When:</strong> ${session.scheduled_start}</p>
      ${session.location ? `<p><strong>Where:</strong> ${session.location}</p>` : ""}
    `,
  });
}

module.exports = {
  sendEmail,
  otpEmail,
  sessionApprovedEmail,
  sessionDeclinedEmail,
  sessionRequestEmail,
  sessionReminderEmail,
};
