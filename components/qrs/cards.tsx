/* eslint-disable @next/next/no-html-link-for-pages -- the old site navigated with plain links (full page loads); its scripts and styles rely on that */
import type { Course } from "@/lib/market/courses";
import { CourseArt } from "./course-art";
import { Icon } from "./icon";

/** Course card in the original site's markup (port of course_card() in _layout.php). `n` makes the SVG gradient ids unique on a page. */
export function QrsCourseCard({ c, n }: { c: Course; n: number }) {
  return (
    <li className="course">
      <article style={{ "--c1": c.c1, "--c2": c.c2 } as React.CSSProperties}>
        <div className="cr-cover">
          <CourseArt slug={c.slug} c1={c.c1} c2={c.c2} icon={c.icon} uid={`c${n}`} />
          <span className="cr-level">{c.level_label || "All levels"}</span>
          <span className="cr-cat">{c.cat_name}</span>
        </div>
        <div className="cr-body">
          <h3><a className="stretch" href={`/courses/${c.slug}`}>{c.title}</a></h3>
          <p className="cr-brief">{c.brief}</p>
          <ul className="cr-meta">
            <li><Icon n="clock" /> {c.hours}</li>
            <li><Icon n="layers" /> {c.modules} modules</li>
            <li><Icon n="book" /> {c.weeks}</li>
          </ul>
          <div className="cr-foot"><span className="cr-badge"><Icon n="award" /> {c.badge || "Certificate"}</span><span className="cr-go">View course <Icon n="arrow" /></span></div>
        </div>
      </article>
    </li>
  );
}
