"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose]
  );

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
    >
      <div
        className={cn(
          "w-full rounded-xl bg-owly-surface border border-owly-border shadow-xl animate-scale-in",
          sizeStyles[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-owly-border px-6 py-4">
            <h2 className="text-base font-semibold text-owly-text">{title}</h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-owly-text-light hover:text-owly-text hover:bg-owly-bg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className={cn("px-6 py-5", !title && "pt-6")}>
          {!title && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded p-1 text-owly-text-light hover:text-owly-text hover:bg-owly-bg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {children}
        </div>

        {footer && (
          <div className="border-t border-owly-border px-6 py-4 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
