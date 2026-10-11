import { describe, expect, it } from "vitest";
import { categoriesOf, paginate, parsePage, relatedPosts, searchPosts, slugify, withHeadingIds } from "./discovery";
import type { BlogPostSummary } from "./blogforge";

const mk = (slug: string, title: string, category: string | null, excerpt = "", day = "01"): BlogPostSummary => ({ id: 1, slug, title, excerpt, category, cover_image: null, author: "A", reading_minutes: 3, url: "/blog/" + slug, published_at: `2026-10-${day} 00:00:00` });
const posts = [
  mk("a", "Digital literacy quiz with answers", "Digital Literacy", "Fifteen questions on files and email", "10"),
  mk("b", "Excel formulas for beginners", "Digital Literacy", "SUM and IF explained", "09"),
  mk("c", "IELTS reading tips", "IELTS", "Band 7 strategy", "08"),
  mk("d", "GRE quant strategy", "GRE", "", "07"),
];

describe("blog discovery", () => {
  it("counts categories and builds slugs", () => {
    expect(categoriesOf(posts)).toEqual([{ name: "Digital Literacy", slug: "digital-literacy", count: 2 }, { name: "GRE", slug: "gre", count: 1 }, { name: "IELTS", slug: "ielts", count: 1 }]);
    expect(slugify("AI in Education!")).toBe("ai-in-education");
  });

  it("paginates and clamps", () => {
    const many = Array.from({ length: 30 }, (_, i) => i);
    expect(paginate(many, 1).items).toHaveLength(12);
    expect(paginate(many, 3)).toMatchObject({ page: 3, pages: 3, total: 30 });
    expect(paginate(many, 99).page).toBe(3);
    expect(paginate([], 1)).toMatchObject({ page: 1, pages: 1, items: [] });
  });

  it("only treats plain integers as a page number", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("2")).toBe(2);
    for (const bad of ["0", "-1", "2.5", "abc", "1; DROP", "99999", ""]) expect(parsePage(bad)).toBeNull();
  });

  it("searches title, category and excerpt, requiring every word", () => {
    expect(searchPosts(posts, "digital literacy").map((p) => p.slug)).toEqual(["a", "b"]);
    expect(searchPosts(posts, "excel sum").map((p) => p.slug)).toEqual(["b"]);
    expect(searchPosts(posts, "ielts band").map((p) => p.slug)).toEqual(["c"]);
    expect(searchPosts(posts, "quiz email").map((p) => p.slug)).toEqual(["a"]);
    expect(searchPosts(posts, "zzz")).toEqual([]);
    expect(searchPosts(posts, "   ")).toEqual([]);
    expect(searchPosts(posts, "<script>alert(1)</script>")).toEqual([]);
  });

  it("suggests related posts from the same category first and never the post itself", () => {
    const r = relatedPosts(posts[0], posts, 3);
    expect(r[0].slug).toBe("b");
    expect(r.some((p) => p.slug === "a")).toBe(false);
  });

  it("adds unique heading ids and a table of contents", () => {
    const { html, toc } = withHeadingIds('<h2>Set up</h2><p>x</p><h2>Set up</h2><h3>Detail</h3><h2 id="keep">Keep me</h2>');
    expect(toc).toEqual([{ id: "set-up", text: "Set up" }, { id: "set-up-2", text: "Set up" }, { id: "keep", text: "Keep me" }]);
    expect(html).toContain('<h2 id="set-up">Set up</h2>');
    expect(html).toContain('<h3 id="detail">Detail</h3>');
    expect(html).toContain('<h2 id="keep">Keep me</h2>');
  });
});
