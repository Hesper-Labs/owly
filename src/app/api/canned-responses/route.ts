import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};

    if (category && category !== "all") {
      where.category = category;
    }

    const responses = await prisma.cannedResponse.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Failed to fetch canned responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch canned responses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, shortcut, isActive } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const response = await prisma.cannedResponse.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || "General",
        shortcut: shortcut?.trim() || "",
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create canned response:", error);
    return NextResponse.json(
      { error: "Failed to create canned response" },
      { status: 500 }
    );
  }
}
