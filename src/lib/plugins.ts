import { logger } from "@/lib/logger";

/**
 * Plugin System for Owly
 * Allows extending functionality via standardized hooks.
 */

export interface PluginContext {
  conversationId?: string;
  customerId?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
}

export interface PluginHook {
  name: string;
  priority: number;
  handler: (context: PluginContext, data: unknown) => Promise<unknown>;
}

export interface OwlyPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  hooks: PluginHook[];
  onInit?: () => Promise<void>;
  onDestroy?: () => Promise<void>;
}

// Plugin registry
const plugins = new Map<string, OwlyPlugin>();
const hookRegistry = new Map<string, PluginHook[]>();

/**
 * Register a plugin.
 */
export async function registerPlugin(plugin: OwlyPlugin): Promise<boolean> {
  if (plugins.has(plugin.id)) {
    logger.warn(`Plugin already registered: ${plugin.id}`);
    return false;
  }

  plugins.set(plugin.id, plugin);

  for (const hook of plugin.hooks) {
    const existing = hookRegistry.get(hook.name) || [];
    existing.push(hook);
    existing.sort((a, b) => b.priority - a.priority);
    hookRegistry.set(hook.name, existing);
  }

  if (plugin.onInit) {
    await plugin.onInit();
  }

  logger.info(`Plugin registered: ${plugin.name} v${plugin.version}`);
  return true;
}

/**
 * Unregister a plugin.
 */
export async function unregisterPlugin(pluginId: string): Promise<boolean> {
  const plugin = plugins.get(pluginId);
  if (!plugin) return false;

  if (plugin.onDestroy) {
    await plugin.onDestroy();
  }

  // Remove hooks
  for (const hook of plugin.hooks) {
    const existing = hookRegistry.get(hook.name) || [];
    hookRegistry.set(
      hook.name,
      existing.filter((h) => h !== hook)
    );
  }

  plugins.delete(pluginId);
  logger.info(`Plugin unregistered: ${plugin.name}`);
  return true;
}

/**
 * Execute all hooks for a given event.
 * Returns the data after all hooks have processed it (pipeline pattern).
 */
export async function executeHooks(
  hookName: string,
  context: PluginContext,
  data: unknown
): Promise<unknown> {
  const hooks = hookRegistry.get(hookName) || [];

  let result = data;
  for (const hook of hooks) {
    try {
      result = await hook.handler(context, result);
    } catch (error) {
      logger.error(`Plugin hook error: ${hookName}/${hook.name}`, error);
    }
  }

  return result;
}

/**
 * Get all registered plugins.
 */
export function getPlugins(): Array<{
  id: string;
  name: string;
  version: string;
  description: string;
  hookCount: number;
}> {
  return Array.from(plugins.values()).map((p) => ({
    id: p.id,
    name: p.name,
    version: p.version,
    description: p.description,
    hookCount: p.hooks.length,
  }));
}

// Hook event names
export const HOOK_EVENTS = {
  BEFORE_MESSAGE_SEND: "before:message:send",
  AFTER_MESSAGE_SEND: "after:message:send",
  BEFORE_AI_RESPONSE: "before:ai:response",
  AFTER_AI_RESPONSE: "after:ai:response",
  BEFORE_TICKET_CREATE: "before:ticket:create",
  AFTER_TICKET_CREATE: "after:ticket:create",
  BEFORE_CONVERSATION_CLOSE: "before:conversation:close",
  AFTER_CONVERSATION_CLOSE: "after:conversation:close",
  ON_CUSTOMER_IDENTIFIED: "on:customer:identified",
  ON_SENTIMENT_DETECTED: "on:sentiment:detected",
  ON_SLA_BREACH: "on:sla:breach",
} as const;
