import { serializeJsonLd } from "@/lib/json-ld";

/** Renders a single schema.org JSON-LD block. One instance per schema
 *  object, matching the multi-<script> convention already used in
 *  app/layout.tsx rather than an untested @graph array.
 *
 *  Uses serializeJsonLd (not raw JSON.stringify) so schema built from
 *  database fields — expert bios, event titles, review names — cannot
 *  break out of the <script> tag with a "</script>" payload. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
