import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "re_placeholder";

export const resend = new Resend(resendApiKey);

export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Daniel Philip <daniel@danielphilip.com>";

export const RESEND_WEBHOOK_SECRET =
  process.env.RESEND_WEBHOOK_SECRET || "";
