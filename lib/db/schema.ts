// The database tables (Cloudflare D1, SQLite). After changing this file run
// `corepack pnpm db:generate` to write the migration, then
// `corepack pnpm db:migrate:local` (SPEC §4 explains the model).

import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** One booking request, from the site or entered by the admin. */
export const bookings = sqliteTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    /** Short reference shown to the visitor and said on the phone, e.g. "K7M4QD". */
    code: text("code").notNull().unique(),
    plan: text("plan", { enum: ["day", "week", "month", "exclusive"] }).notNull(),
    status: text("status", { enum: ["pending", "confirmed", "declined", "cancelled"] }).notNull().default("pending"),
    name: text("name").notNull(),
    /** International format, "+38975281813". */
    phone: text("phone").notNull(),
    email: text("email"),
    activity: text("activity", { enum: ["language", "tutoring", "workshop", "online", "other"] }).notNull(),
    groupSize: integer("group_size"),
    message: text("message"),
    /** The language the visitor booked in: the one to call them back in. */
    locale: text("locale", { enum: ["sq", "mk", "en"] }).notNull(),
    source: text("source", { enum: ["web", "admin"] }).notNull().default("web"),
    totalHours: integer("total_hours").notNull(),
    firstDate: text("first_date").notNull(),
    lastDate: text("last_date").notNull(),
    adminNote: text("admin_note"),
    /** SHA-256 of the visitor's IP address and a secret salt: only for the rate limit. */
    ipHash: text("ip_hash"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    decidedAt: integer("decided_at"),
    archivedAt: integer("archived_at"),
  },
  (t) => [
    index("bookings_status_first_date").on(t.status, t.firstDate),
    index("bookings_ip_created").on(t.ipHash, t.createdAt),
  ],
);

/** The blocks of hours a booking asked for. Kept after a decline, as the record. */
export const bookingSessions = sqliteTable(
  "booking_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    startHour: integer("start_hour").notNull(),
    endHour: integer("end_hour").notNull(),
  },
  (t) => [index("booking_sessions_booking").on(t.bookingId), index("booking_sessions_date").on(t.date)],
);

/**
 * One row per hour a pending or confirmed booking holds. The primary key
 * (date, hour) is what makes double booking impossible: a second booking of
 * the same hour fails to insert, and its whole batch is rolled back.
 */
export const heldHours = sqliteTable(
  "held_hours",
  {
    date: text("date").notNull(),
    hour: integer("hour").notNull(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.date, t.hour] }), index("held_hours_booking").on(t.bookingId)],
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

/**
 * Days the room is closed (holidays, repairs). The public calendar shows them
 * as fully booked and new requests can't use them (features/booking/server/availability.ts).
 */
export const closedDays = sqliteTable("closed_days", {
  date: text("date").primaryKey(),
  reason: text("reason"),
  createdAt: integer("created_at").notNull(),
});

export type ClosedDay = typeof closedDays.$inferSelect;
