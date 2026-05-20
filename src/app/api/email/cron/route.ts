import { NextRequest, NextResponse } from "next/server";
import { processDripCampaign } from "@/lib/email-sender";

/**
 * GET /api/email/cron
 *
 * Triggered daily by Vercel Cron (see vercel.json for schedule).
 * Processes the drip campaign: sends due emails to active enrollments.
 *
 * Protected by CRON_SECRET header verification.
 */

export async function GET(request: NextRequest) {
  try {
    // Verify the cron secret
    const authHeader = request.headers.get("authorization");
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    // Vercel automatically adds the secret as a Bearer token
    if (authHeader !== expectedToken) {
      console.warn(
        "[Cron] Unauthorized cron request - invalid or missing secret"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting email drip campaign processor...");

    const result = await processDripCampaign();

    console.log("[Cron] Campaign processing complete:", result);

    return NextResponse.json({
      success: true,
      message: "Drip campaign processed",
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Cron] Error:", message);
    return NextResponse.json(
      { error: "Failed to process drip campaign" },
      { status: 500 }
    );
  }
}
