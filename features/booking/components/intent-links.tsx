"use client";

// Links elsewhere on the page that jump to the calendar with something already
// chosen (see model/intent.ts). Without JavaScript they still jump there.

import { announceIntent } from "../model/intent";
import type { Activity } from "../model/rules";

export function ActivityLink({ activity, ...props }: { activity: Activity } & Omit<React.ComponentProps<"a">, "href">) {
  return <a href="#calendar" onClick={() => announceIntent({ activity })} {...props} />;
}
