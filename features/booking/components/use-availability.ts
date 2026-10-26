"use client";

// Loads the taken hours and the booking window from /api/availability.
// The calendar waits for it (rather than trusting the visitor's clock), and
// reload() refreshes it after a request, keeping the old data on screen.

import { useCallback, useEffect, useState } from "react";
import type { BookingWindow, TakenHours } from "../model/rules";

export type Availability =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; window: BookingWindow; taken: TakenHours };

async function fetchAvailability(): Promise<Availability> {
  try {
    const response = await fetch("/api/availability", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { window: BookingWindow; taken: TakenHours };
    return { status: "ready", ...data };
  } catch (error) {
    console.error("Loading availability failed", error);
    return { status: "error" };
  }
}

export function useAvailability() {
  const [state, setState] = useState<Availability>({ status: "loading" });

  // A failed refresh keeps the hours already on screen.
  const apply = useCallback((next: Availability) => setState((current) => (next.status === "error" && current.status === "ready" ? current : next)), []);

  useEffect(() => {
    let current = true;
    fetchAvailability().then((next) => current && apply(next));
    return () => {
      current = false;
    };
  }, [apply]);

  const reload = useCallback(() => fetchAvailability().then(apply), [apply]);

  return { availability: state, reload };
}
