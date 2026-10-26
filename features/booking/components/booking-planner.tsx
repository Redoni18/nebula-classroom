"use client";

// The booking section's moving parts: the plans on the left and the booking
// card on the right, which goes through three steps:
//   pick    → calendar, hours and "Your pick" (model/selection.ts)
//   details → who's booking (details-form.tsx), sent to POST /api/bookings
//   done    → the reference code
// The plan list and the lesson cards higher up steer it through model/intent.ts.

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fill } from "@/lib/i18n/text";
import type { Locale } from "@/lib/i18n/locales";
import { scrollToElement } from "@/components/site/smooth-scroll";
import { mainPhone } from "@/lib/site";
import { monthOf, type DayKey } from "../model/dates";
import { createFormat, displayPhone } from "../model/format";
import { onIntent } from "../model/intent";
import { checkPlan, expandSessions, findConflicts, isBookable, plans, type Activity, type Plan } from "../model/rules";
import { initialSelection, selectionReducer } from "../model/selection";
import { DetailsForm } from "./details-form";
import { HourGrid } from "./hour-grid";
import { CalendarLegend, MonthCalendar, MonthNav } from "./month-calendar";
import { PickSummary } from "./pick-summary";
import { PlanList } from "./plan-list";
import { useAvailability } from "./use-availability";

type Step = { name: "pick" } | { name: "details" } | { name: "done"; code: string; phone: string };

export function BookingPlanner({
  locale,
  heading,
  plansLabels,
  labels,
  privacyHref,
}: {
  locale: Locale;
  /** The section's headline, rendered on the server. */
  heading: React.ReactNode;
  plansLabels: Dictionary["plans"];
  labels: Dictionary["booking"];
  privacyHref: string;
}) {
  const fmt = useMemo(() => createFormat(locale), [locale]);
  const { availability, reload } = useAvailability();
  const [selection, dispatch] = useReducer(selectionReducer, undefined, () => initialSelection("day"));
  const [month, setMonth] = useState<DayKey | null>(null);
  const [step, setStep] = useState<Step>({ name: "pick" });
  const [activity, setActivity] = useState<Activity | null>(null);
  const card = useRef<HTMLDivElement>(null);

  const ready = availability.status === "ready" ? availability : null;
  const shownMonth = month ?? (ready ? monthOf(ready.window.earliest.date) : null);

  const expanded = useMemo(
    () => expandSessions(selection.plan, selection.picks, selection.startDate ?? undefined),
    [selection.plan, selection.picks, selection.startDate],
  );
  const conflicts = useMemo(() => (ready ? findConflicts(expanded, ready.taken) : []), [expanded, ready]);
  const problem = ready ? checkPlan(selection.plan, selection.picks, selection.startDate ?? undefined, ready.window) : "empty";
  const canContinue = problem === null && conflicts.length === 0;

  const chosen = new Set(selection.plan === "exclusive" ? (selection.startDate ? [selection.startDate] : []) : selection.picks.map((p) => p.date));
  const echoes = new Set(expanded.map((s) => s.date));
  const conflictDays = new Set(conflicts.map((c) => c.date));

  // "Ask for a quote" and the lesson cards.
  useEffect(
    () =>
      onIntent((intent) => {
        if (intent.plan) dispatch({ type: "plan", plan: intent.plan });
        if (intent.activity) setActivity(intent.activity);
        setStep((s) => (s.name === "done" ? { name: "pick" } : s));
      }),
    [],
  );

  // Each step starts with its heading in focus, for keyboard and screen-reader users.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const top = card.current?.getBoundingClientRect().top ?? 0;
    if (top < 0 && card.current) scrollToElement(card.current);
    card.current?.querySelector<HTMLElement>("#booking-step-title")?.focus({ preventScroll: true });
  }, [step.name]);

  function choosePlan(plan: Plan) {
    dispatch({ type: "plan", plan });
    setStep({ name: "pick" });
    // On phones the card is under the plans: bring it into view.
    const top = card.current?.getBoundingClientRect().top ?? 0;
    if ((top > window.innerHeight * 0.6 || top < 0) && card.current) scrollToElement(card.current);
  }

  const isFree = (date: DayKey, hour: number) =>
    !!ready && isBookable(date, hour, ready.window) && !(ready.taken[date]?.includes(hour) ?? false);

  const recap =
    selection.plan === "exclusive" && expanded.length > 0
      ? [fill(labels.exclusiveRange, { from: fmt.dayMonth(expanded[0].date), to: fmt.dayMonth(expanded[expanded.length - 1].date) })]
      : selection.picks.map((p) => `${fmt.long(p.date)}, ${fmt.range(p)}`);
  if (selection.plan === "month" && expanded.length > 0) {
    recap.push(fill(labels.repeats, { dates: fmt.list(Array.from({ length: 4 }, (_, w) => fmt.dayMonth(expanded[w * selection.picks.length].date))) }));
  }

  return (
    <>
      <div>
        {heading}
        <PlanList plan={selection.plan} labels={plansLabels} onChoose={choosePlan} />
      </div>

      <div ref={card} id="calendar" aria-labelledby="booking-step-title" className="rounded-[1.75rem] bg-paper p-5 shadow-[0_20px_60px_rgb(11_11_11/0.06)] sm:p-7 md:rounded-[2.25rem] md:p-9 lg:self-start">
        {step.name === "pick" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <h3 id="booking-step-title" tabIndex={-1} className="text-2xl font-extrabold tracking-tight outline-none md:text-[1.85rem]">
                {labels.title}
              </h3>
              {ready && shownMonth && <MonthNav month={shownMonth} window={ready.window} fmt={fmt} labels={labels} onMonth={setMonth} />}
            </div>

            <div role="radiogroup" aria-label={labels.planLabel} className="mt-5 grid grid-cols-4 gap-1 rounded-full bg-cream p-1">
              {plans.map((plan) => (
                <button
                  key={plan}
                  type="button"
                  role="radio"
                  aria-checked={selection.plan === plan}
                  onClick={() => dispatch({ type: "plan", plan })}
                  className="whitespace-nowrap rounded-full px-1 py-2 text-[0.8rem] font-bold transition-colors aria-checked:bg-ink aria-checked:text-paper sm:text-sm"
                >
                  {plansLabels.items[plan].short}
                </button>
              ))}
            </div>

            {availability.status === "loading" && <CalendarSkeleton label={labels.loading} />}
            {availability.status === "error" && (
              <div className="mt-6 rounded-xl border-2 border-ink p-5 text-[0.95rem] font-semibold">
                <p>{labels.loadError}</p>
                <Button type="button" variant="ink" size="pill-sm" className="mt-3" onClick={() => void reload()}>
                  {labels.retry}
                </Button>
              </div>
            )}

            {ready && shownMonth && (
              <>
                <MonthCalendar
                  month={shownMonth}
                  window={ready.window}
                  taken={ready.taken}
                  chosen={chosen}
                  echoes={echoes}
                  conflicts={conflictDays}
                  activeDate={selection.plan === "exclusive" ? null : selection.activeDate}
                  fmt={fmt}
                  labels={labels}
                  onDay={(date) => dispatch({ type: "day", date })}
                />
                <CalendarLegend labels={labels} />

                <hr className="my-6 border-cream-line" />

                {selection.plan === "exclusive" ? (
                  !selection.startDate && <p className="rounded-xl bg-cream p-4 text-center text-[0.95rem] font-semibold">{labels.exclusivePick}</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h4 className="text-xl font-extrabold tracking-tight">{labels.pickHours}</h4>
                      {selection.activeDate && <span className="text-sm font-bold">{fmt.long(selection.activeDate)}</span>}
                    </div>
                    <p className="mt-1 text-sm text-ink/75">{labels.pickHoursHint}</p>
                    {selection.activeDate ? (
                      <HourGrid
                        date={selection.activeDate}
                        window={ready.window}
                        taken={ready.taken}
                        pick={selection.picks.find((p) => p.date === selection.activeDate)}
                        anchor={selection.anchor?.date === selection.activeDate ? selection.anchor.hour : null}
                        fmt={fmt}
                        labels={labels}
                        onHour={(hour) => dispatch({ type: "hour", hour, isFree })}
                      />
                    ) : (
                      <p className="mt-4 rounded-xl bg-cream p-4 text-center text-[0.95rem] font-semibold">{labels.pickDayFirst}</p>
                    )}
                  </>
                )}

                {selection.notice && (
                  <p role="status" className="mt-4 rounded-xl border-2 border-ink px-4 py-3 text-sm font-semibold">
                    {selection.notice.kind === "rangeBlocked" && labels.rangeBlocked}
                    {selection.notice.kind === "weekSpan" && fill(labels.weekSpan, { from: fmt.dayMonth(selection.notice.from), to: fmt.dayMonth(selection.notice.to) })}
                    {selection.notice.kind === "conflict" && labels.errors.conflict}
                  </p>
                )}

                <PickSummary
                  locale={locale}
                  plan={selection.plan}
                  picks={selection.picks}
                  expanded={expanded}
                  conflicts={conflicts}
                  fmt={fmt}
                  labels={labels}
                  onRemove={(date) => dispatch({ type: "remove", date })}
                />
                {problem === "tooFewHours" && labels.minimum[selection.plan] && (
                  <p className="mt-3 text-sm font-semibold">
                    {labels.minimum[selection.plan]}
                  </p>
                )}

                <p className="mt-4 text-sm text-ink/75">{labels.note}</p>

                <div className="mt-5 grid grid-cols-[2fr_3fr] gap-3">
                  <Button type="button" variant="inkOutline" size="pill" className="h-14 text-base" onClick={() => dispatch({ type: "clear" })}>
                    {labels.cancel}
                  </Button>
                  <Button type="button" variant="lime" size="pill" className="h-14 text-base" disabled={!canContinue} onClick={() => setStep({ name: "details" })}>
                    {labels.continue}
                  </Button>
                </div>
                <a href={`tel:${mainPhone.tel}`} className="mt-4 block text-center text-sm font-bold underline-offset-2 hover:underline">
                  {labels.bookByPhone} · {mainPhone.display}
                </a>
              </>
            )}
          </>
        )}

        {step.name === "details" && (
          <DetailsForm
            locale={locale}
            plan={selection.plan}
            picks={selection.picks}
            startDate={selection.startDate}
            initialActivity={activity}
            privacyHref={privacyHref}
            labels={labels}
            planName={plansLabels.items[selection.plan].name}
            recap={recap}
            onBack={() => setStep({ name: "pick" })}
            onSent={(code, phone) => {
              setStep({ name: "done", code, phone });
              dispatch({ type: "clear" });
              void reload();
            }}
            onConflict={() => {
              setStep({ name: "pick" });
              dispatch({ type: "notice", notice: { kind: "conflict" } });
              void reload();
            }}
          />
        )}

        {step.name === "done" && (
          <div className="flex flex-col items-start py-2">
            <span className="grid size-14 place-items-center rounded-full bg-lime">
              <Check className="size-7" strokeWidth={3} />
            </span>
            <h3 id="booking-step-title" tabIndex={-1} className="mt-5 text-2xl font-extrabold tracking-tight outline-none md:text-[1.85rem]">
              {labels.done.title}
            </h3>
            <p className="mt-4 -rotate-1 bg-lime px-4 py-2 text-xl font-extrabold tracking-wider">{fill(labels.done.code, { code: step.code })}</p>
            <p className="mt-5 text-[1.05rem] leading-snug">{fill(labels.done.text, { phone: displayPhone(step.phone) })}</p>
            <Button type="button" variant="inkOutline" size="pill" className="mt-6" onClick={() => setStep({ name: "pick" })}>
              {labels.done.another}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function CalendarSkeleton({ label }: { label: string }) {
  return (
    <div className="mt-5" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden className="grid animate-pulse grid-cols-7 gap-1.5 md:gap-2.5">
        {Array.from({ length: 42 }, (_, i) => (
          <span key={i} className="h-10 rounded-[0.7rem] bg-cream md:h-12" />
        ))}
      </div>
    </div>
  );
}

