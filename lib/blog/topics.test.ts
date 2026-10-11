import { describe, expect, it } from "vitest";
import { isIndexableTopic, MIN_POSTS_TO_INDEX, topicFor, TOPICS } from "./topics";
import { authorFor, AUTHORS } from "./authors";
import { LOCAL_POSTS } from "./local";

describe("topics and authors", () => {
  it("curated topics have a 120 to 155 character description and unique slugs", () => {
    expect(new Set(TOPICS.map((t) => t.slug)).size).toBe(TOPICS.length);
    for (const t of TOPICS) {
      expect(t.description.length, t.slug).toBeGreaterThanOrEqual(120);
      expect(t.description.length, t.slug).toBeLessThanOrEqual(155);
      expect(t.learn.length).toBeGreaterThan(0);
      for (const l of t.learn) expect(l.href.startsWith("/")).toBe(true);
    }
  });

  it("a pillar article named by a topic exists", () => {
    const slugs = new Set(LOCAL_POSTS.map((p) => p.slug));
    for (const t of TOPICS) if (t.pillar) expect(slugs.has(t.pillar), t.slug).toBe(true);
  });

  it("indexes a topic only when curated and big enough", () => {
    expect(isIndexableTopic(true, MIN_POSTS_TO_INDEX)).toBe(true);
    expect(isIndexableTopic(true, MIN_POSTS_TO_INDEX - 1)).toBe(false);
    expect(isIndexableTopic(false, 50)).toBe(false);
  });

  it("builds a stand-in topic only when the category name matches the slug", () => {
    expect(topicFor("digital-literacy")?.curated).toBe(true);
    expect(topicFor("physics", "Physics")).toMatchObject({ curated: false, topic: { name: "Physics" } });
    expect(topicFor("physics", "Chemistry")).toBeNull();
    expect(topicFor("physics")).toBeNull();
  });

  it("every local post author has a profile and no invented credentials", () => {
    for (const p of LOCAL_POSTS) expect(authorFor(p.author), p.author).toBeDefined();
    for (const a of AUTHORS) expect(a.credentials).toEqual([]);
  });
});
