"use client";

// Better Auth in the browser: signIn.email() on the login page, signOut() in
// the admin sidebar. It talks to /api/auth on the same site.

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({ basePath: "/api/auth" });
