import { NextResponse } from "next/server";
import { pollGeneration } from "@/lib/fal";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data: job, error } = await supabase.from("generation_jobs").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: "Generation job not found." }, { status: 404 });
  try {
    const result = await pollGeneration(job.model_name, job.fal_request_id);
    const completed = result.status === "completed";
    await supabase.from("generation_jobs").update({ status: result.status, outputs: result.outputs, cost: result.cost, completed_at: completed ? new Date().toISOString() : null }).eq("id", id);
    if (completed) await supabase.from("runs").update({ status: "completed", outputs: result.outputs, cost: result.cost }).eq("id", job.run_id);
    return NextResponse.json(result);
  } catch (failure) {
    const message = failure instanceof Error ? failure.message : "Generation polling failed.";
    await supabase.from("generation_jobs").update({ status: "failed", error: message, completed_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("runs").update({ status: "failed" }).eq("id", job.run_id);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
