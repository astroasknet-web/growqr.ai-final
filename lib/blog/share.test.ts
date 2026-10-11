import { describe, expect, it } from "vitest";
import { assertCanonical, shareLinks } from "./share";
import { postUrl } from "./seo";

const url = postUrl("digital-literacy-quiz-with-answers");
const base = { title: "Digital Literacy Quiz: 15 Free Questions & answers", url, description: "A quick check.\nTake it now.", image: "https://www.growqr.ai/blog/x.png", hashtag: "Digital Literacy" };
const by = (id: string) => shareLinks(base).find((l) => l.id === id)!;

describe("share links", () => {
  it("builds every platform with the canonical URL encoded", () => {
    const links = shareLinks(base);
    expect(links.map((l) => l.id)).toEqual(["whatsapp", "facebook", "x", "linkedin", "telegram", "pinterest", "reddit", "email"]);
    for (const l of links) expect(l.href).toContain(encodeURIComponent(url).replace(/%/g, "%"));
    expect(by("facebook").href).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    expect(by("x").href).toContain("hashtags=DigitalLiteracy");
    expect(by("x").href).toContain(encodeURIComponent("Digital Literacy Quiz: 15 Free Questions & answers"));
    expect(by("whatsapp").href.startsWith("https://wa.me/?text=")).toBe(true);
    expect(by("email").href.startsWith("mailto:?subject=")).toBe(true);
    expect(decodeURIComponent(by("email").href)).toContain(url);
  });

  it("omits Pinterest without an https image and X hashtags without a tag", () => {
    expect(shareLinks({ ...base, image: null }).some((l) => l.id === "pinterest")).toBe(false);
    expect(shareLinks({ ...base, image: "/blog/x.png" }).some((l) => l.id === "pinterest")).toBe(false);
    expect(shareLinks({ ...base, hashtag: undefined }).find((l) => l.id === "x")!.href).not.toContain("hashtags");
  });

  it("only accepts a clean canonical URL (no tracking, no other host, no http)", () => {
    expect(assertCanonical(url)).toBe(url);
    for (const bad of [`${url}?utm_source=x`, `${url}#faq`, "http://www.growqr.ai/blog/a", "https://evil.example/blog/a"]) expect(() => assertCanonical(bad)).toThrow();
    expect(() => shareLinks({ ...base, url: `${url}?ref=1` })).toThrow();
  });

  it("strips control characters from titles", () => {
    expect(shareLinks({ ...base, title: "Bad\r\nTitle\u0000" }).find((l) => l.id === "reddit")!.href).not.toMatch(/%0D|%0A|%00/);
  });
});
