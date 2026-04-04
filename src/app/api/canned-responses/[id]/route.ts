import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, category, shortcut, isActive, usageCount } = body;

    const existing = await prisma.cannedResponse.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Canned response not found" },
        { status: 404 }
      );
    }

    const response = await prisma.cannedResponse.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(shortcut !== undefined && { shortcut: shortcut.trim() }),
        ...(isActive !== undefined && { isActive }),
        ...(usageCount !== undefined && { usageCount }),
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update canned response:", error);
    return NextResponse.json(
      { error: "Failed to update canned response" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.cannedResponse.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Canned response not found" },
        { status: 404 }
      );
    }

    await prisma.cannedResponse.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete canned response:", error);
    return NextResponse.json(
      { error: "Failed to delete canned response" },
      { status: 500 }
    );
  }
}
