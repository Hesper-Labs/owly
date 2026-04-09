import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) throw new Error("CREDENTIAL_ENCRYPTION_KEY env var is required for credential storage");
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) throw new Error("CREDENTIAL_ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  return buf;
}

/**
 * Encrypt a string with AES-256-GCM.
 * Returns base64-encoded iv:ciphertext:tag.
 */
export function encryptCredential(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

/**
 * Decrypt a string encrypted with encryptCredential.
 */
export function decryptCredential(encoded: string): string {
  const key = getEncryptionKey();
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN, buf.length - TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext, undefined, "utf8") + decipher.final("utf8");
}

/**
 * Mask a sensitive string for safe display.
 * Returns "***" if the value is non-empty, empty string otherwise.
 */
export function maskSecret(value: string | null | undefined): string {
  if (!value || value.trim() === "") return "";
  return "***";
}

/**
 * List of fields in Settings that contain secrets.
 */
export const SECRET_FIELDS = [
  "aiApiKey",
  "smtpPass",
  "imapPass",
  "twilioToken",
  "elevenLabsKey",
  "whatsappApiKey",
] as const;

/**
 * Remove secret values from a settings object for API responses.
 * Returns a new object with secrets replaced by "***".
 */
export function maskSettingsSecrets<T extends Record<string, unknown>>(
  settings: T
): T {
  const masked = { ...settings };
  for (const field of SECRET_FIELDS) {
    if (field in masked) {
      masked[field as keyof T] = maskSecret(
        masked[field as keyof T] as string
      ) as T[keyof T];
    }
  }
  return masked;
}

/**
 * Escape HTML entities to prevent XSS.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Sanitize email subject to prevent CRLF header injection.
 */
export function sanitizeEmailSubject(subject: string): string {
  return subject.replace(/[\r\n]/g, " ").trim();
}

const ZALO_CREDENTIAL_FIELDS = ["imei", "cookie", "userAgent"];

/**
 * Strip Zalo credential fields from channel config for API responses.
 * Works for any channel object shape — checks type and strips if zalo-personal.
 */
export function sanitizeChannelCredentials<T extends Record<string, unknown>>(channel: T): T {
  const type = "type" in channel ? channel.type : undefined;
  if (type !== "zalo-personal") return channel;
  const config = channel.config;
  if (typeof config !== "object" || config === null) return channel;
  const cfg = config as Record<string, unknown>;
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cfg)) {
    if (!ZALO_CREDENTIAL_FIELDS.includes(k)) safe[k] = v;
  }
  return { ...channel, config: safe };
}
