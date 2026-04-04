import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const startTime = Date.now();

export async function GET() {
  let dbStatus = "connected";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  const uptimeMs = Date.now() - startTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    version: "0.1.0",
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    database: dbStatus,
  });
}
