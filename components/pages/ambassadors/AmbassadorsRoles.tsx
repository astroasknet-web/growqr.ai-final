import Reveal from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/home/SectionHeader";
import { roleCards } from "./ambassadors-data";

export default function AmbassadorsRoles() {
  return (
    <section id="roles" className="bg-white py-16 md:py-20 px-6 md:px-14">
      <div className="max-w-[1280px] mx-auto">
        <Reveal direction="up" offset={20}>
          <div className="mb-10">
            <Eyebrow>What you&apos;ll do</Eyebrow>
            <h2 className="mt-3 text-[32px] md:text-[42px] font-medium tracking-[-0.04em] leading-[1.1] text-ink">
              Six ways to <span className="text-orange">show up.</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roleCards.map((role, idx) => {
            const Icon = role.icon;
            return (
              <Reveal key={role.title} direction="up" offset={20} delay={idx * 0.04}>
                <div className="group h-full bg-white rounded-xl border border-black/8 p-8 transition-all duration-300 hover:border-orange/20 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(17,24,39,0.14)]">
                  <div className="flex items-center gap-5 mb-5">
                    <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-orange/8 text-orange transition-colors group-hover:bg-orange/14 shrink-0">
                      <Icon className="h-7 w-7" />
                    </span>
                    <h3 className="text-[19px] md:text-[22px] font-semibold tracking-[-0.02em] text-ink leading-tight">
                      {role.title}
                    </h3>
                  </div>
                  <p className="text-[14.5px] md:text-[15.5px] text-ink-3 leading-relaxed">
                    {role.copy}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
