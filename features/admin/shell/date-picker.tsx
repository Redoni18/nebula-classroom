"use client";

// A date field for the admin: a button showing the day ("E martë, 10 nën")
// that opens shadcn's calendar (Albanian, Monday first) and closes on a pick.

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { sq as dayPickerSq } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toKey, type DayKey } from "@/features/booking/model/dates";
import { copy } from "../copy";
import { fmt } from "../format";

function toDate(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function DatePicker({
  value,
  onChange,
  fromDate,
  className,
  id,
}: {
  value: DayKey | null;
  onChange: (value: DayKey) => void;
  /** Days before this can't be picked. */
  fromDate?: DayKey;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className={cn("justify-start font-normal shadow-none", !value && "text-muted-ink", className)}>
          <CalendarIcon />
          {value ? fmt.long(value) : copy.editor.pickDate}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={dayPickerSq}
          weekStartsOn={1}
          disabled={fromDate ? { before: toDate(fromDate) } : undefined}
          selected={value ? toDate(value) : undefined}
          defaultMonth={value ? toDate(value) : fromDate ? toDate(fromDate) : undefined}
          onSelect={(d) => {
            if (!d) return;
            onChange(toKey(d.getFullYear(), d.getMonth() + 1, d.getDate()));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
