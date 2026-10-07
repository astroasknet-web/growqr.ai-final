/**
 * Escape a user-supplied value for use inside a PostgREST filter string
 * (`.or()`, `.filter()`), where `,` `(` `)` are grammar and would otherwise let
 * the value break out and reshape the query.
 *
 * The result is only safe when interpolated **inside double quotes**, which is
 * what makes those characters literal:
 *
 *   query.or(`name.ilike."%${escapePostgrestPattern(q)}%"`)
 *
 * Only `\` and `"` can escape a double-quoted value, so those are all we touch —
 * dots and spaces are left alone, since real searches contain them (emails).
 */
export function escapePostgrestPattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
