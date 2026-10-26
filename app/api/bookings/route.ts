// POST /api/bookings: a booking request from the calendar. Checks the form,
// the honeypot and Turnstile, then hands over to createBooking().

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { bookingRequestSchema, fieldErrors, type BookingResponse } from "@/features/booking/model/request";
import { createBooking } from "@/features/booking/server/create-booking";
import { clientIp, hashIp, verifyTurnstile } from "@/features/booking/server/protection";

function answer(body: BookingResponse, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return answer({ ok: false, error: "generic" }, 400);
  }

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    // A filled honeypot fails the schema too: answer like any other mistake.
    return answer({ ok: false, error: "invalid", fields: fieldErrors(parsed.error) }, 400);
  }

  const { env } = getCloudflareContext();
  const ip = clientIp(request);
  if (!(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, parsed.data.turnstileToken, ip))) {
    return answer({ ok: false, error: "captcha" }, 400);
  }

  try {
    const result = await createBooking(getDb(), parsed.data, { ipHash: await hashIp(ip, env.IP_HASH_SALT), now: Date.now() });
    switch (result.kind) {
      case "created":
        return answer({ ok: true, code: result.code, phone: parsed.data.phone }, 201);
      case "conflict":
        return answer({ ok: false, error: "conflict", conflicts: result.conflicts }, 409);
      case "tooMany":
        return answer({ ok: false, error: "tooMany" }, 429);
      case "invalid":
        return answer({ ok: false, error: "invalid", fields: {}, problem: result.problem }, 400);
    }
  } catch (error) {
    console.error("Saving a booking failed", error);
    return answer({ ok: false, error: "generic" }, 500);
  }
}
