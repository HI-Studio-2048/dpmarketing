"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/" className="text-lg tracking-[0.2em] uppercase text-[#121212]">
            Daniel Philip
          </Link>
          <p className="mt-3 text-xs tracking-wider uppercase text-[#121212]/40">
            Admin Access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs tracking-wider uppercase text-[#121212]/60"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-[#121212]/20 bg-transparent py-3 text-sm text-[#121212] placeholder:text-[#121212]/30 focus:border-[#121212] focus:outline-none"
              placeholder="Enter your password"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-[#121212] bg-[#121212] px-6 py-3 text-sm tracking-wider uppercase text-white hover:bg-white hover:text-[#121212] disabled:opacity-30"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
