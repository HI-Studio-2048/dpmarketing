/**
 * Email sending utility
 *
 * Handles:
 * - Drip campaign processing (daily)
 * - Broadcast sending
 * - Logging to email_logs table
 * - Resend API integration
 */

import { resend, EMAIL_FROM } from "./resend";
import { supabase, type Lead, type SequenceStep } from "./supabase-server";
import { getStepDueForLead, type EmailLog, type EmailCondition } from "./drip-engine";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://danielphilip.com";
const EMAIL_CAMPAIGN_ENABLED =
  process.env.EMAIL_CAMPAIGN_ENABLED === "true";

interface SendResult {
  leadId: string;
  email: string;
  stepNumber: number;
  success: boolean;
  error?: string;
  resendId?: string;
}

async function getEligibleLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .in("status", ["Lead", "Checkout Started", "Abandoned"])
    .eq("unsubscribed", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching eligible leads:", error);
    return [];
  }

  return (data as Lead[]) || [];
}

/**
 * Get active enrollments with their sequence steps
 */
async function getActiveEnrollments(): Promise<
  Array<{
    lead_id: string;
    sequence_id: string;
    enrolled_at: string;
    steps: SequenceStep[];
  }>
> {
  const { data, error } = await supabase
    .from("lead_sequence_enrollments")
    .select(
      `
      lead_id,
      sequence_id,
      enrolled_at,
      sequences!inner(
        sequence_steps(*)
      )
    `
    )
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching enrollments:", error);
    return [];
  }

  return (data || []).map((enrollment: any) => ({
    lead_id: enrollment.lead_id,
    sequence_id: enrollment.sequence_id,
    enrolled_at: enrollment.enrolled_at,
    steps: (enrollment.sequences?.sequence_steps || []) as SequenceStep[],
  }));
}

/**
 * Fetch email logs for a lead to track behavioral conditions
 */
async function getEmailLogsForLead(leadId: string): Promise<EmailLog[]> {
  const { data, error } = await supabase
    .from("email_logs")
    .select("sequence_step, status, opened_at, clicked_at")
    .eq("lead_id", leadId)
    .eq("campaign_type", "sequence");

  if (error) {
    console.error(`Error fetching email logs for lead ${leadId}:`, error);
    return [];
  }

  return (data || []).map(
    (row: {
      sequence_step: number;
      status: string;
      opened_at: string | null;
      clicked_at: string | null;
    }) => ({
      step_number: row.sequence_step,
      status: row.status,
      opened_at: row.opened_at,
      clicked_at: row.clicked_at,
    })
  );
}

/**
 * Log a sent email to email_logs
 */
async function logEmailSent(
  leadId: string,
  leadEmail: string,
  sequenceId: string,
  step: SequenceStep,
  resendId: string | null
): Promise<void> {
  const { error } = await supabase.from("email_logs").insert({
    lead_id: leadId,
    email: leadEmail,
    campaign_type: "sequence",
    sequence_id: sequenceId,
    step_id: step.id,
    sequence_step: step.step_number,
    sequence_key: step.step_key,
    subject: step.subject,
    resend_id: resendId,
    status: resendId ? "sent" : "failed",
  });

  if (error) {
    console.error(
      `Error logging email for lead ${leadId}, step ${step.step_number}:`,
      error
    );
  }
}

/**
 * Send a single drip email
 */
async function sendDripEmail(
  lead: Lead,
  step: SequenceStep
): Promise<SendResult> {
  const unsubscribeUrl = `${SITE_URL}/api/email/unsubscribe?email=${encodeURIComponent(lead.email)}&token=${Buffer.from(lead.id).toString("base64")}`;

  try {
    // Personalize the HTML body
    const html = step.html_body
      .replace(/{{first_name}}/g, lead.first_name || "")
      .replace(/{{email}}/g, lead.email)
      .replace(/{{unsubscribe_url}}/g, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [lead.email],
      subject: step.subject,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [
        { name: "campaign", value: "drip-sequence" },
        { name: "step", value: String(step.step_number) },
        { name: "type", value: step.email_type || "value" },
      ],
    });

    if (error) {
      console.error(`Resend error for ${lead.email}:`, error);
      return {
        leadId: lead.id,
        email: lead.email,
        stepNumber: step.step_number,
        success: false,
        error: error.message,
      };
    }

    const resendId = data?.id || null;
    return {
      leadId: lead.id,
      email: lead.email,
      stepNumber: step.step_number,
      success: true,
      resendId: resendId || undefined,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Failed to send email to ${lead.email}:`, errorMessage);
    return {
      leadId: lead.id,
      email: lead.email,
      stepNumber: step.step_number,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Process the daily drip campaign
 * Returns stats on how many emails were sent
 */
export async function processDripCampaign(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  results: SendResult[];
}> {
  if (!EMAIL_CAMPAIGN_ENABLED) {
    console.log(
      "[Drip Campaign] EMAIL_CAMPAIGN_ENABLED is false, skipping actual sends"
    );
    return { processed: 0, sent: 0, skipped: 0, failed: 0, results: [] };
  }

  const leads = await getEligibleLeads();
  const enrollments = await getActiveEnrollments();
  const results: SendResult[] = [];
  let sent = 0,
    skipped = 0,
    failed = 0;

  console.log(
    `[Drip Campaign] Processing ${leads.length} leads with ${enrollments.length} active enrollments...`
  );

  for (const lead of leads) {
    const leadEnrollments = enrollments.filter(
      (e) => e.lead_id === lead.id && e.steps.length > 0
    );

    if (leadEnrollments.length === 0) {
      skipped++;
      continue;
    }

    // Process first enrollment (most common case: one sequence per lead)
    const enrollment = leadEnrollments[0];
    const emailLogs = await getEmailLogsForLead(lead.id);
    const stepDue = getStepDueForLead(
      new Date(enrollment.enrolled_at),
      emailLogs,
      enrollment.steps
    );

    if (!stepDue) {
      skipped++;
      continue;
    }

    // Throttle sends to avoid rate limits
    if (results.length > 0) {
      await new Promise((r) => setTimeout(r, 200));
    }

    const sendResult = await sendDripEmail(lead, stepDue as SequenceStep);
    await logEmailSent(
      lead.id,
      lead.email,
      enrollment.sequence_id,
      stepDue as SequenceStep,
      sendResult.resendId || null
    );

    results.push(sendResult);
    sendResult.success ? sent++ : failed++;
  }

  console.log(
    `[Drip Campaign] Done. Sent: ${sent}, Skipped: ${skipped}, Failed: ${failed}`
  );
  return { processed: leads.length, sent, skipped, failed, results };
}

/**
 * Send a broadcast to a segment
 */
export async function sendBroadcast(
  broadcastId: string,
  recipientEmails: string[],
  subject: string,
  htmlBody: string
): Promise<{ sent: number; failed: number }> {
  if (!EMAIL_CAMPAIGN_ENABLED) {
    console.log("[Broadcast] EMAIL_CAMPAIGN_ENABLED is false, skipping");
    return { sent: 0, failed: 0 };
  }

  let sent = 0,
    failed = 0;

  for (const email of recipientEmails) {
    if (sent + failed > 0) {
      await new Promise((r) => setTimeout(r, 200));
    }

    try {
      const unsubscribeUrl = `${SITE_URL}/api/email/unsubscribe?email=${encodeURIComponent(email)}`;
      const personalizedHtml = htmlBody
        .replace(/{{unsubscribe_url}}/g, unsubscribeUrl)
        .replace(/{{email}}/g, email);

      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [email],
        subject,
        html: personalizedHtml,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
        },
        tags: [{ name: "campaign", value: "broadcast" }],
      });

      if (error) {
        console.error(`Failed to send broadcast to ${email}:`, error);
        failed++;
      } else {
        await supabase.from("email_logs").insert({
          email,
          campaign_type: "broadcast",
          broadcast_id: broadcastId,
          subject,
          resend_id: data?.id || null,
          status: data?.id ? "sent" : "failed",
        });
        sent++;
      }
    } catch (err) {
      console.error(`Broadcast send error for ${email}:`, err);
      failed++;
    }
  }

  return { sent, failed };
}
