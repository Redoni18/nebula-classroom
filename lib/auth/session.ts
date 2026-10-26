// Who's signed in, for admin pages and server actions. Every admin page and
// every admin action calls requireAdmin() first: server actions are public
// endpoints, so each one checks for itself.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./server";

async function requestOrigin(): Promise<{ origin: string; headers: Headers }> {
  const h = await headers();
  // Only the Host header: forwarded-host headers can be set by anyone.
  const host = h.get("host") ?? "localhost";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return { origin: `${proto}://${host}`, headers: h };
}

export async function getAdminSession() {
  const { origin, headers } = await requestOrigin();
  return getAuth(origin).api.getSession({ headers });
}

/** The signed-in staff member, or a redirect to the sign-in page. */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session.user;
}
