/**
 * Stub CTA handlers.
 *
 * All Activate / Subscribe / Get-your-QR buttons wire to these functions
 * until the real integration exists. Each carries a TODO noting which real
 * service it's waiting on.
 *
 * When replacing a stub, keep the same function signature so existing
 * call-sites don't need to change.
 */

import type { Audience } from "./data";

// TODO: wire to signup flow — the Hero / Nav / FinalCTA "Get your QR" CTA.
//   Likely calls an /api/signup endpoint or redirects to the signup route.
export function handleGetYourQR(): void {
  window.location.href = "https://app.growqr.ai/signup";
}

// TODO: wire to activation service — used by every Squad agent card.
//   Should activate that specific agent for the signed-in user.
export function handleActivateAgent(_agentKey: string): void {
  window.location.href = "https://app.growqr.ai/login";
}

// TODO: wire to activation service — used by the Workflows section
//   Activate button. Should spin up the full multi-agent workflow
//   for (audience × goal) combination.
export function handleActivateWorkflow(
  _audienceKey: Audience,
  _goalLabel: string
): void {
  window.location.href = "https://app.growqr.ai/login";
}

// TODO: wire to subscription flow — used by every Use Case sub-page CTA
//   and the Use Cases grid on the home page. Should route to a per-persona
//   plan picker or checkout.
export function handleSubscribe(_personaKey: Audience): void {
  window.location.href = "https://app.growqr.ai/login";
}
