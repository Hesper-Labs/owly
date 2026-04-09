"use client";

import { Header } from "@/components/layout/header";
import {
  Webhook,
  Plus,
  X,
  Pencil,
  Trash2,
  Zap,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Info,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookData {
  id: string;
  name: string;
  description: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  isActive: boolean;
  triggerOn: string;
  createdAt: string;
  updatedAt: string;
}

interface HeaderPair {
  key: string;
  value: string;
}

interface TestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  bodyPreview?: string;
  error?: string;
}

const triggerEvents = [
  { value: "ticket_created", label: "Ticket Created" },
  { value: "conversation_started", label: "Conversation Started" },
  { value: "escalation", label: "Escalation" },
  { value: "conversation_closed", label: "Conversation Closed" },
  { value: "satisfaction_received", label: "Satisfaction Received" },
];

const methods = ["GET", "POST", "PUT"];

function getTriggerLabel(value: string) {
  return triggerEvents.find((t) => t.value === value)?.label || value;
}

const methodBadgeColors: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  PUT: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

// ---------------------------------------------------------------------------
// Webhook Modal
// ---------------------------------------------------------------------------

function WebhookModal({
  webhook,
  onClose,
  onSaved,
}: {
  webhook: WebhookData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!webhook;
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(webhook?.name || "");
  const [description, setDescription] = useState(webhook?.description || "");
  const [url, setUrl] = useState(webhook?.url || "");
  const [method, setMethod] = useState(webhook?.method || "POST");
  const [triggerOn, setTriggerOn] = useState(webhook?.triggerOn || "ticket_created");
  const [headerPairs, setHeaderPairs] = useState<HeaderPair[]>(() => {
    if (webhook?.headers && typeof webhook.headers === "object") {
      const entries = Object.entries(webhook.headers);
      return entries.length > 0
        ? entries.map(([key, value]) => ({ key, value: String(value) }))
        : [{ key: "", value: "" }];
    }
    return [{ key: "", value: "" }];
  });

  const addHeaderPair = () => setHeaderPairs([...headerPairs, { key: "", value: "" }]);

  const removeHeaderPair = (index: number) => {
    setHeaderPairs(headerPairs.filter((_, i) => i !== index));
  };

  const updateHeaderPair = (index: number, field: "key" | "value", val: string) => {
    const updated = [...headerPairs];
    updated[index][field] = val;
    setHeaderPairs(updated);
  };

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) return;
    setSaving(true);

    const headers: Record<string, string> = {};
    for (const pair of headerPairs) {
      if (pair.key.trim()) headers[pair.key.trim()] = pair.value;
    }

    const payload = { name, description, url, method, headers, triggerOn };

    try {
      if (isEdit) {
        await fetch(`/api/webhooks/${webhook.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onSaved();
      onClose();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-owly-surface border border-owly-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-owly-border">
          <h3 className="text-lg font-semibold text-owly-text">
            {isEdit ? "Edit Webhook" : "Add Webhook"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-owly-text-light hover:text-owly-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-owly-text mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Slack Notification"
              className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-theme"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-owly-text mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sends alerts to the support channel"
              className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-theme"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-owly-text mb-1">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-theme font-mono"
            />
          </div>

          {/* Method + Trigger */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-owly-text mb-1">
                Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-theme"
              >
                {methods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-owly-text mb-1">
                Trigger Event
              </label>
              <select
                value={triggerOn}
                onChange={(e) => setTriggerOn(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-theme"
              >
                {triggerEvents.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Headers */}
          <div>
            <label className="block text-sm font-medium text-owly-text mb-2">
              Custom Headers
            </label>
            <div className="space-y-2">
              {headerPairs.map((pair, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pair.key}
                    onChange={(e) => updateHeaderPair(i, "key", e.target.value)}
                    placeholder="Header name"
                    className="flex-1 px-3 py-1.5 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-theme"
                  />
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(e) => updateHeaderPair(i, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-1.5 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-theme"
                  />
                  {headerPairs.length > 1 && (
                    <button
                      onClick={() => removeHeaderPair(i)}
                      className="p-1.5 text-owly-text-light hover:text-owly-danger transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addHeaderPair}
              className="mt-2 text-sm text-owly-primary hover:text-owly-primary-dark font-medium transition-colors"
            >
              + Add Header
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-owly-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-owly-text-light hover:text-owly-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !url.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-owly-primary text-white text-sm font-medium rounded-lg hover:bg-owly-primary-dark transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Webhook"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test Result Panel
// ---------------------------------------------------------------------------

function TestResultPanel({ result, onClose }: { result: TestResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-owly-surface border border-owly-border rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-owly-border">
          <h3 className="text-lg font-semibold text-owly-text">Test Result</h3>
          <button
            onClick={onClose}
            className="p-1 text-owly-text-light hover:text-owly-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="h-6 w-6 text-owly-success" />
            ) : (
              <XCircle className="h-6 w-6 text-owly-danger" />
            )}
            <div>
              <p className="font-semibold text-owly-text">
                {result.success ? "Webhook delivered successfully" : "Webhook delivery failed"}
              </p>
              {result.status && (
                <p className="text-sm text-owly-text-light">
                  Status: {result.status} {result.statusText}
                </p>
              )}
              {result.error && (
                <p className="text-sm text-owly-danger">{result.error}</p>
              )}
            </div>
          </div>
          {result.bodyPreview && (
            <div>
              <p className="text-xs font-semibold text-owly-text-light uppercase tracking-wider mb-1">
                Response Preview
              </p>
              <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-lg border border-gray-700 overflow-x-auto max-h-48">
                {result.bodyPreview}
              </pre>
            </div>
          )}
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-owly-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-owly-text-light hover:text-owly-text transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation
// ---------------------------------------------------------------------------

function DeleteConfirm({
  webhookName,
  onConfirm,
  onCancel,
}: {
  webhookName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-owly-surface border border-owly-border rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-owly-danger" />
            </div>
            <h3 className="text-lg font-semibold text-owly-text">Delete Webhook</h3>
          </div>
          <p className="text-sm text-owly-text-light">
            Are you sure you want to delete <span className="font-medium text-owly-text">{webhookName}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-owly-text-light hover:text-owly-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-owly-danger text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalWebhook, setModalWebhook] = useState<WebhookData | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<WebhookData | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks");
      const data = await res.json();
      setWebhooks(data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleToggleActive = async (wh: WebhookData) => {
    await fetch(`/api/webhooks/${wh.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !wh.isActive }),
    });
    fetchWebhooks();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/webhooks/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchWebhooks();
  };

  const handleTest = async (wh: WebhookData) => {
    setTestingId(wh.id);
    try {
      const res = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId: wh.id }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, error: "Failed to send test request" });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Webhooks"
        description="Connect Owly to external services"
        actions={
          <button
            onClick={() => setModalWebhook("new")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-owly-primary text-white text-sm font-medium rounded-lg hover:bg-owly-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Webhook
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Info section */}
          <div className="border border-owly-border rounded-xl bg-owly-surface p-5 transition-theme">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-owly-primary-50 rounded-lg flex-shrink-0">
                <Info className="h-4 w-4 text-owly-primary" />
              </div>
              <div className="text-sm text-owly-text-light leading-relaxed space-y-2">
                <p className="font-medium text-owly-text">Webhook Payload Format</p>
                <p>
                  When a trigger event occurs, Owly sends a JSON payload to your configured URL containing the event type, a timestamp, and the relevant data object. The payload structure is:
                </p>
                <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-lg border border-gray-700 overflow-x-auto">
{`{
  "event": "ticket_created",
  "timestamp": "2026-04-01T10:00:00Z",
  "data": {
    "id": "...",
    "...": "event-specific fields"
  }
}`}
                </pre>
                <p>
                  The <code className="px-1 py-0.5 bg-owly-bg rounded text-owly-text font-mono text-xs">data</code> object varies depending on the trigger event. Ticket events include ticket details, conversation events include conversation and customer info, and satisfaction events include the rating and feedback.
                </p>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-owly-primary" />
            </div>
          )}

          {/* Empty state */}
          {!loading && webhooks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-owly-primary-50 rounded-full mb-4">
                <Webhook className="h-8 w-8 text-owly-primary" />
              </div>
              <h3 className="text-lg font-semibold text-owly-text mb-1">
                No webhooks configured
              </h3>
              <p className="text-sm text-owly-text-light mb-4 max-w-md">
                Webhooks let you send real-time notifications to external services when events occur in Owly.
              </p>
              <button
                onClick={() => setModalWebhook("new")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-owly-primary text-white text-sm font-medium rounded-lg hover:bg-owly-primary-dark transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Your First Webhook
              </button>
            </div>
          )}

          {/* Webhook cards */}
          {!loading && webhooks.length > 0 && (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="border border-owly-border rounded-xl bg-owly-surface p-5 transition-theme hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-sm font-semibold text-owly-text">
                          {wh.name}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide min-w-[48px] justify-center",
                            methodBadgeColors[wh.method] || "bg-gray-100 text-gray-800"
                          )}
                        >
                          {wh.method}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            wh.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              wh.isActive ? "bg-emerald-500" : "bg-gray-400"
                            )}
                          />
                          {wh.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-owly-text-light font-mono truncate">
                        {wh.url}
                      </p>
                      {wh.description && (
                        <p className="mt-1 text-xs text-owly-text-light">
                          {wh.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-owly-text-light">
                          <Zap className="h-3 w-3" />
                          {getTriggerLabel(wh.triggerOn)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleTest(wh)}
                        disabled={testingId === wh.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-owly-primary bg-owly-primary-50 rounded-lg hover:bg-owly-primary-100 transition-colors disabled:opacity-50"
                        title="Send test payload"
                      >
                        {testingId === wh.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Test
                      </button>
                      <button
                        onClick={() => handleToggleActive(wh)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                          wh.isActive
                            ? "text-owly-text-light hover:bg-owly-bg"
                            : "text-owly-success hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        )}
                      >
                        {wh.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => setModalWebhook(wh)}
                        className="p-1.5 text-owly-text-light hover:text-owly-text hover:bg-owly-bg rounded-lg transition-colors"
                        title="Edit webhook"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(wh)}
                        className="p-1.5 text-owly-text-light hover:text-owly-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete webhook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modalWebhook !== null && (
        <WebhookModal
          webhook={modalWebhook === "new" ? null : modalWebhook}
          onClose={() => setModalWebhook(null)}
          onSaved={fetchWebhooks}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          webhookName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {testResult && (
        <TestResultPanel
          result={testResult}
          onClose={() => setTestResult(null)}
        />
      )}
    </div>
  );
}
