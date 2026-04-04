import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rules = await prisma.sLARule.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Failed to fetch SLA rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch SLA rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, channel, priority, firstResponseMins, resolutionMins, isActive } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Rule name is required" },
        { status: 400 }
      );
    }

    const rule = await prisma.sLARule.create({
      data: {
        name: name.trim(),
        description: description?.trim() || "",
        channel: channel || "all",
        priority: priority || "all",
        firstResponseMins: firstResponseMins ?? 30,
        resolutionMins: resolutionMins ?? 480,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Failed to create SLA rule:", error);
    return NextResponse.json(
      { error: "Failed to create SLA rule" },
      { status: 500 }
    );
  }
}
