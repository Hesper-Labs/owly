"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeStore {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", newTheme === "dark");
          }
          return { theme: newTheme };
        }),
      setTheme: (theme) => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
        set({ theme });
      },
    }),
    {
      name: "owly-theme",
      onRehydrateStorage: () => (state) => {
        if (state?.theme === "dark" && typeof document !== "undefined") {
          document.documentElement.classList.add("dark");
        }
      },
    }
  )
);
