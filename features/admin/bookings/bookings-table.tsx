"use client";

// The bookings table: one row per booking with the columns that say what it
// is (code, client, plan, when, hours, status, created). Clicking a row opens
// its details (booking-sheet.tsx); the ⋯ menu holds the actions. Edits open
// the editor (booking-editor.tsx); deleting asks first.

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fill } from "@/lib/i18n/text";
import { displayPhone } from "@/features/booking/model/format";
import { copy } from "../copy";
import { formatCreated, formatWhen, planName } from "../format";
import type { BookingRow } from "../queries";
import { BookingEditor } from "./booking-editor";
import { BookingSheet } from "./booking-sheet";
import { StatusBadge } from "./status-badge";
import { statusMoves } from "./status-moves";
import { useBookingActions } from "./use-booking-actions";

export function BookingsTable({ rows, emptyText }: { rows: BookingRow[]; emptyText: string }) {
  const actions = useBookingActions();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<BookingRow | null>(null);
  const [deleting, setDeleting] = useState<BookingRow | null>(null);
  const open = rows.find((r) => r.id === openId) ?? null;

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-cream-line bg-paper">
        <Table>
          <TableHeader>
            <TableRow className="bg-cream/60 hover:bg-cream/60">
              <TableHead className="pl-4">{copy.table.code}</TableHead>
              <TableHead>{copy.table.client}</TableHead>
              <TableHead className="hidden md:table-cell">{copy.table.plan}</TableHead>
              <TableHead>{copy.table.when}</TableHead>
              <TableHead className="hidden text-right sm:table-cell">{copy.table.hours}</TableHead>
              <TableHead>{copy.table.status}</TableHead>
              <TableHead className="hidden lg:table-cell">{copy.table.created}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-ink">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id} onClick={() => setOpenId(row.id)} className="cursor-pointer">
                <TableCell className="pl-4 font-mono text-[0.8rem] font-bold tracking-wide">{row.code}</TableCell>
                <TableCell>
                  <div className="font-semibold">{row.name}</div>
                  <div className="text-xs text-muted-ink">{displayPhone(row.phone)}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{planName(row.plan)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatWhen(row)}
                  {row.sessions.length > 1 && <div className="text-xs text-muted-ink">{fill(copy.table.sessions, { n: row.sessions.length })}</div>}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{row.totalHours}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                  {row.archived && <span className="ml-1.5 text-xs text-muted-ink">{copy.table.archived}</span>}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-ink lg:table-cell">{formatCreated(row.createdAt)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="pr-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={fill(copy.table.actions, { code: row.code })} disabled={actions.busy}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {statusMoves(row.status).map((move) => (
                        <DropdownMenuItem key={move.to} onSelect={() => actions.setStatus(row, move.to)}>
                          {move.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onSelect={() => setEditing(row)}>{copy.actions.edit}</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => actions.setArchived(row, !row.archived)}>
                        {row.archived ? copy.actions.unarchive : copy.actions.archive}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(row)}>
                        {copy.actions.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BookingSheet
        booking={open}
        onOpenChange={(value) => !value && setOpenId(null)}
        onEdit={(row) => setEditing(row)}
        onDelete={(row) => setDeleting(row)}
        actions={actions}
      />

      {editing && <BookingEditor key={editing.id} booking={editing} open onOpenChange={(value) => !value && setEditing(null)} />}

      <AlertDialog open={!!deleting} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fill(copy.remove.title, { code: deleting?.code ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{copy.remove.text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.remove.keep}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                actions.remove(deleting, () => setOpenId(null));
                setDeleting(null);
              }}
            >
              {copy.remove.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
