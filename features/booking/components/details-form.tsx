"use client";

// The booking card's second step: who's booking (shadcn Field, Input, Select, Textarea). Checks the fields with the
// same schema as the server, passes Turnstile, sends POST /api/bookings and
// hands the answer back to the planner (sent, hours taken meanwhile, or an
// error to show here).

import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { mainPhone } from "@/lib/site";
import type { DayKey } from "../model/dates";
import { bookingRequestSchema, fieldErrors, type BookingRequest, type BookingResponse, type ContactField } from "../model/request";
import { activities, type Activity, type Plan, type Session } from "../model/rules";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

// The site's look on shadcn's fields: cream, no border until focus, ink focus.
const controlClass =
  "h-12 rounded-xl border-2 border-cream bg-cream px-4 text-base shadow-none transition-colors placeholder:text-muted-ink/60 focus-visible:border-ink focus-visible:bg-paper focus-visible:ring-0 aria-invalid:border-destructive aria-invalid:ring-0 md:text-base";
const labelClass = "text-sm font-bold";

type FormError = "captcha" | "tooMany" | "generic";

export function DetailsForm({
  locale,
  plan,
  picks,
  startDate,
  initialActivity,
  privacyHref,
  labels,
  planName,
  recap,
  onBack,
  onSent,
  onConflict,
}: {
  locale: Locale;
  plan: Plan;
  picks: Session[];
  startDate: DayKey | null;
  initialActivity: Activity | null;
  privacyHref: string;
  labels: Dictionary["booking"];
  planName: string;
  /** One line per picked day, already written out. */
  recap: string[];
  onBack: () => void;
  onSent: (code: string, phone: string) => void;
  onConflict: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<ContactField, ContactField>>>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | "">(initialActivity ?? "");
  const turnstile = useRef<TurnstileInstance | undefined>(undefined);
  const d = labels.details;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    const groupSize = text("groupSize").trim();
    const request: BookingRequest = {
      plan,
      sessions: plan === "exclusive" ? [] : picks,
      startDate: plan === "exclusive" ? (startDate ?? undefined) : undefined,
      name: text("name"),
      phone: text("phone"),
      email: text("email"),
      activity: activity as Activity,
      groupSize: groupSize ? Number(groupSize) : undefined,
      message: text("message"),
      locale,
      turnstileToken: token ?? undefined,
      website: text("website"),
    };

    const parsed = bookingRequestSchema.safeParse(request);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setFormError(null);
      focusFirstError(event.currentTarget);
      return;
    }
    setErrors({});
    if (!token) {
      setFormError("captcha");
      return;
    }

    setSending(true);
    setFormError(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const result = (await response.json()) as BookingResponse;
      if (result.ok) return onSent(result.code, result.phone);
      if (result.error === "conflict") return onConflict();
      if (result.error === "invalid") {
        setErrors(result.fields);
        if (Object.keys(result.fields).length === 0) setFormError("generic");
      } else {
        setFormError(result.error);
      }
    } catch {
      setFormError("generic");
    } finally {
      setSending(false);
      // A Turnstile token works once: get a fresh one for another try.
      turnstile.current?.reset();
      setToken(null);
    }
  }

  const error = (field: ContactField) =>
    errors[field] ? (
      <FieldError id={`${field}-error`} className="font-semibold">
        {labels.errors[field]}
      </FieldError>
    ) : null;
  const invalid = (field: ContactField) => (errors[field] ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {});

  return (
    <form onSubmit={submit} noValidate className="flex flex-col">
      <button type="button" onClick={onBack} className="-ml-1 flex w-fit items-center gap-1.5 rounded-full px-1 text-sm font-bold hover:underline">
        <ArrowLeft className="size-4" strokeWidth={2.5} /> {labels.back}
      </button>
      <h3 id="booking-step-title" tabIndex={-1} className="mt-4 text-2xl font-extrabold tracking-tight outline-none md:text-[1.85rem]">
        {d.title}
      </h3>
      <p className="mt-2 text-[0.95rem] leading-snug text-ink/80">{d.intro}</p>

      <div className="mt-5 rounded-xl bg-lime px-4 py-3 text-sm">
        <p className="font-extrabold uppercase tracking-wide">{planName}</p>
        <ul className="mt-1 font-semibold">
          {recap.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field className="gap-1.5 sm:col-span-2">
          <FieldLabel htmlFor="name" className={labelClass}>{d.name}</FieldLabel>
          <Input id="name" name="name" autoComplete="name" required maxLength={80} className={controlClass} {...invalid("name")} />
          {error("name")}
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="phone" className={labelClass}>{d.phone}</FieldLabel>
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} placeholder="07x xxx xxx" className={controlClass} {...invalid("phone")} aria-describedby={errors.phone ? "phone-error" : "phone-hint"} />
          {error("phone") ?? <FieldDescription id="phone-hint" className="text-xs text-muted-ink">{d.phoneHint}</FieldDescription>}
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="email" className={labelClass}>{d.email}</FieldLabel>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={120} className={controlClass} {...invalid("email")} />
          {error("email")}
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="activity" className={labelClass}>{d.activity}</FieldLabel>
          <Select value={activity} onValueChange={(value) => setActivity(value as Activity)}>
            <SelectTrigger id="activity" className={cn(controlClass, "w-full pr-3 data-[size=default]:h-12 data-placeholder:text-muted-ink/60 [&_svg]:text-ink")} {...invalid("activity")}>
              <SelectValue placeholder={d.activityPlaceholder} />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={6} className="rounded-xl border-0 p-1 shadow-[0_16px_40px_rgb(11_11_11/0.14)] ring-1 ring-ink/10">
              {activities.map((a) => (
                <SelectItem key={a} value={a} className="rounded-lg py-2.5 pl-3 text-base focus:bg-lime-soft">
                  {d.activities[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error("activity")}
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="groupSize" className={labelClass}>{d.groupSize}</FieldLabel>
          <Input id="groupSize" name="groupSize" type="number" inputMode="numeric" min={1} max={60} className={controlClass} {...invalid("groupSize")} />
          {error("groupSize")}
        </Field>
        <Field className="gap-1.5 sm:col-span-2">
          <FieldLabel htmlFor="message" className={labelClass}>{d.message}</FieldLabel>
          <Textarea id="message" name="message" rows={3} maxLength={1000} className={cn(controlClass, "h-auto min-h-24 py-3")} {...invalid("message")} />
          {error("message")}
        </Field>
      </div>

      {/* Bots fill in every field; people never see this one. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-5 min-h-[65px]">
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

      {formError && (
        <p role="alert" className="mt-4 rounded-xl border-2 border-ink px-4 py-3 text-sm font-semibold">
          {labels.errors[formError]}
        </p>
      )}

      <p className="mt-4 text-sm text-ink/75">
        {d.privacy}{" "}
        <a href={privacyHref} className="font-bold underline underline-offset-2">
          {d.privacyLink}
        </a>
      </p>

      <Button type="submit" variant="lime" size="pill" disabled={sending} className="mt-5 h-14 w-full text-lg">
        {sending ? d.sending : d.submit}
      </Button>
      <a href={`tel:${mainPhone.tel}`} className="mt-4 text-center text-sm font-bold underline-offset-2 hover:underline">
        {labels.bookByPhone} · {mainPhone.display}
      </a>
    </form>
  );
}

function focusFirstError(form: HTMLFormElement) {
  requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
}

