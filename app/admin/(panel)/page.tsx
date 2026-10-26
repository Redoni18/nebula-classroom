// /admin: the bookings. Headline numbers, the views (pending, upcoming, all,
// archive), a search by code, name or phone, and the table (features/admin).

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { currentTime } from "@/lib/clock";
import { getDb } from "@/lib/db";
import { tetovoClock } from "@/features/booking/model/dates";
import { BookingsPage } from "@/features/admin/bookings/bookings-page";
import { bookingViews, type BookingView } from "@/features/admin/queries";
import { copy } from "@/features/admin/copy";

export const metadata: Metadata = { title: copy.nav.bookings };

export default async function AdminBookings({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const params = await searchParams;
  const view = (bookingViews as readonly string[]).includes(String(params.view)) ? (params.view as BookingView) : "pending";
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const now = currentTime();
  return <BookingsPage db={getDb()} view={view} q={q} today={tetovoClock(now).date} now={now} />;
}
