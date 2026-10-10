import { describe, expect, it } from "vitest";
import { indexJsonLd, postJsonLd, postUrl, relatedLearning, toIso } from "./seo";
import type { BlogPost } from "./blogforge";

const post = (o: Partial<BlogPost> = {}): BlogPost => ({
  id: 1, title: "How to lift your IELTS reading band", slug: "ielts-reading-band", excerpt: "Tactics that work", cover_image: "https://cdn.test/c.jpg", category: "IELTS",
  author: "Asha Rao", reading_minutes: 6, url: "https://engine.test/blog/ielts-reading-band", published_at: "2026-09-01 10:00:00", updated_at: "2026-09-20 08:30:00",
  content: "<p>x</p>", json_ld: "", meta: { title: null, description: "Lift your band", canonical: "https://engine.test/blog/x", og_image: null, noindex: false }, ...o,
});

describe("blog SEO helpers", () => {
  it("always uses GrowQR's own URL, never the engine's", () => {
    expect(postUrl("a b")).toBe("https://www.growqr.ai/blog/a%20b");
    const ld = JSON.stringify(postJsonLd(post()));
    expect(ld).toContain("https://www.growqr.ai/blog/ielts-reading-band");
    expect(ld).not.toContain("engine.test");
  });
  it("builds BlogPosting with real dates, author and a breadcrumb", () => {
    const g = (postJsonLd(post()) as { "@graph": Array<Record<string, unknown>> })["@graph"];
    const bp = g.find((x) => x["@type"] === "BlogPosting")!;
    expect(bp.datePublished).toBe("2026-09-01T10:00:00.000Z");
    expect(bp.dateModified).toBe("2026-09-20T08:30:00.000Z");
    expect(bp.author).toEqual({ "@type": "Person", name: "Asha Rao" });
    expect(g.find((x) => x["@type"] === "BreadcrumbList")).toBeTruthy();
    expect(String(bp.headline).length).toBeLessThanOrEqual(110);
  });
  it("falls back sensibly when dates, author and image are missing", () => {
    const bp = (postJsonLd(post({ updated_at: null, author: null, cover_image: null, published_at: "bad" })) as { "@graph": Array<Record<string, unknown>> })["@graph"][0];
    expect(bp.dateModified).toBeUndefined();
    expect(bp.image).toBeUndefined();
    expect(bp.author).toEqual({ "@type": "Person", name: "GrowQR" });
    expect(toIso(undefined)).toBeUndefined();
    expect(toIso("2026-01-02T03:04:05Z")).toBe("2026-01-02T03:04:05.000Z");
  });
  it("lists the posts shown on the index", () => {
    const ld = indexJsonLd([post(), post({ slug: "b", title: "B" })]) as { "@graph": Array<Record<string, unknown>> };
    expect((ld["@graph"].find((x) => x["@type"] === "ItemList")!.itemListElement as unknown[]).length).toBe(2);
  });
  it("links a post to the matching course or practice test, else the hubs", () => {
    expect(relatedLearning(post()).map((l) => l.href)).toContain("/practice-tests/ielts-reading");
    expect(relatedLearning({ title: "GRE Quant tips", category: null, excerpt: null })[0].href).toBe("/practice-tests/gre-quant");
    expect(relatedLearning({ title: "Pandas for beginners", category: "Data", excerpt: null })[0].href).toBe("/courses/data-analytics-python");
    expect(relatedLearning({ title: "Hiring trends", category: "Careers", excerpt: null }).map((l) => l.href)).toEqual(["/courses", "/practice-tests"]);
    expect(relatedLearning({ title: "IELTS GRE data science html", category: null, excerpt: null }).length).toBeLessThanOrEqual(3);
  });
});
