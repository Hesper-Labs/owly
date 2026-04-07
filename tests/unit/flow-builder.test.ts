import { describe, it, expect } from "vitest";
import { executeFlowNode, validateFlow, type Flow } from "@/lib/flow-builder";

describe("Flow Builder", () => {
  const testFlow: Flow = {
    id: "flow-1",
    name: "Test Flow",
    description: "A test flow",
    isActive: true,
    startNodeId: "start",
    nodes: [
      { id: "start", type: "message", content: "Welcome!", nextNodeId: "ask" },
      {
        id: "ask",
        type: "question",
        content: "How can I help?",
        options: [
          { label: "billing", nextNodeId: "billing" },
          { label: "support", nextNodeId: "support" },
        ],
      },
      { id: "billing", type: "message", content: "Let me check your account.", nextNodeId: "end" },
      { id: "support", type: "transfer", content: "Technical Support" },
      { id: "end", type: "end", content: "Thank you!" },
    ],
  };

  describe("executeFlowNode", () => {
    it("should execute a message node", () => {
      const result = executeFlowNode(testFlow, "start", {
        conversationId: "c1",
        customerMessage: "",
        channel: "widget",
        customerName: "John",
        variables: {},
      });

      expect(result.responses).toEqual(["Welcome!"]);
      expect(result.nextNodeId).toBe("ask");
    });

    it("should execute a question node and match option", () => {
      const result = executeFlowNode(testFlow, "ask", {
        conversationId: "c1",
        customerMessage: "I have a billing question",
        channel: "widget",
        customerName: "John",
        variables: {},
      });

      expect(result.responses).toEqual(["How can I help?"]);
      expect(result.nextNodeId).toBe("billing");
    });

    it("should execute a transfer node", () => {
      const result = executeFlowNode(testFlow, "support", {
        conversationId: "c1",
        customerMessage: "",
        channel: "widget",
        customerName: "John",
        variables: {},
      });

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].type).toBe("transfer");
      expect(result.nextNodeId).toBeNull();
    });

    it("should execute an end node", () => {
      const result = executeFlowNode(testFlow, "end", {
        conversationId: "c1",
        customerMessage: "",
        channel: "widget",
        customerName: "John",
        variables: {},
      });

      expect(result.responses).toEqual(["Thank you!"]);
      expect(result.nextNodeId).toBeNull();
    });

    it("should handle non-existent node", () => {
      const result = executeFlowNode(testFlow, "nonexistent", {
        conversationId: "c1",
        customerMessage: "",
        channel: "widget",
        customerName: "John",
        variables: {},
      });

      expect(result.responses).toEqual([]);
      expect(result.nextNodeId).toBeNull();
    });
  });

  describe("validateFlow", () => {
    it("should validate a correct flow", () => {
      const result = validateFlow(testFlow);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing start node", () => {
      const result = validateFlow({ ...testFlow, startNodeId: "" });
      expect(result.valid).toBe(false);
    });

    it("should detect invalid next node references", () => {
      const broken: Flow = {
        ...testFlow,
        nodes: [
          { id: "start", type: "message", content: "Hi", nextNodeId: "doesnt_exist" },
        ],
      };
      const result = validateFlow(broken);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("doesnt_exist");
    });
  });
});
