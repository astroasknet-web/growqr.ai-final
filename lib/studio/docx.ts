import { strToU8, zipSync } from "fflate";
import { NEWLINE } from "./diff";
import { toText, type ResumeData } from "./resume-data";
import type { Template } from "./templates";
import { byteLen } from "../qrscore/php";

/**
 * Minimal Word (.docx) export (port of Studio\Docx). A single-column, plain document with real headings and bullets, which is
 * also what applicant-tracking systems read best. It does not reproduce the visual template (use PDF for that).
 */
const x = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

interface ParaOpts { b?: boolean; sz?: number; color?: string | null; caps?: boolean; before?: number; after?: number; bullet?: boolean; border?: boolean; center?: boolean }

function para(text: string, o: ParaOpts = {}): string {
  const rpr = (o.b ? "<w:b/>" : "") + (o.sz !== undefined ? `<w:sz w:val="${Math.trunc(o.sz)}"/>` : "") + (o.color ? `<w:color w:val="${o.color}"/>` : "") + (o.caps ? "<w:caps/>" : "");
  const ppr =
    (o.after !== undefined ? `<w:spacing w:before="${Math.trunc(o.before ?? 0)}" w:after="${Math.trunc(o.after)}"/>` : "") +
    (o.bullet ? '<w:ind w:left="360" w:hanging="220"/>' : "") +
    (o.border ? '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="9CA3AF"/></w:pBdr>' : "") +
    (o.center ? '<w:jc w:val="center"/>' : "");
  return `<w:p><w:pPr>${ppr}</w:pPr><w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${x((o.bullet ? "• " : "") + text)}</w:t></w:r></w:p>`;
}

const HEADS = ["PROFESSIONAL SUMMARY", "WORK EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS", "CERTIFICATIONS", "AWARDS", "PUBLICATIONS", "LANGUAGES"];

/** The word/document.xml part (exposed so tests can compare it with the PHP output). */
export function documentXml(d: ResumeData, t: Template): string {
  const lines = toText(d, t.region).split(NEWLINE);
  let body = "";
  let first = true;
  lines.forEach((raw, i) => {
    const ln = raw.replace(/[ \n\r\t\x0B\0]+$/, "");
    if (ln === "") return;
    if (first) {
      body += para(ln, { b: true, sz: 40, after: 60, center: true });
      first = false;
    } else if (HEADS.includes(ln)) {
      body += para(ln, { b: true, sz: 22, before: 220, after: 80, border: true });
    } else if (ln.startsWith("- ")) {
      body += para(ln.slice(2), { bullet: true, after: 20 });
    } else if (i <= 3 && !ln.includes("Present")) {
      body += para(ln, { center: true, after: 40, color: "374151" });
    } else {
      const isDate = /^(\w{3} \d{4}|\d{4})\b.*$/.test(ln) && byteLen(ln) < 40;
      body += para(ln, { b: !isDate && /[A-Za-z]/.test(ln) && byteLen(ln) < 90 && !ln.includes("|"), after: 20, color: isDate ? "4B5563" : null });
    }
  });
  const [w, h] = t.paper === "Letter" ? [12240, 15840] : [11906, 16838];
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body +
    `<w:sectPr><w:pgSz w:w="${w}" w:h="${h}"/><w:pgMar w:top="1000" w:right="1100" w:bottom="1000" w:left="1100" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`
  );
}

export function build(d: ResumeData, t: Template): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
    "_rels/.rels": strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
    "word/document.xml": strToU8(documentXml(d, t)),
  };
  return zipSync(files, { level: 6 });
}
