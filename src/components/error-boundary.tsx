"use client";

import React from "react";
import { useToast } from "@/components/ui/toast";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  toast?: ReturnType<typeof useToast>["toast"];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (this.props.toast) {
      this.props.toast({
        type: "error",
        title: "Application Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
    console.error("ErrorBoundary caught:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return <ErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  const { toast } = useToast();
  return <ErrorBoundaryInner {...props} toast={toast} />;
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-owly-danger" />
        </div>
        <h2 className="text-lg font-semibold text-owly-text">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-owly-text-light">
          An unexpected error occurred. You can try again or return to the
          dashboard.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-owly-border bg-owly-surface px-4 py-2 text-sm font-medium text-owly-text hover:bg-owly-bg transition-colors"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </a>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-owly-primary px-4 py-2 text-sm font-medium text-white hover:bg-owly-primary-dark transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
