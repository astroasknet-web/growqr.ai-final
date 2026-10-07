"""
Builds the /gallery design reference deck: docs/GrowQR-Gallery-Design.pptx

Run with:  npm run gallery:deck

This recreates the website's gallery in NATIVE PowerPoint objects — real
pictures, real text boxes, real shapes with real gradient fills. Nothing is a
flattened screenshot, so images stay replaceable and copy stays editable.

Layout method: justified rows, the same idea the website's masonry uses. Every
image keeps its NATIVE aspect ratio and row heights are solved so each row ends
flush at the same right edge. Nothing is cropped and nothing is forced into a
uniform tile, which is what makes the mixed ratios read as intentional rather
than as a photo grid.

Typography and colour come from tailwind.config.ts / app/globals.css so the deck
reads as the same design system as the site, not a separate PowerPoint look.
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.oxml import parse_xml
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = Path.home() / "Desktop/GrowQR Gallery Archive"
SOURCE = ARCHIVE / "01 Source library"
OUT = ROOT / "docs/GrowQR-Gallery-Design.pptx"
CACHE = ROOT / ".gallery-deck-cache"

# ── Design tokens, lifted from the site ────────────────────────────────────
CREAM = RGBColor(0xFA, 0xF8, 0xF4)      # body background
INK = RGBColor(0x11, 0x11, 0x11)
INK_3 = RGBColor(0x4B, 0x4B, 0x4B)
INK_4 = RGBColor(0x86, 0x86, 0x8B)
ORANGE = RGBColor(0xFF, 0x6A, 0x2F)
ORANGE_DEEP = RGBColor(0x9C, 0x3A, 0x11)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

FONT = "Poppins"
FONT_MED = "Poppins Medium"
FONT_SEMI = "Poppins SemiBold"

SLIDE_W, SLIDE_H = 13.333, 7.5
MARGIN = 0.55
GUTTER = 0.13
CONTENT_W = SLIDE_W - 2 * MARGIN

# Square corners everywhere. The site has no rounded imagery and that is what
# lets the mixed aspect ratios line up cleanly.


def load_images():
    """slug -> {path, aspect, location, place, date, caption}"""
    index = json.loads((ROOT / "gallery-assets/review/curation-index.json").read_text())
    by_slug = {s["slug"]: s["file"] for s in index["selected"]}

    ts = (ROOT / "lib/gallery/gallery-data.ts").read_text()
    body = ts.split("galleryImages: GalleryImage[] = [", 1)[1].split("\n];", 1)[0]
    out = {}
    for chunk in body.split("  {\n"):
        if '"slug"' not in chunk and "slug:" not in chunk:
            continue
        rec = {}
        for line in chunk.splitlines():
            line = line.strip().rstrip(",")
            if ": " not in line:
                continue
            k, v = line.split(": ", 1)
            rec[k.strip()] = v.strip()
        if "slug" not in rec:
            continue
        slug = json.loads(rec["slug"])
        if slug not in by_slug:
            continue
        out[slug] = {
            "path": SOURCE / by_slug[slug],
            "aspect": int(rec["width"]) / int(rec["height"]),
            "location": json.loads(rec["location"]),
            "place": json.loads(rec["place"]),
            "date": None if rec["date"] == "null" else json.loads(rec["date"]),
            "caption": json.loads(rec["caption"]),
        }
    return out


def prepared(img, width_in):
    """Resize the original to ~192 DPI for its placed size and cache it.

    Placing an 8MB 6000px original would bloat the file for no visible gain at
    projection size; 2x the placed pixel size is the point of diminishing
    returns."""
    CACHE.mkdir(exist_ok=True)
    target_px = max(600, int(width_in * 192))
    dest = CACHE / f"{img['path'].stem}-{target_px}.jpg"
    if not dest.exists():
        im = Image.open(img["path"])
        im = im.convert("RGB")
        # honour EXIF orientation before resizing
        try:
            from PIL import ImageOps

            im = ImageOps.exif_transpose(im)
        except Exception:
            pass
        w, h = im.size
        if w > target_px:
            im = im.resize((target_px, round(h * target_px / w)), Image.LANCZOS)
        im.save(dest, "JPEG", quality=88, optimize=True, progressive=True)
    return dest


def justified_row(slugs, images, total_w, gutter=GUTTER):
    """Solve the row height so the row ends flush, with no image cropped."""
    span = sum(images[s]["aspect"] for s in slugs)
    avail = total_w - gutter * (len(slugs) - 1)
    h = avail / span
    return h, [images[s]["aspect"] * h for s in slugs]


# ── Native helpers ─────────────────────────────────────────────────────────
GRAD_NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'


def gradient_scrim(slide, x, y, w, h):
    """The site's hover scrim: ink at 80% fading to fully transparent upward.

    A real a:gradFill with alpha stops, not a flattened PNG, so it stays an
    editable shape."""
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.line.fill.background()
    shape.shadow.inherit = False
    spPr = shape._element.spPr
    for tag in ("a:solidFill", "a:noFill", "a:gradFill", "a:blipFill", "a:pattFill"):
        el = spPr.find(qn(tag))
        if el is not None:
            spPr.remove(el)
    xml = (
        f'<a:gradFill {GRAD_NS} rotWithShape="1"><a:gsLst>'
        '<a:gs pos="0"><a:srgbClr val="111111"><a:alpha val="0"/></a:srgbClr></a:gs>'
        '<a:gs pos="55000"><a:srgbClr val="111111"><a:alpha val="16000"/></a:srgbClr></a:gs>'
        '<a:gs pos="100000"><a:srgbClr val="111111"><a:alpha val="82000"/></a:srgbClr></a:gs>'
        '</a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill>'
    )
    prst = spPr.find(qn("a:prstGeom"))
    prst.addnext(parse_xml(xml))
    return shape


def textbox(slide, x, y, w, h, anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    return tf


def run(p, text, *, font=FONT, size=12, color=INK, bold=False, spacing=None):
    r = p.add_run()
    r.text = text
    f = r.font
    f.name = font
    f.size = Pt(size)
    f.bold = bold
    f.color.rgb = color
    if spacing is not None:  # letter-spacing, in points
        r.font._rPr.set("spc", str(int(spacing * 100)))
    return r


def eyebrow(slide, x, y, text):
    # The site's pill badge reduced to its two essentials: the orange dot and
    # the tracked uppercase label. Drawn as a real oval rather than a bullet
    # character, which Poppins does not carry at every weight.
    dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y + 0.055),
                                 Inches(0.058), Inches(0.058))
    dot.fill.solid()
    dot.fill.fore_color.rgb = ORANGE
    dot.line.fill.background()
    dot.shadow.inherit = False
    tf = textbox(slide, x + 0.13, y, 5, 0.22)
    run(tf.paragraphs[0], text.upper(), font=FONT_SEMI, size=8,
        color=ORANGE_DEEP, spacing=1.4)


def headline(slide, x, y, w, parts, size=30):
    tf = textbox(slide, x, y, w, 0.62)
    p = tf.paragraphs[0]
    for text, color in parts:
        run(p, text, font=FONT_MED, size=size, color=color, spacing=-0.9)


def place_rows(slide, images, rows, x, y, row_w, avail_h, overlay_rows=None, label_h=0.0):
    """Lay several justified rows so they fill the width AND fit the height.

    Justified rows fix their own height once the width is set, so a row of two
    landscapes is simply tall. Left alone that overflowed the slide. Here the
    natural heights are solved first, then every row is scaled by one shared
    factor and the whole block is centred, which preserves both the native
    aspect ratios and the flush left/right edges while guaranteeing it fits.
    """
    solved = [justified_row(r, images, row_w) for r in rows]
    natural = sum(h for h, _ in solved) + GUTTER * (len(rows) - 1) + label_h * len(rows)
    k = min(1.0, avail_h / natural) if natural else 1.0
    # Left-align to the headline. Centring a scaled block leaves it floating
    # off the type's left edge, which reads as an accident.
    block_w = row_w * k
    ox = x
    cy = y
    for i, ((h, widths), slugs) in enumerate(zip(solved, rows)):
        if label_h:
            cy += label_h
        place_row(slide, images, slugs, ox, cy, h * k, [w * k for w in widths],
                  GUTTER * k, (overlay_rows or [None] * len(rows))[i])
        cy += h * k + GUTTER * k
    return cy, ox, block_w


def place_row(slide, images, slugs, x, y, h, widths, gutter, overlays=None):
    cx = x
    for slug, w in zip(slugs, widths):
        img = images[slug]
        slide.shapes.add_picture(
            str(prepared(img, w)), Inches(cx), Inches(y), Inches(w), Inches(h)
        )
        if overlays and slug in overlays:
            scrim_h = min(h * 0.42, 1.1)
            gradient_scrim(slide, cx, y + h - scrim_h, w, scrim_h)
            pad = 0.17
            tf = textbox(slide, cx + pad, y + h - 0.42, w - 2 * pad, 0.28)
            name = img["location"]
            # Poppins Medium averages ~0.52em per character; shrink until the
            # name sits inside the frame, never below legible.
            fit = (w - 2 * pad) * 72 / (len(name) * 0.52)
            run(tf.paragraphs[0], name, font=FONT_MED,
                size=max(7.5, min(11.0, fit)), color=WHITE)
        cx += w + gutter
    return h


def background(slide, prs):
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg.fill.solid()
    bg.fill.fore_color.rgb = CREAM
    bg.line.fill.background()
    bg.shadow.inherit = False
    return bg


def blank(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    background(slide, prs)
    return slide


def main():
    images = load_images()
    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W)
    prs.slide_height = Inches(SLIDE_H)

    BOTTOM = 7.02

    # ── 1. Hero ────────────────────────────────────────────────────────────
    s1 = blank(prs)
    eyebrow(s1, MARGIN, 0.46, "Gallery")
    headline(s1, MARGIN, 0.70, 10, [("Ideas in action, ", INK), ("across India.", ORANGE)])
    sub = textbox(s1, MARGIN, 1.28, 8, 0.28)
    run(sub.paragraphs[0],
        "Workshops, masterclasses and partnerships, captured as they happened.",
        font=FONT, size=10.5, color=INK_3)
    top = 1.82
    place_rows(
        s1, images,
        [["xaviers-cohort-stage", "jnu-auditorium", "banasthali-full-house"],
         ["lpu-qr", "xaviers-scan-to-begin", "lbs-handshake", "poddar-visit"]],
        MARGIN, top, CONTENT_W, BOTTOM - top,
    )

    # ── 2. Named campuses ──────────────────────────────────────────────────
    # Every frame carries its institution name and nothing else. One text box
    # per image, so any name can be retyped in place.
    s2 = blank(prs)
    eyebrow(s2, MARGIN, 0.46, "Gallery")
    headline(s2, MARGIN, 0.70, 10, [("Where the sessions ", INK), ("happen.", ORANGE)])
    top = 1.50
    r1 = ["banasthali-student-question", "jnu-auditorium", "ibb-hall", "andhra-gate"]
    r2 = ["xaviers-auditorium-full", "lpu-cohort", "lbshm-session"]
    place_rows(
        s2, images, [r1, r2], MARGIN, top, CONTENT_W, BOTTOM - top,
        overlay_rows=[set(r1), set(r2)],
    )

    # ── 3. Reach ───────────────────────────────────────────────────────────
    s3 = blank(prs)
    eyebrow(s3, MARGIN, 0.46, "Gallery")
    headline(s3, MARGIN, 0.70, 10, [("Fifteen institutions, ", INK), ("one platform.", ORANGE)])
    top = 1.50
    place_rows(
        s3, images,
        [["lpu-address", "banasthali-cohort", "ibb-faculty"],
         ["jnu-stage", "lordbuddha-scanning", "lawcollege-seminar",
          "andhra-centenary"]],
        MARGIN, top, CONTENT_W, BOTTOM - top,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    prs.save(OUT)
    print(f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size / 1048576:.2f} MB, 3 slides)")


if __name__ == "__main__":
    main()
