"use client";

// The bookings search: filters as you type (a short pause after the last key),
// by code, name or phone, across every booking including the archive. The
// search lives in the address (/admin?q=K7M4QD), so it survives a reload and
// can be linked to (the week calendar's blocks do).

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { copy } from "../copy";

const PAUSE_MS = 250;

export function BookingSearch({ q, className }: { q: string; className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(q);
  const [searching, startSearch] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A new search from elsewhere (a calendar block, "Pastro kërkimin") shows here too.
  const [shown, setShown] = useState(q);
  if (q !== shown) {
    setShown(q);
    setValue(q);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function go(next: string) {
    const term = next.trim();
    startSearch(() => router.replace(term ? `/admin?q=${encodeURIComponent(term)}` : "/admin", { scroll: false }));
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current);
        go(value);
      }}
      className={cn("relative", className)}
    >
      {searching ? (
        <Loader2 className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-ink" />
      ) : (
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-ink" />
      )}
      <Input
        type="search"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => go(next), PAUSE_MS);
        }}
        placeholder={copy.table.search}
        aria-label={copy.table.search}
        className="h-full rounded-lg border-cream-line bg-paper pl-8 pr-8 shadow-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label={copy.table.clearSearch}
          onClick={() => {
            clearTimeout(timer.current);
            setValue("");
            go("");
          }}
          className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-ink hover:bg-cream hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      )}
    </form>
  );
}
