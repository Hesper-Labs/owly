"use client";

import { Header } from "@/components/layout/header";
import { Clock, Save, Check, AlertTriangle } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

interface BusinessHoursData {
  id: string;
  enabled: boolean;
  timezone: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  offlineMessage: string;
}

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const days: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const defaultConfig: BusinessHoursData = {
  id: "default",
  enabled: false,
  timezone: "UTC",
  monday: "09:00-18:00",
  tuesday: "09:00-18:00",
  wednesday: "09:00-18:00",
  thursday: "09:00-18:00",
  friday: "09:00-18:00",
  saturday: "",
  sunday: "",
  offlineMessage:
    "We are currently offline. We will get back to you during business hours.",
};

function parseTime(timeRange: string): { start: string; end: string } | null {
  if (!timeRange) return null;
  const parts = timeRange.split("-");
  if (parts.length !== 2) return null;
  return { start: parts[0], end: parts[1] };
}

function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      options.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      );
    }
  }
  return options;
}

export default function BusinessHoursPage() {
  const [config, setConfig] = useState<BusinessHoursData>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const timeOptions = useMemo(() => generateTimeOptions(), []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/business-hours");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch business hours:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/business-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save business hours:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: DayKey) => {
    setConfig((c) => ({
      ...c,
      [day]: c[day] ? "" : "09:00-18:00",
    }));
  };

  const updateDayTime = (
    day: DayKey,
    part: "start" | "end",
    value: string
  ) => {
    const current = parseTime(config[day]);
    if (!current) return;
    const newRange =
      part === "start" ? `${value}-${current.end}` : `${current.start}-${value}`;
    setConfig((c) => ({ ...c, [day]: newRange }));
  };

  const currentStatus = useMemo(() => {
    if (!config.enabled) return { open: false, label: "Support is disabled" };

    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: config.timezone,
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const weekday = parts.find((p) => p.type === "weekday")?.value?.toLowerCase();
      const hour = parts.find((p) => p.type === "hour")?.value || "00";
      const minute = parts.find((p) => p.type === "minute")?.value || "00";
      const currentTime = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

      const dayKey = weekday as DayKey;
      const daySchedule = config[dayKey];

      if (!daySchedule) return { open: false, label: "Closed today" };

      const times = parseTime(daySchedule);
      if (!times) return { open: false, label: "Closed today" };

      const isOpen = currentTime >= times.start && currentTime < times.end;
      return {
        open: isOpen,
        label: isOpen
          ? `Open now (until ${times.end})`
          : `Closed (opens at ${times.start})`,
      };
    } catch {
      return { open: false, label: "Unable to determine status" };
    }
  }, [config]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <Header
          title="Business Hours"
          description="Configure when your support is available"
        />
        <div className="flex-1 p-6">
          <div className="max-w-3xl space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-owly-surface border border-owly-border rounded-xl p-6 animate-pulse"
              >
                <div className="h-5 bg-owly-border rounded w-1/4 mb-4" />
                <div className="h-10 bg-owly-border rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Business Hours"
        description="Configure when your support is available"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-6">
          {/* Status Preview */}
          <div
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border",
              currentStatus.open
                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full",
                currentStatus.open
                  ? "bg-green-100 dark:bg-green-900/40"
                  : "bg-amber-100 dark:bg-amber-900/40"
              )}
            >
              {currentStatus.open ? (
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  currentStatus.open
                    ? "text-green-800 dark:text-green-300"
                    : "text-amber-800 dark:text-amber-300"
                )}
              >
                Current Status
              </p>
              <p
                className={cn(
                  "text-sm",
                  currentStatus.open
                    ? "text-green-700 dark:text-green-400"
                    : "text-amber-700 dark:text-amber-400"
                )}
              >
                {currentStatus.label}
              </p>
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="bg-owly-surface border border-owly-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-owly-text">
                  Business Hours
                </h3>
                <p className="text-xs text-owly-text-light mt-0.5">
                  When enabled, customers will see your availability status and
                  offline message outside business hours.
                </p>
              </div>
              <button
                onClick={() =>
                  setConfig((c) => ({ ...c, enabled: !c.enabled }))
                }
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
                  config.enabled ? "bg-owly-primary" : "bg-owly-border"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4.5 w-4.5 rounded-full bg-white transition-transform",
                    config.enabled ? "translate-x-5.5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Timezone */}
          <div className="bg-owly-surface border border-owly-border rounded-xl p-5">
            <label className="block text-sm font-semibold text-owly-text mb-2">
              Timezone
            </label>
            <select
              value={config.timezone}
              onChange={(e) =>
                setConfig((c) => ({ ...c, timezone: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-surface text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-theme"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Weekly Schedule */}
          <div className="bg-owly-surface border border-owly-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-owly-text mb-4">
              Weekly Schedule
            </h3>
            <div className="space-y-3">
              {days.map(({ key, label }) => {
                const isOpen = !!config[key];
                const times = parseTime(config[key]);

                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                      isOpen
                        ? "bg-owly-bg border-owly-border"
                        : "bg-owly-bg/50 border-owly-border/50"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium w-28 flex-shrink-0",
                        isOpen ? "text-owly-text" : "text-owly-text-light"
                      )}
                    >
                      {label}
                    </span>

                    <button
                      onClick={() => toggleDay(key)}
                      className={cn(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0",
                        isOpen ? "bg-owly-primary" : "bg-owly-border"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                          isOpen ? "translate-x-4.5" : "translate-x-0.5"
                        )}
                      />
                    </button>

                    {isOpen && times ? (
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={times.start}
                          onChange={(e) =>
                            updateDayTime(key, "start", e.target.value)
                          }
                          className="px-2.5 py-1.5 text-sm border border-owly-border rounded-lg bg-owly-surface text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 transition-theme"
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-owly-text-light">to</span>
                        <select
                          value={times.end}
                          onChange={(e) =>
                            updateDayTime(key, "end", e.target.value)
                          }
                          className="px-2.5 py-1.5 text-sm border border-owly-border rounded-lg bg-owly-surface text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 transition-theme"
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-sm text-owly-text-light italic">
                        Closed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Offline Message */}
          <div className="bg-owly-surface border border-owly-border rounded-xl p-5">
            <label className="block text-sm font-semibold text-owly-text mb-2">
              Offline Message
            </label>
            <p className="text-xs text-owly-text-light mb-3">
              This message will be shown to customers when your support team is
              outside business hours.
            </p>
            <textarea
              value={config.offlineMessage}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  offlineMessage: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-surface text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-theme resize-none"
              placeholder="Enter the message customers will see when you're offline..."
            />
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pb-6">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-owly-success font-medium animate-fade-in">
                <Check className="h-4 w-4" />
                Changes saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-owly-primary text-white rounded-lg hover:bg-owly-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
