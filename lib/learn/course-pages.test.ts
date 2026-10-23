import { describe, expect, it } from "vitest";
import catalogue from "../market/data/courses.json";
import { cleanHtml, gradeQuiz, nativeCourse, nativeSlugs } from "../market/lessons";
import { fitTitle, formatDate, landingJsonLd, landingMetadata, moduleTitle } from "./course-seo";
import { DIAGRAMS, esc, lessonHtml, renderBlock } from "../../scripts/lib/course-html.mjs";

const slugs = nativeSlugs().filter((s) => nativeCourse(s)?.landing);

describe("university programme courses (landing block)", () => {
  it("at least one programme course is registered", () => {
    expect(slugs).toContain("bba-financial-accounting");
  });

  it("is in the catalogue under the university category", () => {
    for (const slug of slugs) {
      const row = catalogue.courses.find((c) => c.slug === slug);
      expect(row, slug).toBeTruthy();
      expect(row!.cat).toBe("university");
      expect(Object.keys(catalogue.categories)).toContain("university");
      expect(row!.modules).toBe(nativeCourse(slug)!.modules.length);
    }
  });

  it("uses short, unique, keyword URLs for units and lessons", () => {
    for (const slug of slugs) {
      const nc = nativeCourse(slug)!;
      const seen = new Set<string>();
      for (const m of nc.modules) {
        expect(m.slug, m.title).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        expect(m.slug.length).toBeLessThanOrEqual(50);
        expect(m.seoTitle && m.seoTitle.length <= 30, `${m.slug} seoTitle`).toBe(true);
        expect(seen.has(m.slug)).toBe(false);
        seen.add(m.slug);
        const lessonSlugs = new Set<string>();
        for (const t of m.topics) {
          expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
          expect(lessonSlugs.has(t.slug), `${m.slug}/${t.slug}`).toBe(false);
          lessonSlugs.add(t.slug);
        }
      }
    }
  });

  it("generated lesson HTML is already safe (cleanHtml removes nothing)", () => {
    for (const slug of slugs) {
      const nc = nativeCourse(slug)!;
      for (const m of nc.modules) {
        expect(cleanHtml(m.intro), `${m.slug} intro`).toBe(m.intro);
        for (const t of m.topics) expect(cleanHtml(t.html), `${m.slug}/${t.slug}`).toBe(t.html);
        for (const s of m.practical?.steps ?? []) expect(cleanHtml(s)).toBe(s);
      }
      expect(cleanHtml(nc.capstone.intro)).toBe(nc.capstone.intro);
      for (const s of nc.capstone.steps) expect(cleanHtml(s)).toBe(s);
    }
  });

  it("every quiz is well formed: 4 options, key in range, model answers pass, wrong answers do not", () => {
    for (const slug of slugs) {
      const nc = nativeCourse(slug)!;
      const quizzes = [...nc.modules.map((m) => m.quiz), nc.capstone.quiz];
      for (const quiz of quizzes) {
        expect(quiz).toBeTruthy();
        for (const q of quiz!.questions) {
          expect(q.options).toHaveLength(4);
          expect(q.correct).toBeGreaterThanOrEqual(0);
          expect(q.correct).toBeLessThan(4);
          expect(q.explanation.length).toBeGreaterThan(5);
        }
        const all = quiz!.questions.map((q) => q.correct);
        expect(gradeQuiz(quiz!, all).passed).toBe(true);
        const wrong = quiz!.questions.map((q) => (q.correct + 1) % 4);
        expect(gradeQuiz(quiz!, wrong).passed).toBe(false);
        expect(gradeQuiz(quiz!, quiz!.questions.map(() => null)).percent).toBe(0);
      }
    }
  });

  it("correct answers are spread over all four positions (no guessing by position)", () => {
    for (const slug of slugs) {
      const nc = nativeCourse(slug)!;
      const all = [...nc.modules.flatMap((m) => m.quiz?.questions ?? []), ...(nc.capstone.quiz?.questions ?? [])];
      const dist = [0, 0, 0, 0];
      all.forEach((q) => dist[q.correct]++);
      for (const n of dist) expect(n / all.length).toBeGreaterThan(0.15);
    }
  });

  it("has SEO metadata within the project limits", () => {
    for (const slug of slugs) {
      const nc = nativeCourse(slug)!;
      const meta = landingMetadata(nc, slug)!;
      expect(String(meta.title).length).toBeLessThanOrEqual(62);
      expect(String(meta.title)).toContain("GrowQR");
      const d = String(meta.description);
      expect(d.length).toBeGreaterThanOrEqual(120);
      expect(d.length).toBeLessThanOrEqual(155);
      expect(meta.alternates?.canonical).toBe(`https://www.growqr.ai/courses/${slug}`);
      expect(nc.landing!.faqs.length).toBeGreaterThanOrEqual(4);
      expect(nc.landing!.alignment.length).toBeGreaterThan(0);
      for (const a of nc.landing!.alignment) expect(a.source).toMatch(/^https:\/\//);
    }
  });

  it("emits valid structured data", () => {
    for (const slug of slugs) {
      const nc = nativeCourse(slug)!;
      const row = catalogue.courses.find((c) => c.slug === slug)!;
      const ld = landingJsonLd(nc, slug, { title: nc.title, brief: row.brief, level_label: row.levelLabel, cat_name: "University Programmes", category: "university" });
      const types = ld["@graph"].map((g) => g["@type"]);
      expect(types).toEqual(["Course", "FAQPage", "DefinedTermSet", "BreadcrumbList"]);
      const course = ld["@graph"][0] as Record<string, unknown>;
      expect(course.isAccessibleForFree).toBeUndefined(); // the courses are paid, so the page does not claim to be free
      expect(course.offers).toBeUndefined();
      expect((course.hasPart as unknown[]).length).toBe(nc.modules.length);
      expect(() => JSON.stringify(ld)).not.toThrow();
    }
  });

  it("builds lesson titles that never end mid-word", () => {
    expect(fitTitle(["a".repeat(80), "short title"])).toBe("short title");
    expect(moduleTitle("Journal and Trial Balance", "BBA Financial Accounting")).toBe("Journal and Trial Balance | BBA Financial Accounting | GrowQR");
    expect(moduleTitle("A very long unit title that cannot possibly fit", "BBA Financial Accounting").length).toBeLessThanOrEqual(63);
    expect(formatDate("2026-10-16")).toMatch(/16 October 2026/);
  });
});

describe("course HTML renderer", () => {
  it("escapes every piece of text", () => {
    expect(esc('<script>"x" & y</script>')).toBe("&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;");
    const html = renderBlock({ type: "text", text: "<img src=x onerror=alert(1)>" });
    expect(html).not.toContain("<img");
  });

  it("every diagram is an accessible figure with a text alternative", () => {
    for (const fns of Object.values(DIAGRAMS) as Array<Array<() => string>>) {
      for (const f of fns) {
        const svg = f();
        expect(svg).toMatch(/role="img"/);
        expect(svg).toMatch(/aria-label="[^"]{20,}"/);
        expect(svg).toMatch(/<figcaption>/);
        expect(svg).not.toMatch(/<script|onload=|href=/i);
      }
    }
  });

  it("renders a lesson with objectives, an example and a model answer", () => {
    const html = lessonHtml({ id: "X", objectives: ["Do the thing"], minutes: 10, blocks: [{ type: "formula", name: "Area", expression: "w x h" }], worked_examples: [{ title: "T", problem: "P", solution_steps: ["one", "two"], answer: "A", verify: { journal: [{ ref: "a", dr: [["Cash", 100]], cr: [["Capital", 100]] }] } }], practice: { short: [{ q: "Q?", model_answer: "A!" }] }, exam_tip: "tip", common_mistakes: ["m"] });
    expect(html).toContain("cw-obj");
    expect(html).toContain("cw-formula");
    expect(html).toContain("cw-journal");
    expect(html).toContain("Model answer");
  });
});
