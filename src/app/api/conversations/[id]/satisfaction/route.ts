import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { rating } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  const conversation = await prisma.conversation.update({
    where: { id },
    data: { satisfaction: rating },
  });

  return NextResponse.json({
    success: true,
    satisfaction: conversation.satisfaction,
  });
}
