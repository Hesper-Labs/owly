"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SatisfactionWidgetProps {
  conversationId: string;
  currentRating?: number | null;
  onRate?: (rating: number) => void;
  compact?: boolean;
}

export function SatisfactionWidget({
  conversationId,
  currentRating,
  onRate,
  compact = false,
}: SatisfactionWidgetProps) {
  const [rating, setRating] = useState(currentRating || 0);
  const [hovering, setHovering] = useState(0);
  const [submitted, setSubmitted] = useState(!!currentRating);
  const [submitting, setSubmitting] = useState(false);

  const labels = ["", "Very Poor", "Poor", "Average", "Good", "Excellent"];

  const handleRate = async (value: number) => {
    setRating(value);
    setSubmitting(true);

    try {
      await fetch(`/api/conversations/${conversationId}/satisfaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });
      setSubmitted(true);
      onRate?.(value);
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={cn(
              "h-3.5 w-3.5 cursor-pointer transition-colors",
              value <= (hovering || rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-owly-border"
            )}
            onMouseEnter={() => !submitted && setHovering(value)}
            onMouseLeave={() => setHovering(0)}
            onClick={() => !submitted && handleRate(value)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-owly-primary-50 rounded-lg p-4 text-center animate-slide-in-up transition-theme">
      {submitted ? (
        <div>
          <p className="text-sm font-medium text-owly-text">
            Thank you for your feedback!
          </p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                className={cn(
                  "h-5 w-5",
                  value <= rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-owly-border"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-owly-text-light mt-1">
            {labels[rating]}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-owly-text">
            How would you rate this conversation?
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                disabled={submitting}
                className="group"
                onMouseEnter={() => setHovering(value)}
                onMouseLeave={() => setHovering(0)}
                onClick={() => handleRate(value)}
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-all",
                    value <= (hovering || rating)
                      ? "text-yellow-400 fill-yellow-400 scale-110"
                      : "text-owly-border group-hover:text-yellow-300"
                  )}
                />
              </button>
            ))}
          </div>
          {hovering > 0 && (
            <p className="text-xs text-owly-text-light mt-2 animate-fade-in">
              {labels[hovering]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
