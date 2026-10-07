"use client";

import type { ReactNode } from "react";
import { CurrencyProvider } from "@/components/layout/CurrencyProvider";
import { DEFAULT_REGION } from "@/lib/currency";

/**
 * Some homepage sections (e.g. "Human in the Loop", GlobalNetwork) render only
 * for visitors in a "live" market, decided from a Vercel geo header. Hosts
 * without that header (Hostinger test site) would hide them. The design previews
 * must always show them, so this forces isLive for the wrapped section only;
 * pricing and the waitlist CTAs keep the real detected region.
 */
export default function ForceLive({ children }: { children: ReactNode }) {
  return <CurrencyProvider value={{ ...DEFAULT_REGION, isLive: true }}>{children}</CurrencyProvider>;
}
