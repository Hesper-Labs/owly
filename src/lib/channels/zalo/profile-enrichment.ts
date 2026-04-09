import type { API } from "zca-js";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { normalizePhone } from "@/lib/customer-resolver";
import { cacheGet, cacheSet } from "@/lib/cache";
import { asRecord } from "./helpers";

// ---------------------------------------------------------------------------
// Enrich customer with full Zalo profile
// ---------------------------------------------------------------------------

export async function enrichCustomerFromZalo(api: API, customerId: string, zaloUserId: string): Promise<void> {
  const cacheKey = `zalo:enrich:${customerId}`;
  if (await cacheGet(cacheKey)) return;

  const res = await api.getUserInfo(zaloUserId);
  const profiles = res?.changed_profiles ?? res;
  const profile = profiles?.[zaloUserId] || profiles?.[`${zaloUserId}_0`];
  if (!profile) {
    logger.warn("[Zalo] No profile data returned from getUserInfo", { zaloUserId, responseKeys: Object.keys(profiles ?? {}) });
    return;
  }

  logger.debug("[Zalo] Raw profile from getUserInfo", { zaloUserId, profile });

  const profileRec = asRecord(profile);
  const displayName = profileRec.displayName || profileRec.zaloName || profileRec.name;
  const avatar = profileRec.avatar;
  const rawPhone = profileRec.phoneNumber;
  const gender = profileRec.gender;
  const dob = profileRec.dob;
  const status = profileRec.status;
  const zaloName = profileRec.zaloName;

  const phoneStr = rawPhone != null ? String(rawPhone) : "";
  const validPhone = phoneStr.replace(/\D/g, "").length >= 7 ? normalizePhone(phoneStr) : "";

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { name: true, phone: true, metadata: true },
  });
  if (!customer) return;

  const existingMeta = asRecord(customer.metadata);

  const zaloProfile: Record<string, unknown> = {};
  if (displayName) zaloProfile.zaloDisplayName = String(displayName);
  if (zaloName) zaloProfile.zaloName = String(zaloName);
  if (avatar) zaloProfile.zaloAvatar = String(avatar);
  if (validPhone) zaloProfile.zaloPhone = validPhone;
  if (gender !== undefined && gender !== null) zaloProfile.zaloGender = Number(gender);
  if (dob !== undefined && dob !== null) zaloProfile.zaloDob = String(dob);
  if (status) zaloProfile.zaloStatus = String(status);

  const update: Record<string, unknown> = {
    metadata: { ...existingMeta, ...zaloProfile },
  };

  if (!customer.phone && validPhone) {
    update.phone = validPhone;
    logger.info("[Zalo] Backfilled customer phone from Zalo profile", { customerId, phone: validPhone });
  }

  if (customer.name === "Unknown" && displayName) {
    update.name = String(displayName);
  }

  await prisma.customer.update({ where: { id: customerId }, data: update });

  if (Object.keys(zaloProfile).length > 0) {
    await cacheSet(cacheKey, "1", 3600);
  }
  logger.debug("[Zalo] Enriched customer profile", { customerId, fields: Object.keys(zaloProfile) });
}

// ---------------------------------------------------------------------------
// Name resolution with cache
// ---------------------------------------------------------------------------

export async function resolveUserName(api: API, userId: string): Promise<string> {
  const cached = await cacheGet(`zalo:user:${userId}`);
  if (cached) return cached;

  try {
    const res = await api.getUserInfo(userId);
    const profiles = res?.changed_profiles ?? res;
    const profile = profiles?.[userId] || profiles?.[`${userId}_0`];
    const profileRec = asRecord(profile);
    const raw = profileRec.displayName || profileRec.zaloName || profileRec.name;
    const name = typeof raw === "string" && raw ? raw : userId;
    await cacheSet(`zalo:user:${userId}`, name, 300);
    return name;
  } catch (err) {
    logger.warn("[Zalo] Failed to resolve user name", { userId, error: String(err) });
    return userId;
  }
}

export async function resolveGroupName(api: API, groupId: string): Promise<string> {
  const cached = await cacheGet(`zalo:group:${groupId}`);
  if (cached) return cached;

  try {
    const res = await api.getGroupInfo(groupId);
    const info = res?.gridInfoMap?.[groupId];
    const name = info?.name || "Unknown Group";
    await cacheSet(`zalo:group:${groupId}`, name, 300);
    return name;
  } catch (err) {
    logger.warn("[Zalo] Failed to resolve group name", { groupId, error: String(err) });
    return "Unknown Group";
  }
}
