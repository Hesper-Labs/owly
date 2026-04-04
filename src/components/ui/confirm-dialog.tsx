"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Info, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  icon,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      setLoading(false);
    }
  }, [open]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }, [onConfirm]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current && !loading) {
        onCancel();
      }
    },
    [onCancel, loading]
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel, loading]);

  if (!open) return null;

  const DefaultIcon = destructive ? AlertTriangle : Info;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={cn(
        "fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-xl bg-owly-surface border border-owly-border shadow-xl p-6 transition-all duration-200",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "shrink-0 flex items-center justify-center rounded-full p-2",
              destructive
                ? "bg-red-50 text-owly-danger"
                : "bg-owly-primary-50 text-owly-primary"
            )}
          >
            {icon || <DefaultIcon className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-owly-text">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-owly-text-light">{description}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="shrink-0 rounded p-1 text-owly-text-light hover:text-owly-text transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-owly-border bg-owly-surface px-4 py-2 text-sm font-medium text-owly-text hover:bg-owly-bg transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-70 flex items-center gap-2",
              destructive
                ? "bg-owly-danger hover:bg-red-600"
                : "bg-owly-primary hover:bg-owly-primary-dark"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
