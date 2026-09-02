import "server-only";
import { unzipSync, strFromU8 } from "fflate";

export type ImportedSkillFile = { path: string; content: string };
export type ImportedSkill = { name: string; slug: string; description: string | null; source: "claude_code" | "perplexity" | "markdown" | "built_here" | "zip"; sourcePath: string | null; instruction: string; triggers: string[]; files: ImportedSkillFile[] };

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80); }
function frontmatter(markdown: string) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const meta = new Map<string, string>();
  if (match) for (const line of match[1].split("\n")) { const [key, ...rest] = line.split(":"); if (key && rest.length) meta.set(key.trim().toLowerCase(), rest.join(":").trim().replace(/^['"]|['"]$/g, "")); }
  return { meta, body: markdown.slice(match?.[0].length ?? 0).trim() };
}
function parseMarkdown(markdown: string, source: ImportedSkill["source"], sourcePath: string | null, files: ImportedSkillFile[] = []): ImportedSkill {
  const { meta, body } = frontmatter(markdown);
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const name = meta.get("name") || heading;
  if (!name || !body) throw new Error("This skill needs a title and non-empty SKILL.md instructions.");
  const description = meta.get("description") ?? body.split("\n").find((line) => line.trim() && !line.startsWith("#"))?.trim() ?? null;
  const triggers = (meta.get("triggers") ?? "").replace(/[\[\]]/g, "").split(",").map((item) => item.trim()).filter(Boolean);
  return { name, slug: slugify(name), description, source, sourcePath, instruction: body, triggers, files };
}

export function importSkillFile(input: { name: string; text?: string; bytes?: Uint8Array }): ImportedSkill {
  const name = input.name.toLowerCase();
  if (name.endsWith(".md")) return parseMarkdown(input.text ?? "", "markdown", input.name);
  if (!name.endsWith(".zip") || !input.bytes) throw new Error("Recognized inputs are SKILL.md, markdown, Perplexity markdown export, or a skill zip.");
  const archive = unzipSync(input.bytes);
  const entries = Object.entries(archive).filter(([path]) => !path.endsWith("/")).map(([path, value]) => ({ path, content: strFromU8(value) }));
  const manifest = entries.find((entry) => /(^|\/)SKILL\.md$/i.test(entry.path));
  if (!manifest) throw new Error("Unrecognized zip: it must contain a SKILL.md entry point.");
  const declared = entries.filter((entry) => entry.path === manifest.path || /(^|\/)(references|scripts|assets)\//i.test(entry.path));
  return parseMarkdown(manifest.content, "zip", manifest.path, declared.filter((entry) => entry.path !== manifest.path));
}
