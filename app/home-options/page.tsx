import Link from "next/link";

const GROUPS = [
  {
    title: "The standard",
    items: [
      ["a", "Option A", "The live site, upgraded. A looping product film (scan, score, agents fix, match), an internship board your score unlocks, a flip-card Skill Passport and a rotating globe."],
      ["b", "Option B", "Agents in orbit around a flipping passport, a passport that builds itself as you scroll, an employer scan on a phone, and a dark globe band."],
      ["c", "Option C", "A pinned phone that walks the whole journey (score, coach, verify, match, grow) as you scroll, then a bento of live tools."],
    ],
  },
  {
    title: "Next level",
    items: [
      ["d", "Option D", "One QR made of two thousand particles. Scroll and it reforms into a score, a resume, a globe and a verified seal. Move your cursor through it."],
      ["e", "Option E", "Your cursor is a scanner. Sweep a resume of claims and the verified layer underneath is revealed, then drag to compare claim against proof."],
      ["f", "Option F", "The whole platform as an exploded 3D stack: resume, score, agents, passport, roles. Scroll to pull the layers apart and focus each one."],
    ],
  },
] as const;

export default function HomeOptionsIndex() {
  return (
    <div className="mx-auto max-w-[960px] px-6 pb-24 pt-36">
      <h1 className="mb-3 font-serif text-[clamp(2.4rem,6vw,4rem)] leading-none">Homepage: six options</h1>
      <p className="mb-10 text-[1.1rem] text-ink-3">GrowQR with QR Score integrated. Open each, then use the switcher at the bottom of the page to compare.</p>
      {GROUPS.map((g) => (
        <section key={g.title} className="mb-10">
          <h2 className="mb-4 text-[0.8rem] font-bold uppercase tracking-[0.16em] text-orange-dark">{g.title}</h2>
          <div className="grid gap-4">
            {g.items.map(([k, n, d]) => (
              <Link key={k} href={"/home-options/" + k} className="block rounded-3xl border-2 border-ink bg-white p-6 transition hover:-translate-y-1 hover:shadow-glow">
                <strong className="font-serif text-[1.8rem] font-normal">{n}</strong>
                <span className="mt-1 block text-ink-3">{d}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
