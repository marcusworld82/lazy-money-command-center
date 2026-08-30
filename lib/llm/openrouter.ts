import "server-only";

/**
 * OpenRouter client. Master spec section 11 makes OpenRouter the router for all
 * text/reasoning calls, so everything goes through here rather than a
 * provider SDK — which also means Phase 5 can add model routing and
 * model_usage_log cost writes in one place without touching call sites.
 *
 * Plain fetch against the OpenAI-compatible endpoint; no package needed.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Sensible default; Phase 5 will make this configurable per call type. */
export const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

export class MissingLLMKeyError extends Error {
  constructor() {
    super(
      "OPENROUTER_API_KEY is not set. Add it to .env.local to enable content analysis and platform adaptation.",
    );
    this.name = "MissingLLMKeyError";
  }
}

export function hasLLMKey(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

interface CompleteOptions {
  system: string;
  user: string;
  model?: string;
  /** Ask the model for strict JSON back. */
  json?: boolean;
  maxTokens?: number;
}

export async function complete({
  system,
  user,
  model = DEFAULT_MODEL,
  json = false,
  maxTokens = 2000,
}: CompleteOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new MissingLLMKeyError();

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter request failed (${response.status}): ${detail.slice(0, 300)}`,
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenRouter returned an unexpected response shape.");
  }
  return content;
}

/** Parses a JSON completion, tolerating models that wrap output in code fences. */
export function parseJsonCompletion<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned) as T;
}
