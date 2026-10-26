// The status changes that make sense from each status, for the ⋯ menu and
// the detail panel: pending → confirm or decline; confirmed → cancel or back
// to pending; declined or cancelled → back to pending (takes the hours again).

import { copy } from "../copy";
import type { BookingRow } from "../queries";

export function statusMoves(status: BookingRow["status"]): { to: BookingRow["status"]; label: string }[] {
  switch (status) {
    case "pending":
      return [
        { to: "confirmed", label: copy.actions.confirm },
        { to: "declined", label: copy.actions.decline },
      ];
    case "confirmed":
      return [
        { to: "cancelled", label: copy.actions.cancel },
        { to: "pending", label: copy.actions.reopen },
      ];
    default:
      return [{ to: "pending", label: copy.actions.reopen }];
  }
}
