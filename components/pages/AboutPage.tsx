import Reveal from "@/components/ui/Reveal";

export default function AboutPage() {
  const stats = [
    { value: "5+", label: "Countries", description: "Global credential network" },
    { value: "10+", label: "Enterprises", description: "Instant updates" },
    { value: "25+", label: "Skill Dimensions", description: "Comprehensive assessment" },
    { value: "100k+", label: "Users Pipeline", description: "Active talent network" },
  ];

  const team = [
    {
      name: "Visionary Leadership",
      role: "Founders",
      description:
        "Industry veterans from Fortune 500 enterprises and leading EdTech platforms, united by a vision to democratize talent verification.",
    },
    {
      name: "AI & Engineering",
      role: "Technology Team",
      description:
        "PhDs and engineers from top tech enterprises building the next generation of skill intelligence systems.",
    },
    {
      name: "Global Operations",
      role: "Partners",
      description:
        "Connecting institutions, enterprises, and governments across 5+ countries to build a unified talent ecosystem.",
    },
  ];

  return (
    <>
      <section className="pt-32 md:pt-40 pb-14 md:pb-20 px-6 md:px-14">
        <div className="mx-auto max-w-[1280px] text-center">
          <Reveal direction="left" offset={60}>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange/15 bg-orange/5 px-4 py-2 text-sm font-semibold text-orange-deep mb-6">
              About GrowQR
            </div>
            <h1 className="mx-auto max-w-4xl text-balance text-[40px] font-medium leading-[1.02] tracking-[-0.04em] text-ink sm:text-[56px] md:text-[76px]">
              Making Talent <span className="text-orange">Visible</span>, Verified, and Valuable.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[16px] md:text-[18px] text-ink-3 leading-relaxed">
              We&apos;re building the world&apos;s first unified skill identity platform where your abilities are verified, portable, and recognized everywhere.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-6 md:px-14 pb-16 md:pb-24">
        <div className="mx-auto max-w-[1280px] grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-black/8 bg-white p-5 md:p-7 shadow-[0_18px_40px_-28px_rgba(26,26,26,0.2)]">
              <div className="text-[28px] md:text-[40px] font-semibold text-ink">{stat.value}</div>
              <div className="mt-2 text-sm text-ink-3">{stat.label}</div>
              <div className="mt-1 text-xs text-ink-4">{stat.description}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 md:px-14 pb-20 md:pb-28">
        <div className="mx-auto max-w-[1280px] grid gap-5 md:grid-cols-3">
          {team.map((member) => (
            <div key={member.name} className="rounded-3xl border border-black/8 bg-cream p-6 md:p-8">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-deep mb-2">{member.role}</div>
              <h2 className="text-2xl font-medium text-ink mb-3">{member.name}</h2>
              <p className="text-[15px] md:text-[16px] leading-relaxed text-ink-3">{member.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
