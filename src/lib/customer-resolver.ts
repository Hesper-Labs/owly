import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Normalize a phone number for consistent matching.
 * Strips WhatsApp suffixes (@c.us, @s.whatsapp.net) and non-digit chars (except leading +).
 */
export function normalizePhone(input: string): string {
  const cleaned = input.replace(/@(c\.us|s\.whatsapp\.net)$/, "");
  return cleaned.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

/**
 * Resolve a customer identity across channels.
 * Finds or creates a Customer record based on contact info.
 * Returns the customerId for linking to conversations.
 */
export async function resolveCustomer(
  channel: string,
  customerContact: string,
  customerName: string
): Promise<string> {
  if (!customerContact) {
    return createCustomer(customerName, channel, customerContact);
  }

  // Step 1: Direct field match by channel
  const directMatch = await findByChannelField(channel, customerContact);
  if (directMatch) {
    await updateExistingCustomer(directMatch.id, channel, customerContact, customerName);
    return directMatch.id;
  }

  // Step 2: Normalized phone match (for phone/whatsapp channels)
  if (channel === "phone" || channel === "whatsapp") {
    const normalized = normalizePhone(customerContact);
    if (normalized.length >= 7) {
      const phoneMatch = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: { contains: normalized } },
            { whatsapp: { contains: normalized } },
          ],
        },
      });
      if (phoneMatch) {
        await updateExistingCustomer(phoneMatch.id, channel, customerContact, customerName);
        return phoneMatch.id;
      }
    }
  }

  // Step 3: Cross-field fallback (search all contact fields)
  const crossMatch = await prisma.customer.findFirst({
    where: {
      OR: [
        { email: { equals: customerContact, mode: "insensitive" } },
        { phone: customerContact },
        { whatsapp: customerContact },
        { zalo: customerContact },
      ],
    },
  });
  if (crossMatch) {
    await updateExistingCustomer(crossMatch.id, channel, customerContact, customerName);
    return crossMatch.id;
  }

  // Step 4: Auto-create new customer
  return createCustomer(customerName, channel, customerContact);
}

async function findByChannelField(channel: string, contact: string) {
  switch (channel) {
    case "email":
      return prisma.customer.findFirst({
        where: { email: { equals: contact, mode: "insensitive" } },
      });
    case "whatsapp":
      return prisma.customer.findFirst({
        where: { whatsapp: contact },
      });
    case "zalo-personal":
      return prisma.customer.findFirst({
        where: { zalo: contact },
      });
    case "phone":
      return prisma.customer.findFirst({
        where: { phone: contact },
      });
    default:
      return null;
  }
}

async function createCustomer(
  name: string,
  channel: string,
  contact: string
): Promise<string> {
  const customer = await prisma.customer.create({
    data: {
      name: name || "Unknown",
      firstContact: new Date(),
      lastContact: new Date(),
      ...(channel === "email" ? { email: contact } : {}),
      ...(channel === "whatsapp" ? { whatsapp: contact } : {}),
      ...(channel === "zalo-personal" ? { zalo: contact } : {}),
      ...(channel === "phone" ? { phone: contact } : {}),
    },
  });

  logger.info("Auto-created customer from channel contact", {
    customerId: customer.id,
    channel,
  });

  return customer.id;
}

async function updateExistingCustomer(
  customerId: string,
  channel: string,
  contact: string,
  name: string
): Promise<void> {
  const update: Record<string, unknown> = {
    lastContact: new Date(),
  };

  // Backfill empty channel fields
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { name: true, email: true, phone: true, whatsapp: true, zalo: true },
  });

  if (!customer) return;

  if (channel === "email" && !customer.email) update.email = contact;
  if (channel === "whatsapp" && !customer.whatsapp) update.whatsapp = contact;
  if (channel === "zalo-personal" && !customer.zalo) update.zalo = contact;
  if (channel === "phone" && !customer.phone) update.phone = contact;

  // Update name if current is "Unknown" and we have a better one
  if (customer.name === "Unknown" && name && name !== "Unknown") {
    update.name = name;
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: update,
  });
}
