"use client";

import { Bell, Search, Sun, Moon, LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/lib/hooks/use-theme";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/login");
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-owly-surface border-b border-owly-border transition-theme">
      <div className="animate-fade-in">
        <h2 className="text-xl font-semibold text-owly-text">{title}</h2>
        {description && (
          <p className="text-sm text-owly-text-light mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {searchOpen && (
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-1.5 text-sm border border-owly-border rounded-lg bg-owly-surface text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary w-64 animate-slide-in-down transition-theme"
            autoFocus
            onBlur={() => setSearchOpen(false)}
          />
        )}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 text-owly-text-light hover:text-owly-text hover:bg-owly-primary-50 rounded-lg transition-colors"
          title="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-owly-text-light hover:text-owly-text hover:bg-owly-primary-50 rounded-lg transition-colors"
          title={theme === "light" ? "Dark mode" : "Light mode"}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>

        <button className="relative p-2 text-owly-text-light hover:text-owly-text hover:bg-owly-primary-50 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-owly-danger rounded-full" />
        </button>

        {actions}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-owly-primary text-white text-sm font-medium hover:bg-owly-primary-dark transition-colors"
          >
            A
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-owly-surface border border-owly-border rounded-lg shadow-lg py-1 z-50 animate-scale-in transition-theme">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  router.push("/settings");
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-owly-text hover:bg-owly-primary-50 transition-colors"
              >
                <User className="h-4 w-4" />
                Profile & Settings
              </button>
              <div className="border-t border-owly-border my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-owly-danger hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
