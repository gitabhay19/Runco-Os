import * as fs from "fs";
import * as path from "path";
import nodemailer from "nodemailer";

// Manually parse .env (no dotenv dependency)
const envPath = path.join(process.cwd(), ".env");
const envText = fs.readFileSync(envPath, "utf-8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) {
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

async function main() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 0;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM ?? "noreply@runcogrowth.com";

  console.log("SMTP config:");
  console.log("  host:", host);
  console.log("  port:", port);
  console.log("  user:", user);
  console.log("  pass:", pass ? `${pass.slice(0, 7)}...` : "(missing)");
  console.log("  from:", from);
  console.log("");

  if (!host || !port || !user || !pass) {
    console.error("Missing SMTP env vars!");
    process.exit(1);
  }

  const to = process.argv[2];
  if (!to) {
    console.error("Usage: npx tsx prisma/test-email.ts <recipient@example.com>");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  console.log(`Sending test email to ${to}…`);
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: "Runco OS test email",
      text: "This is a test email from Runco OS. If you got this, SMTP is working.",
      html: "<p>This is a test email from <strong>Runco OS</strong>. If you got this, SMTP is working.</p>",
    });
    console.log("✓ Sent successfully");
    console.log("  messageId:", info.messageId);
    console.log("  response:", info.response);
  } catch (err) {
    console.error("✗ Failed to send:");
    console.error(err);
    process.exit(1);
  }
}

main();
