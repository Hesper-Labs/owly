import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateConversationSummary } from "@/lib/ai/engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        tags: {
          include: { tag: true },
        },
        tickets: {
          include: {
            department: true,
            assignedTo: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Failed to fetch conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, customerName, customerContact, summary, satisfaction, tagIds } = body;

    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(customerName !== undefined && { customerName: customerName.trim() }),
        ...(customerContact !== undefined && { customerContact: customerContact.trim() }),
        ...(summary !== undefined && { summary: summary.trim() }),
        ...(satisfaction !== undefined && { satisfaction }),
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        tags: {
          include: { tag: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    // Auto-generate summary when status changes to resolved or closed
    if (
      status !== undefined && 
      (status === "resolved" || status === "closed") && 
      (existing.status !== "resolved" && existing.status !== "closed") &&
      !summary
    ) {
      // Call summary generation asynchronously so we don't block the UI update as much,
      // but wait for it so the response has the summary immediately if possible.
      // Wait, let's just generate it and update the memory item.
      try {
        conversation.summary = await generateConversationSummary(id);
      } catch (err) {
        console.error("Auto-summary generation failed:", err);
      }
    }

    if (tagIds && Array.isArray(tagIds)) {
      await prisma.conversationTag.deleteMany({
        where: { conversationId: id },
      });

      if (tagIds.length > 0) {
        await prisma.conversationTag.createMany({
          data: tagIds.map((tagId: string) => ({
            conversationId: id,
            tagId,
          })),
        });
      }

      const updated = await prisma.conversation.findUnique({
        where: { id },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          tags: { include: { tag: true } },
          _count: { select: { messages: true } },
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Failed to update conversation:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
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

    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    await prisma.conversation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
