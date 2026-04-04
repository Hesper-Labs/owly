import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "7d":
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "7d";
  const periodStart = getPeriodStart(period);

  const [
    conversations,
    allConversations,
    channelGroups,
    ticketsByPriority,
    ticketsByStatus,
    categories,
    teamMembers,
    messages,
  ] = await Promise.all([
    // Conversations in period
    prisma.conversation.findMany({
      where: { createdAt: { gte: periodStart } },
      select: { id: true, createdAt: true, satisfaction: true, status: true },
    }),

    // All conversations (for resolution rate)
    prisma.conversation.findMany({
      select: { status: true },
    }),

    // Channel breakdown in period
    prisma.conversation.groupBy({
      by: ["channel"],
      where: { createdAt: { gte: periodStart } },
      _count: { id: true },
    }),

    // Tickets by priority in period
    prisma.ticket.groupBy({
      by: ["priority"],
      where: { createdAt: { gte: periodStart } },
      _count: { id: true },
    }),

    // Tickets by status in period
    prisma.ticket.groupBy({
      by: ["status"],
      where: { createdAt: { gte: periodStart } },
      _count: { id: true },
    }),

    // Top categories by entry count
    prisma.category.findMany({
      select: { name: true, _count: { select: { entries: true } } },
      orderBy: { entries: { _count: "desc" } },
      take: 8,
    }),

    // Team members with their resolved tickets in period
    prisma.teamMember.findMany({
      select: {
        name: true,
        tickets: {
          where: {
            createdAt: { gte: periodStart },
          },
          select: { status: true, createdAt: true, updatedAt: true },
        },
      },
    }),

    // Messages in period for response time estimation
    prisma.message.findMany({
      where: { createdAt: { gte: periodStart } },
      select: {
        conversationId: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // -- Conversations per day --
  const dayMap: Record<string, number> = {};
  const dayCount = period === "90d" ? 90 : period === "30d" ? 30 : 7;
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000);
    dayMap[formatDateKey(d)] = 0;
  }
  for (const c of conversations) {
    const key = formatDateKey(new Date(c.createdAt));
    if (key in dayMap) dayMap[key]++;
  }
  const conversationsPerDay = Object.entries(dayMap).map(([date, count]) => ({
    date,
    count,
  }));

  // -- Channel breakdown --
  const channelBreakdown = channelGroups.map((g) => ({
    channel: g.channel,
    count: g._count.id,
  }));

  // -- Avg response time (estimate from first assistant reply per conversation) --
  const convFirstResponse: Record<string, number> = {};
  const convStart: Record<string, Date> = {};
  for (const m of messages) {
    if (m.role === "user" && !convStart[m.conversationId]) {
      convStart[m.conversationId] = new Date(m.createdAt);
    }
    if (
      m.role === "assistant" &&
      convStart[m.conversationId] &&
      !convFirstResponse[m.conversationId]
    ) {
      const diffMs =
        new Date(m.createdAt).getTime() -
        convStart[m.conversationId].getTime();
      convFirstResponse[m.conversationId] = diffMs / 60000; // minutes
    }
  }
  const responseTimes = Object.values(convFirstResponse);
  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(
          (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) *
            10
        ) / 10
      : 0;

  // -- Resolution rate --
  const resolved = allConversations.filter(
    (c) => c.status === "resolved" || c.status === "closed"
  ).length;
  const resolutionRate =
    allConversations.length > 0
      ? Math.round((resolved / allConversations.length) * 100)
      : 0;

  // -- Satisfaction average --
  const rated = conversations.filter((c) => c.satisfaction != null);
  const satisfactionAvg =
    rated.length > 0
      ? Math.round(
          (rated.reduce((sum, c) => sum + (c.satisfaction ?? 0), 0) /
            rated.length) *
            10
        ) / 10
      : 0;

  // -- Top categories --
  const topCategories = categories.map((c) => ({
    category: c.name,
    hitCount: c._count.entries,
  }));

  // -- Team performance --
  const teamPerformance = teamMembers
    .map((tm) => {
      const resolvedTickets = tm.tickets.filter(
        (t) => t.status === "resolved" || t.status === "closed"
      );
      const times = resolvedTickets.map(
        (t) =>
          (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) /
          60000
      );
      const avg =
        times.length > 0
          ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
          : 0;
      return {
        member: tm.name,
        ticketsResolved: resolvedTickets.length,
        avgTime: avg,
      };
    })
    .filter((t) => t.ticketsResolved > 0)
    .sort((a, b) => b.ticketsResolved - a.ticketsResolved);

  return NextResponse.json({
    conversationsPerDay,
    channelBreakdown,
    avgResponseTime,
    resolutionRate,
    satisfactionAvg,
    ticketsByPriority: ticketsByPriority.map((g) => ({
      priority: g.priority,
      count: g._count.id,
    })),
    ticketsByStatus: ticketsByStatus.map((g) => ({
      status: g.status,
      count: g._count.id,
    })),
    topCategories,
    teamPerformance,
    totalConversations: conversations.length,
  });
}
