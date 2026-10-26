"use client";

// "Ways to book": the four plans on the left of the booking section. "Ask for
// a quote" picks the plan in the calendar next to it (prices are agreed on
// the phone); the chosen plan gets a ring and says so.

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { plans, type Plan } from "../model/rules";

export function PlanList({ plan, labels, onChoose }: { plan: Plan; labels: Dictionary["plans"]; onChoose: (plan: Plan) => void }) {
  return (
    <ul className="mt-8 flex flex-col gap-3.5 md:mt-10 md:gap-4">
      {plans.map((key) => {
        const item = labels.items[key];
        const chosen = plan === key;
        const dark = key === "exclusive";
        return (
          <li
            key={key}
            className={cn(
              "flex flex-col gap-5 rounded-[1.6rem] p-6 transition-shadow sm:flex-row sm:items-center sm:justify-between md:rounded-[1.9rem] md:px-8 md:py-7",
              dark ? "bg-ink text-paper" : "bg-paper",
              chosen && (dark ? "ring-4 ring-lime" : "ring-[3px] ring-ink"),
            )}
          >
            <div>
              <h3 className="font-display text-[1.65rem] leading-none md:text-[2rem]">{item.name}</h3>
              <p className={cn("mt-2.5 max-w-[24rem] text-[0.95rem] leading-snug md:text-[1.05rem]", dark ? "text-paper/85" : "text-ink/85")}>{item.text}</p>
            </div>
            <Button
              type="button"
              variant="lime"
              size="pill-sm"
              aria-pressed={chosen}
              onClick={() => onChoose(key)}
              className="self-start px-5 sm:self-center"
            >
              {chosen ? (
                <>
                  <Check strokeWidth={3} /> {labels.chosen}
                </>
              ) : (
                labels.ask
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
