import { z } from "zod";

// Israeli mobile phone, tolerant of spaces/dashes and +972 / 0 prefixes.
const phone = z
  .string()
  .trim()
  .min(9)
  .max(20)
  .regex(/^[+]?[0-9\s-]{9,20}$/, "מספר טלפון לא תקין");

export const LeadInput = z.object({
  event_type: z.string().trim().min(1).max(40).optional(),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין")
    .optional(),
  city: z.string().trim().min(1).max(60).optional(),
  guests: z.coerce.number().int().min(1).max(2000).optional(),
  budget: z.coerce.number().int().min(0).max(1_000_000).optional(),
  cuisine: z.string().trim().max(40).optional(),
  kosher: z.boolean().default(false),
  client_name: z.string().trim().min(1).max(80),
  client_phone: phone,
  client_email: z.string().trim().email().max(120).optional().or(z.literal("")),
  turnstile_token: z.string().optional().default(""),
  source: z.string().trim().max(200).optional(),
});
export type LeadInputType = z.infer<typeof LeadInput>;

export const ReserveInput = z.object({
  chef_phone: phone,
});
export type ReserveInputType = z.infer<typeof ReserveInput>;

// A professional/business applying to join the ezfind network via the umbrella
// landing page. Email, business name and message are optional; the rest required.
export const JoinInput = z.object({
  full_name: z.string().trim().min(1).max(80),
  business_name: z.string().trim().max(120).optional().or(z.literal("")),
  category: z.string().trim().min(1).max(40),
  city: z.string().trim().min(1).max(60),
  phone: phone,
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  source: z.string().trim().max(200).optional(),
});
export type JoinInputType = z.infer<typeof JoinInput>;

// Generic webhook envelope. Provider-specific fields are validated loosely here
// and interpreted by the payments adapter's verifyWebhook().
export const WebhookPayload = z.object({
  provider_ref: z.string().min(1).optional(),
  status: z.string().optional(),
  // Raw provider fields are preserved for signature verification.
  raw: z.record(z.unknown()).optional(),
});
export type WebhookPayloadType = z.infer<typeof WebhookPayload>;
