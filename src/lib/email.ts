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
  const subject = `Welcome to Runco OS — your account is ready`;
  const text =
    `Hi ${args.name},\n\n` +
    `Your Runco OS account has been created by your workspace admin.\n\n` +
    `Sign in with the credentials below. We recommend updating your password from the Profile page after your first login.\n\n` +
    `Email: ${args.email}\n` +
    `Password: ${args.password}\n\n` +
    `Sign in here: ${args.loginUrl}\n\n` +
    `If you were not expecting this email, please ignore it or contact ${args.loginUrl.replace("/login", "")} for help.\n\n` +
    `— The RunCoGrowth Team\n\n` +
    `RunCoGrowth | os.runcogrowth.com\n` +
    `This is a transactional email sent because an admin created your account.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Runco OS</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:18px;font-weight:800;letter-spacing:-0.04em;color:#0f172a;">RUNCO</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">OS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">
                Welcome to Runco OS, ${args.name.split(" ")[0]}.
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                Your workspace account has been created. Use the credentials below to sign in, then update your password from the Profile page.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;">Email</span><br/>
                    <span style="font-size:14px;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${args.email}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;">
                    <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;">Temporary password</span><br/>
                    <span style="font-size:14px;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${args.password}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#0f172a;">
                    <a href="${args.loginUrl}" style="display:inline-block;padding:11px 20px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Sign in to Runco OS →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
                If you were not expecting this email, you can safely ignore it. No action is required.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
                <strong style="color:#64748b;">RunCoGrowth</strong> · os.runcogrowth.com
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                This is a transactional email. You received it because an admin created your account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

export function passwordResetEmail(args: { name: string; email: string; password: string; loginUrl: string }) {
  const subject = `Your Runco OS password has been reset`;
  const text =
    `Hi ${args.name},\n\n` +
    `An admin has reset your Runco OS password.\n\n` +
    `Email: ${args.email}\n` +
    `New password: ${args.password}\n\n` +
    `Sign in here: ${args.loginUrl}\n\n` +
    `If you did not expect this change, contact your workspace admin immediately.\n\n` +
    `— The RunCoGrowth Team\n\n` +
    `RunCoGrowth | os.runcogrowth.com\n` +
    `This is a transactional security email.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:18px;font-weight:800;letter-spacing:-0.04em;color:#0f172a;">RUNCO</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">OS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">
                Your password was reset
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                An admin reset your Runco OS password. Use the credentials below to sign in.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;">Email</span><br/>
                    <span style="font-size:14px;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${args.email}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;">
                    <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;">New password</span><br/>
                    <span style="font-size:14px;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${args.password}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#0f172a;">
                    <a href="${args.loginUrl}" style="display:inline-block;padding:11px 20px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Sign in to Runco OS →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
                If you did not expect this change, contact your workspace admin immediately at <a href="mailto:abhay@runcogrowth.com" style="color:#64748b;">abhay@runcogrowth.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
                <strong style="color:#64748b;">RunCoGrowth</strong> · os.runcogrowth.com
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                This is a transactional security email sent because your password was changed.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
