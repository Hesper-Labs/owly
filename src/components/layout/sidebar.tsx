"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageSquare,
  Settings,
  Radio,
  Ticket,
  BarChart3,
  ScrollText,
  Timer,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Conversations", href: "/conversations", icon: MessageSquare },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { name: "Team", href: "/team", icon: Users },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Activity Log", href: "/activity", icon: ScrollText },
  { name: "Channels", href: "/channels", icon: Radio },
  { name: "SLA Rules", href: "/sla", icon: Timer },
  { name: "Canned Responses", href: "/canned-responses", icon: Zap },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col bg-owly-sidebar text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <Image
          src="/owly.png"
          alt="Owly"
          width={36}
          height={36}
          className="rounded-lg flex-shrink-0"
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight">Owly</h1>
            <p className="text-xs text-white/50">AI Customer Support</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-owly-sidebar-active text-white"
                  : "text-white/70 hover:bg-owly-sidebar-hover hover:text-white"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-white/50 hover:text-white hover:bg-owly-sidebar-hover transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
