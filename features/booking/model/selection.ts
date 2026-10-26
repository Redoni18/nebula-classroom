// What the visitor has picked in the calendar, and how each tap changes it.
// A plain reducer (no React here), so the rules of tapping are in one place:
//
// - Day pass: one day; tapping another day moves the pick there.
// - Week and month: several days, all within 7 days of each other.
// - Hours: the first tap picks one hour and remembers it; the second tap on
//   the same day stretches the pick to that hour (both included), as long as
//   no taken hour is in between. A third tap starts again.
// - Exclusive month: one tap picks the start day.

import { daysBetween, addDays, type DayKey } from "./dates";
import type { Plan, Session } from "./rules";

export type Notice =
  | { kind: "rangeBlocked" }
  | { kind: "weekSpan"; from: DayKey; to: DayKey }
  | { kind: "conflict" };

export interface Selection {
  plan: Plan;
  /** Day, week, month: one block per day. Month: the first week's blocks. */
  picks: Session[];
  /** Exclusive month: the first day. */
  startDate: DayKey | null;
  /** The day whose hours are shown. */
  activeDate: DayKey | null;
  /** First tap of a two-tap range. */
  anchor: { date: DayKey; hour: number } | null;
  notice: Notice | null;
}

export type SelectionAction =
  | { type: "plan"; plan: Plan }
  | { type: "day"; date: DayKey }
  | { type: "hour"; hour: number; isFree: (date: DayKey, hour: number) => boolean }
  | { type: "remove"; date: DayKey }
  | { type: "clear" }
  | { type: "notice"; notice: Notice | null };

export function initialSelection(plan: Plan = "day"): Selection {
  return { plan, picks: [], startDate: null, activeDate: null, anchor: null, notice: null };
}

/** True when `date` can join the picks without the days spreading over more than 7. */
function fitsWeek(picks: Session[], date: DayKey): boolean {
  const dates = [...picks.map((p) => p.date), date].sort();
  return daysBetween(dates[0], dates[dates.length - 1]) < 7;
}

function weekOf(picks: Session[]): { from: DayKey; to: DayKey } {
  const first = picks.map((p) => p.date).sort()[0];
  return { from: first, to: addDays(first, 6) };
}

function setPick(picks: Session[], pick: Session, onlyOne: boolean): Session[] {
  const others = onlyOne ? [] : picks.filter((p) => p.date !== pick.date);
  return [...others, pick].sort((a, b) => a.date.localeCompare(b.date));
}

export function selectionReducer(state: Selection, action: SelectionAction): Selection {
  switch (action.type) {
    case "plan":
      if (action.plan === state.plan) return state;
      return { ...initialSelection(action.plan), activeDate: action.plan === "exclusive" ? null : state.activeDate };

    case "clear":
      return initialSelection(state.plan);

    case "notice":
      return { ...state, notice: action.notice };

    case "remove":
      return {
        ...state,
        picks: state.picks.filter((p) => p.date !== action.date),
        anchor: state.anchor?.date === action.date ? null : state.anchor,
        notice: null,
      };

    case "day": {
      const { date } = action;
      if (state.plan === "exclusive") {
        return { ...state, startDate: date, activeDate: date, notice: null };
      }
      if (state.plan === "day") {
        return { ...state, activeDate: date, picks: state.picks.filter((p) => p.date === date), anchor: null, notice: null };
      }
      if (state.picks.length > 0 && !fitsWeek(state.picks, date)) {
        return { ...state, notice: { kind: "weekSpan", ...weekOf(state.picks) } };
      }
      return { ...state, activeDate: date, anchor: null, notice: null };
    }

    case "hour": {
      const date = state.activeDate;
      if (!date || state.plan === "exclusive") return state;
      const { hour, isFree } = action;
      const onlyOne = state.plan === "day";
      const existing = state.picks.find((p) => p.date === date);

      // Second tap: stretch from the remembered hour to this one.
      if (state.anchor && state.anchor.date === date && state.anchor.hour !== hour) {
        const lo = Math.min(state.anchor.hour, hour);
        const hi = Math.max(state.anchor.hour, hour);
        for (let h = lo; h <= hi; h++) {
          if (!isFree(date, h)) {
            return {
              ...state,
              picks: setPick(state.picks, { date, start: hour, end: hour + 1 }, onlyOne),
              anchor: { date, hour },
              notice: { kind: "rangeBlocked" },
            };
          }
        }
        return { ...state, picks: setPick(state.picks, { date, start: lo, end: hi + 1 }, onlyOne), anchor: null, notice: null };
      }

      // The same single hour again: un-pick it.
      if (state.anchor && existing && existing.start === hour && existing.end === hour + 1) {
        return { ...state, picks: state.picks.filter((p) => p.date !== date), anchor: null, notice: null };
      }

      return { ...state, picks: setPick(state.picks, { date, start: hour, end: hour + 1 }, onlyOne), anchor: { date, hour }, notice: null };
    }
  }
}
