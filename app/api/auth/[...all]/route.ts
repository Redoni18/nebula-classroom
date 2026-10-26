// /api/auth/*: Better Auth's own routes (sign in, sign out, session).
// Configured in lib/auth/server.ts.

import { getAuth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

function handle(request: Request) {
  return getAuth(new URL(request.url).origin).handler(request);
}

export { handle as GET, handle as POST };
