import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/ui/stat-card";
import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";
import { prisma } from "@/lib/prisma";
import {
  MessageSquare,
  Users,
  Ticket,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { formatRelativeTime, getChannelLabel, getStatusColor } from "@/lib/utils";

async function getStats() {
  const [
    totalConversations,
    activeConversations,
    totalTickets,
    openTickets,
    totalMessages,
    recentConversations,
  ] = await Promise.all([
    prisma.conversation.count(),
    prisma.conversation.count({ where: { status: "active" } }),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "open" } }),
    prisma.message.count(),
    prisma.conversation.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { take: 1, orderBy: { createdAt: "desc" } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const resolvedConversations = await prisma.conversation.count({
    where: { status: "resolved" },
  });

  const resolutionRate =
    totalConversations > 0
      ? Math.round((resolvedConversations / totalConversations) * 100)
      : 0;

  return {
    totalConversations,
    activeConversations,
    totalTickets,
    openTickets,
    totalMessages,
    resolutionRate,
    recentConversations,
  };
}

const channelIcons: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  email: Mail,
  phone: Phone,
};

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of your customer support activity"
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <OnboardingChecklist />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Conversations"
            value={stats.totalConversations}
            icon={MessageSquare}
          />
          <StatCard
            title="Active Now"
            value={stats.activeConversations}
            icon={Clock}
            iconColor="bg-green-50 text-green-600"
          />
          <StatCard
            title="Open Tickets"
            value={stats.openTickets}
            icon={Ticket}
            iconColor="bg-orange-50 text-orange-600"
          />
          <StatCard
            title="Resolution Rate"
            value={`${stats.resolutionRate}%`}
            icon={CheckCircle}
            iconColor="bg-blue-50 text-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-owly-surface rounded-xl border border-owly-border">
            <div className="px-5 py-4 border-b border-owly-border">
              <h3 className="font-semibold text-owly-text">
                Recent Conversations
              </h3>
            </div>
            <div className="divide-y divide-owly-border">
              {stats.recentConversations.length === 0 ? (
                <div className="px-5 py-12 text-center text-owly-text-light">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No conversations yet</p>
                  <p className="text-sm mt-1">
                    Conversations will appear here once customers start reaching
                    out
                  </p>
                </div>
              ) : (
                stats.recentConversations.map((conv) => {
                  const ChannelIcon =
                    channelIcons[conv.channel] || MessageSquare;
                  const lastMessage = conv.messages[0];
                  return (
                    <div
                      key={conv.id}
                      className="px-5 py-3.5 hover:bg-owly-primary-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-owly-primary-50 text-owly-primary mt-0.5">
                          <ChannelIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-owly-text truncate">
                              {conv.customerName}
                            </p>
                            <span className="text-xs text-owly-text-light flex-shrink-0 ml-2">
                              {formatRelativeTime(conv.updatedAt)}
                            </span>
                          </div>
                          <p className="text-xs text-owly-text-light mt-0.5">
                            {getChannelLabel(conv.channel)} -{" "}
                            {conv._count.messages} messages
                          </p>
                          {lastMessage && (
                            <p className="text-sm text-owly-text-light mt-1 truncate">
                              {lastMessage.content}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conv.status)}`}
                        >
                          {conv.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-owly-surface rounded-xl border border-owly-border">
              <div className="px-5 py-4 border-b border-owly-border">
                <h3 className="font-semibold text-owly-text">
                  Channel Overview
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  {
                    name: "WhatsApp",
                    icon: MessageCircle,
                    color: "text-green-600",
                  },
                  { name: "Email", icon: Mail, color: "text-blue-600" },
                  { name: "Phone", icon: Phone, color: "text-purple-600" },
                ].map((channel) => (
                  <div
                    key={channel.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <channel.icon
                        className={`h-4 w-4 ${channel.color}`}
                      />
                      <span className="text-sm font-medium">
                        {channel.name}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                      Disconnected
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-owly-surface rounded-xl border border-owly-border">
              <div className="px-5 py-4 border-b border-owly-border">
                <h3 className="font-semibold text-owly-text">Quick Stats</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-owly-text-light">Total Messages</span>
                  <span className="font-medium">{stats.totalMessages}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-owly-text-light">Total Tickets</span>
                  <span className="font-medium">{stats.totalTickets}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-owly-text-light">
                    Avg. Resolution Rate
                  </span>
                  <span className="font-medium">{stats.resolutionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
