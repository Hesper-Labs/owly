import { describe, it, expect } from "vitest";
import { redactPII, detectPII } from "@/lib/gdpr";

describe("GDPR Module", () => {
  describe("redactPII", () => {
    it("should redact credit card numbers", () => {
      const result = redactPII("My card number is 4111-1111-1111-1111");
      expect(result).toContain("[CARD REDACTED]");
      expect(result).not.toContain("4111");
    });

    it("should redact SSN", () => {
      const result = redactPII("My SSN is 123-45-6789");
      expect(result).toContain("[SSN REDACTED]");
    });

    it("should redact email addresses", () => {
      const result = redactPII("Contact me at john@example.com");
      expect(result).toContain("[EMAIL REDACTED]");
    });

    it("should redact phone numbers", () => {
      const result = redactPII("Call me at +1 555 123 4567");
      expect(result).toContain("[PHONE REDACTED]");
    });

    it("should handle text with no PII", () => {
      const result = redactPII("Hello, how are you?");
      expect(result).toBe("Hello, how are you?");
    });

    it("should redact multiple PII types in one text", () => {
      const text = "Email: test@test.com, Card: 4111 1111 1111 1111";
      const result = redactPII(text);
      expect(result).toContain("[EMAIL REDACTED]");
      expect(result).toContain("[CARD REDACTED]");
    });
  });

  describe("detectPII", () => {
    it("should detect email PII", () => {
      const result = detectPII("Send to user@domain.com");
      expect(result.found).toBe(true);
      expect(result.types).toContain("email");
    });

    it("should detect multiple PII types", () => {
      const result = detectPII("Card 4111-1111-1111-1111 email user@test.com");
      expect(result.types).toContain("credit_card");
      expect(result.types).toContain("email");
    });

    it("should return false for clean text", () => {
      const result = detectPII("Just a normal message");
      expect(result.found).toBe(false);
    });
  });
});
