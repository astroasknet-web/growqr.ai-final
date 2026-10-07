import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { Eyebrow, SectionHeading } from "@/components/home/SectionHeader";
import { APPLICATIONS_OPEN } from "./ambassadors-data";

export default function AmbassadorsCTA() {
  return (
    <section id="apply" className="bg-cream/60 border-y border-black/5 py-16 md:py-20 lg:py-24 px-6 md:px-14">
      <div className="max-w-[1280px] mx-auto">
        <Reveal direction="up" offset={24}>
          <div className="text-center max-w-[680px] mx-auto">
            <Eyebrow center>Application Form</Eyebrow>
            <SectionHeading>
              Join the GrowQR AI <span className="text-orange">Global Campus</span> Program.
            </SectionHeading>
            <p className="mt-5 text-[16px] md:text-[17px] text-ink-3 leading-relaxed">
              Building AI-Ready Talent, Campus by Campus.
            </p>
            <Link
              href="/ambassadors/apply"
              className="inline-flex items-center justify-center gap-2 bg-orange text-white text-[15px] font-semibold px-7 py-3.5 rounded-full transition hover:bg-orange-dark hover:shadow-[0_12px_30px_-10px_rgba(255,106,47,0.55)] mt-7"
            >
              {APPLICATIONS_OPEN ? "Join Now" : "Get Notified"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
