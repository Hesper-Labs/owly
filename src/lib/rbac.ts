/**
 * Role-Based Access Control (RBAC) System
 *
 * Roles: admin > supervisor > agent > viewer
 * Each role inherits all permissions of the roles below it.
 */

export const ROLES = ["viewer", "agent", "supervisor", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  // Conversations
  "conversations:read": ["viewer", "agent", "supervisor", "admin"],
  "conversations:create": ["agent", "supervisor", "admin"],
  "conversations:update": ["agent", "supervisor", "admin"],
  "conversations:delete": ["supervisor", "admin"],
  "conversations:assign": ["supervisor", "admin"],
  "conversations:transfer": ["agent", "supervisor", "admin"],

  // Messages
  "messages:read": ["viewer", "agent", "supervisor", "admin"],
  "messages:create": ["agent", "supervisor", "admin"],

  // Tickets
  "tickets:read": ["viewer", "agent", "supervisor", "admin"],
  "tickets:create": ["agent", "supervisor", "admin"],
  "tickets:update": ["agent", "supervisor", "admin"],
  "tickets:delete": ["supervisor", "admin"],

  // Customers
  "customers:read": ["viewer", "agent", "supervisor", "admin"],
  "customers:create": ["agent", "supervisor", "admin"],
  "customers:update": ["agent", "supervisor", "admin"],
  "customers:delete": ["admin"],
  "customers:export": ["supervisor", "admin"],

  // Knowledge Base
  "knowledge:read": ["viewer", "agent", "supervisor", "admin"],
  "knowledge:create": ["supervisor", "admin"],
  "knowledge:update": ["supervisor", "admin"],
  "knowledge:delete": ["admin"],

  // Team Management
  "team:read": ["viewer", "agent", "supervisor", "admin"],
  "team:create": ["admin"],
  "team:update": ["admin"],
  "team:delete": ["admin"],

  // Automation
  "automation:read": ["viewer", "agent", "supervisor", "admin"],
  "automation:create": ["supervisor", "admin"],
  "automation:update": ["supervisor", "admin"],
  "automation:delete": ["admin"],

  // Webhooks
  "webhooks:read": ["supervisor", "admin"],
  "webhooks:create": ["admin"],
  "webhooks:update": ["admin"],
  "webhooks:delete": ["admin"],

  // Settings
  "settings:read": ["admin"],
  "settings:update": ["admin"],

  // Admin (users, API keys)
  "admin:read": ["admin"],
  "admin:create": ["admin"],
  "admin:update": ["admin"],
  "admin:delete": ["admin"],

  // Analytics
  "analytics:read": ["viewer", "agent", "supervisor", "admin"],
  "analytics:export": ["supervisor", "admin"],

  // Activity Log
  "activity:read": ["supervisor", "admin"],

  // Channels
  "channels:read": ["supervisor", "admin"],
  "channels:update": ["admin"],

  // SLA
  "sla:read": ["viewer", "agent", "supervisor", "admin"],
  "sla:create": ["admin"],
  "sla:update": ["admin"],
  "sla:delete": ["admin"],

  // Business Hours
  "business-hours:read": ["viewer", "agent", "supervisor", "admin"],
  "business-hours:update": ["admin"],

  // Canned Responses
  "canned:read": ["agent", "supervisor", "admin"],
  "canned:create": ["supervisor", "admin"],
  "canned:update": ["supervisor", "admin"],
  "canned:delete": ["admin"],

  // Export
  "export:read": ["supervisor", "admin"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return (allowed as readonly string[]).includes(role);
}

/**
 * Check if a role meets the minimum required role level.
 */
export function hasMinRole(role: string, minRole: Role): boolean {
  const roleIndex = ROLES.indexOf(role as Role);
  const minIndex = ROLES.indexOf(minRole);
  if (roleIndex === -1 || minIndex === -1) return false;
  return roleIndex >= minIndex;
}

/**
 * Get all permissions for a role.
 */
export function getPermissionsForRole(role: string): Permission[] {
  return (Object.entries(PERMISSIONS) as [Permission, readonly string[]][])
    .filter(([, roles]) => roles.includes(role))
    .map(([perm]) => perm);
}
