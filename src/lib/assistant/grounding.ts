/**
 * Validates model output against the facts it was given. An answer is accepted only if:
 *  - it is the requested JSON shape and a reasonable length,
 *  - every cited evidence ID resolves to a known farm, client or segment,
 *  - every ID-like token in the text is known (no invented C11/F99),
 *  - every number in the text appears in the supplied facts (no new calculations),
 *  - it cites at least one ID, unless it says the information is unavailable.
 */
import type { TopicContext } from "./topics";

const MAX_ANSWER_CHARS = 1500;
/** Farm/client/station-style identifiers: letters followed by digits, e.g. F01, C02, STATION-01. */
const ID_TOKEN = /\b[A-Z][A-Z]*[-_]?\d+\b/g;
const NUMBER_TOKEN = /\d[\d,]*(?:\.\d+)?/g;
const SEGMENT_ID = /^[A-D]$/;

export type GroundingResult = { ok: true; answer: string; evidenceIds: string[] } | { ok: false; reason: string };

export function validateModelOutput(raw: string, context: TopicContext): GroundingResult {
  const parsed = parseJson(raw);
  if (!parsed) return { ok: false, reason: "the model did not return the required JSON" };

  const { answer, evidence_ids: evidence } = parsed as { answer?: unknown; evidence_ids?: unknown };
  if (typeof answer !== "string" || answer.trim() === "") return { ok: false, reason: "the answer text is missing" };
  if (answer.length > MAX_ANSWER_CHARS) return { ok: false, reason: "the answer is too long" };
  if (!Array.isArray(evidence) || !evidence.every((id) => typeof id === "string")) {
    return { ok: false, reason: "evidence_ids is not a list of IDs" };
  }

  const cited = [...new Set(evidence.map((id) => id.trim()))];
  const unknownCited = cited.filter((id) => !context.knownIds.has(id));
  if (unknownCited.length) return { ok: false, reason: `it cited unknown IDs: ${unknownCited.join(", ")}` };

  const unknownInText = [...new Set(answer.match(ID_TOKEN) ?? [])].filter((id) => !context.knownIds.has(id));
  if (unknownInText.length) return { ok: false, reason: `it mentioned unknown IDs: ${unknownInText.join(", ")}` };

  const allowed = numbersIn(context.facts.join(" "));
  const invented = [...numbersIn(answer)].filter((n) => !allowed.has(n));
  if (invented.length) return { ok: false, reason: `it used numbers not present in the plan: ${invented.join(", ")}` };

  const unavailable = /\b(unavailable|not available)\b/i.test(answer);
  if (cited.length === 0 && !unavailable) return { ok: false, reason: "it did not cite any farm, client or segment ID" };

  // Keep evidence ordered: entities first, then segment labels.
  const ordered = [...cited.filter((id) => !SEGMENT_ID.test(id)), ...cited.filter((id) => SEGMENT_ID.test(id))];
  return { ok: true, answer: answer.trim(), evidenceIds: ordered };
}

/** Canonical numbers in a text, ignoring the digits inside IDs (so F01 does not count as "1"). */
export function numbersIn(text: string): Set<string> {
  const withoutIds = text.replace(ID_TOKEN, " ");
  return new Set((withoutIds.match(NUMBER_TOKEN) ?? []).map((n) => String(Number(n.replace(/,/g, "")))));
}

function parseJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    const value = JSON.parse(trimmed);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
