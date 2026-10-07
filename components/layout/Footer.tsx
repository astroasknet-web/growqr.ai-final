"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaXTwitter, FaLinkedin, FaInstagram } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import Logo from "./Logo";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/ui/TurnstileWidget";
import { useIsIndia } from "@/components/layout/CurrencyProvider";
import { trackGenerateLead, trackFormError } from "@/lib/analytics";

// Pricing is a B2C (self-serve, individual) concept — GrowQR's B2B surfaces
// (Enterprises/Institutes/Recruiters/Startups solution pages, /enterprise and
// its agent pages, and everything else: About, Vision, Contact, Experts,
// Events, Community, ...) sell on a custom quote via "Book a Call", not a
// public price list. Rather than denylist every B2B/other page, this is an
// allowlist of the B2C pages where the footer's Pricing link should appear —
// anything not listed here hides the link by default. Listed pages render
// their own #pricing section, so the footer link jumps straight to it.
const B2C_PAGES_WITH_PRICING = new Set([
  "/",
  "/solutions/coaches",
  "/solutions/consultants",
  "/solutions/freelancers",
  "/solutions/professionals",
  "/solutions/students",
  "/ai-roleplay-coach",
  "/ai-learning-curator",
  "/ai-interviewer",
  "/ai-opportunity-finder",
  "/ai-resume-expert",
  "/ai-brand-builder",
  "/ai-skill-trainer",
]);

function usePricingHref() {
  const pathname = usePathname() ?? "/";
  if (!B2C_PAGES_WITH_PRICING.has(pathname)) return null;
  return `${pathname === "/" ? "" : pathname}#pricing`;
}

export default function Footer() {
  const pricingHref = usePricingHref();
  const isIndia = useIsIndia();
  // Experts, events and community are India-specific. International visitors
  // instead get the four solution links relevant to those markets.
  const exploreLinks = isIndia
    ? [
        { href: "/experts", label: "Experts" },
        { href: "/events", label: "Events" },
        { href: "/community", label: "Community" },
        { href: "/enterprise", label: "Enterprise" },
      ]
    : [
        { href: "/enterprise", label: "Enterprise" },
        { href: "/solutions/institutes", label: "Institutes" },
        { href: "/solutions/recruiters", label: "Recruiters" },
        { href: "/solutions/coaches", label: "Coaches" },
      ];
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [shouldSubmit, setShouldSubmit] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  // Turnstile injects ~250KB of Cloudflare scripts the moment it mounts. The
  // footer is on every page, so we don't mount it until the user engages the
  // newsletter field — keeping that payload off the initial page load.
  const [turnstileArmed, setTurnstileArmed] = useState(false);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const processSubscription = useCallback(async () => {
    if (!email) {
      setErrorMessage("Please enter your email.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/send-newsletter-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer", token: turnstileToken }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("You are already subscribed.");
        }
        throw new Error(data.error || "Could not subscribe. Please try again.");
      }

      trackGenerateLead("newsletter");
      setSuccessMessage("Thanks for subscribing.");
      setErrorMessage(null);
      setEmail("");
      setTurnstileToken(null);
      turnstileRef.current?.reset();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      // "Already subscribed" is a benign duplicate, not a submission failure.
      if (error?.message !== "You are already subscribed.") {
        trackFormError("newsletter", "submit_failed");
      }
      setErrorMessage(error?.message || "Something went wrong. Please try again.");
      setSuccessMessage(null);
    } finally {
      setIsLoading(false);
    }
  }, [email, turnstileToken]);

  useEffect(() => {
    if (shouldSubmit && turnstileToken) {
      processSubscription();
      setShouldSubmit(false);
    }
  }, [processSubscription, shouldSubmit, turnstileToken]);

  // Once the widget has mounted (armed) and we're mid-submit without a token,
  // kick off the invisible challenge. Runs here (not inline in the submit
  // handler) so it also works when submit is what first armed the widget.
  useEffect(() => {
    if (turnstileArmed && shouldSubmit && !turnstileToken) {
      turnstileRef.current?.execute();
    }
  }, [turnstileArmed, shouldSubmit, turnstileToken]);

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (honeypot) {
      setIsLoading(false);
      setSuccessMessage("Thanks for subscribing.");
      return;
    }

    if (!turnstileToken) {
      // Arm + flag submit; the effect above runs the challenge once the widget
      // is mounted (covers the case where the user never focused the field).
      setTurnstileArmed(true);
      setShouldSubmit(true);
      return;
    }

    await processSubscription();
  };

  return (
    <footer
      id="company"
      className="bg-cream border-t border-black/5"
    >
      <div className="mx-auto max-w-[1340px] px-6 md:px-14 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-0">

          {/* ── Logo + Newsletter + Social ── */}
          <div className="col-span-2 md:col-span-4">
            <Logo width={132} height={62} />

            <form className="flex items-center gap-2 mt-6 w-full max-w-[280px] sm:w-fit sm:max-w-none" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onFocus={() => setTurnstileArmed(true)}
                placeholder="Your email"
                required
                disabled={isLoading}
                className="h-9 w-full min-w-0 sm:w-44 rounded-full border border-black/10 bg-white px-4 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-orange/30"
              />
              <input
                type="text"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="h-9 px-4 rounded-full bg-orange text-white text-sm font-semibold hover:bg-orange-dark transition-colors shrink-0"
              >
                {isLoading ? "Joining..." : "Join"}
              </button>
            </form>
            {turnstileArmed && (
              <TurnstileWidget
                ref={turnstileRef}
                className="mt-2"
                execution="execute"
                onVerify={(token) => setTurnstileToken(token)}
                onError={() => {
                  setErrorMessage("Security check failed. Please try again.");
                  setIsLoading(false);
                  setShouldSubmit(false);
                }}
              />
            )}
            {successMessage && <p className="mt-2 text-xs text-orange-deep">{successMessage}</p>}
            {errorMessage   && <p className="mt-2 text-xs text-orange-deep">{errorMessage}</p>}

            <div className="flex gap-2 mt-5">
              <a href="https://www.linkedin.com/company/growqr" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-black/8 flex items-center justify-center text-ink-4 hover:bg-orange hover:text-white hover:border-orange transition-all duration-300"
                aria-label="LinkedIn"><FaLinkedin className="w-4 h-4" /></a>
              <a href="https://x.com/Growqr" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-black/8 flex items-center justify-center text-ink-4 hover:bg-orange hover:text-white hover:border-orange transition-all duration-300"
                aria-label="X"><FaXTwitter className="w-4 h-4" /></a>
              <a href="https://www.instagram.com/growqr.ai" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-black/8 flex items-center justify-center text-ink-4 hover:bg-orange hover:text-white hover:border-orange transition-all duration-300"
                aria-label="Instagram"><FaInstagram className="w-4 h-4" /></a>
              <a href="mailto:support@growqr.ai?subject=GrowQR%20Enquiry&body=Hi%20GrowQR%20Team%2C%0A%0AI%20have%20a%20question%20about%20GrowQR%3A%0A%0A"
                className="w-9 h-9 rounded-full bg-white border border-black/8 flex items-center justify-center text-ink-4 hover:bg-orange hover:text-white hover:border-orange transition-all duration-300"
                aria-label="Email"><MdEmail className="w-4 h-4" /></a>
            </div>
          </div>

          {/* ── Company ── */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-[11px] font-semibold text-ink-4 uppercase tracking-widest mb-4">
              Company
            </h3>
            <ul className="space-y-3.5">
              <li><Link href="/about"          className="text-sm text-ink-3 hover:text-orange transition-colors">About Us</Link></li>
              <li><Link href="/vision"          className="text-sm text-ink-3 hover:text-orange transition-colors">Vision</Link></li>
              <li><Link href="/gallery"         className="text-sm text-ink-3 hover:text-orange transition-colors">Gallery</Link></li>
              <li><Link href="/blog"            className="text-sm text-ink-3 hover:text-orange transition-colors">Blog</Link></li>
              {pricingHref && (
                <li><Link href={pricingHref}  className="text-sm text-ink-3 hover:text-orange transition-colors">Pricing</Link></li>
              )}
              <li><Link href="/contact"         className="text-sm text-ink-3 hover:text-orange transition-colors">Contact Us</Link></li>
              {/*
                The three legal links are ungated on purpose. They were once behind
                `isIndia` on the reasoning that both policies are written to Indian
                law, and that gate must not come back:

                · GrowQR is headquartered in Princeton, NJ (see PrivacyPage). The
                  Privacy Policy covers global processing and applies the DPDP Act
                  *where the visitor is in India*; it is not an India-only document.
                · The newsletter field in this same footer collects an email from
                  every visitor, so the policy has to be reachable from the point of
                  collection, not only from Indian IPs.
                · Meta App Review requires the deletion instructions to stay publicly
                  accessible for as long as the Instagram/LinkedIn connection is live,
                  and Google OAuth verification expects a privacy link on the site.
                  Both are recurring reviews, not one-time hurdles.
                · `isIndia` would also be the wrong gate for the Refund Policy:
                  LIVE_COUNTRIES in lib/currency.ts has 13 markets where plans are
                  purchasable, so gating on India hides refund terms from paying
                  customers in the UAE, Norway, Brazil and ten others. Gate on
                  `useIsLive()` if that link ever needs narrowing.
              */}
              <li><Link href="/privacy-policy"  className="text-sm text-ink-3 hover:text-orange transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund-policy"   className="text-sm text-ink-3 hover:text-orange transition-colors">Refund Policy</Link></li>
              <li><Link href="/data-deletion"   className="text-sm text-ink-3 hover:text-orange transition-colors">Data Deletion</Link></li>
            </ul>
          </div>

          {/* ── Explore ── */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-[11px] font-semibold text-ink-4 uppercase tracking-widest mb-4">
              Explore
            </h3>
            <ul className="space-y-3.5">
              {exploreLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink-3 hover:text-orange transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Offices ── */}
          <div className="col-span-2 md:col-span-4">
            <h3 className="text-[11px] font-semibold text-ink-4 uppercase tracking-widest mb-4">
              Offices
            </h3>
            <ul className="space-y-4">
              <li>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                  <span className="text-sm font-medium text-ink-3">New Jersey, USA</span>
                  <span className="text-[9px] font-bold text-orange bg-orange/10 px-1.5 py-0.5 rounded">HQ</span>
                </div>
                <p className="text-xs text-ink-4 leading-relaxed pl-3.5">
                  103 Carnegie Center Drive, Princeton, NJ 08540
                </p>
              </li>
              <li>
                <a
                  href="https://share.google/OeH9CLBjeBa3VssRT"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                    <span className="text-sm font-medium text-ink-3">Noida, India</span>
                  </div>
                  <p className="text-xs text-ink-4 leading-relaxed pl-3.5">
                    4th Floor, Wesource Building, Sector 125, Noida, UP 201313
                  </p>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                  <span className="text-sm font-medium text-ink-3">Oslo, Norway</span>
                </div>
                <p className="text-xs text-ink-4 leading-relaxed pl-3.5">
                  Odalsgata 42, 2003 Lillestrom
                </p>
              </li>
              <li>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                  <span className="text-sm font-medium text-ink-3">St Julian&apos;s, Malta</span>
                </div>
                <p className="text-xs text-ink-4 leading-relaxed pl-3.5">
                  Dragonara Business Centre, 5th Floor, Dragonara Road, St Julian&apos;s
                </p>
              </li>
            </ul>
          </div>

        </div>
      </div>

      <div className="border-t border-black/5">
        <div className="mx-auto max-w-[1340px] px-6 md:px-14 py-4 sm:py-5 pb-[calc(1rem+env(safe-area-inset-bottom))] flex flex-col md:flex-row justify-center items-center gap-3 sm:gap-4">
          <p className="text-xs text-ink-4 text-center">
            © {new Date().getFullYear()} GrowQR. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
