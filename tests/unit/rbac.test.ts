import { describe, it, expect } from "vitest";
import { hasPermission, hasMinRole, getPermissionsForRole } from "@/lib/rbac";

describe("RBAC System", () => {
  describe("hasPermission", () => {
    it("admin should have all permissions", () => {
      expect(hasPermission("admin", "settings:read")).toBe(true);
      expect(hasPermission("admin", "settings:update")).toBe(true);
      expect(hasPermission("admin", "admin:delete")).toBe(true);
      expect(hasPermission("admin", "conversations:read")).toBe(true);
    });

    it("viewer should only have read permissions", () => {
      expect(hasPermission("viewer", "conversations:read")).toBe(true);
      expect(hasPermission("viewer", "conversations:create")).toBe(false);
      expect(hasPermission("viewer", "settings:read")).toBe(false);
    });

    it("agent should have create/update but not delete on most resources", () => {
      expect(hasPermission("agent", "conversations:create")).toBe(true);
      expect(hasPermission("agent", "conversations:update")).toBe(true);
      expect(hasPermission("agent", "conversations:delete")).toBe(false);
      expect(hasPermission("agent", "tickets:create")).toBe(true);
      expect(hasPermission("agent", "knowledge:create")).toBe(false);
    });

    it("supervisor should have most permissions except admin", () => {
      expect(hasPermission("supervisor", "conversations:delete")).toBe(true);
      expect(hasPermission("supervisor", "knowledge:create")).toBe(true);
      expect(hasPermission("supervisor", "webhooks:read")).toBe(true);
      expect(hasPermission("supervisor", "admin:create")).toBe(false);
      expect(hasPermission("supervisor", "settings:update")).toBe(false);
    });

    it("should return false for invalid role", () => {
      expect(hasPermission("hacker", "conversations:read")).toBe(false);
    });

    it("should return false for invalid permission", () => {
      expect(hasPermission("admin", "nonexistent:read" as never)).toBe(false);
    });
  });

  describe("hasMinRole", () => {
    it("admin meets any minimum role", () => {
      expect(hasMinRole("admin", "viewer")).toBe(true);
      expect(hasMinRole("admin", "admin")).toBe(true);
    });

    it("viewer does not meet agent minimum", () => {
      expect(hasMinRole("viewer", "agent")).toBe(false);
    });

    it("agent meets agent minimum", () => {
      expect(hasMinRole("agent", "agent")).toBe(true);
    });

    it("invalid role returns false", () => {
      expect(hasMinRole("unknown", "admin")).toBe(false);
    });
  });

  describe("getPermissionsForRole", () => {
    it("should return permissions array for a role", () => {
      const adminPerms = getPermissionsForRole("admin");
      expect(adminPerms.length).toBeGreaterThan(20);
      expect(adminPerms).toContain("settings:update");
    });

    it("viewer should have fewer permissions than admin", () => {
      const viewerPerms = getPermissionsForRole("viewer");
      const adminPerms = getPermissionsForRole("admin");
      expect(viewerPerms.length).toBeLessThan(adminPerms.length);
    });
  });
});
