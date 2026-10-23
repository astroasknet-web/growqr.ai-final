import "server-only";
import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { appSecret } from "./crypto";
import { clientIp, fails, recordFail, sha256 } from "./security";
import { verifyTurnstile } from "@/lib/turnstile";

/**
 * The human check on email sign-in, sign-up and password reset.
 *
 *  - turnstile: Cloudflare Turnstile, when both TURNSTILE_SITE_KEY (or NEXT_PUBLIC_TURNSTILE_SITE_KEY) and TURNSTILE_SECRET_KEY are set.
 *  - pow: otherwise a built-in proof-of-work challenge. The browser has to find a number whose SHA-256 (together with a server-signed
 *    challenge) starts with N zero bits. It costs a person under a second and a bot farm real CPU time per attempt. Each challenge is
 *    signed, expires after 10 minutes and works once. N rises for addresses that have recently failed.
 *  - off: only with PORTAL_CAPTCHA=off (development).
 *
 * It never fails open: when the check cannot be verified, the form is refused.
 */
export type CaptchaMode = "off" | "turnstile" | "pow";

const envKey = (k: string): string => process.env[k] ?? ""; // looked up at run time, not baked in at build

export function turnstileSiteKey(): string {
  return envKey("TURNSTILE_SITE_KEY") || envKey("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
}

export function captchaMode(): CaptchaMode {
  if (envKey("PORTAL_CAPTCHA") === "off") return "off";
  return turnstileSiteKey() && envKey("TURNSTILE_SECRET_KEY") ? "turnstile" : "pow";
}

// ---- proof of work -----------------------------------------------------------------------------------------------------------

const BASE_BITS = 16;
const HARD_BITS = 19;
const MAX_AGE_MS = 10 * 60 * 1000;

export function leadingZeroBits(buf: Buffer): number {
  let n = 0;
  for (const byte of buf) {
    if (byte === 0) { n += 8; continue; }
    n += Math.clz32(byte) - 24;
    break;
  }
  return n;
}

const sign = (secret: string, body: string): string => createHmac("sha256", secret).update(`pow-v1:${body}`).digest("base64url");

/** A new signed challenge for the browser to solve. */
export async function powChallenge(): Promise<{ challenge: string; bits: number }> {
  const ip = await clientIp();
  const bits = (await fails(`loginip:${ip}`)) + (await fails(`pow:${ip}`)) >= 5 ? HARD_BITS : BASE_BITS;
  const body = `${Date.now()}.${randomBytes(12).toString("hex")}.${bits}`;
  return { challenge: `${body}.${sign(await appSecret(), body)}`, bits };
}

/** Check a solution of the form "<challenge>~<nonce>". Single use. */
export async function verifyPow(solution: string): Promise<boolean> {
  if (typeof solution !== "string" || solution.length > 300) return false;
  const [challenge, nonce] = solution.split("~");
  if (!challenge || !nonce || !/^[0-9a-z]{1,16}$/i.test(nonce)) return false;
  const parts = challenge.split(".");
  if (parts.length !== 4) return false;
  const [ts, rnd, bitsStr, sig] = parts;
  const body = `${ts}.${rnd}.${bitsStr}`;
  const good = sign(await appSecret(), body);
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return false;
  const bits = Number(bitsStr);
  const age = Date.now() - Number(ts);
  if (!Number.isInteger(bits) || bits < BASE_BITS || bits > 26 || !(age >= 0 && age <= MAX_AGE_MS)) return false;
  if (leadingZeroBits(createHash("sha256").update(`${challenge}:${nonce}`).digest()) < bits) return false;
  const used = `powused:${sha256(challenge)}`;
  if ((await fails(used, 15)) > 0) return false; // already spent
  await recordFail(used);
  return true;
}

// ---- the check used by the form actions ---------------------------------------------------------------------------------------

export async function humanCheck(fd: FormData, label: string): Promise<boolean> {
  const mode = captchaMode();
  if (mode === "off") return true;
  if (mode === "turnstile") return verifyTurnstile(String(fd.get("cf-turnstile-response") ?? ""), `portal-${label}`);
  const ok = await verifyPow(String(fd.get("pow") ?? ""));
  if (!ok) await recordFail(`pow:${await clientIp()}`); // a failed or replayed solution makes the next challenge harder
  return ok;
}
