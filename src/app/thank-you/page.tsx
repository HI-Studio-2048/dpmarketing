"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const SCENTS: Record<string, { name: string; tagline: string }> = {
  oud: { name: "Oud Royale", tagline: "Bold. Commanding. Unmistakable." },
  citrus: { name: "Citrus Bloom", tagline: "Fresh. Modern. Effortless." },
  rose: { name: "Rose Amber", tagline: "Warm. Captivating. Unforgettable." },
  noir: { name: "Noir Smoke", tagline: "Grounded. Timeless. Confident." },
};

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const scentMatch = searchParams.get("scent") || "oud";
  const scent = SCENTS[scentMatch] || SCENTS.oud;

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#121212]/10 px-6 py-6 text-center">
        <Link href="/" className="text-lg tracking-[0.2em] uppercase text-[#121212]">
          Daniel Philip
        </Link>
      </header>

      <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          {/* Result */}
          <p className="mb-6 text-xs tracking-[0.3em] uppercase text-[#121212]/40">
            Your Match
          </p>
          <h1 className="mb-3 text-4xl font-light text-[#121212]">
            {scent.name}
          </h1>
          <p className="mb-10 text-sm font-light tracking-wide text-[#121212]/60">
            {scent.tagline}
          </p>

          {/* Divider */}
          <div className="mx-auto mb-10 w-12 border-t border-[#121212]/20" />

          <p className="mb-10 text-sm font-light leading-relaxed text-[#121212]/60">
            We&apos;ve sent your personalized recommendation to your email.
            Check your inbox for exclusive details and a welcome offer.
          </p>

          {/* Instagram CTA */}
          <div className="mb-10 border border-[#121212]/10 p-8">
            <p className="mb-2 text-xs tracking-[0.3em] uppercase text-[#121212]/40">
              Get a Personal Recommendation
            </p>
            <p className="mb-6 text-sm font-light text-[#121212]/60">
              DM @its.danielphilip on Instagram with your scent match
            </p>
            <a
              href="https://instagram.com/its.danielphilip"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-[#121212] bg-[#121212] px-8 py-3 text-sm tracking-wider uppercase text-white hover:bg-white hover:text-[#121212]"
            >
              Message on Instagram
            </a>
          </div>

          <Link
            href="/"
            className="text-xs tracking-wider uppercase text-[#121212]/40 hover:text-[#121212]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
