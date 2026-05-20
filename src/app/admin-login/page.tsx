"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";

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
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.push("/admin");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] shadow-lg shadow-[var(--accent-blue)]/20">
            <Mail size={24} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Daniel Philip
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Admin Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8">
          <h2 className="mb-6 text-center text-base font-semibold text-[var(--text-primary)]">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                  placeholder="Enter your password"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-[var(--accent-red)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] py-3 text-sm font-medium text-white shadow-lg shadow-[var(--accent-blue)]/20 transition-all hover:shadow-xl hover:shadow-[var(--accent-blue)]/30 disabled:opacity-30"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
