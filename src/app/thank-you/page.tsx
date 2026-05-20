"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const SCENTS: Record<string, { name: string; emoji: string }> = {
  oud: { name: "Oud Royale", emoji: "👑" },
  citrus: { name: "Citrus Bloom", emoji: "🌸" },
  rose: { name: "Rose Amber", emoji: "🌹" },
  noir: { name: "Noir Smoke", emoji: "🌙" },
};

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const scentMatch = searchParams.get("scent") || "oud";
  const scent = SCENTS[scentMatch] || SCENTS.oud;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          {/* Success Message */}
          <div className="rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mb-4 text-5xl">✨</div>
            <h1 className="mb-2 text-3xl font-bold text-slate-900">
              Welcome to Your Scent Journey
            </h1>
            <p className="mb-6 text-slate-600">
              We've matched you with the perfect fragrance and sent everything to your email.
            </p>

            {/* Scent Match */}
            <div className="mb-6 rounded-lg border-2 border-amber-500 bg-amber-50 p-4">
              <p className="text-sm text-slate-600">Your perfect match:</p>
              <p className="mt-2 text-2xl font-bold">
                {scent.emoji} {scent.name}
              </p>
            </div>

            <p className="mb-6 text-sm text-slate-600">
              Check your inbox for your welcome offer and exclusive details about your scent.
            </p>

            <div className="space-y-3">
              <Link
                href="/"
                className="block rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
              >
                Back to Home
              </Link>
            </div>
          </div>

          {/* Instagram CTA */}
          <div className="rounded-2xl bg-gradient-to-r from-purple-900 to-pink-900 p-8 text-center text-white shadow-2xl">
            <div className="mb-3 text-3xl">📱</div>
            <h3 className="mb-2 text-xl font-bold">
              Want a personal recommendation?
            </h3>
            <p className="mb-6 text-slate-300">
              DM @its.danielphilip on Instagram with your scent match to get a
              personalized offer
            </p>
            <a
              href="https://instagram.com/its.danielphilip"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-white px-6 py-3 font-bold text-pink-900 hover:bg-slate-100"
            >
              Message on Instagram →
            </a>
          </div>

          {/* Newsletter Signup */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 text-center text-white">
            <p className="text-sm text-slate-300">
              Stay updated on new scents and exclusive offers
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
