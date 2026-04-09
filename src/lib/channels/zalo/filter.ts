import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { cacheGet, cacheSet } from "@/lib/cache";
import { asRecord } from "./helpers";

// ---------------------------------------------------------------------------
// Allowlist / denylist filter
// ---------------------------------------------------------------------------

export async function isAllowedByFilter(senderId: string, threadId: string): Promise<boolean> {
  try {
    const cached = await cacheGet("zalo:filter:config");
    let filterMode: string;
    let filterList: string[];

    if (cached) {
      const parsed = JSON.parse(cached);
      filterMode = parsed.filterMode;
      filterList = parsed.filterList;
    } else {
      const channel = await prisma.channel.findUnique({ where: { type: "zalo-personal" }, select: { config: true } });
      const cfg = asRecord(channel?.config);
      filterMode = typeof cfg.filterMode === "string" ? cfg.filterMode : "disabled";
      filterList = Array.isArray(cfg.filterList) ? (cfg.filterList as string[]) : [];
      await cacheSet("zalo:filter:config", JSON.stringify({ filterMode, filterList }), 30);
    }

    if (filterMode === "disabled") return true;
    if (filterList.length === 0) return filterMode === "denylist";

    const match = filterList.some((id) => id === senderId || id === threadId);
    return filterMode === "allowlist" ? match : !match;
  } catch (err) {
    logger.warn("[Zalo] Filter check failed, allowing message", { error: String(err) });
    return true; // fail-open
  }
}

// ---------------------------------------------------------------------------
// Thread metadata and auto-tagging
// ---------------------------------------------------------------------------

export async function updateThreadMetadata(
  conversationId: string,
  threadLabel: "group" | "user",
  threadId: string,
  threadName: string,
): Promise<void> {
  try {
    const existing = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { metadata: true } });
    const meta = asRecord(existing?.metadata);
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        metadata: { ...meta, zaloThreadType: threadLabel, zaloThreadId: threadId, zaloThreadName: threadName },
      },
    });

    const tagName = threadLabel === "group" ? "Zalo Group" : "Zalo User";
    const tagColor = threadLabel === "group" ? "#6366F1" : "#0068FF";
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName, color: tagColor },
    });

    await prisma.conversationTag.upsert({
      where: { conversationId_tagId: { conversationId, tagId: tag.id } },
      update: {},
      create: { conversationId, tagId: tag.id },
    });
  } catch (err) {
    logger.warn("[Zalo] Failed to update thread metadata/tag", { conversationId, error: String(err) });
  }
}
