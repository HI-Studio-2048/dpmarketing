import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Create client with empty keys if not configured (will fail gracefully on actual queries)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Type helpers
export type Lead = {
  id: string;
  email: string;
  first_name?: string;
  phone?: string;
  status: "Lead" | "Checkout Started" | "Buyer" | "Abandoned" | "Unsubscribed";
  source?: string;
  tags: string[];
  quiz_score?: number;
  quiz_answers?: Record<string, unknown>;
  quiz_progress?: string;
  city?: string;
  country?: string;
  platform?: string;
  device?: string;
  unsubscribed: boolean;
  unsubscribed_at?: string;
  created_at: string;
  updated_at: string;
};

export type Sequence = {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
};

export type SequenceStep = {
  id: string;
  sequence_id: string;
  step_number: number;
  day_offset: number;
  subject: string;
  html_body: string;
  step_key?: string;
  email_type: string;
  condition?: Record<string, unknown>;
  created_at: string;
};

export type LeadSequenceEnrollment = {
  id: string;
  lead_id: string;
  sequence_id: string;
  enrolled_at: string;
  completed_at?: string;
  is_active: boolean;
};

export type EmailLog = {
  id: string;
  lead_id?: string;
  email: string;
  campaign_type: "sequence" | "broadcast";
  sequence_id?: string;
  step_id?: string;
  sequence_step?: number;
  sequence_key?: string;
  broadcast_id?: string;
  subject: string;
  resend_id?: string;
  status:
    | "sent"
    | "delivered"
    | "opened"
    | "clicked"
    | "bounced"
    | "complained"
    | "failed";
  opened_at?: string;
  clicked_at?: string;
  created_at: string;
};

export type Broadcast = {
  id: string;
  subject: string;
  html_body: string;
  segment_json: Record<string, unknown>;
  status: "draft" | "sending" | "sent" | "failed";
  sent_at?: string;
  recipient_count?: number;
  created_at: string;
};
