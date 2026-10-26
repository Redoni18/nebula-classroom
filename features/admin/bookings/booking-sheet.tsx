"use client";

// A booking's details, sliding in from the right when its row is clicked:
// contact, lesson, every block of hours, notes, and the same actions as the
// row's ⋯ menu.

import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fill } from "@/lib/i18n/text";
import { displayPhone } from "@/features/booking/model/format";
import { copy } from "../copy";
import { activityName, fmt, formatCreated, planName } from "../format";
import type { BookingRow } from "../queries";
import { statusMoves } from "./status-moves";
import { StatusBadge } from "./status-badge";
import type { useBookingActions } from "./use-booking-actions";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-muted-ink">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function BookingSheet({
  booking,
  onOpenChange,
  onEdit,
  onDelete,
  actions,
}: {
  booking: BookingRow | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (row: BookingRow) => void;
  onDelete: (row: BookingRow) => void;
  actions: ReturnType<typeof useBookingActions>;
}) {
  return (
    <Sheet open={!!booking} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {booking && (
          <>
            <SheetHeader className="border-b border-cream-line">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold tracking-wide">{booking.code}</span>
                <StatusBadge status={booking.status} />
              </div>
              <SheetTitle className="text-xl font-extrabold">{booking.name}</SheetTitle>
              <SheetDescription>
                {planName(booking.plan)} · {fill(copy.detail.total, { hours: booking.totalHours })}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-wrap gap-2 border-b border-cream-line p-4">
              {statusMoves(booking.status).map((move) => (
                <Button
                  key={move.to}
                  size="sm"
                  variant={move.to === "confirmed" ? "lime" : "outline"}
                  disabled={actions.busy}
                  onClick={() => actions.setStatus(booking, move.to)}
                >
                  {move.label}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => onEdit(booking)}>
                {copy.actions.edit}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${booking.phone}`}>
                  <Phone /> {copy.actions.call}
                </a>
              </Button>
            </div>

            <dl className="divide-y divide-cream-line px-4">
              <Row label={copy.detail.phone}>
                <a href={`tel:${booking.phone}`} className="font-semibold underline-offset-2 hover:underline">
                  {displayPhone(booking.phone)}
                </a>
              </Row>
              <Row label={copy.detail.email}>{booking.email ? <a href={`mailto:${booking.email}`}>{booking.email}</a> : copy.detail.none}</Row>
              <Row label={copy.detail.language}>{copy.languages[booking.locale]}</Row>
              <Row label={copy.detail.activity}>{activityName(booking.activity)}</Row>
              <Row label={copy.detail.groupSize}>{booking.groupSize ?? copy.detail.none}</Row>
              <Row label={copy.detail.sessions}>
                <ul className="flex flex-col gap-0.5">
                  {booking.sessions.map((s) => (
                    <li key={`${s.date}-${s.start}`} className="tabular-nums">
                      {fmt.short(s.date)}, {fmt.range(s)}
                    </li>
                  ))}
                </ul>
              </Row>
              <Row label={copy.detail.message}>{booking.message ?? copy.detail.none}</Row>
              <Row label={copy.detail.adminNote}>{booking.adminNote ?? copy.detail.none}</Row>
              <Row label={copy.detail.source}>{copy.detail.sources[booking.source]}</Row>
              <Row label={copy.detail.created}>{formatCreated(booking.createdAt)}</Row>
            </dl>

            <div className="mt-auto flex gap-2 border-t border-cream-line p-4">
              <Button size="sm" variant="outline" disabled={actions.busy} onClick={() => actions.setArchived(booking, !booking.archived)}>
                {booking.archived ? copy.actions.unarchive : copy.actions.archive}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(booking)}>
                {copy.actions.delete}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
