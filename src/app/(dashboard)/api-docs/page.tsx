"use client";

import { Header } from "@/components/layout/header";
import {
  FileCode,
  Key,
  ChevronDown,
  ChevronRight,
  Send,
  Copy,
  Check,
  Loader2,
  MessageSquare,
  MessagesSquare,
  Ticket,
  BookOpen,
  Users,
  Webhook,
  Download,
  Heart,
} from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  requestBody?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseExample: any;
  params?: { name: string; type: string; required: boolean; description: string }[];
  queryParams?: { name: string; type: string; required: boolean; description: string }[];
}

interface ApiSection {
  id: string;
  name: string;
  icon: React.ElementType;
  endpoints: Endpoint[];
}

// ---------------------------------------------------------------------------
// API Sections Data
// ---------------------------------------------------------------------------

const apiSections: ApiSection[] = [
  {
    id: "chat",
    name: "Chat",
    icon: MessageSquare,
    endpoints: [
      {
        method: "POST",
        path: "/api/chat",
        description: "Send a message and get an AI-generated response. The AI uses your knowledge base and conversation history to generate relevant answers.",
        requestBody: {
          message: "How do I reset my password?",
          conversationId: "conv_abc123",
          channel: "web",
          customerName: "John Doe",
        },
        responseExample: {
          reply: "To reset your password, go to Settings > Security and click 'Reset Password'...",
          conversationId: "conv_abc123",
          messageId: "msg_xyz789",
        },
        params: [],
      },
    ],
  },
  {
    id: "conversations",
    name: "Conversations",
    icon: MessagesSquare,
    endpoints: [
      {
        method: "GET",
        path: "/api/conversations",
        description: "List all conversations with optional filtering by status or channel.",
        responseExample: [
          {
            id: "conv_abc123",
            channel: "web",
            customerName: "John Doe",
            status: "active",
            createdAt: "2026-04-01T10:00:00Z",
          },
        ],
        queryParams: [
          { name: "status", type: "string", required: false, description: "Filter by status: active, closed, archived" },
          { name: "channel", type: "string", required: false, description: "Filter by channel: web, whatsapp, email, phone" },
        ],
      },
      {
        method: "POST",
        path: "/api/conversations",
        description: "Create a new conversation.",
        requestBody: {
          channel: "web",
          customerName: "Jane Smith",
          customerContact: "jane@example.com",
        },
        responseExample: {
          id: "conv_def456",
          channel: "web",
          customerName: "Jane Smith",
          status: "active",
          createdAt: "2026-04-01T10:00:00Z",
        },
      },
      {
        method: "GET",
        path: "/api/conversations/:id",
        description: "Get a specific conversation with its messages.",
        responseExample: {
          id: "conv_abc123",
          channel: "web",
          customerName: "John Doe",
          status: "active",
          messages: [
            { id: "msg_1", role: "user", content: "Hello", createdAt: "2026-04-01T10:00:00Z" },
            { id: "msg_2", role: "assistant", content: "Hi! How can I help?", createdAt: "2026-04-01T10:00:01Z" },
          ],
        },
        params: [
          { name: "id", type: "string", required: true, description: "Conversation ID" },
        ],
      },
      {
        method: "PUT",
        path: "/api/conversations/:id",
        description: "Update a conversation's status, customer info, or metadata.",
        requestBody: {
          status: "closed",
          satisfaction: 5,
          summary: "Customer asked about password reset.",
        },
        responseExample: {
          id: "conv_abc123",
          status: "closed",
          satisfaction: 5,
          updatedAt: "2026-04-01T12:00:00Z",
        },
        params: [
          { name: "id", type: "string", required: true, description: "Conversation ID" },
        ],
      },
      {
        method: "DELETE",
        path: "/api/conversations/:id",
        description: "Delete a conversation and all its messages.",
        responseExample: { ok: true },
        params: [
          { name: "id", type: "string", required: true, description: "Conversation ID" },
        ],
      },
      {
        method: "POST",
        path: "/api/conversations/:id/messages",
        description: "Add a message to an existing conversation.",
        requestBody: {
          role: "user",
          content: "I need help with billing",
        },
        responseExample: {
          id: "msg_new123",
          conversationId: "conv_abc123",
          role: "user",
          content: "I need help with billing",
          createdAt: "2026-04-01T10:05:00Z",
        },
        params: [
          { name: "id", type: "string", required: true, description: "Conversation ID" },
        ],
      },
    ],
  },
  {
    id: "tickets",
    name: "Tickets",
    icon: Ticket,
    endpoints: [
      {
        method: "GET",
        path: "/api/tickets",
        description: "List all tickets with optional filtering.",
        responseExample: [
          {
            id: "tkt_abc123",
            title: "Login issue",
            status: "open",
            priority: "high",
            createdAt: "2026-04-01T10:00:00Z",
          },
        ],
        queryParams: [
          { name: "status", type: "string", required: false, description: "Filter by status: open, in_progress, resolved, closed" },
          { name: "priority", type: "string", required: false, description: "Filter by priority: low, medium, high, urgent" },
        ],
      },
      {
        method: "POST",
        path: "/api/tickets",
        description: "Create a new support ticket.",
        requestBody: {
          title: "Cannot access dashboard",
          description: "User reports 403 error when accessing the main dashboard.",
          priority: "high",
          departmentId: "dept_abc",
        },
        responseExample: {
          id: "tkt_new456",
          title: "Cannot access dashboard",
          status: "open",
          priority: "high",
          createdAt: "2026-04-01T10:00:00Z",
        },
      },
      {
        method: "GET",
        path: "/api/tickets/:id",
        description: "Get a specific ticket with related conversation and assignment details.",
        responseExample: {
          id: "tkt_abc123",
          title: "Login issue",
          status: "open",
          priority: "high",
          department: { id: "dept_1", name: "Engineering" },
          assignedTo: { id: "mem_1", name: "Alice" },
        },
        params: [
          { name: "id", type: "string", required: true, description: "Ticket ID" },
        ],
      },
      {
        method: "PUT",
        path: "/api/tickets/:id",
        description: "Update a ticket's status, priority, assignment, or resolution.",
        requestBody: {
          status: "resolved",
          resolution: "Fixed permission configuration for the user.",
        },
        responseExample: {
          id: "tkt_abc123",
          status: "resolved",
          resolution: "Fixed permission configuration for the user.",
          updatedAt: "2026-04-01T12:00:00Z",
        },
        params: [
          { name: "id", type: "string", required: true, description: "Ticket ID" },
        ],
      },
      {
        method: "DELETE",
        path: "/api/tickets/:id",
        description: "Delete a ticket permanently.",
        responseExample: { ok: true },
        params: [
          { name: "id", type: "string", required: true, description: "Ticket ID" },
        ],
      },
    ],
  },
  {
    id: "knowledge",
    name: "Knowledge Base",
    icon: BookOpen,
    endpoints: [
      {
        method: "GET",
        path: "/api/knowledge/categories",
        description: "List all knowledge base categories with entry counts.",
        responseExample: [
          { id: "cat_1", name: "FAQ", description: "Frequently asked questions", entryCount: 12 },
        ],
      },
      {
        method: "POST",
        path: "/api/knowledge/categories",
        description: "Create a new knowledge base category.",
        requestBody: {
          name: "Troubleshooting",
          description: "Common troubleshooting guides",
          icon: "wrench",
          color: "#E67E22",
        },
        responseExample: {
          id: "cat_new1",
          name: "Troubleshooting",
          description: "Common troubleshooting guides",
          createdAt: "2026-04-01T10:00:00Z",
        },
      },
      {
        method: "GET",
        path: "/api/knowledge/entries",
        description: "List knowledge base entries, optionally filtered by category.",
        responseExample: [
          {
            id: "entry_1",
            title: "How to reset password",
            content: "Go to Settings > Security...",
            categoryId: "cat_1",
            isActive: true,
          },
        ],
        queryParams: [
          { name: "categoryId", type: "string", required: false, description: "Filter by category ID" },
        ],
      },
      {
        method: "POST",
        path: "/api/knowledge/entries",
        description: "Create a new knowledge base entry.",
        requestBody: {
          categoryId: "cat_1",
          title: "How to update billing info",
          content: "Navigate to Account > Billing and click 'Update Payment Method'...",
          priority: 1,
        },
        responseExample: {
          id: "entry_new1",
          title: "How to update billing info",
          categoryId: "cat_1",
          isActive: true,
          createdAt: "2026-04-01T10:00:00Z",
        },
      },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    icon: Users,
    endpoints: [
      {
        method: "GET",
        path: "/api/settings",
        description: "Get the current application settings.",
        responseExample: {
          businessName: "My Business",
          welcomeMessage: "Hello! How can I help you today?",
          tone: "friendly",
          aiProvider: "openai",
          aiModel: "gpt-4o-mini",
        },
      },
      {
        method: "PUT",
        path: "/api/settings",
        description: "Update application settings. Only include the fields you want to change.",
        requestBody: {
          businessName: "Acme Support",
          welcomeMessage: "Welcome to Acme! How can we assist you?",
          tone: "professional",
        },
        responseExample: {
          businessName: "Acme Support",
          welcomeMessage: "Welcome to Acme! How can we assist you?",
          tone: "professional",
          updatedAt: "2026-04-01T12:00:00Z",
        },
      },
    ],
  },
  {
    id: "webhooks",
    name: "Webhooks",
    icon: Webhook,
    endpoints: [
      {
        method: "GET",
        path: "/api/webhooks",
        description: "List all configured webhooks.",
        responseExample: [
          {
            id: "wh_abc123",
            name: "Slack notifications",
            url: "https://hooks.slack.com/services/...",
            method: "POST",
            triggerOn: "ticket_created",
            isActive: true,
          },
        ],
      },
      {
        method: "POST",
        path: "/api/webhooks",
        description: "Create a new webhook.",
        requestBody: {
          name: "Slack notification",
          url: "https://hooks.slack.com/services/T00/B00/xxx",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          triggerOn: "ticket_created",
        },
        responseExample: {
          id: "wh_new456",
          name: "Slack notification",
          url: "https://hooks.slack.com/services/T00/B00/xxx",
          triggerOn: "ticket_created",
          isActive: true,
          createdAt: "2026-04-01T10:00:00Z",
        },
      },
    ],
  },
  {
    id: "export",
    name: "Export",
    icon: Download,
    endpoints: [
      {
        method: "GET",
        path: "/api/export",
        description: "Export data in CSV or JSON format. Supports exporting conversations, tickets, knowledge base entries, and customers.",
        responseExample: {
          note: "Returns CSV or JSON file as download",
        },
        queryParams: [
          { name: "type", type: "string", required: true, description: "Data type: conversations, tickets, knowledge, customers" },
          { name: "format", type: "string", required: true, description: "Output format: csv or json" },
        ],
      },
    ],
  },
  {
    id: "health",
    name: "Health Check",
    icon: Heart,
    endpoints: [
      {
        method: "GET",
        path: "/api/health",
        description: "Check the API health status. Returns uptime and database connectivity status.",
        responseExample: {
          status: "ok",
          uptime: 86400,
          database: "connected",
          timestamp: "2026-04-01T10:00:00Z",
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Method Badge
// ---------------------------------------------------------------------------

const methodColors: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  PUT: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide min-w-[56px] justify-center",
        methodColors[method] || "bg-gray-100 text-gray-800"
      )}
    >
      {method}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Code Block
// ---------------------------------------------------------------------------

function CodeBlock({ data, label }: { data: unknown; label: string }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 rounded-t-lg border border-gray-700">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 text-sm p-4 rounded-b-lg border border-t-0 border-gray-700 overflow-x-auto">
        <code>{text}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Try It Panel
// ---------------------------------------------------------------------------

function TryItPanel({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [bodyText, setBodyText] = useState(
    endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : ""
  );

  const handleSend = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    setResponseStatus(null);

    try {
      let url = endpoint.path;

      // Replace path params
      if (endpoint.params) {
        for (const p of endpoint.params) {
          url = url.replace(`:${p.name}`, paramValues[p.name] || `{${p.name}}`);
        }
      }

      // Add query params
      if (endpoint.queryParams) {
        const qp = new URLSearchParams();
        for (const p of endpoint.queryParams) {
          if (paramValues[p.name]) qp.set(p.name, paramValues[p.name]);
        }
        const qs = qp.toString();
        if (qs) url += `?${qs}`;
      }

      const opts: RequestInit = {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" },
      };

      if ((endpoint.method === "POST" || endpoint.method === "PUT") && bodyText.trim()) {
        opts.body = bodyText;
      }

      const res = await fetch(url, opts);
      setResponseStatus(res.status);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const json = await res.json();
        setResponse(JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setResponse(text.slice(0, 2000));
      }
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : "Request failed"}`);
    } finally {
      setLoading(false);
    }
  }, [endpoint, paramValues, bodyText]);

  const allParams = [
    ...(endpoint.params || []),
    ...(endpoint.queryParams || []),
  ];

  return (
    <div className="mt-4 border border-owly-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-owly-text bg-owly-primary-50 hover:bg-owly-primary-100 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-owly-primary" />
        ) : (
          <ChevronRight className="h-4 w-4 text-owly-primary" />
        )}
        <Send className="h-4 w-4 text-owly-primary" />
        Try it
      </button>

      {open && (
        <div className="p-4 space-y-4 bg-owly-surface border-t border-owly-border">
          {allParams.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-owly-text-light uppercase tracking-wider">
                Parameters
              </h4>
              {allParams.map((p) => (
                <div key={p.name} className="flex items-start gap-3">
                  <div className="w-40 flex-shrink-0">
                    <label className="text-sm font-medium text-owly-text">
                      {p.name}
                      {p.required && <span className="text-owly-danger ml-0.5">*</span>}
                    </label>
                    <p className="text-xs text-owly-text-light">{p.type}</p>
                  </div>
                  <input
                    type="text"
                    placeholder={p.description}
                    className="flex-1 px-3 py-1.5 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-theme"
                    value={paramValues[p.name] || ""}
                    onChange={(e) =>
                      setParamValues({ ...paramValues, [p.name]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {(endpoint.method === "POST" || endpoint.method === "PUT") && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-owly-text-light uppercase tracking-wider">
                Request Body (JSON)
              </h4>
              <textarea
                className="w-full h-40 px-3 py-2 text-sm font-mono border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary resize-y transition-theme"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
              />
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-owly-primary text-white text-sm font-medium rounded-lg hover:bg-owly-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Request
          </button>

          {response !== null && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-owly-text-light uppercase tracking-wider">
                  Response
                </span>
                {responseStatus !== null && (
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded",
                      responseStatus >= 200 && responseStatus < 300
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    )}
                  >
                    {responseStatus}
                  </span>
                )}
              </div>
              <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 text-sm p-4 rounded-lg border border-gray-700 overflow-x-auto max-h-80">
                <code>{response}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Endpoint Card
// ---------------------------------------------------------------------------

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="border border-owly-border rounded-xl bg-owly-surface p-6 transition-theme">
      <div className="flex items-center gap-3 flex-wrap">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-semibold text-owly-text font-mono">
          {endpoint.path}
        </code>
      </div>

      <p className="mt-3 text-sm text-owly-text-light leading-relaxed">
        {endpoint.description}
      </p>

      {/* Parameters table */}
      {((endpoint.params && endpoint.params.length > 0) ||
        (endpoint.queryParams && endpoint.queryParams.length > 0)) && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-owly-text-light uppercase tracking-wider mb-2">
            Parameters
          </h4>
          <div className="border border-owly-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-owly-bg">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-owly-text-light uppercase">
                    Name
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-owly-text-light uppercase">
                    Type
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-owly-text-light uppercase">
                    Required
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-owly-text-light uppercase">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...(endpoint.params || []), ...(endpoint.queryParams || [])].map(
                  (p) => (
                    <tr key={p.name} className="border-t border-owly-border">
                      <td className="px-4 py-2 font-mono text-owly-text font-medium">
                        {p.name}
                      </td>
                      <td className="px-4 py-2 text-owly-text-light">{p.type}</td>
                      <td className="px-4 py-2">
                        {p.required ? (
                          <span className="text-owly-danger font-medium">Yes</span>
                        ) : (
                          <span className="text-owly-text-light">No</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-owly-text-light">{p.description}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request body */}
      {endpoint.requestBody && (
        <div className="mt-4">
          <CodeBlock data={endpoint.requestBody} label="Request Body" />
        </div>
      )}

      {/* Response example */}
      <div className="mt-4">
        <CodeBlock data={endpoint.responseExample} label="Response" />
      </div>

      {/* Try it */}
      <TryItPanel endpoint={endpoint} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("chat");

  const currentSection = apiSections.find((s) => s.id === activeSection) || apiSections[0];

  return (
    <div className="flex flex-col h-full">
      <Header
        title="API Documentation"
        description="Integrate Owly with your systems"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-60 flex-shrink-0 border-r border-owly-border bg-owly-bg overflow-y-auto p-4 hidden lg:block">
          <nav className="space-y-1">
            {apiSections.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    isActive
                      ? "bg-owly-primary text-white"
                      : "text-owly-text-light hover:bg-owly-surface hover:text-owly-text"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {section.name}
                  <span className="ml-auto text-xs opacity-70">
                    {section.endpoints.length}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Mobile section selector */}
            <div className="lg:hidden">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="w-full px-3 py-2 border border-owly-border rounded-lg bg-owly-surface text-owly-text text-sm focus:outline-none focus:ring-2 focus:ring-owly-primary/30"
              >
                {apiSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Authentication Section */}
            <div className="border border-owly-border rounded-xl bg-owly-surface p-6 transition-theme">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-owly-primary-50 rounded-lg">
                  <Key className="h-5 w-5 text-owly-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-owly-text">
                    Authentication
                  </h3>
                  <p className="text-sm text-owly-text-light">
                    All API requests require authentication
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-owly-text-light leading-relaxed">
                <p>
                  Include your API key in the request headers using the{" "}
                  <code className="px-1.5 py-0.5 bg-owly-bg rounded text-owly-text font-mono text-xs">
                    X-API-Key
                  </code>{" "}
                  header. You can generate and manage API keys from the{" "}
                  <span className="font-medium text-owly-text">Settings</span> page.
                </p>
                <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 text-sm p-4 rounded-lg border border-gray-700 font-mono">
                  <span className="text-blue-400">curl</span>{" "}
                  <span className="text-green-400">-H</span>{" "}
                  <span className="text-amber-300">{'"X-API-Key: your_api_key_here"'}</span>{" "}
                  \<br />
                  {"  "}https://your-domain.com/api/conversations
                </div>
                <p>
                  API keys can be configured with different permissions. Keep your keys
                  secure and never expose them in client-side code. If a key is compromised,
                  revoke it immediately from the Settings page and generate a new one.
                </p>
              </div>
            </div>

            {/* Section Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-owly-primary-50 rounded-lg">
                <currentSection.icon className="h-5 w-5 text-owly-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-owly-text">
                  {currentSection.name}
                </h3>
                <p className="text-sm text-owly-text-light">
                  {currentSection.endpoints.length} endpoint
                  {currentSection.endpoints.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Endpoints */}
            <div className="space-y-6">
              {currentSection.endpoints.map((ep, i) => (
                <EndpointCard key={`${ep.method}-${ep.path}-${i}`} endpoint={ep} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
