"use client";

// The (i) next to an editor option: a small popover saying what the option does.

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} className="inline-grid size-5 place-items-center rounded-full text-muted-ink hover:bg-cream hover:text-ink">
          <Info className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-72 text-sm leading-snug">
        {children}
      </PopoverContent>
    </Popover>
  );
}
