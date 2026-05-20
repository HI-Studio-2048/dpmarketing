import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/resend";

/**
 * POST /api/admin/test-email
 *
 * Sends a test email to specified addresses without creating a broadcast.
 * Body: { to: string[], subject: string, html_body: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { to, subject, html_body } = await request.json();

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient email is required" },
        { status: 400 }
      );
    }

    if (!subject || !html_body) {
      return NextResponse.json(
        { error: "subject and html_body are required" },
        { status: 400 }
      );
    }

    // Replace template variables with test values
    const html = html_body
      .replace(/\{\{first_name\}\}/g, "Test")
      .replace(/\{\{email\}\}/g, to[0])
      .replace(/\{\{unsubscribe_url\}\}/g, "#");

    const results = [];

    for (const email of to) {
      try {
        const { data, error } = await resend.emails.send({
          from: EMAIL_FROM,
          to: [email],
          subject: `[TEST] ${subject}`,
          html,
        });

        results.push({
          email,
          success: !error,
          id: data?.id || null,
          error: error?.message || null,
        });
      } catch (err) {
        results.push({
          email,
          success: false,
          id: null,
          error: err instanceof Error ? err.message : "Send failed",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
