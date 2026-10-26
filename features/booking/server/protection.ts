// Spam protection for the booking form: Cloudflare Turnstile's server check,
// and the hashed IP address the rate limit counts by (the address itself is
// never stored).

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** True when Turnstile says the token came from a person. No secret configured: false (fail closed). */
export async function verifyTurnstile(secret: string | undefined, token: string | undefined, ip: string | null): Promise<boolean> {
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not set: booking requests are refused");
    return false;
  }
  if (!token) return false;
  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetch(SITEVERIFY, { method: "POST", body });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("Turnstile check failed", error);
    return false;
  }
}

/** The visitor's address as Cloudflare saw it (cf-connecting-ip can't be set by the visitor). */
export function clientIp(request: Request): string | null {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function hashIp(ip: string | null, salt: string | undefined): Promise<string | null> {
  if (!ip || !salt) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}
