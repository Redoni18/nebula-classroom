"use client";

// The staff sign-in form: email, password and a Turnstile check, sent to
// Better Auth (/api/auth/sign-in/email). On success it opens /admin.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { copy } from "../copy";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const turnstile = useRef<TurnstileInstance | undefined>(undefined);
  const l = copy.login;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return setError(l.captcha);
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      fetchOptions: { headers: { "x-captcha-response": token } },
    });
    if (!error) {
      router.replace("/admin");
      router.refresh();
      return;
    }
    setBusy(false);
    turnstile.current?.reset();
    setToken(null);
    setError(error.status === 429 ? l.tooMany : error.status === 401 ? l.wrong : error.status === 403 ? l.captcha : l.error);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-paper p-6 shadow-[0_20px_60px_rgb(11_11_11/0.12)] md:p-8">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.06em]">Nebula Classroom.</p>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{l.title}</h1>
        <p className="mt-1 text-sm text-muted-ink">{l.intro}</p>
      </div>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="email" className="text-sm font-semibold">{l.email}</FieldLabel>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-11 rounded-lg border-cream-line shadow-none" />
      </Field>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="password" className="text-sm font-semibold">{l.password}</FieldLabel>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11 rounded-lg border-cream-line shadow-none" />
      </Field>
      <div className="min-h-[65px]">
        {TURNSTILE_SITE_KEY && (
          <Turnstile
            ref={turnstile}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setToken}
            onExpire={() => setToken(null)}
            onError={() => setToken(null)}
            options={{ theme: "light", size: "flexible", language: "auto" }}
          />
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-lg border-2 border-ink px-3 py-2 text-sm font-semibold">
          {error}
        </p>
      )}
      <Button type="submit" variant="ink" className="h-11 text-base" disabled={busy}>
        {busy ? l.signingIn : l.submit}
      </Button>
    </form>
  );
}
