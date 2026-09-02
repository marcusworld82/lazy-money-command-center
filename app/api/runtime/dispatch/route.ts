import { NextResponse } from "next/server";
import { notifyWorker } from "@/lib/runtime/dispatch";
import type { RuntimeDispatch } from "@/lib/runtime/types";
export async function POST(request: Request) { const body = await request.json() as Partial<RuntimeDispatch>; if (!body.runId || !body.agentId || !body.threadId || !body.request || !["user", "agent", "automation", "background"].includes(body.lane ?? "")) return NextResponse.json({ error: "Invalid runtime dispatch." }, { status: 400 }); const result = await notifyWorker(body as RuntimeDispatch); return NextResponse.json(result, { status: result.delivered ? 202 : 503 }); }
