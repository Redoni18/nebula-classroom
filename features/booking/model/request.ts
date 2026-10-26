// What the booking form sends to POST /api/bookings, and how it's checked.
// The browser runs the same schema before sending, so the visitor sees the
// same messages the server would give. Error keys match the dictionary's
// booking.errors.

import { z } from "zod";
import { locales } from "@/lib/i18n/locales";
import { activities, plans } from "./rules";

const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * "075 281 813", "+389 75 281 813" or "0038975281813" → "+38975281813".
 * A local number (starting with 0) is taken as North Macedonian.
 */
export function normalizePhone(raw: string): string {
  let phone = raw.replace(/[\s\-().\/]/g, "");
  if (phone.startsWith("00")) phone = "+" + phone.slice(2);
  else if (phone.startsWith("0")) phone = "+389" + phone.slice(1);
  return phone;
}

export const bookingRequestSchema = z.object({
  plan: z.enum(plans),
  /** Day and week: every pick. Month: the first week's picks. Exclusive: empty. */
  sessions: z
    .array(z.object({ date: dayKey, start: z.number().int(), end: z.number().int() }))
    .max(7),
  /** Exclusive month only: the first day. */
  startDate: dayKey.optional(),
  name: z.string().trim().min(2, "name").max(80, "name"),
  phone: z
    .string()
    .trim()
    .max(30, "phone")
    .transform(normalizePhone)
    .refine((p) => /^\+\d{8,15}$/.test(p), "phone"),
  email: z
    .union([z.literal(""), z.email("email").max(120, "email")])
    .optional()
    .transform((e) => e || undefined),
  activity: z.enum(activities, "activity"),
  groupSize: z.number("groupSize").int("groupSize").min(1, "groupSize").max(60, "groupSize").optional(),
  message: z
    .string()
    .trim()
    .max(1000, "message")
    .optional()
    .transform((m) => m || undefined),
  locale: z.enum(locales),
  turnstileToken: z.string().max(4096).optional(),
  /** Hidden from people; bots fill it in. */
  website: z.string().max(0).optional(),
});

export type BookingRequest = z.input<typeof bookingRequestSchema>;
export type ParsedBookingRequest = z.output<typeof bookingRequestSchema>;

export const contactFields = ["name", "phone", "email", "activity", "groupSize", "message"] as const;
export type ContactField = (typeof contactFields)[number];

/** Field → error key, from a failed parse (only the contact fields). */
export function fieldErrors(error: z.ZodError): Partial<Record<ContactField, ContactField>> {
  const out: Partial<Record<ContactField, ContactField>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && (contactFields as readonly string[]).includes(field)) {
      out[field as ContactField] = field as ContactField;
    }
  }
  return out;
}

/** What POST /api/bookings answers. */
export type BookingResponse =
  | { ok: true; code: string; phone: string }
  | { ok: false; error: "invalid"; fields: Partial<Record<ContactField, ContactField>>; problem?: string }
  | { ok: false; error: "conflict"; conflicts: { date: string; hours: number[] }[] }
  | { ok: false; error: "captcha" | "tooMany" | "generic" };
