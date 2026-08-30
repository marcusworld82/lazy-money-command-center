import "server-only";
import { complete, parseJsonCompletion } from "@/lib/llm/openrouter";
import type { ContentAnalysis, ContentItem } from "@/lib/types";

const ANALYZER_SYSTEM = `You are a Content Analyzer. You read one piece of source content and extract its single source of truth, BEFORE any platform rewriting happens.

Your output is the contract every downstream platform adaptation must respect. Getting it wrong causes meaning drift across every channel.

Return strict JSON with exactly these keys:
{
  "core_idea": "one sentence capturing what this content is actually about",
  "hook": "the single most attention-grabbing angle, in the source's own framing",
  "key_points": ["the substantive points, in priority order"],
  "facts_to_preserve": ["every concrete claim, number, price, date, name, statistic, or guarantee stated in the source"]
}

Rules:
- facts_to_preserve must quote figures EXACTLY as written. Do not round, approximate, convert, or reword them.
- Never invent facts, statistics, results, or testimonials that are not in the source.
- If the source contains no concrete factual claims, return an empty facts_to_preserve array. Do not manufacture entries.
- Capture what the source says, not what you think would perform better.`;

export async function analyzeContent(
  item: Pick<ContentItem, "originalContent" | "contentType" | "goal" | "audience" | "cta">,
): Promise<ContentAnalysis> {
  const user = [
    `CONTENT TYPE: ${item.contentType}`,
    item.goal ? `GOAL: ${item.goal}` : null,
    item.audience ? `AUDIENCE: ${item.audience}` : null,
    item.cta ? `CALL TO ACTION: ${item.cta}` : null,
    "",
    "SOURCE CONTENT:",
    item.originalContent,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await complete({
    system: ANALYZER_SYSTEM,
    user,
    json: true,
    maxTokens: 1500,
  });

  const parsed = parseJsonCompletion<Partial<ContentAnalysis>>(raw);

  // Normalize defensively — a malformed analysis would silently corrupt every
  // downstream adaptation, so coerce to the expected shape rather than trusting it.
  return {
    core_idea: parsed.core_idea ?? "",
    hook: parsed.hook ?? "",
    key_points: Array.isArray(parsed.key_points) ? parsed.key_points : [],
    facts_to_preserve: Array.isArray(parsed.facts_to_preserve)
      ? parsed.facts_to_preserve
      : [],
  };
}
