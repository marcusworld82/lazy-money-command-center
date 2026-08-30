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

/**
 * Default model, overridable with OPENROUTER_MODEL in .env.local.
 *
 * Verified against OpenRouter's live model list — slugs do get retired, so this
 * has to be a currently-served id rather than a familiar-looking one. The
 * override exists so a free model can be used while an account has no credits,
 * without editing code. Phase 5 makes routing per call type.
 */
export const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5";

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

/**
 * Parses a JSON completion.
 *
 * Not every model honours response_format (free models especially), so this
 * tolerates code fences and surrounding prose by falling back to the outermost
 * {...} span before giving up.
 */
export function parseJsonCompletion<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error(
      `Model did not return JSON. First 200 chars: ${cleaned.slice(0, 200)}`,
    );
  }
}
