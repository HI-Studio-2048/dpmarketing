import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { resend, EMAIL_FROM } from "@/lib/resend";

/**
 * POST /api/leads
 *
 * Public endpoint called by quiz/funnel to collect leads.
 *
 * Accepts:
 * - email (required)
 * - first_name
 * - phone
 * - status
 * - source (e.g., 'quiz-brain', 'funnel-lp1')
 * - quiz_score
 * - quiz_answers
 * - quiz_progress
 * - tags
 * - city, country, platform, device
 *
 * On success:
 * 1. Upserts lead into leads table
 * 2. Finds active sequence and enrolls lead
 * 3. Sends welcome email (step with day_offset=0)
 * 4. Logs the welcome email
 * 5. Returns lead_id
 */

interface LeadInput {
  email: string;
  first_name?: string;
  phone?: string;
  status?: string;
  source?: string;
  quiz_score?: number;
  quiz_answers?: Record<string, unknown>;
  quiz_progress?: string;
  tags?: string[];
  city?: string;
  country?: string;
  platform?: string;
  device?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LeadInput;

    // Validate email
    if (!body.email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Normalize email
    const email = body.email.toLowerCase().trim();

    // Upsert lead
    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .upsert(
        {
          email,
          first_name: body.first_name,
          phone: body.phone,
          status: body.status || "Lead",
          source: body.source,
          quiz_score: body.quiz_score,
          quiz_answers: body.quiz_answers,
          quiz_progress: body.quiz_progress,
          tags: body.tags || [],
          city: body.city,
          country: body.country,
          platform: body.platform,
          device: body.device,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (leadError || !leadData) {
      console.error("Error upserting lead:", leadError);
      return NextResponse.json(
        { error: "Failed to create lead" },
        { status: 500 }
      );
    }

    const leadId = leadData.id;

    // Find an active sequence (prefer by source if available)
    let { data: sequences, error: sequenceError } = await supabase
      .from("sequences")
      .select("id, name")
      .eq("is_active", true)
      .limit(1);

    if (sequenceError || !sequences || sequences.length === 0) {
      console.log("[Leads] No active sequence found, skipping enrollment");
      return NextResponse.json({
        success: true,
        lead_id: leadId,
        message: "Lead created but no active sequence to enroll",
      });
    }

    const sequenceId = sequences[0].id;

    // Check if already enrolled in this sequence
    const { data: existing } = await supabase
      .from("lead_sequence_enrollments")
      .select("id")
      .eq("lead_id", leadId)
      .eq("sequence_id", sequenceId)
      .single();

    if (!existing) {
      // Enroll lead in sequence
      const { error: enrollError } = await supabase
        .from("lead_sequence_enrollments")
        .insert({
          lead_id: leadId,
          sequence_id: sequenceId,
          enrolled_at: new Date().toISOString(),
          is_active: true,
        });

      if (enrollError) {
        console.error("Error enrolling lead:", enrollError);
        // Don't fail the request, enrollment error is non-critical
      }
    }

    // Fetch the welcome step (day_offset = 0) from this sequence
    const { data: welcomeSteps, error: stepsError } = await supabase
      .from("sequence_steps")
      .select("*")
      .eq("sequence_id", sequenceId)
      .eq("day_offset", 0)
      .limit(1);

    if (stepsError || !welcomeSteps || welcomeSteps.length === 0) {
      console.log(
        "[Leads] No welcome step (day_offset=0) found in sequence"
      );
      return NextResponse.json({
        success: true,
        lead_id: leadId,
        message: "Lead enrolled but no welcome email configured",
      });
    }

    const welcomeStep = welcomeSteps[0];

    // Send welcome email
    try {
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${Buffer.from(leadId).toString("base64")}`;

      const html = welcomeStep.html_body
        .replace(/{{first_name}}/g, body.first_name || "")
        .replace(/{{email}}/g, email)
        .replace(/{{unsubscribe_url}}/g, unsubscribeUrl);

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [email],
        subject: welcomeStep.subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        tags: [
          { name: "campaign", value: "drip-sequence" },
          { name: "step", value: String(welcomeStep.step_number) },
          { name: "type", value: "welcome" },
        ],
      });

      if (emailError) {
        console.error("Failed to send welcome email:", emailError);
      } else {
        // Log the email
        await supabase.from("email_logs").insert({
          lead_id: leadId,
          email,
          campaign_type: "sequence",
          sequence_id: sequenceId,
          step_id: welcomeStep.id,
          sequence_step: welcomeStep.step_number,
          sequence_key: welcomeStep.step_key,
          subject: welcomeStep.subject,
          resend_id: emailData?.id || null,
          status: emailData?.id ? "sent" : "failed",
        });
      }
    } catch (err) {
      console.error("Error sending welcome email:", err);
      // Don't fail the request
    }

    return NextResponse.json({
      success: true,
      lead_id: leadId,
      sequence_id: sequenceId,
      message: "Lead created and welcome email sent",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Leads] Error:", message);
    return NextResponse.json(
      { error: "Failed to process lead" },
      { status: 500 }
    );
  }
}
