import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { supabase } from "@/lib/supabase-server";
import { RESEND_WEBHOOK_SECRET } from "@/lib/resend";

/**
 * POST /api/email/webhook
 *
 * Resend webhook endpoint for tracking email events.
 * Configure this URL in your Resend dashboard under Webhooks.
 *
 * Events we track: delivered, opened, clicked, bounced, complained
 */

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    click?: {
      link: string;
      timestamp: string;
    };
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.text();

    if (!RESEND_WEBHOOK_SECRET) {
      console.error("[Resend Webhook] RESEND_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 503 }
      );
    }

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Missing webhook signature headers" },
        { status: 400 }
      );
    }

    const wh = new Webhook(RESEND_WEBHOOK_SECRET);
    try {
      wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body) as ResendWebhookEvent;
    const { type, data } = event;

    console.log(`[Resend Webhook] ${type} for ${data.email_id}`);

    // Map Resend event types to our status column
    const statusMap: Record<string, string> = {
      "email.delivered": "delivered",
      "email.opened": "opened",
      "email.clicked": "clicked",
      "email.bounced": "bounced",
      "email.complained": "complained",
    };

    const newStatus = statusMap[type];
    if (!newStatus) {
      // Event type we don't track
      return NextResponse.json({ received: true });
    }

    // This Resend account is shared with other projects (e.g. dr-jasper), and
    // Resend webhooks are account-level — so this endpoint also receives events
    // for emails this project never sent. Only act on events whose email_id
    // matches a row we logged; otherwise ignore (prevents cross-project
    // unsubscribes and stray status writes).
    const { data: ownLogs } = await supabase
      .from("email_logs")
      .select("id")
      .eq("resend_id", data.email_id)
      .limit(1);

    if (!ownLogs || ownLogs.length === 0) {
      return NextResponse.json({ received: true, ignored: true });
    }

    // Update the email_logs record
    const updateData: Record<string, unknown> = { status: newStatus };

    if (type === "email.opened") {
      updateData.opened_at = new Date().toISOString();
    }
    if (type === "email.clicked") {
      updateData.clicked_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("email_logs")
      .update(updateData)
      .eq("resend_id", data.email_id);

    if (error) {
      console.error(
        `[Resend Webhook] Error updating log for ${data.email_id}:`,
        error
      );
    }

    // If bounced or complained, auto-unsubscribe the lead
    if (type === "email.bounced" || type === "email.complained") {
      const recipientEmail = data.to?.[0];
      if (recipientEmail) {
        await supabase
          .from("leads")
          .update({
            unsubscribed: true,
            unsubscribed_at: new Date().toISOString(),
          })
          .eq("email", recipientEmail);

        // Also update status, but don't downgrade a Buyer
        await supabase
          .from("leads")
          .update({ status: "Unsubscribed" })
          .eq("email", recipientEmail)
          .neq("status", "Buyer");

        console.log(
          `[Resend Webhook] Auto-unsubscribed recipient due to ${type}`
        );
      }
    }

    return NextResponse.json({ received: true, status: newStatus });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Resend Webhook] Error:", message);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
