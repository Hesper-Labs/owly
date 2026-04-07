import en from "./locales/en";
import tr from "./locales/tr";
import de from "./locales/de";
import es from "./locales/es";
import ar from "./locales/ar";
import fr from "./locales/fr";

export const SUPPORTED_LOCALES = ["en", "tr", "de", "es", "ar", "fr"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const RTL_LOCALES: Locale[] = ["ar"];

const translations: Record<Locale, Record<string, string>> = {
  en,
  tr,
  de,
  es,
  ar,
  fr,
};

/**
 * Get a translated string by key.
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return translations[locale]?.[key] || translations[DEFAULT_LOCALE]?.[key] || key;
}

/**
 * Get a translated string with variable interpolation.
 * Usage: tf("welcome_user", "en", { name: "John" }) -> "Welcome, John!"
 */
export function tf(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  vars: Record<string, string | number> = {}
): string {
  let text = t(key, locale);
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return text;
}

/**
 * Check if a locale uses RTL direction.
 */
export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}
