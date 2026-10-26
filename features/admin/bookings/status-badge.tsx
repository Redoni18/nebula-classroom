// A booking's status as a small coloured label: pending lime, confirmed ink,
// declined and cancelled grey.

import { cn } from "@/lib/utils";
import { copy } from "../copy";
import type { BookingRow } from "../queries";

const STYLES: Record<BookingRow["status"], string> = {
  pending: "bg-lime text-ink",
  confirmed: "bg-ink text-paper",
  declined: "bg-cream text-muted-ink line-through",
  cancelled: "bg-cream text-muted-ink line-through",
};

export function StatusBadge({ status, className }: { status: BookingRow["status"]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap", STYLES[status], className)}>
      {copy.status[status]}
    </span>
  );
}
