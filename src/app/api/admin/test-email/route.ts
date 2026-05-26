import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/resend";

/**
 * POST /api/admin/test-email
 *
 * Sends an email to specified addresses without creating a broadcast.
 * Body: { to: string[], subject: string, html_body: string, test?: boolean }
 *
 * When test=true (default), subject is prefixed with [TEST] and template
 * variables use placeholder values.
 * When test=false, subject and body are sent as-is (direct send).
 */
export async function POST(request: NextRequest) {
  try {
    const { to, subject, html_body, test = true, attachments } = await request.json();

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

    // Build Resend attachments array
    const resendAttachments = attachments?.map(
      (a: { filename: string; content: string; type: string }) => ({
        filename: a.filename,
        content: Buffer.from(a.content, "base64"),
        content_type: a.type,
      })
    );

    const results = [];

    for (const email of to) {
      const html = html_body
        .replace(/\{\{first_name\}\}/g, test ? "Test" : "")
        .replace(/\{\{email\}\}/g, email)
        .replace(/\{\{unsubscribe_url\}\}/g, "#");

      try {
        const { data, error } = await resend.emails.send({
          from: EMAIL_FROM,
          to: [email],
          subject: test ? `[TEST] ${subject}` : subject,
          html,
          attachments: resendAttachments,
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
