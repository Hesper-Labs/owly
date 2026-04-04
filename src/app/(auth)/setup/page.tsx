"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const STEPS = [
  "Create Admin Account",
  "Business Profile",
  "AI Configuration",
  "You're All Set!",
];

const TONE_OPTIONS = [
  { value: "friendly", label: "Friendly", desc: "Warm and approachable" },
  { value: "professional", label: "Professional", desc: "Formal and business-like" },
  { value: "casual", label: "Casual", desc: "Relaxed and conversational" },
  { value: "concise", label: "Concise", desc: "Short and to the point" },
];

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { value: "claude", label: "Claude (Anthropic)", models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"] },
  { value: "ollama", label: "Ollama (Local)", models: ["llama3", "mistral", "codellama", "phi3"] },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // Step 1 - Admin Account
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 - Business Profile
  const [businessName, setBusinessName] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("Hello! How can I help you today?");
  const [tone, setTone] = useState("friendly");

  // Step 3 - AI Configuration
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [aiApiKey, setAiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Step 4 - Summary
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (!data.setupRequired) {
          router.replace("/login");
          return;
        }
      } catch {
        // Allow setup page to render
      }
      setChecking(false);
    }
    checkSetup();
  }, [router]);

  function currentModels() {
    return PROVIDER_OPTIONS.find((p) => p.value === aiProvider)?.models || [];
  }

  async function handleNext() {
    setError("");
    setLoading(true);

    try {
      if (step === 0) {
        // Validate admin fields
        if (!name.trim() || !username.trim() || !password) {
          setError("All fields are required.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "setup", name, username, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Setup failed.");
          setLoading(false);
          return;
        }
        setCompletedSteps((prev) => [...prev, 0]);
        setStep(1);
      } else if (step === 1) {
        const body: Record<string, string> = {};
        if (businessName.trim()) body.businessName = businessName.trim();
        if (businessDesc.trim()) body.businessDesc = businessDesc.trim();
        if (welcomeMessage.trim()) body.welcomeMessage = welcomeMessage.trim();
        body.tone = tone;

        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to save business profile.");
          setLoading(false);
          return;
        }
        setCompletedSteps((prev) => [...prev, 1]);
        setStep(2);
      } else if (step === 2) {
        const body: Record<string, string> = {
          aiProvider,
          aiModel,
        };
        if (aiApiKey.trim()) body.aiApiKey = aiApiKey.trim();

        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to save AI configuration.");
          setLoading(false);
          return;
        }
        setCompletedSteps((prev) => [...prev, 2]);
        setStep(3);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  }

  function handleBack() {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-owly-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-owly-surface rounded-2xl shadow-lg border border-owly-border overflow-hidden">
      {/* Header */}
      <div className="bg-owly-primary-50 border-b border-owly-border px-8 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <Image src="/owly.png" alt="Owly" width={40} height={40} />
          <div>
            <h1 className="text-lg font-bold text-owly-text">Set Up Owly</h1>
            <p className="text-xs text-owly-text-light">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-colors duration-300"
              style={{
                backgroundColor:
                  i <= step
                    ? "var(--owly-primary)"
                    : "var(--owly-border)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-8 py-6">
        <h2 className="text-xl font-bold text-owly-text mb-1">
          {STEPS[step]}
        </h2>

        {/* Step 0: Admin Account */}
        {step === 0 && (
          <>
            <p className="text-sm text-owly-text-light mb-6">
              Create your administrator account to get started.
            </p>
            <div className="space-y-4">
              <Field
                id="name"
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="Your name"
                autoComplete="name"
              />
              <Field
                id="username"
                label="Username"
                value={username}
                onChange={setUsername}
                placeholder="Choose a username"
                autoComplete="username"
              />
              <Field
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <Field
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </div>
          </>
        )}

        {/* Step 1: Business Profile */}
        {step === 1 && (
          <>
            <p className="text-sm text-owly-text-light mb-6">
              Tell us about your business so Owly can represent you.
            </p>
            <div className="space-y-4">
              <Field
                id="businessName"
                label="Business Name"
                value={businessName}
                onChange={setBusinessName}
                placeholder="Your company or brand name"
              />
              <div>
                <label
                  htmlFor="businessDesc"
                  className="block text-sm font-medium text-owly-text mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="businessDesc"
                  rows={3}
                  value={businessDesc}
                  onChange={(e) => setBusinessDesc(e.target.value)}
                  placeholder="Briefly describe what your business does"
                  className="w-full rounded-lg border border-owly-border bg-owly-bg px-3.5 py-2.5 text-sm text-owly-text placeholder:text-owly-text-light focus:outline-none focus:ring-2 focus:ring-owly-primary focus:border-transparent transition-shadow resize-none"
                />
              </div>
              <Field
                id="welcomeMessage"
                label="Welcome Message"
                value={welcomeMessage}
                onChange={setWelcomeMessage}
                placeholder="The first message customers see"
              />
              <div>
                <label className="block text-sm font-medium text-owly-text mb-2">
                  Response Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        tone === t.value
                          ? "border-owly-primary bg-owly-primary-50 ring-1 ring-owly-primary"
                          : "border-owly-border bg-owly-bg hover:border-owly-primary-light"
                      }`}
                    >
                      <div className="text-sm font-medium text-owly-text">
                        {t.label}
                      </div>
                      <div className="text-xs text-owly-text-light">
                        {t.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: AI Configuration */}
        {step === 2 && (
          <>
            <p className="text-sm text-owly-text-light mb-6">
              Configure the AI model that powers your support agent.
            </p>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="aiProvider"
                  className="block text-sm font-medium text-owly-text mb-1.5"
                >
                  AI Provider
                </label>
                <select
                  id="aiProvider"
                  value={aiProvider}
                  onChange={(e) => {
                    const prov = e.target.value;
                    setAiProvider(prov);
                    const models =
                      PROVIDER_OPTIONS.find((p) => p.value === prov)?.models ||
                      [];
                    setAiModel(models[0] || "");
                  }}
                  className="w-full rounded-lg border border-owly-border bg-owly-bg px-3.5 py-2.5 text-sm text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary focus:border-transparent transition-shadow"
                >
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="aiModel"
                  className="block text-sm font-medium text-owly-text mb-1.5"
                >
                  Model
                </label>
                <select
                  id="aiModel"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full rounded-lg border border-owly-border bg-owly-bg px-3.5 py-2.5 text-sm text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary focus:border-transparent transition-shadow"
                >
                  {currentModels().map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="aiApiKey"
                  className="block text-sm font-medium text-owly-text mb-1.5"
                >
                  API Key
                  {aiProvider === "ollama" && (
                    <span className="ml-1 font-normal text-owly-text-light">
                      (not required for local models)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="aiApiKey"
                    type={showApiKey ? "text" : "password"}
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder={
                      aiProvider === "ollama"
                        ? "Optional"
                        : "Enter your API key"
                    }
                    className="w-full rounded-lg border border-owly-border bg-owly-bg px-3.5 py-2.5 pr-16 text-sm text-owly-text placeholder:text-owly-text-light focus:outline-none focus:ring-2 focus:ring-owly-primary focus:border-transparent transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-owly-primary hover:bg-owly-primary-50 transition-colors"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <>
            <p className="text-sm text-owly-text-light mb-6">
              Your Owly instance is ready to go.
            </p>
            <div className="space-y-3 mb-6">
              <SummaryRow
                done={completedSteps.includes(0)}
                label="Admin account created"
                detail={username}
              />
              <SummaryRow
                done={completedSteps.includes(1)}
                label="Business profile configured"
                detail={businessName || "Default settings"}
              />
              <SummaryRow
                done={completedSteps.includes(2)}
                label="AI provider configured"
                detail={`${PROVIDER_OPTIONS.find((p) => p.value === aiProvider)?.label} / ${aiModel}`}
              />
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-owly-danger">
            {error}
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="border-t border-owly-border px-8 py-4 flex items-center justify-between">
        {step > 0 && step < 3 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="rounded-lg border border-owly-border bg-white px-4 py-2 text-sm font-medium text-owly-text hover:bg-owly-bg disabled:opacity-60 transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="rounded-lg bg-owly-primary px-5 py-2 text-sm font-semibold text-white hover:bg-owly-primary-dark focus:outline-none focus:ring-2 focus:ring-owly-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : step === 2 ? (
              "Finish Setup"
            ) : (
              "Next"
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="rounded-lg bg-owly-primary px-5 py-2 text-sm font-semibold text-white hover:bg-owly-primary-dark focus:outline-none focus:ring-2 focus:ring-owly-primary focus:ring-offset-2 transition-colors"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

/* ---- Helper Components ---- */

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-owly-text mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-owly-border bg-owly-bg px-3.5 py-2.5 text-sm text-owly-text placeholder:text-owly-text-light focus:outline-none focus:ring-2 focus:ring-owly-primary focus:border-transparent transition-shadow"
      />
    </div>
  );
}

function SummaryRow({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-owly-border bg-owly-bg px-4 py-3">
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? "bg-owly-success text-white"
            : "bg-owly-border text-owly-text-light"
        }`}
      >
        {done ? (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <span>-</span>
        )}
      </div>
      <div>
        <div className="text-sm font-medium text-owly-text">{label}</div>
        <div className="text-xs text-owly-text-light">{detail}</div>
      </div>
    </div>
  );
}
