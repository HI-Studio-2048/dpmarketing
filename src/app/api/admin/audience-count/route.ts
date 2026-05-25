import { NextRequest, NextResponse } from "next/server";
import { countSegment, type SegmentFilter } from "@/lib/broadcast-queue";

/**
 * POST /api/admin/audience-count
 *
 * Returns the count of leads matching a given segment filter.
 * Used by the composer to preview audience size before sending.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SegmentFilter;
    const count = await countSegment(body);
    return NextResponse.json({ count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Audience Count] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
