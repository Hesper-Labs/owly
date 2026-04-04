"use client";

import { useEffect } from "react";
import { useTheme } from "@/lib/hooks/use-theme";

export function ThemeInit() {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
