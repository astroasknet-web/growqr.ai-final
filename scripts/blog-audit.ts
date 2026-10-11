/**
 * Audit every repository blog post against the house standard (lib/blog/standard.ts).
 *   npm run blog:audit            all posts
 *   npm run blog:audit -- <slug>  one post
 * Exits 1 if any post fails, so it can gate a deploy.
 */
import { LOCAL_POSTS } from "../lib/blog/local";
import { auditPost } from "../lib/blog/standard";

const only = process.argv[2];
let failed = 0;
for (const p of LOCAL_POSTS.filter((x) => !only || x.slug === only)) {
  const r = auditPost(p);
  console.log(`\n${p.slug}: ${r.passed}/${r.total} checks (${r.score}%)  words=${r.stats.words} kw=${r.stats.keywordUses} courses=${r.stats.relatedCourses}`);
  for (const c of r.checks) if (!c.pass) console.log(`  FAIL [${c.group}] ${c.label} -> ${c.detail}`);
  if (!r.ok) failed++;
}
if (!LOCAL_POSTS.length) console.log("No repository posts.");
process.exit(failed ? 1 : 0);
