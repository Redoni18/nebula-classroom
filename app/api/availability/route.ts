// GET /api/availability: the booking window (earliest bookable hour, last
// day) and the hours already taken, for the calendar. Days and hours only.

import { getDb } from "@/lib/db";
import { addDays } from "@/features/booking/model/dates";
import { bookingWindow } from "@/features/booking/model/rules";
import { getTakenHours } from "@/features/booking/server/availability";

export const dynamic = "force-dynamic";

export async function GET() {
  const window = bookingWindow(Date.now());
  // A month plan repeats for 4 weeks and an exclusive month lasts 30 days, so
  // look a month past the calendar's last day.
  const taken = await getTakenHours(getDb(), window.earliest.date, addDays(window.lastDate, 31));
  return Response.json({ window, taken }, { headers: { "Cache-Control": "no-store" } });
}
