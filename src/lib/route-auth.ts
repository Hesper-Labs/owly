import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

interface AuthContext {
  userId: string;
  role: string;
  username: string;
  name: string;
}

/**
 * Authenticate and authorize an API request.
 * Returns the auth context or a 401/403 response.
 */
export async function requireAuth(
  request: NextRequest,
  permission?: Permission
): Promise<AuthContext | NextResponse> {
  const token = request.cookies.get("owly-token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } },
      { status: 401 }
    );
  }

  // Check permission if specified
  if (permission && !hasPermission(payload.role, permission)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  const admin = await prisma.admin.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, name: true, role: true },
  });

  if (!admin) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "User not found" } },
      { status: 401 }
    );
  }

  return {
    userId: admin.id,
    role: admin.role,
    username: admin.username,
    name: admin.name,
  };
}

/**
 * Type guard: check if result is an auth context (not an error response).
 */
export function isAuthenticated(
  result: AuthContext | NextResponse
): result is AuthContext {
  return !(result instanceof NextResponse);
}
