import { describe, expect, it } from "vitest";
import { auditPost } from "./standard";
import { LOCAL_POSTS, localPost, localSummaries, isLocal } from "./local";

describe("blog standard", () => {
  it("every local post passes the house audit", () => {
    for (const p of LOCAL_POSTS) {
      const r = auditPost(p);
      expect(r.checks.filter((c) => !c.pass).map((c) => `${c.id}: ${c.detail}`), p.slug).toEqual([]);
      expect(r.ok).toBe(true);
    }
  });

  it("slugs are unique", () => {
    expect(new Set(LOCAL_POSTS.map((p) => p.slug)).size).toBe(LOCAL_POSTS.length);
  });

  it("the audit catches a weak post", () => {
    const bad = { ...LOCAL_POSTS[0], seoTitle: "Too short", author: "Editorial Team", content: LOCAL_POSTS[0].content.replace("<!--quiz-->", "Furthermore, dive into it.<!--quiz-->") };
    const failed = auditPost(bad).checks.filter((c) => !c.pass).map((c) => c.id);
    expect(failed).toEqual(expect.arrayContaining(["title-len", "author", "banned"]));
  });

  it("quiz answers are valid indexes", () => {
    for (const p of LOCAL_POSTS) for (const q of p.quiz?.questions ?? []) {
      expect(q.options).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
    }
  });

  it("local posts resolve by slug and list as summaries", () => {
    const p = LOCAL_POSTS[0];
    const post = localPost(p.slug);
    expect(post && isLocal(post)).toBe(true);
    expect(post?.meta.title).toBe(p.seoTitle);
    expect(localSummaries().map((s) => s.slug)).toContain(p.slug);
    expect(localPost("no-such-post")).toBeNull();
  });
});
