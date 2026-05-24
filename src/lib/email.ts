import "server-only";
import nodemailer from "nodemailer";

interface SendInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Singleton transporter — falls back to a JSON transport (logs to console)
 * when SMTP credentials are not configured. Production should set:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

const DEFAULT_FROM = process.env.EMAIL_FROM ?? "Runco OS <noreply@runcogrowth.com>";

export async function sendEmail({ to, subject, text, html }: SendInput) {
  const t = getTransporter();
  try {
    const result = await t.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      text,
      html: html ?? text,
    });
    if (process.env.NODE_ENV !== "production") {
      // The dev transport stringifies the message into result.message
      // — surface it so the developer can preview the email locally.
      // eslint-disable-next-line no-console
      console.log(`[email] →`, to, subject);
    }
    return { ok: true, result };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[email] Failed to send:", err);
    return { ok: false, error: err };
  }
}

export function welcomeEmail(args: {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
}) {
  const subject = `Welcome to Runco OS, ${args.name.split(" ")[0]}`;
  const text =
    `Hi ${args.name},\n\n` +
    `An admin has created your Runco OS account. Sign in with the credentials below and update your password from the Profile page.\n\n` +
    `Email: ${args.email}\n` +
    `Temporary password: ${args.password}\n\n` +
    `Sign in: ${args.loginUrl}\n\n` +
    `— Runco OS`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; max-width: 520px; margin: 0 auto; color: #0f172a;">
      <div style="padding: 24px 0; border-bottom: 1px solid #e2e8f0;">
        <strong style="font-size: 20px; letter-spacing: -0.04em;">RUNCO</strong>
      </div>
      <h1 style="font-size: 22px; margin: 24px 0 8px;">Welcome to Runco OS, ${args.name.split(" ")[0]}.</h1>
      <p style="line-height: 1.6; color: #334155;">An admin has created your account. Sign in with these credentials and update your password from the Profile page.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin:16px 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;">
        <div><strong style="color:#475569">Email</strong> ${args.email}</div>
        <div><strong style="color:#475569">Password</strong> ${args.password}</div>
      </div>
      <a href="${args.loginUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Sign in</a>
      <p style="margin-top:32px;color:#64748b;font-size:12px;">Runco OS — Operational console</p>
    </div>
  `;

  return { subject, text, html };
}

export function passwordResetEmail(args: { name: string; email: string; password: string; loginUrl: string }) {
  const subject = `Your Runco OS password was reset`;
  const text =
    `Hi ${args.name},\n\n` +
    `An admin reset your Runco OS password.\n\n` +
    `Email: ${args.email}\n` +
    `New password: ${args.password}\n\n` +
    `Sign in: ${args.loginUrl}\n\n` +
    `If this wasn't you or expected, contact your workspace admin.\n\n— Runco OS`;
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; max-width: 520px; margin: 0 auto; color: #0f172a;">
      <div style="padding: 24px 0; border-bottom: 1px solid #e2e8f0;">
        <strong style="font-size: 20px; letter-spacing: -0.04em;">RUNCO</strong>
      </div>
      <h1 style="font-size: 22px; margin: 24px 0 8px;">Your password was reset</h1>
      <p style="line-height: 1.6; color: #334155;">An admin reset your Runco OS password.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin:16px 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;">
        <div><strong style="color:#475569">Email</strong> ${args.email}</div>
        <div><strong style="color:#475569">New password</strong> ${args.password}</div>
      </div>
      <a href="${args.loginUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Sign in</a>
    </div>
  `;
  return { subject, text, html };
}
