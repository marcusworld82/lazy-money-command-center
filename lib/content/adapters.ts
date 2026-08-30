import "server-only";
import { complete, parseJsonCompletion } from "@/lib/llm/openrouter";
import { PLATFORM_RULES } from "@/lib/content/platforms";
import type {
  ContentAnalysis,
  ContentPlatform,
  ContentVersionPayload,
  BrandVoiceProfileData,
  ContentGoal,
} from "@/lib/types";

const ADAPTER_SYSTEM = `You are the Master Adaptation Agent. You take one analyzed piece of content and rewrite it natively for a single target platform.

Non-negotiable rules:
1. PRESERVE FACTS EXACTLY. Every item in facts_to_preserve must appear in your output with its meaning and figures unchanged. Do not round numbers, soften claims, strengthen claims, or invent new ones.
2. WRITE NATIVELY. Produce something that belongs on this specific platform. Never produce copy that reads like it was pasted from another channel.
3. RESPECT THE BRAND VOICE. Honour words_to_use, words_to_avoid, emoji rules, and hashtag rules exactly as given.
4. NEVER FABRICATE. No invented statistics, results, testimonials, or social proof.

Return strict JSON. Include only the keys relevant to the platform:
{
  "caption": "primary post copy, when the platform has one",
  "hashtags": ["without", "the", "hash", "symbol"],
  "script": "spoken script, for video platforms",
  "title": "for YouTube, Pinterest, or blog",
  "body": "long-form body, for blog or email",
  "subject": "subject line, for email",
  "notes": "anything the human should know before posting",
  "manualPostPack": {
    "mediaSpec": "exact media dimensions/format this platform needs",
    "suggestedTime": "a suggested posting time and why",
    "steps": ["ordered steps to post this by hand"]
  }
}

manualPostPack is required on every response: nothing here publishes automatically, so a human must be able to post it correctly from your output alone.`;

function describeBrandVoice(voice?: BrandVoiceProfileData): string {
  if (!voice || Object.keys(voice).length === 0) {
    return "BRAND VOICE: none specified. Use a neutral, direct, non-hype register.";
  }
  return [
    "BRAND VOICE:",
    voice.tone ? `- Tone: ${voice.tone}` : null,
    voice.style ? `- Style: ${voice.style}` : null,
    voice.hooks ? `- Hook style: ${voice.hooks}` : null,
    voice.ctaStyle ? `- CTA style: ${voice.ctaStyle}` : null,
    voice.wordsToUse?.length ? `- Words to use: ${voice.wordsToUse.join(", ")}` : null,
    voice.wordsToAvoid?.length
      ? `- Words to AVOID entirely: ${voice.wordsToAvoid.join(", ")}`
      : null,
    voice.emojiRules ? `- Emoji rules: ${voice.emojiRules}` : null,
    voice.hashtagRules ? `- Hashtag rules: ${voice.hashtagRules}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function adaptForPlatform(input: {
  platform: ContentPlatform;
  analysis: ContentAnalysis;
  brandVoice?: BrandVoiceProfileData;
  goal?: ContentGoal;
  audience?: string;
  cta?: string;
}): Promise<ContentVersionPayload> {
  const rules = PLATFORM_RULES[input.platform];

  const user = [
    `TARGET PLATFORM: ${rules.label}`,
    `FORMAT: ${rules.format}`,
    rules.maxLength ? `MAX LENGTH: ${rules.maxLength} characters` : null,
    `HASHTAG RULE: ${rules.hashtags}`,
    `PLATFORM NOTES: ${rules.notes}`,
    "",
    describeBrandVoice(input.brandVoice),
    "",
    input.goal ? `GOAL: ${input.goal}` : null,
    input.audience ? `AUDIENCE: ${input.audience}` : null,
    input.cta ? `CALL TO ACTION: ${input.cta}` : null,
    "",
    "ANALYZED SOURCE OF TRUTH:",
    `- Core idea: ${input.analysis.core_idea}`,
    `- Hook: ${input.analysis.hook}`,
    `- Key points: ${input.analysis.key_points.join(" | ")}`,
    "",
    "FACTS TO PRESERVE EXACTLY (these must survive verbatim):",
    input.analysis.facts_to_preserve.length
      ? input.analysis.facts_to_preserve.map((f) => `- ${f}`).join("\n")
      : "- (none stated in the source; do not invent any)",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await complete({
    system: ADAPTER_SYSTEM,
    user,
    json: true,
    maxTokens: 2000,
  });

  const parsed = parseJsonCompletion<ContentVersionPayload>(raw);

  return {
    caption: parsed.caption,
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : undefined,
    script: parsed.script,
    title: parsed.title,
    body: parsed.body,
    subject: parsed.subject,
    notes: parsed.notes,
    manualPostPack: parsed.manualPostPack,
  };
}

/**
 * Checks that every preserved fact actually survived adaptation.
 *
 * Master spec section 5 requires facts to carry through unchanged, and a prompt
 * instruction alone is not a guarantee — this verifies the output and surfaces
 * anything that went missing rather than trusting the model silently.
 */
export function findMissingFacts(
  analysis: ContentAnalysis,
  payload: ContentVersionPayload,
): string[] {
  const haystack = [
    payload.caption,
    payload.script,
    payload.title,
    payload.body,
    payload.subject,
    payload.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return analysis.facts_to_preserve.filter((fact) => {
    const needle = fact.trim().toLowerCase();
    if (!needle) return false;
    if (haystack.includes(needle)) return false;
    // A fact often survives reworded around its figures, so also accept the case
    // where every number in the fact still appears in the output.
    const numbers = needle.match(/\d[\d,.]*/g);
    if (numbers?.length) return !numbers.every((n) => haystack.includes(n));
    return true;
  });
}
