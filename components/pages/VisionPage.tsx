import Reveal from "@/components/ui/Reveal";

export default function VisionPage() {
  const goals = [
    "Launch in 4+ countries",
    "Partner with 50+ institutions globally",
    "Enable 100k+ in hiring matches",
    "Verify 1 million credentials by 2026",
  ];

  return (
    <>
      <section className="pt-32 md:pt-40 pb-14 md:pb-20 px-6 md:px-14">
        <div className="mx-auto max-w-[1280px] text-center">
          <Reveal direction="left" offset={60}>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange/15 bg-orange/5 px-4 py-2 text-sm font-semibold text-orange-deep mb-6">
              Vision
            </div>
            <h1 className="mx-auto max-w-4xl text-center text-[30px] sm:text-[40px] md:text-[52px] font-medium leading-[1.2] tracking-[-0.02em] text-ink">
              To Enable a World Where Every <span className="text-orange">Skill</span> is Recognized, Talent is Verified, and Opportunity is Unlocked.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="px-6 md:px-14 pb-20 md:pb-28">
        <div className="mx-auto max-w-[1280px] grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-md border border-black/8 bg-cream p-6 md:p-8">
            <Reveal direction="left" offset={60}>
              <h2 className="text-3xl md:text-5xl font-medium leading-tight text-ink">Ambitious <span className="text-orange">Goals</span></h2>
              <p className="mt-4 text-[15px] md:text-[16px] text-ink-3 leading-relaxed">
                We&apos;re not just building a product. We&apos;re building a movement.
                Here&apos;s what we&apos;re committed to achieving.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {goals.map((goal, index) => (
              <div key={goal} className="rounded-md border border-black/8 bg-white p-5 md:p-6 shadow-[0_18px_40px_-28px_rgba(26,26,26,0.18)]">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-deep mb-3">0{index + 1}</div>
                <p className="text-[16px] md:text-[17px] leading-relaxed text-ink">{goal}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}