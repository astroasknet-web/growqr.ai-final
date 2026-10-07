import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ConsentForm from "./ConsentForm";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Connect Your Calendar | GrowQR",
  // Self-referencing so the root layout's homepage canonical doesn't leak in
  // and pair a noindex with a canonical to a different URL.
  alternates: { canonical: canonicalUrl("/experts/connect") },
  robots: { index: false, follow: false },
};

type SP = { expert?: string; status?: string; email?: string; message?: string };

/* Shared shell: centered branded card on a soft background. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 md:p-10 shadow-card">
        <Image
          src="/growqr-logo.png"
          alt="GrowQR"
          width={400}
          height={200}
          priority
          className="h-[30px] w-auto select-none mb-7"
        />
        {children}
      </div>
    </main>
  );
}

function Check() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#16A34A" opacity="0.12" />
      <path d="M7 12.5L10.5 16L17 9" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function ConnectCalendarPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { expert, status, email, message } = await searchParams;

  /* ── Success ── */
  if (status === "success") {
    return (
      <Shell>
        <h1 className="text-ink text-2xl font-semibold leading-tight">Calendar connected 🎉</h1>
        <p className="mt-2 text-ink/65 leading-relaxed">
          You&apos;re ready to receive bookings.
        </p>
        {email && (
          <div className="mt-5 rounded-2xl border border-black/10 bg-cream/50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/45">Connected account</p>
            <p className="mt-0.5 font-semibold text-ink break-all">{email}</p>
          </div>
        )}
        <p className="mt-6 text-sm text-ink/45">You can close this window.</p>
      </Shell>
    );
  }

  /* ── Error ── */
  if (status === "error") {
    return (
      <Shell>
        <h1 className="text-ink text-2xl font-semibold leading-tight">Couldn&apos;t connect</h1>
        <p className="mt-2 text-ink/65 leading-relaxed break-words">
          {message || "Something went wrong. Please try again."}
        </p>
        <Link
          href={`/experts/connect${expert ? `?expert=${encodeURIComponent(expert)}` : ""}`}
          className="mt-6 inline-flex items-center justify-center rounded-full border border-black/20 px-7 py-3.5 font-semibold text-ink shadow-[0_6px_0_0_rgb(0,0,0)] transition-all duration-200 hover:bg-ink hover:text-white hover:shadow-[0_4px_0_0_rgb(0,0,0)] hover:translate-y-0.5 active:translate-y-1"
        >
          Try again
        </Link>
      </Shell>
    );
  }

  /* ── Pre-OAuth consent ── */
  return (
    <Shell>
      <h1 className="text-ink text-2xl font-semibold leading-tight">Connect your calendar</h1>
      <p className="mt-2 text-ink/65 leading-relaxed">
        So GrowQR can manage your session bookings.
      </p>

      <ul className="mt-6 flex flex-col gap-3 list-none pl-0">
        {[
          "Check your availability",
          "Add booked sessions to your calendar",
          "Create Google Meet links",
        ].map((t) => (
          <li key={t} className="flex items-start gap-3 text-[15px] text-ink/85">
            <Check />
            {t}
          </li>
        ))}
      </ul>

      <p className="mt-5 flex items-start gap-2 rounded-2xl bg-cream/60 px-4 py-3 text-[13px] leading-snug text-ink/60">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-orange" aria-hidden>
          <path d="M6 10V8a6 6 0 1 1 12 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="4" y="10" width="16" height="10" rx="2.5" stroke="currentColor" strokeWidth="2" />
        </svg>
        We never read your meeting content, notes, or attendees.
      </p>

      <div className="mt-7">
        <ConsentForm expert={expert} />
      </div>
    </Shell>
  );
}
