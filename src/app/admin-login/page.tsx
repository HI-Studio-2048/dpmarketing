"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] shadow-lg shadow-[var(--accent-blue)]/20">
            <Mail size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            DP Marketing
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Sign in to your dashboard
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
        >
          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]/30"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-[var(--accent-blue)] py-3 text-sm font-medium text-white transition-all hover:bg-[var(--accent-blue)]/90 hover:shadow-lg hover:shadow-[var(--accent-blue)]/20 disabled:opacity-40"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
