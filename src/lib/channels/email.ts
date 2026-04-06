import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { chat, createNewConversation } from "@/lib/ai/engine";
import { escapeHtml, sanitizeEmailSubject } from "@/lib/security";
import { logger } from "@/lib/logger";
import { resolveCustomer } from "@/lib/customer-resolver";

interface EmailConfig {
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPass: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
}

let imapConnection: Imap | null = null;
let isListening = false;

async function getEmailConfig(): Promise<EmailConfig | null> {
  const settings = await prisma.settings.findFirst();
  if (!settings?.imapHost || !settings?.smtpHost) return null;

  return {
    imapHost: settings.imapHost,
    imapPort: settings.imapPort,
    imapUser: settings.imapUser,
    imapPass: settings.imapPass,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPass: settings.smtpPass,
    smtpFrom: settings.smtpFrom || settings.smtpUser,
  };
}

function createImapConnection(config: EmailConfig): Imap {
  return new Imap({
    user: config.imapUser,
    password: config.imapPass,
    host: config.imapHost,
    port: config.imapPort,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });
}

function getSmtpTransporter(config: EmailConfig) {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
}

async function processEmail(parsed: ParsedMail, config: EmailConfig) {
  const fromAddress = parsed.from?.value?.[0]?.address;
  const fromName =
    parsed.from?.value?.[0]?.name || fromAddress || "Unknown";
  const subject = parsed.subject || "No Subject";
  const textBody = parsed.text || "";

  if (!fromAddress) return;

  // Resolve customer identity across channels
  const customerId = await resolveCustomer("email", fromAddress, fromName);

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      channel: "email",
      status: { in: ["active", "escalated"] },
      OR: [
        { customerId },
        { customerContact: fromAddress },
      ],
    },
  });

  if (!conversation) {
    conversation = await createNewConversation(
      "email",
      fromName,
      fromAddress,
      customerId
    );
  }

  // Get AI response
  const messageContent = `Subject: ${subject}\n\n${textBody}`;
  const aiResponse = await chat(conversation.id, messageContent);

  // Send reply with branding
  const branding = await getEmailBranding();
  const transporter = getSmtpTransporter(config);
  await transporter.sendMail({
    from: config.smtpFrom,
    to: fromAddress,
    subject: sanitizeEmailSubject(`Re: ${subject}`),
    text: aiResponse,
    html: buildEmailHtml(aiResponse, branding),
    inReplyTo: parsed.messageId,
    references: parsed.messageId,
  });
}

interface EmailBranding {
  businessName: string;
  primaryColor?: string;
}

async function getEmailBranding(): Promise<EmailBranding> {
  const settings = await prisma.settings.findFirst({
    select: { businessName: true },
  });
  return {
    businessName: settings?.businessName || "Support",
  };
}

function buildEmailHtml(text: string, branding?: EmailBranding): string {
  const name = branding?.businessName || "Support";
  const color = branding?.primaryColor || "#0F172A";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background-color:${escapeHtml(color)};padding:20px 24px;">
          <h1 style="margin:0;font-size:18px;font-weight:600;color:#FFFFFF;">${escapeHtml(name)}</h1>
        </td></tr>
        <tr><td style="padding:24px;">
          ${text
            .split("\n")
            .map((line) => `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(line)}</p>`)
            .join("")}
        </td></tr>
        <tr><td style="border-top:1px solid #E2E8F0;padding:16px 24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94A3B8;">${escapeHtml(name)} &middot; Powered by Owly</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function startEmailListener() {
  if (isListening) return;

  const config = await getEmailConfig();
  if (!config) {
    logger.info("[Email] Not configured, skipping listener start");
    return;
  }

  const imap = createImapConnection(config);

  imap.once("ready", () => {
    logger.info("[Email] IMAP connected");
    isListening = true;

    imap.openBox("INBOX", false, (err) => {
      if (err) {
        logger.error("[Email] Error opening inbox:", err);
        return;
      }

      imap.on("mail", () => {
        imap.search(["UNSEEN"], (err, results) => {
          if (err || !results.length) return;

          const fetch = imap.fetch(results, { bodies: "" });
          fetch.on("message", (msg) => {
            msg.on("body", (stream) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              simpleParser(stream as any, (err: Error | null, parsed: ParsedMail) => {
                if (err) {
                  logger.error("[Email] Parse error:", err);
                  return;
                }
                processEmail(parsed, config);
              });
            });
          });
        });
      });
    });
  });

  imap.once("error", (err: Error) => {
    logger.error("[Email] IMAP error:", err);
    isListening = false;
  });

  imap.once("end", () => {
    logger.info("[Email] IMAP disconnected");
    isListening = false;
  });

  imapConnection = imap;
  imap.connect();
}

export async function stopEmailListener() {
  if (imapConnection) {
    imapConnection.end();
    imapConnection = null;
    isListening = false;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  const config = await getEmailConfig();
  if (!config) return false;

  const branding = await getEmailBranding();
  const transporter = getSmtpTransporter(config);
  await transporter.sendMail({
    from: config.smtpFrom,
    to,
    subject,
    text: body,
    html: buildEmailHtml(body, branding),
  });

  return true;
}

export function getEmailStatus() {
  return {
    connected: isListening,
    status: isListening ? "connected" : "disconnected",
  };
}
