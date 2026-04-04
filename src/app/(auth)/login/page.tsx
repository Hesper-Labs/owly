"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (data.setupRequired) {
          router.replace("/setup");
          return;
        }
        if (data.authenticated) {
          router.replace("/");
          return;
        }
      } catch {
        // Allow login page to render
      }
      setChecking(false);
    }
    checkAuth();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      router.replace("/");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-owly-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-owly-surface rounded-2xl shadow-lg border border-owly-border p-8">
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/owly.png"
          alt="Owly"
          width={56}
          height={56}
          className="mb-4"
        />
        <h1 className="text-2xl font-bold text-owly-text">
          Welcome to Owly
        </h1>
        <p className="text-owly-text-light text-sm mt-1">
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-owly-text mb-1.5"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-owly-border bg-owly-bg px-3.5 py-2.5 text-sm text-owly-text placeholder:text-owly-text-light focus:outline-none focus:ring-2 focus:ring-owly-primary focus:border-transparent transition-shadow"
            placeholder="Enter your username"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-owly-text mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-owly-border bg-owly-bg px-3.5 py-2.5 text-sm text-owly-text placeholder:text-owly-text-light focus:outline-none focus:ring-2 focus:ring-owly-primary focus:border-transparent transition-shadow"
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-owly-danger">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-owly-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-owly-primary-dark focus:outline-none focus:ring-2 focus:ring-owly-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
}
