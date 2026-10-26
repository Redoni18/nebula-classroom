// The bookings page's content (server): the top bar with search and
// "Shto rezervim", four headline cards, the view tabs and the table.

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Db } from "@/lib/db";
import { fill } from "@/lib/i18n/text";
import { cn } from "@/lib/utils";
import { copy } from "../copy";
import { bookingStats, bookingViews, listBookings, viewCounts, type BookingView } from "../queries";
import { StatCard } from "../shell/stat-card";
import { TopBar } from "../shell/top-bar";
import { NewBookingButton } from "./booking-editor";
import { BookingSearch } from "./booking-search";
import { BookingsTable } from "./bookings-table";

export async function BookingsPage({ db, view, q, today, now }: { db: Db; view: BookingView; q: string; today: string; now: number }) {
  const [rows, counts, stats] = await Promise.all([listBookings(db, view, q, today), viewCounts(db, today), bookingStats(db, today, now)]);

  return (
    <>
      <TopBar title={copy.nav.bookings}>
        <BookingSearch q={q} className="hidden h-8 w-64 sm:block" />
        <NewBookingButton />
      </TopBar>

      <div className="flex flex-col gap-5 p-3 md:p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard accent={stats.pending > 0} label={copy.stats.pending.label} value={stats.pending} line={copy.stats.pending.line} />
          <StatCard label={copy.stats.today.label} value={stats.todayHours} line={fill(copy.stats.today.line, { open: stats.openToday })} />
          <StatCard label={copy.stats.week.label} value={stats.weekHours} line={fill(copy.stats.week.line, { open: stats.openWeekHours, percent: stats.weekPercent })} />
          <StatCard label={copy.stats.fresh.label} value={stats.fresh} line={copy.stats.fresh.line} />
        </div>

        {/* Search on phones (the top bar's field is hidden there). */}
        <BookingSearch q={q} className="h-10 sm:hidden" />

        {q ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">“{q}”</span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">
                <X /> {copy.table.clearSearch}
              </Link>
            </Button>
          </div>
        ) : (
          <nav className="flex flex-wrap gap-1.5" aria-label={copy.nav.bookings}>
            {bookingViews.map((v) => (
              <Link
                key={v}
                href={v === "pending" ? "/admin" : `/admin?view=${v}`}
                aria-current={v === view ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-cream-line bg-paper px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-cream",
                  v === view && "border-ink bg-ink text-paper hover:bg-ink",
                )}
              >
                {copy.views[v]}
                <span className={cn("rounded-full px-1.5 text-xs tabular-nums", v === view ? "bg-paper/15" : "bg-cream")}>{counts[v]}</span>
              </Link>
            ))}
          </nav>
        )}

        <BookingsTable rows={rows} emptyText={q ? fill(copy.table.emptySearch, { q }) : copy.table.empty} />
      </div>
    </>
  );
}
