"use server";

// Everything the admin changes goes through these server actions. Each one
// checks the session first (server actions can be called by anyone who finds
// them), does the change through features/booking/server/manage-booking.ts,
// and refreshes the admin pages.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { closedDays, heldHours, bookings } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { locales } from "@/lib/i18n/locales";
import { isDayKey } from "@/features/booking/model/dates";
import { normalizePhone } from "@/features/booking/model/request";
import { activities, plans } from "@/features/booking/model/rules";
import {
  deleteBooking,
  saveAdminBooking,
  setArchived,
  setBookingStatus,
  type BookingStatus,
  type SaveResult,
} from "@/features/booking/server/manage-booking";

function refresh() {
  revalidatePath("/admin", "layout");
}

export async function setStatusAction(id: string, status: BookingStatus): Promise<SaveResult> {
  await requireAdmin();
  const result = await setBookingStatus(getDb(), id, status, Date.now());
  refresh();
  return result;
}

export async function setArchivedAction(id: string, archived: boolean) {
  await requireAdmin();
  await setArchived(getDb(), id, archived, Date.now());
  refresh();
}

export async function deleteBookingAction(id: string) {
  await requireAdmin();
  await deleteBooking(getDb(), id);
  refresh();
}

const editorSchema = z.object({
  plan: z.enum(plans),
  status: z.enum(["pending", "confirmed"]),
  name: z.string().trim().min(1, "name").max(80, "name"),
  phone: z
    .string()
    .trim()
    .max(30, "phone")
    .transform(normalizePhone)
    .refine((p) => /^\+\d{6,15}$/.test(p), "phone"),
  email: z
    .union([z.literal(""), z.email("email").max(120, "email")])
    .transform((e) => e || null),
  activity: z.enum(activities),
  groupSize: z.number("groupSize").int("groupSize").min(1, "groupSize").max(200, "groupSize").nullable(),
  message: z.string().trim().max(1000).transform((m) => m || null),
  adminNote: z.string().trim().max(2000).transform((m) => m || null),
  locale: z.enum(locales),
  sessions: z.array(z.object({ date: z.string(), start: z.number().int(), end: z.number().int() })).min(1).max(62),
});

export type EditorInput = z.input<typeof editorSchema>;
export type EditorResult = SaveResult | { kind: "fields"; fields: string[] };

export async function saveBookingAction(id: string | null, input: EditorInput): Promise<EditorResult> {
  await requireAdmin();
  const parsed = editorSchema.safeParse(input);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))];
    if (fields.includes("sessions")) return { kind: "invalid", reason: "sessions" };
    return { kind: "fields", fields };
  }
  const result = await saveAdminBooking(getDb(), parsed.data, id, Date.now());
  refresh();
  return result;
}

export type ClosedDayResult = { kind: "added" } | { kind: "invalid" } | { kind: "hasBookings"; codes: string[] };

export async function addClosedDayAction(date: string, reason: string): Promise<ClosedDayResult> {
  await requireAdmin();
  if (!isDayKey(date)) return { kind: "invalid" };
  const db = getDb();
  // A day with bookings can't be closed until they're cancelled or moved.
  const held = await db
    .selectDistinct({ code: bookings.code })
    .from(heldHours)
    .innerJoin(bookings, eq(bookings.id, heldHours.bookingId))
    .where(eq(heldHours.date, date));
  if (held.length) return { kind: "hasBookings", codes: held.map((h) => h.code) };
  await db
    .insert(closedDays)
    .values({ date, reason: reason.trim().slice(0, 200) || null, createdAt: Date.now() })
    .onConflictDoUpdate({ target: closedDays.date, set: { reason: reason.trim().slice(0, 200) || null } });
  refresh();
  return { kind: "added" };
}

export async function removeClosedDayAction(date: string) {
  await requireAdmin();
  await getDb().delete(closedDays).where(eq(closedDays.date, date));
  refresh();
}
