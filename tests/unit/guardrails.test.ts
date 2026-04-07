import { describe, it, expect } from "vitest";
import {
  analyzeSentiment,
  detectIntent,
  checkBlockedTopics,
  requiresHumanApproval,
  enforceResponseLength,
  estimateConfidence,
} from "@/lib/ai/guardrails";

describe("AI Guardrails", () => {
  describe("analyzeSentiment", () => {
    it("should detect negative sentiment", () => {
      const result = analyzeSentiment("This is terrible, I hate your service!");
      expect(result.sentiment).toBe("negative");
    });

    it("should detect positive sentiment", () => {
      const result = analyzeSentiment("Thank you so much, this is amazing!");
      expect(result.sentiment).toBe("positive");
    });

    it("should detect frustrated sentiment", () => {
      const result = analyzeSentiment("I keep asking about this, how long do I have to wait?");
      expect(["frustrated", "negative"]).toContain(result.sentiment);
      expect(result.score).toBeLessThan(0);
    });

    it("should detect neutral sentiment", () => {
      const result = analyzeSentiment("What are your business hours?");
      expect(result.sentiment).toBe("neutral");
    });
  });

  describe("detectIntent", () => {
    it("should detect support intent", () => {
      const result = detectIntent("My order is not working properly, I need help");
      expect(result.intent).toBe("support");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should detect billing intent", () => {
      const result = detectIntent("I need a refund for my last invoice payment");
      expect(result.intent).toBe("billing");
    });

    it("should detect cancellation intent", () => {
      const result = detectIntent("I want to cancel my subscription immediately");
      expect(result.intent).toBe("cancellation");
    });

    it("should detect sales intent", () => {
      const result = detectIntent("I am interested in buying your product, can I get a demo?");
      expect(result.intent).toBe("sales");
    });
  });

  describe("checkBlockedTopics", () => {
    it("should block legal advice", () => {
      const result = checkBlockedTopics("Can you give me legal advice about this contract?");
      expect(result.blocked).toBe(true);
      expect(result.topic).toBe("legal advice");
    });

    it("should allow normal questions", () => {
      const result = checkBlockedTopics("What are your shipping rates?");
      expect(result.blocked).toBe(false);
    });
  });

  describe("requiresHumanApproval", () => {
    it("should flag refund requests", () => {
      const result = requiresHumanApproval("I want a full refund");
      expect(result.required).toBe(true);
      expect(result.reason).toBe("refund");
    });

    it("should not flag normal questions", () => {
      const result = requiresHumanApproval("What is your return policy?");
      expect(result.required).toBe(false);
    });
  });

  describe("enforceResponseLength", () => {
    it("should truncate long responses", () => {
      const long = "A".repeat(3000);
      const result = enforceResponseLength(long);
      expect(result.length).toBeLessThanOrEqual(2003); // 2000 + "..."
    });

    it("should not modify short responses", () => {
      const result = enforceResponseLength("Short response");
      expect(result).toBe("Short response");
    });
  });

  describe("estimateConfidence", () => {
    it("should return higher confidence with large knowledge base", () => {
      const r1 = estimateConfidence("Here is the answer.", 5, false);
      const r2 = estimateConfidence("Here is the answer.", 50, false);
      expect(r2.score).toBeGreaterThan(r1.score);
    });

    it("should flag for escalation when uncertain", () => {
      const result = estimateConfidence("I'm not sure, I apologize, I cannot help with this.", 2, false);
      expect(result.shouldEscalate).toBe(true);
    });

    it("should not escalate confident responses", () => {
      const result = estimateConfidence("Our return policy allows 30-day returns.", 60, true);
      expect(result.shouldEscalate).toBe(false);
    });
  });
});
