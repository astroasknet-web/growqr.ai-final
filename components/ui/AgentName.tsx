import { type ReactNode } from "react";

/**
 * Renders an agent's display name with a small, trademark-style raised "RQ"
 * mark — e.g. the stored name `RQ-Sage` renders as `Sage`ᴿᑫ.
 *
 * Agent names are stored canonically as `RQ-<Name>` (see `lib/data.ts`). This
 * component strips that prefix and appends the raised mark so the brand reads
 * as identity (`Sage`ᴿᑫ) rather than a prefixed slug. Use it for every visible
 * agent-name display; keep the plain `RQ-<Name>` string for lookup keys, alt
 * text, metadata, and LLM prompts.
 *
 * `RQ-Score` (the metric) is intentionally NOT an agent — never wrap it here.
 */
export function AgentName({
  name,
  className,
}: {
  name: string;
  className?: string;
}): ReactNode {
  const base = name.replace(/^RQ-/, "");
  return (
    <span className={className}>
      {base}
      <sup className="ml-[0.14em] align-super text-[0.58em] font-semibold tracking-[0.02em] opacity-70">
        RQ
      </sup>
    </span>
  );
}

export default AgentName;

/**
 * Canonical agent tokens (base names only — `RQ-Score` is a metric, not an
 * agent, and is deliberately excluded so it never gets the mark).
 */
const AGENT_TOKEN =
  /(RQ-(?:Scout|Mira|Vera|Kai|Nova|Sage|Lyra|Atlas|Drape|Rita|Theo|Rohan|Finn|Eva|Maya))/g;
const IS_AGENT_TOKEN =
  /^RQ-(?:Scout|Mira|Vera|Kai|Nova|Sage|Lyra|Atlas|Drape|Rita|Theo|Rohan|Finn|Eva|Maya)$/;

/**
 * Renders a prose string with every embedded agent name (`RQ-Sage`, …) shown
 * via {@link AgentName} — i.e. `Sage`ᴿᑫ. Use at render sites that output copy
 * strings (FAQ answers, step descriptions, taglines) so the mark stays
 * consistent with the standalone name displays. Returns the string untouched
 * when it contains no agent token.
 */
export function withAgentMarks(text: string): ReactNode {
  if (!text || !text.includes("RQ-")) return text;
  const parts = text.split(AGENT_TOKEN);
  return parts.map((part, i) =>
    IS_AGENT_TOKEN.test(part) ? <AgentName key={i} name={part} /> : part,
  );
}
