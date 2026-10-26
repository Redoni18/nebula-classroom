// The email the owner gets for each new booking request (SPEC step 3), in
// Albanian: who, what, which hours, and a button that opens it in the admin.
// Sent through Cloudflare Email Sending (the EMAIL binding, wrangler.jsonc)
// from bookings@nebulaclassroom.com to the address in lib/site.ts. Replying
// goes to the client when they left an email.
//
// It's sent after the request is saved and the visitor already has their
// answer; a failed email is logged and doesn't undo the booking (the admin
// shows it either way).

import { sq } from "@/lib/i18n/dictionaries/sq";
import { site } from "@/lib/site";
import { createFormat, displayPhone } from "../model/format";
import type { ParsedBookingRequest } from "../model/request";
import { totalHours, type Session } from "../model/rules";

const fmt = createFormat("sq");
const LANGUAGES = { sq: "Shqip", mk: "Maqedonisht", en: "Anglisht" } as const;
/** Longer bookings (an exclusive month) list this many blocks, then "+N të tjera". */
const SESSIONS_SHOWN = 8;

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export interface NewRequest {
  code: string;
  request: ParsedBookingRequest;
  sessions: Session[];
  /** The site's address, for the link to the admin. */
  origin: string;
}

export function requestEmail({ code, request, sessions, origin }: NewRequest) {
  const when = sessions.length === 1 ? `${fmt.short(sessions[0].date)}, ${fmt.range(sessions[0])}` : `${fmt.dayMonth(sessions[0].date)} – ${fmt.dayMonth(sessions[sessions.length - 1].date)}`;
  const subject = `Kërkesë e re · ${request.name} · ${when} · ${code}`;
  const adminUrl = `${origin}/admin?q=${code}`;
  const phone = displayPhone(request.phone);
  const lines = sessions.slice(0, SESSIONS_SHOWN).map((s) => `${fmt.long(s.date)}, ${fmt.range(s)}`);
  if (sessions.length > SESSIONS_SHOWN) lines.push(`+${sessions.length - SESSIONS_SHOWN} të tjera`);

  const details: [string, string, string?][] = [
    ["Klienti", request.name],
    ["Telefoni", phone, `tel:${request.phone}`],
    ["Email", request.email ?? "—", request.email ? `mailto:${request.email}` : undefined],
    ["Mësimi", sq.booking.details.activities[request.activity]],
    ["Nxënës", request.groupSize ? String(request.groupSize) : "—"],
    ["Gjuha", LANGUAGES[request.locale]],
    ["Shënimi", request.message ?? "—"],
  ];

  const text = [
    `Kërkesë e re për rezervim: ${code}`,
    `${sq.plans.items[request.plan].name} · ${totalHours(sessions)} orë`,
    "",
    ...details.map(([label, value]) => `${label}: ${value}`),
    "",
    "Orët:",
    ...lines.map((l) => `  ${l}`),
    "",
    `Hape në panel: ${adminUrl}`,
    "",
    "Orët mbahen të zëna (Në pritje) derisa ta konfirmosh ose ta refuzosh në panel.",
  ].join("\n");

  const row = ([label, value, href]: [string, string, string?]) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#66665f;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;vertical-align:top">${
      href ? `<a href="${escapeHtml(href)}" style="color:#0b0b0b;font-weight:700">${escapeHtml(value)}</a>` : escapeHtml(value)
    }</td></tr>`;

  const html = `<!doctype html>
<html lang="sq"><body style="margin:0;padding:0;background:#f4f4ec">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(`${request.name} · ${when}`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4ec;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#0b0b0b;font-size:15px;line-height:1.45">
<tr><td style="background:#c7e03c;padding:14px 24px;font-weight:800;letter-spacing:.08em;font-size:13px">NEBULA CLASSROOM.</td></tr>
<tr><td style="padding:24px 24px 8px">
<div style="font-size:22px;font-weight:800">Kërkesë e re për rezervim</div>
<div style="margin-top:4px;color:#66665f">${escapeHtml(sq.plans.items[request.plan].name)} · ${totalHours(sessions)} orë · <span style="font-family:monospace;font-weight:700;color:#0b0b0b;background:#c7e03c;padding:1px 6px;border-radius:4px">${code}</span></div>
</td></tr>
<tr><td style="padding:8px 24px"><table role="presentation" cellpadding="0" cellspacing="0">${details.map(row).join("")}</table></td></tr>
<tr><td style="padding:8px 24px">
<div style="color:#66665f;margin-bottom:4px">Orët</div>
${lines.map((l) => `<div style="font-weight:700">${escapeHtml(l)}</div>`).join("")}
</td></tr>
<tr><td style="padding:20px 24px 8px">
<a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#0b0b0b;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;margin:0 8px 8px 0">Hape në panel</a>
<a href="tel:${escapeHtml(request.phone)}" style="display:inline-block;background:#c7e03c;color:#0b0b0b;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;margin:0 0 8px">Thirr ${escapeHtml(phone)}</a>
</td></tr>
<tr><td style="padding:8px 24px 24px;color:#66665f;font-size:13px">Orët mbahen të zëna (Në pritje) derisa ta konfirmosh ose ta refuzosh në panel.${
    request.email ? " Nëse i përgjigjesh këtij emaili, përgjigjja shkon te klienti." : ""
  }</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return { subject, html, text };
}

/** Sends the owner the email for a new request. Missing binding (a local run without it): logged, not thrown. */
export async function notifyOwner(email: SendEmail | undefined, request: NewRequest): Promise<void> {
  if (!email) {
    console.warn("No EMAIL binding: the owner wasn't emailed about", request.code);
    return;
  }
  const mail = requestEmail(request);
  await email.send({
    from: site.notifications.from,
    to: site.notifications.to,
    replyTo: request.request.email ?? undefined,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}
