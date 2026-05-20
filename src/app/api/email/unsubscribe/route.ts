import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

/**
 * GET /api/email/unsubscribe
 *
 * One-click unsubscribe handler.
 * Used in email List-Unsubscribe headers and unsubscribe links.
 *
 * Query params:
 * - email: the email to unsubscribe
 * - token: optional base64-encoded lead_id for extra security
 */

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter required" },
        { status: 400 }
      );
    }

    // Mark as unsubscribed
    const { error } = await supabase
      .from("leads")
      .update({
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
        status: "Unsubscribed",
      })
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error unsubscribing:", error);
      return NextResponse.json(
        { error: "Failed to unsubscribe" },
        { status: 500 }
      );
    }

    // Return a simple confirmation page
    return new NextResponse(
      `<!DOCTYPE html>
<html>
  <head>
    <title>Unsubscribed</title>
    <style>
      body { font-family: sans-serif; padding: 40px; text-align: center; }
      h1 { color: #333; }
      p { color: #666; }
    </style>
  </head>
  <body>
    <h1>Unsubscribed</h1>
    <p>You have been unsubscribed from our mailing list.</p>
    <p>We'll miss you, but we respect your choice.</p>
  </body>
</html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Unsubscribe] Error:", message);
    return NextResponse.json(
      { error: "Failed to process unsubscribe" },
      { status: 500 }
    );
  }
}
