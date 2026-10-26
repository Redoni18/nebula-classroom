"use client";

// Adding and removing closed days: a date picker and an optional reason, and
// a "Hape përsëri" button per day. A day that still has bookings can't be
// closed (the reply lists their codes).

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fill } from "@/lib/i18n/text";
import type { DayKey } from "@/features/booking/model/dates";
import { addClosedDayAction, removeClosedDayAction } from "../actions";
import { copy } from "../copy";
import { fmt } from "../format";
import { DatePicker } from "../shell/date-picker";
import { InfoTip } from "../shell/info-tip";

export function ClosedDaysEditor({ days, today }: { days: { date: string; reason: string | null }[]; today: DayKey }) {
  const [date, setDate] = useState<DayKey | null>(null);
  const [reason, setReason] = useState("");
  const [busy, start] = useTransition();
  const c = copy.closedDays;

  function add(event: React.FormEvent) {
    event.preventDefault();
    if (!date) return;
    start(async () => {
      const result = await addClosedDayAction(date, reason);
      if (result.kind === "added") {
        toast.success(fill(c.added, { date: fmt.long(date) }));
        setDate(null);
        setReason("");
      } else if (result.kind === "hasBookings") {
        toast.error(fill(c.hasBookings, { list: result.codes.join(", ") }));
      } else {
        toast.error(copy.toasts.error);
      }
    });
  }

  function remove(day: string) {
    start(async () => {
      await removeClosedDayAction(day);
      toast.success(fill(c.removed, { date: fmt.long(day) }));
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={add} className="grid gap-3 rounded-xl border border-cream-line bg-paper p-4 sm:grid-cols-[14rem_1fr_auto] sm:items-end">
        <Field className="gap-1.5">
          <div className="flex items-center gap-1">
            <FieldLabel className="text-sm font-semibold">{c.date}</FieldLabel>
            <InfoTip label={fill(copy.infoLabel, { name: c.date })}>{c.info.date}</InfoTip>
          </div>
          <DatePicker value={date} onChange={setDate} fromDate={today} className="h-10" />
        </Field>
        <Field className="gap-1.5">
          <div className="flex items-center gap-1">
            <FieldLabel htmlFor="reason" className="text-sm font-semibold">{c.reason}</FieldLabel>
            <InfoTip label={fill(copy.infoLabel, { name: c.reason })}>{c.info.reason}</InfoTip>
          </div>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={c.reasonPlaceholder} maxLength={200} className="h-10 rounded-lg border-cream-line shadow-none" />
        </Field>
        <Button type="submit" variant="ink" className="h-10" disabled={!date || busy}>
          {c.add}
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-cream-line bg-paper">
        <Table>
          <TableHeader>
            <TableRow className="bg-cream/60 hover:bg-cream/60">
              <TableHead className="pl-4">{c.date}</TableHead>
              <TableHead>{c.reason}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-ink">
                  {c.empty}
                </TableCell>
              </TableRow>
            )}
            {days.map((day) => (
              <TableRow key={day.date}>
                <TableCell className="pl-4 font-semibold">{fmt.long(day.date)} {day.date.slice(0, 4)}</TableCell>
                <TableCell className="text-muted-ink">{day.reason ?? "—"}</TableCell>
                <TableCell className="pr-3 text-right">
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => remove(day.date)}>
                    {c.remove}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
