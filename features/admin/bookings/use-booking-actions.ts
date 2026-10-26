"use client";

// Runs the admin's server actions on a booking and says what happened in a
// toast: confirmed, freed, or why it couldn't (hours taken, day closed).
// Shared by the table's ⋯ menu and the detail panel.

import { useTransition } from "react";
import { toast } from "sonner";
import { fill } from "@/lib/i18n/text";
import type { SaveResult } from "@/features/booking/server/manage-booking";
import { deleteBookingAction, setArchivedAction, setStatusAction } from "../actions";
import { copy } from "../copy";
import { fmt } from "../format";
import type { BookingRow } from "../queries";

/** The reason a save didn't happen, written out; null when it worked. */
export function describeFailure(result: SaveResult | { kind: "fields"; fields: string[] }): string | null {
  switch (result.kind) {
    case "saved":
      return null;
    case "conflict":
      return fill(copy.toasts.conflict, {
        list: result.conflicts.map((c) => `${fmt.dayMonth(c.date)} ${fmt.range({ start: c.hours[0], end: c.hours[c.hours.length - 1] + 1 })} (${c.code})`).join(", "),
      });
    case "closed":
      return fill(copy.toasts.closed, { list: result.dates.map(fmt.dayMonth).join(", ") });
    case "invalid":
      return copy.toasts.invalid;
    case "missing":
      return copy.toasts.missing;
    case "fields":
      return copy.toasts.fields;
  }
}

export function useBookingActions() {
  const [busy, startTransition] = useTransition();

  function run(work: () => Promise<void>) {
    startTransition(async () => {
      try {
        await work();
      } catch (error) {
        console.error(error);
        toast.error(copy.toasts.error);
      }
    });
  }

  return {
    busy,
    setStatus(row: BookingRow, status: BookingRow["status"]) {
      run(async () => {
        const result = await setStatusAction(row.id, status);
        const failure = describeFailure(result);
        if (failure) toast.error(failure);
        else toast.success(fill(copy.toasts[status], { code: row.code }));
      });
    },
    setArchived(row: BookingRow, archived: boolean) {
      run(async () => {
        await setArchivedAction(row.id, archived);
        toast.success(archived ? copy.toasts.archived : copy.toasts.unarchived);
      });
    },
    remove(row: BookingRow, then?: () => void) {
      run(async () => {
        await deleteBookingAction(row.id);
        toast.success(copy.toasts.deleted);
        then?.();
      });
    },
  };
}
