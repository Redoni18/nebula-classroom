// How other parts of the page tell the booking calendar what the visitor
// wants: "Ask for a quote" on a plan picks that plan, an arrow on a "What will
// you teach" card picks that lesson for the form. A tiny publish/subscribe,
// because those buttons and the calendar live in different sections.

import type { Activity, Plan } from "./rules";

export interface BookingIntent {
  plan?: Plan;
  activity?: Activity;
}

const listeners = new Set<(intent: BookingIntent) => void>();

export function announceIntent(intent: BookingIntent) {
  for (const listener of listeners) listener(intent);
}

export function onIntent(listener: (intent: BookingIntent) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
