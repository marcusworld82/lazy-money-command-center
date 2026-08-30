import type { ContentPlatform, ContentVersion } from "@/lib/types";

/** Native shape and constraints each adapter must write toward. */
export interface PlatformRules {
  label: string;
  format: string;
  maxLength?: number;
  hashtags: string;
  notes: string;
}

export const PLATFORM_RULES: Record<ContentPlatform, PlatformRules> = {
  instagram: {
    label: "Instagram",
    format: "Caption for a feed post or carousel. Hook in the first line, before the fold.",
    maxLength: 2200,
    hashtags: "5-15 relevant hashtags, placed at the end",
    notes: "Line breaks for scannability. Conversational. No external links in caption.",
  },
  tiktok: {
    label: "TikTok",
    format: "Short spoken-word video script plus a short caption.",
    maxLength: 2200,
    hashtags: "3-6 hashtags, trend-aware",
    notes: "Hook must land in the first 2 seconds. Write the script as spoken, not written.",
  },
  youtube: {
    label: "YouTube",
    format: "Video title, description, and a chaptered outline.",
    maxLength: 5000,
    hashtags: "3-5 hashtags in the description",
    notes: "Title is search-driven and specific. Description front-loads value in 2 lines.",
  },
  x: {
    label: "X",
    format: "A single post, or a short thread when the idea genuinely needs it.",
    maxLength: 280,
    hashtags: "0-2 hashtags maximum",
    notes: "Terse. No filler. Each line earns the next. Thread only if warranted.",
  },
  linkedin: {
    label: "LinkedIn",
    format: "Professional post with a strong opening line.",
    maxLength: 3000,
    hashtags: "3-5 professional hashtags",
    notes: "Business-outcome framing. Short paragraphs. Credible, not salesy.",
  },
  threads: {
    label: "Threads",
    format: "Conversational post, optionally a short chain.",
    maxLength: 500,
    hashtags: "0-1 hashtag",
    notes: "Casual and direct. Reads like a person talking, not a brand broadcasting.",
  },
  facebook: {
    label: "Facebook",
    format: "Post copy for a Page audience.",
    maxLength: 63206,
    hashtags: "0-3 hashtags",
    notes: "Plain-spoken and community-oriented. Links are fine here.",
  },
  pinterest: {
    label: "Pinterest",
    format: "Pin title and description.",
    maxLength: 500,
    hashtags: "2-5 keyword-style hashtags",
    notes: "Search-driven and keyword-rich. Describe the outcome the viewer gets.",
  },
  email: {
    label: "Email",
    format: "Subject line plus email body.",
    hashtags: "none",
    notes: "Subject earns the open. Body is direct, one clear call to action.",
  },
  blog: {
    label: "Blog",
    format: "Post title and structured markdown body with headings.",
    hashtags: "none",
    notes: "Skimmable structure. Headings carry meaning on their own.",
  },
};

/* ------------------------------------------------------------------ */
/* Connector interface                                                 */
/* ------------------------------------------------------------------ */

export type ConnectionStatus = "connected" | "not_connected" | "unsupported";

export interface PublishResult {
  ok: boolean;
  platformPostId?: string;
  url?: string;
  reason?: string;
}

/**
 * The 4-method interface master spec section 5 requires of every connector.
 *
 * No platform has real OAuth or publishing wired this phase, so every
 * connector's publish() returns ok:false. That is the mechanism that makes
 * "never claim content was published if it wasn't" structural rather than a
 * convention someone has to remember: with no successful publish path, the only
 * terminal state a version can reach is READY_TO_POST.
 */
export interface PlatformConnector {
  platform: ContentPlatform;
  validateConnection(): Promise<ConnectionStatus>;
  publish(version: ContentVersion): Promise<PublishResult>;
  getStatus(): Promise<ConnectionStatus>;
  /** Returns null when unavailable — never a fabricated number. */
  getAnalytics(version: ContentVersion): Promise<Record<string, number> | null>;
}

function createUnwiredConnector(platform: ContentPlatform): PlatformConnector {
  return {
    platform,
    // TODO: replace with a real OAuth check once platform credentials are wired.
    async validateConnection() {
      return "not_connected";
    },
    async publish() {
      return {
        ok: false,
        reason:
          "No publish connector is wired for this platform yet. Saved as READY_TO_POST with a complete manual-post pack.",
      };
    },
    async getStatus() {
      return "not_connected";
    },
    // Master spec section 5: never fabricate analytics. Null means unavailable.
    async getAnalytics() {
      return null;
    },
  };
}

export const CONNECTORS: Record<ContentPlatform, PlatformConnector> = Object.fromEntries(
  (Object.keys(PLATFORM_RULES) as ContentPlatform[]).map((p) => [
    p,
    createUnwiredConnector(p),
  ]),
) as Record<ContentPlatform, PlatformConnector>;

export const ALL_PLATFORMS = Object.keys(PLATFORM_RULES) as ContentPlatform[];
