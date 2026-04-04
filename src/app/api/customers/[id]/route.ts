import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Find linked conversations by matching email, phone, or whatsapp
    const contactFilters: Record<string, unknown>[] = [];
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

    let conversations: unknown[] = [];
    if (contactFilters.length > 0) {
      conversations = await prisma.conversation.findMany({
        where: { OR: contactFilters },
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { messages: true } },
          tags: { include: { tag: true } },
        },
      });
    }

    return NextResponse.json({ ...customer, conversations });
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
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
    const { name, email, phone, whatsapp, tags, isBlocked, metadata } = body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email: email.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(whatsapp !== undefined && { whatsapp: whatsapp.trim() }),
        ...(tags !== undefined && { tags: tags.trim() }),
        ...(isBlocked !== undefined && { isBlocked }),
        ...(metadata !== undefined && { metadata }),
        lastContact: new Date(),
      },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { notes: true } },
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Failed to update customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
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

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    await prisma.customer.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
