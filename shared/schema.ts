import { z } from "zod";
import { CREDIT_PACKAGES, CHEF_STATUS } from "./constants.ts";

// Israeli mobile phone, tolerant of spaces/dashes and +972 / 0 prefixes.
const phone = z
  .string()
  .trim()
  .min(9)
  .max(20)
  .regex(/^[+]?[0-9\s-]{9,20}$/, "מספר טלפון לא תקין");

const password = z.string().min(6, "סיסמה קצרה מדי").max(100);
const email = z.string().trim().email().max(120).optional().or(z.literal(""));

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

// Generic webhook envelope. Provider-specific fields are validated loosely here
// and interpreted by the payments adapter's verifyWebhook().
export const WebhookPayload = z.object({
  provider_ref: z.string().min(1).optional(),
  status: z.string().optional(),
  // Raw provider fields are preserved for signature verification.
  raw: z.record(z.unknown()).optional(),
});
export type WebhookPayloadType = z.infer<typeof WebhookPayload>;

// ── Prepaid lead bank ───────────────────────────────────────────────────────

const packageIds = CREDIT_PACKAGES.map((p) => p.id) as [string, ...string[]];

export const ChefRegisterInput = z.object({
  phone,
  name: z.string().trim().min(1).max(80),
  email,
  password,
  turnstile_token: z.string().optional().default(""),
});
export type ChefRegisterInputType = z.infer<typeof ChefRegisterInput>;

export const ChefLoginInput = z.object({ phone, password });
export type ChefLoginInputType = z.infer<typeof ChefLoginInput>;

export const CheckoutInput = z.object({ package: z.enum(packageIds) });
export type CheckoutInputType = z.infer<typeof CheckoutInput>;

// Admin-side account management.
export const AdminCreateChefInput = z.object({
  phone,
  name: z.string().trim().min(1).max(80).optional(),
  email,
  // Optional: when omitted, the handler generates a temporary password.
  password: password.optional(),
  credits: z.coerce.number().int().min(0).max(100_000).optional(),
});
export type AdminCreateChefInputType = z.infer<typeof AdminCreateChefInput>;

export const AdminAdjustCreditsInput = z.object({
  delta: z.coerce.number().int().refine((n) => n !== 0, "delta must be non-zero"),
  note: z.string().trim().max(200).optional(),
});
export type AdminAdjustCreditsInputType = z.infer<typeof AdminAdjustCreditsInput>;

export const AdminSetPasswordInput = z.object({ password });
export type AdminSetPasswordInputType = z.infer<typeof AdminSetPasswordInput>;

export const AdminSetStatusInput = z.object({
  status: z.enum([CHEF_STATUS.active, CHEF_STATUS.disabled]),
});
export type AdminSetStatusInputType = z.infer<typeof AdminSetStatusInput>;
