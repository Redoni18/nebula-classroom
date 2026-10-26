"use client";

// The admin's booking form, in a dialog: adding a booking taken by phone, or
// changing one (details and hours). Every option has an (i) saying what it
// does. Hours are entered as rows (a day, from, to); "Përsërit 4 javë" copies
// the rows to the next three weeks for monthly plans. Saving checks the hours
// against everyone else's and against closed days (manage-booking.ts).

import { useState, useTransition } from "react";
import { Plus, Repeat, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fill } from "@/lib/i18n/text";
import { locales, type Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";
import { addDays, type DayKey } from "@/features/booking/model/dates";
import { displayPhone } from "@/features/booking/model/format";
import { activities, CLOSE_HOUR, OPEN_HOUR, plans, type Activity, type Plan } from "@/features/booking/model/rules";
import { saveBookingAction } from "../actions";
import { copy } from "../copy";
import { activityName, fmt, planName } from "../format";
import type { BookingRow } from "../queries";
import { DatePicker } from "../shell/date-picker";
import { InfoTip } from "../shell/info-tip";
import { describeFailure } from "./use-booking-actions";

interface SessionRow {
  key: number;
  date: DayKey | null;
  start: number;
  end: number;
}

interface FormState {
  plan: Plan;
  status: "pending" | "confirmed";
  name: string;
  phone: string;
  email: string;
  activity: Activity;
  groupSize: string;
  message: string;
  adminNote: string;
  locale: Locale;
  sessions: SessionRow[];
}

let nextKey = 1;

function fromBooking(booking: BookingRow | null): FormState {
  return {
    plan: booking?.plan ?? "day",
    status: booking?.status === "pending" ? "pending" : "confirmed",
    name: booking?.name ?? "",
    phone: booking ? displayPhone(booking.phone) : "",
    email: booking?.email ?? "",
    activity: booking?.activity ?? "other",
    groupSize: booking?.groupSize ? String(booking.groupSize) : "",
    message: booking?.message ?? "",
    adminNote: booking?.adminNote ?? "",
    locale: booking?.locale ?? "sq",
    sessions: booking?.sessions.length
      ? booking.sessions.map((s) => ({ key: nextKey++, ...s }))
      : [{ key: nextKey++, date: null, start: 9, end: 11 }],
  };
}

const START_HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
const END_HOURS = START_HOURS.map((h) => h + 1);
const controlClass = "h-10 w-full rounded-lg border-cream-line bg-paper shadow-none";

function Label({ htmlFor, children, info }: { htmlFor?: string; children: React.ReactNode; info: string }) {
  return (
    <div className="flex items-center gap-1">
      <FieldLabel htmlFor={htmlFor} className="text-sm font-semibold">
        {children}
      </FieldLabel>
      <InfoTip label={fill(copy.infoLabel, { name: String(children) })}>{info}</InfoTip>
    </div>
  );
}

export function BookingEditor({ booking, open, onOpenChange }: { booking: BookingRow | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState<FormState>(() => fromBooking(booking));
  const [errors, setErrors] = useState<string[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const e = copy.editor;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setSession = (key: number, patch: Partial<SessionRow>) =>
    setForm((f) => ({
      ...f,
      sessions: f.sessions.map((s) => {
        if (s.key !== key) return s;
        const next = { ...s, ...patch };
        if (next.end <= next.start) next.end = Math.min(next.start + 1, CLOSE_HOUR);
        return next;
      }),
    }));

  function addDay() {
    setForm((f) => {
      const last = f.sessions[f.sessions.length - 1];
      return { ...f, sessions: [...f.sessions, { key: nextKey++, date: last?.date ? addDays(last.date, 1) : null, start: last?.start ?? 9, end: last?.end ?? 11 }] };
    });
  }

  /** Copies the rows with a day to the next three weeks, skipping days already listed. */
  function repeatFourWeeks() {
    setForm((f) => {
      const dated = f.sessions.filter((s): s is SessionRow & { date: DayKey } => !!s.date);
      const existing = new Set(dated.map((s) => `${s.date}:${s.start}`));
      const copies = [7, 14, 21].flatMap((offset) =>
        dated
          .map((s) => ({ key: nextKey++, date: addDays(s.date, offset), start: s.start, end: s.end }))
          .filter((s) => !existing.has(`${s.date}:${s.start}`)),
      );
      return { ...f, sessions: [...f.sessions, ...copies].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")) };
    });
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    setFailure(null);
    startSaving(async () => {
      const result = await saveBookingAction(booking?.id ?? null, {
        plan: form.plan,
        status: form.status,
        name: form.name,
        phone: form.phone,
        email: form.email,
        activity: form.activity,
        groupSize: form.groupSize.trim() ? Number(form.groupSize) : null,
        message: form.message,
        adminNote: form.adminNote,
        locale: form.locale,
        sessions: form.sessions.filter((s) => s.date).map((s) => ({ date: s.date as DayKey, start: s.start, end: s.end })),
      });
      if (result.kind === "saved") {
        toast.success(fill(copy.toasts.saved, { code: result.code }));
        onOpenChange(false);
        return;
      }
      setErrors(result.kind === "fields" ? result.fields : []);
      setFailure(describeFailure(result));
    });
  }

  const invalid = (field: string) => (errors.includes(field) ? { "aria-invalid": true as const } : {});
  const fieldError = (field: keyof typeof e.errors) => (errors.includes(field) ? <FieldError>{e.errors[field]}</FieldError> : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-x-hidden overflow-y-auto p-0 sm:max-w-2xl">
        <form onSubmit={save} className="flex flex-col">
          <DialogHeader className="border-b border-cream-line p-4 md:p-6">
            <DialogTitle className="text-xl font-extrabold">{booking ? fill(e.titleEdit, { code: booking.code }) : e.titleNew}</DialogTitle>
            <DialogDescription>{e.intro}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 p-4 md:grid-cols-2 md:p-6">
            <Field className="gap-1.5">
              <Label info={e.info.plan}>{e.plan}</Label>
              <Select value={form.plan} onValueChange={(v) => set("plan", v as Plan)}>
                <SelectTrigger className={controlClass} aria-label={e.plan}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p} value={p}>
                      {planName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field className="gap-1.5">
              <Label info={e.info.status}>{e.status}</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as FormState["status"])}>
                <SelectTrigger className={controlClass} aria-label={e.status}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">{copy.status.confirmed}</SelectItem>
                  <SelectItem value="pending">{copy.status.pending}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <fieldset className="flex flex-col gap-2 md:col-span-2">
              <div className="flex items-center gap-1">
                <legend className="text-sm font-semibold">{e.sessions}</legend>
                <InfoTip label={fill(copy.infoLabel, { name: e.sessions })}>{e.info.sessions}</InfoTip>
              </div>
              {/* One row per day. Phones: the date on its own line, from/to/remove under it. */}
              {form.sessions.map((s) => (
                <div key={s.key} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                  <DatePicker value={s.date} onChange={(date) => setSession(s.key, { date })} className={cn(controlClass, "col-span-3 sm:col-span-1")} />
                  <Select value={String(s.start)} onValueChange={(v) => setSession(s.key, { start: Number(v) })}>
                    <SelectTrigger className={cn(controlClass, "sm:w-24")} aria-label={e.from}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {START_HOURS.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {fmt.hour(h)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(s.end)} onValueChange={(v) => setSession(s.key, { end: Number(v) })}>
                    <SelectTrigger className={cn(controlClass, "sm:w-24")} aria-label={e.to}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {END_HOURS.filter((h) => h > s.start).map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {fmt.hour(h)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={e.removeDay}
                    disabled={form.sessions.length === 1}
                    onClick={() => set("sessions", form.sessions.filter((x) => x.key !== s.key))}
                  >
                    <X />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={addDay}>
                  <Plus /> {e.addDay}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={repeatFourWeeks}>
                  <Repeat /> {e.repeat}
                </Button>
              </div>
            </fieldset>

            <Field className="gap-1.5 md:col-span-2">
              <FieldLabel htmlFor="ed-name" className="text-sm font-semibold">{e.name}</FieldLabel>
              <Input id="ed-name" value={form.name} onChange={(ev) => set("name", ev.target.value)} className={controlClass} {...invalid("name")} />
              {fieldError("name")}
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="ed-phone" className="text-sm font-semibold">{e.phone}</FieldLabel>
              <Input id="ed-phone" type="tel" value={form.phone} onChange={(ev) => set("phone", ev.target.value)} placeholder="07x xxx xxx" className={controlClass} {...invalid("phone")} />
              {fieldError("phone")}
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="ed-email" className="text-sm font-semibold">{e.email}</FieldLabel>
              <Input id="ed-email" type="email" value={form.email} onChange={(ev) => set("email", ev.target.value)} className={controlClass} {...invalid("email")} />
              {fieldError("email")}
            </Field>
            <Field className="gap-1.5">
              <Label info={e.info.activity}>{e.activity}</Label>
              <Select value={form.activity} onValueChange={(v) => set("activity", v as Activity)}>
                <SelectTrigger className={controlClass} aria-label={e.activity}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((a) => (
                    <SelectItem key={a} value={a}>
                      {activityName(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field className="gap-1.5">
              <Label htmlFor="ed-group" info={e.info.groupSize}>{e.groupSize}</Label>
              <Input id="ed-group" type="number" inputMode="numeric" min={1} max={200} value={form.groupSize} onChange={(ev) => set("groupSize", ev.target.value)} className={controlClass} {...invalid("groupSize")} />
              {fieldError("groupSize")}
            </Field>
            <Field className="gap-1.5">
              <Label info={e.info.locale}>{e.locale}</Label>
              <Select value={form.locale} onValueChange={(v) => set("locale", v as Locale)}>
                <SelectTrigger className={controlClass} aria-label={e.locale}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((l) => (
                    <SelectItem key={l} value={l}>
                      {copy.languages[l]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field className="gap-1.5 md:col-span-2">
              <Label htmlFor="ed-message" info={e.info.message}>{e.message}</Label>
              <Textarea id="ed-message" value={form.message} onChange={(ev) => set("message", ev.target.value)} className="min-h-16 rounded-lg border-cream-line bg-paper shadow-none" />
            </Field>
            <Field className="gap-1.5 md:col-span-2">
              <Label htmlFor="ed-note" info={e.info.adminNote}>{e.adminNote}</Label>
              <Textarea id="ed-note" value={form.adminNote} onChange={(ev) => set("adminNote", ev.target.value)} className="min-h-16 rounded-lg border-cream-line bg-paper shadow-none" />
            </Field>
          </div>

          {failure && (
            <p role="alert" className="mx-4 mb-2 rounded-lg border-2 border-ink px-3 py-2 text-sm font-semibold md:mx-6">
              {failure}
            </p>
          )}

          {/* mx-0 mb-0: shadcn's footer reaches out by the dialog's padding, which this dialog doesn't have. */}
          <DialogFooter className="sticky bottom-0 mx-0 mb-0 border-t border-cream-line bg-paper p-4 md:px-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {e.cancel}
            </Button>
            <Button type="submit" variant="ink" disabled={saving}>
              {saving ? e.saving : e.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** The "Shto rezervim" button in the bookings page's top bar. */
export function NewBookingButton() {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  return (
    <>
      <Button
        variant="ink"
        size="sm"
        onClick={() => {
          setRound((r) => r + 1);
          setOpen(true);
        }}
      >
        <Plus /> {copy.actions.add}
      </Button>
      {open && <BookingEditor key={round} booking={null} open={open} onOpenChange={setOpen} />}
    </>
  );
}
