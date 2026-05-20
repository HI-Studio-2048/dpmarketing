// src/app/api/email/broadcast-drain/route.ts
import { NextRequest, NextResponse } from "next/server";
import { drainOnce } from "@/lib/broadcast-queue";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await drainOnce();

    // Self-chain: if more work and headroom remain, kick the next batch without waiting.
    if (!result.paused && !result.capReached && result.remaining > 0) {
      const url = new URL("/api/email/broadcast-drain", request.url);
      void fetch(url.toString(), {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "drain failed";
    console.error("[broadcast-drain]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Allow GET so Vercel Cron (which issues GET) can trigger the same logic.
export async function GET(request: NextRequest) {
  return POST(request);
}
