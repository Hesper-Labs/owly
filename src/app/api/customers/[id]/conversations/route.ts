import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const { page, limit, skip, take } = parsePagination(searchParams);
    const channel = searchParams.get("channel");

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { id: true, email: true, phone: true, whatsapp: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Build cross-channel query: match by customerId OR any contact field
    const contactFilters: Record<string, unknown>[] = [{ customerId: id }];

    if (customer.email) {
      contactFilters.push({
        customerContact: { equals: customer.email, mode: "insensitive" },
      });
    }
    if (customer.phone) {
      contactFilters.push({ customerContact: customer.phone });
    }
    if (customer.whatsapp) {
      contactFilters.push({ customerContact: customer.whatsapp });
    }

    const where: Record<string, unknown> = { OR: contactFilters };

    if (channel && channel !== "all") {
      where.channel = channel;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
        include: {
          messages: { take: 1, orderBy: { createdAt: "desc" } },
          _count: { select: { messages: true } },
          tags: { include: { tag: true } },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(conversations, total, page, limit));
  } catch (error) {
    logger.error("Failed to fetch customer conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer conversations" },
      { status: 500 }
    );
  }
}
