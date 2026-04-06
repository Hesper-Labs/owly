"use client";

import { Header } from "@/components/layout/header";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Send,
  Loader2,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Layers,
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Source {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  contentPreview: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  model?: string;
  timestamp: Date;
}

interface KBStats {
  totalCategories: number;
  totalEntries: number;
  activeEntries: number;
  lastUpdated: string | null;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function KnowledgeTestPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<KBStats | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Fetch KB stats
  // ---------------------------------------------------------------------------

  const fetchStats = useCallback(async () => {
    try {
      const [categoriesRes, entriesRes] = await Promise.all([
        fetch("/api/knowledge/categories"),
        fetch("/api/knowledge/entries"),
      ]);

      const categories = categoriesRes.ok ? await categoriesRes.json() : [];
      const entries = entriesRes.ok ? await entriesRes.json() : [];

      const activeEntries = entries.filter((e: { isActive: boolean }) => e.isActive);
      const lastUpdated =
        entries.length > 0
          ? entries.sort(
              (a: { updatedAt: string }, b: { updatedAt: string }) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )[0].updatedAt
          : null;

      setStats({
        totalCategories: categories.length,
        totalEntries: entries.length,
        activeEntries: activeEntries.length,
        lastUpdated,
      });
    } catch (err) {
      toast({
        type: "error",
        title: "Error",
        description: "Failed to fetch knowledge base statistics",
      });
      console.error("Failed to fetch KB stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ---------------------------------------------------------------------------
  // Auto-scroll
  // ---------------------------------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------------------------------------------------------------------
  // Send question
  // ---------------------------------------------------------------------------

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    setError("");
    setInput("");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/knowledge/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to get response.");
        setLoading(false);
        return;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        model: data.model,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      toast({
        type: "error",
        title: "Error",
        description: "Failed to test knowledge base",
      });
      console.error("Failed to test KB:", err);
      setError("An unexpected error occurred. Check your AI configuration.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function toggleSources(messageId: string) {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatRelativeDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <Header
        title="Knowledge Base Test"
        description="Test how your AI responds to customer questions"
      />

      <div className="flex-1 overflow-hidden flex">
        {/* ================= CHAT AREA ================= */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && !loading && (
              <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-owly-primary-50 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-owly-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-owly-text mb-2">
                    Test Your Knowledge Base
                  </h3>
                  <p className="text-sm text-owly-text-light">
                    Ask a question below to see how the AI responds using your
                    knowledge base entries. This helps verify your content before
                    going live.
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-owly-primary-50 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-owly-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[70%] space-y-2",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-owly-primary text-white rounded-br-sm"
                        : "bg-owly-surface border border-owly-border text-owly-text rounded-bl-sm"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>

                  {/* Sources section for assistant messages */}
                  {message.role === "assistant" &&
                    message.sources &&
                    message.sources.length > 0 && (
                      <div className="w-full">
                        <button
                          onClick={() => toggleSources(message.id)}
                          className="flex items-center gap-1.5 text-xs text-owly-text-light hover:text-owly-text transition-colors"
                        >
                          <BookOpen className="h-3 w-3" />
                          {message.sources.length} source
                          {message.sources.length !== 1 ? "s" : ""} used
                          {expandedSources.has(message.id) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>

                        {expandedSources.has(message.id) && (
                          <div className="mt-2 space-y-1.5">
                            {message.sources.map((source) => (
                              <div
                                key={source.id}
                                className="bg-owly-bg border border-owly-border rounded-lg px-3 py-2"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: source.categoryColor }}
                                  />
                                  <span className="text-xs font-medium text-owly-text">
                                    {source.title}
                                  </span>
                                  <span className="text-xs text-owly-text-light">
                                    {source.category}
                                  </span>
                                </div>
                                <p className="text-xs text-owly-text-light line-clamp-2">
                                  {source.contentPreview}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  <div
                    className={cn(
                      "flex items-center gap-2 text-xs text-owly-text-light",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <span>{formatTime(message.timestamp)}</span>
                    {message.model && (
                      <span className="opacity-60">{message.model}</span>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-owly-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-owly-primary-50 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-owly-primary" />
                </div>
                <div className="bg-owly-surface border border-owly-border rounded-xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-owly-text-light">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching knowledge base...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mb-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-owly-border bg-owly-surface px-6 py-4">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm border border-owly-border rounded-lg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary bg-owly-bg text-owly-text disabled:opacity-50 placeholder:text-owly-text-light"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-owly-primary text-white hover:bg-owly-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= SIDEBAR: KB STATS ================= */}
        <div className="w-72 flex-shrink-0 border-l border-owly-border bg-owly-surface overflow-y-auto">
          <div className="px-5 py-4 border-b border-owly-border">
            <h3 className="text-sm font-semibold text-owly-text">
              Knowledge Base Stats
            </h3>
          </div>

          {stats ? (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-owly-bg rounded-lg">
                <div className="p-2 rounded-lg bg-owly-primary-50">
                  <Layers className="h-4 w-4 text-owly-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-owly-text">
                    {stats.totalCategories}
                  </p>
                  <p className="text-xs text-owly-text-light">Categories</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-owly-bg rounded-lg">
                <div className="p-2 rounded-lg bg-green-50">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-owly-text">
                    {stats.activeEntries}
                    <span className="text-sm font-normal text-owly-text-light">
                      {" "}
                      / {stats.totalEntries}
                    </span>
                  </p>
                  <p className="text-xs text-owly-text-light">Active Entries</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-owly-bg rounded-lg">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-owly-text">
                    {stats.lastUpdated
                      ? formatRelativeDate(stats.lastUpdated)
                      : "Never"}
                  </p>
                  <p className="text-xs text-owly-text-light">Last Updated</p>
                </div>
              </div>

              <div className="pt-3 border-t border-owly-border">
                <p className="text-xs text-owly-text-light leading-relaxed">
                  The AI uses active knowledge base entries to answer questions.
                  Inactive entries are excluded from responses.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-owly-text-light" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
