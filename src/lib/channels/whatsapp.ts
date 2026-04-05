import { Client, LocalAuth, Message } from "whatsapp-web.js";
import * as qrcode from "qrcode";
import { prisma } from "@/lib/prisma";
import { chat, createNewConversation } from "@/lib/ai/engine";

let whatsappClient: Client | null = null;
let currentQR: string | null = null;
let connectionStatus: "disconnected" | "qr_ready" | "connecting" | "connected" | "error" = "disconnected";
let statusMessage = "";

export function getWhatsAppStatus() {
  return {
    status: connectionStatus,
    qr: currentQR,
    message: statusMessage,
  };
}

export async function initWhatsApp(): Promise<void> {
  if (whatsappClient) {
    console.log("[WhatsApp] Client already exists");
    return;
  }

  connectionStatus = "connecting";
  statusMessage = "Initializing WhatsApp client...";

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    },
  });

  client.on("qr", async (qr: string) => {
    console.log("[WhatsApp] QR code received");
    currentQR = await qrcode.toDataURL(qr);
    connectionStatus = "qr_ready";
    statusMessage = "Scan the QR code with WhatsApp on your phone";
  });

  client.on("ready", async () => {
    console.log("[WhatsApp] Client is ready");
    currentQR = null;
    connectionStatus = "connected";
    statusMessage = "Connected to WhatsApp";

    await prisma.channel.upsert({
      where: { type: "whatsapp" },
      update: { isActive: true, status: "connected" },
      create: { type: "whatsapp", isActive: true, status: "connected" },
    });
  });

  client.on("authenticated", () => {
    console.log("[WhatsApp] Authenticated");
    connectionStatus = "connecting";
    statusMessage = "Authenticated, loading chats...";
  });

  client.on("auth_failure", (message: string) => {
    console.error("[WhatsApp] Auth failure:", message);
    connectionStatus = "error";
    statusMessage = `Authentication failed: ${message}`;
  });

  client.on("disconnected", async (reason: string) => {
    console.log("[WhatsApp] Disconnected:", reason);
    connectionStatus = "disconnected";
    statusMessage = `Disconnected: ${reason}`;
    whatsappClient = null;

    await prisma.channel.upsert({
      where: { type: "whatsapp" },
      update: { isActive: false, status: "disconnected" },
      create: { type: "whatsapp", isActive: false, status: "disconnected" },
    });
  });

  client.on("message", async (message: Message) => {
    if (message.fromMe) return;

    const contact = await message.getContact();
    const customerName = contact.pushname || contact.name || "Unknown";
    const customerContact = message.from;

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        channel: "whatsapp",
        customerContact,
        status: { in: ["active", "escalated"] },
      },
    });

    if (!conversation) {
      conversation = await createNewConversation(
        "whatsapp",
        customerName,
        customerContact
      );
    }

    let messageContent = message.body;

    // Handle media messages
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      if (media) {
        const mediaType = media.mimetype.split("/")[0];
        messageContent = `[${mediaType} attachment: ${media.filename || "media"}] ${message.body || ""}`;

        // If it's an audio message, we could add STT here
        if (mediaType === "audio") {
          messageContent = `[Voice message received] ${message.body || ""}`;
        }
      }
    }

    // Get AI response
    const aiResponse = await chat(conversation.id, messageContent);

    // Send response back via WhatsApp
    await message.reply(aiResponse);
  });

  whatsappClient = client;
  await client.initialize();
}

export async function disconnectWhatsApp(): Promise<void> {
  if (whatsappClient) {
    await whatsappClient.destroy();
    whatsappClient = null;
    currentQR = null;
    connectionStatus = "disconnected";
    statusMessage = "Disconnected";
  }
}

export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<boolean> {
  if (!whatsappClient || connectionStatus !== "connected") {
    return false;
  }

  const chatId = to.includes("@c.us") ? to : `${to}@c.us`;
  await whatsappClient.sendMessage(chatId, message);
  return true;
}
