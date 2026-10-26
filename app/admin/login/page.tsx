// /admin/login: staff sign-in. Someone already signed in goes straight to /admin.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { copy } from "@/features/admin/copy";
import { LoginForm } from "@/features/admin/login/login-form";

export const metadata: Metadata = { title: copy.login.title };
export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main className="grid min-h-dvh place-items-center bg-lime bg-grid p-4 [--grid-line:rgb(11_11_11/0.1)]">
      <LoginForm />
    </main>
  );
}
