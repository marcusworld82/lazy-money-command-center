import { NextResponse } from "next/server";
import { complete } from "@/lib/openrouter";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { agentId, draft } = await request.json() as { agentId?: string; draft?: string };
  if (!agentId || !draft?.trim()) return NextResponse.json({ error: "An agent and draft are required." }, { status: 400 });
  if (draft.length > 8_000) return NextResponse.json({ error: "Draft is too long to enhance." }, { status: 400 });
  const { data: agent, error } = await getSupabaseServerClient().from("agents").select("model_fast,model_reasoning").eq("id", agentId).single();
  if (error) return NextResponse.json({ error: "The selected agent could not be loaded." }, { status: 404 });
  const model = agent.model_fast || agent.model_reasoning;
  if (!model) return NextResponse.json({ error: "Select a reasoning or fast model in this agent’s Settings before enhancing." }, { status: 422 });
  try {
    const result = await complete({ model, agentId, maxTokens: 700, messages: [{ role: "system", content: "Improve the user's draft for clarity, specificity, and useful creative direction. Preserve intent, facts, names, constraints, and tone. Return only the revised draft." }, { role: "user", content: draft }] });
    return NextResponse.json({ draft: result.content });
  } catch (enhanceError) { return NextResponse.json({ error: enhanceError instanceof Error ? enhanceError.message : "Prompt enhancement failed." }, { status: 502 }); }
}
