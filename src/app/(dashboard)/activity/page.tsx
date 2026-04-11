"use client";

import { Header } from "@/components/layout/header";
import { useToast } from "@/components/ui/toast";
import {
  ScrollText,
  MessageSquare,
  Ticket,
  Settings,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ActivityData {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  userName: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface ActivityResponse {
  activities: ActivityData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const entityTypes = [
  { value: "all", label: "All Types" },
  { value: "conversation", label: "Conversation" },
  { value: "ticket", label: "Ticket" },
  { value: "settings", label: "Settings" },
  { value: "knowledge", label: "Knowledge" },
  { value: "team", label: "Team" },
];

const entityConfig: Record<
  string,
  { icon: React.ElementType; bgColor: string; iconColor: string }
> = {
  conversation: {
    icon: MessageSquare,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  ticket: {
    icon: Ticket,
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  settings: {
    icon: Settings,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-600",
  },
  knowledge: {
    icon: BookOpen,
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  team: {
    icon: Users,
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
};

export default function ActivityPage() {
  const { toast } = useToast();
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState("all");

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (entityFilter !== "all") params.set("entity", entityFilter);

      const res = await fetch(`/api/activity?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error(error);
      toast({
        type: "error",
        title: "Error",
        description: "Failed to fetch activities",
      });
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    setPage(1);
  }, [entityFilter]);

  const activities = data?.activities || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <>
      <Header
        title="Activity Log"
        description="Track all actions and changes"
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Filter Bar */}
        <div className="bg-owly-surface rounded-xl border border-owly-border p-3">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-owly-text-light" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="text-sm px-3 py-2 border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 text-owly-text"
            >
              {entityTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-owly-text-light ml-auto">
              {total} {total === 1 ? "entry" : "entries"}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-owly-surface rounded-xl border border-owly-border">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-sm text-owly-text-light">Loading...</div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="p-4 rounded-full bg-owly-primary-50 mb-4">
                <ScrollText className="h-8 w-8 text-owly-primary" />
              </div>
              <p className="font-medium text-owly-text">No activity found</p>
              <p className="text-sm text-owly-text-light mt-1">
                Actions and changes will appear here as they happen
              </p>
            </div>
          ) : (
            <div className="divide-y divide-owly-border">
              {activities.map((activity) => {
                const config = entityConfig[activity.entity] || {
                  icon: ScrollText,
                  bgColor: "bg-gray-100",
                  iconColor: "text-gray-600",
                };
                const Icon = config.icon;

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-owly-primary-50/30 transition-colors"
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg flex-shrink-0 mt-0.5",
                        config.bgColor
                      )}
                    >
                      <Icon className={cn("h-4 w-4", config.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-owly-text">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-owly-text-light">
                          {activity.userName}
                        </span>
                        <span className="text-xs text-owly-text-light">
                          {formatRelativeTime(activity.createdAt)}
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-medium",
                            activity.entity === "conversation"
                              ? "bg-blue-50 text-blue-700"
                              : activity.entity === "ticket"
                              ? "bg-orange-50 text-orange-700"
                              : activity.entity === "settings"
                              ? "bg-gray-100 text-gray-700"
                              : activity.entity === "knowledge"
                              ? "bg-green-50 text-green-700"
                              : activity.entity === "team"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {activity.entity}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-owly-surface rounded-xl border border-owly-border px-5 py-3">
            <p className="text-sm text-owly-text-light">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors",
                  page <= 1
                    ? "text-owly-text-light cursor-not-allowed"
                    : "text-owly-text hover:bg-owly-primary-50"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors",
                  page >= totalPages
                    ? "text-owly-text-light cursor-not-allowed"
                    : "text-owly-text hover:bg-owly-primary-50"
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
