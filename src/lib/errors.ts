import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  requestId?: string,
  details?: unknown
): NextResponse {
  const error: Record<string, unknown> = { code, message };
  if (details) error.details = details;
  if (requestId) error.requestId = requestId;

  return NextResponse.json({ error }, { status: statusCode });
}

// Common error factories
export const Errors = {
  notFound: (resource: string, requestId?: string) =>
    errorResponse(404, "NOT_FOUND", `${resource} not found`, requestId),

  badRequest: (message: string, requestId?: string, details?: unknown) =>
    errorResponse(400, "VALIDATION_ERROR", message, requestId, details),

  unauthorized: (requestId?: string) =>
    errorResponse(401, "UNAUTHORIZED", "Authentication required", requestId),

  forbidden: (requestId?: string) =>
    errorResponse(403, "FORBIDDEN", "Insufficient permissions", requestId),

  tooManyRequests: (retryAfter: number, requestId?: string) => {
    const response = errorResponse(
      429,
      "RATE_LIMIT_EXCEEDED",
      "Too many requests. Please try again later.",
      requestId
    );
    response.headers.set("Retry-After", String(retryAfter));
    return response;
  },

  internal: (requestId?: string) =>
    errorResponse(
      500,
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      requestId
    ),
} as const;
