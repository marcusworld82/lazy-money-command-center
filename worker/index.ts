import { createServer } from "node:http";
import { Scheduler } from "./scheduler";
const secret = process.env.MARCO_WORKER_SECRET;
if (!secret) throw new Error("MARCO_WORKER_SECRET is required.");
const scheduler = new Scheduler(process.env.HOSTNAME ?? `worker-${process.pid}`);
createServer(async (req, res) => {
  if (req.url === "/health") { res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ ok: true })); return; }
  if (req.url !== "/internal/dispatch" || req.method !== "POST" || req.headers.authorization !== `Bearer ${secret}`) { res.writeHead(401).end(); return; }
  try { let body = ""; for await (const chunk of req) body += chunk; const payload = JSON.parse(body) as { runId?: string; agentId?: string; threadId?: string; lane?: string; request?: string }; if (!payload.runId || !payload.agentId || !payload.threadId || !payload.request || !["user", "agent", "automation", "background"].includes(payload.lane ?? "")) { res.writeHead(400).end("Invalid dispatch payload."); return; } void scheduler.drain(); res.writeHead(202, { "content-type": "application/json" }).end(JSON.stringify({ accepted: true })); } catch { res.writeHead(400).end("Invalid dispatch payload."); }
}).listen(Number(process.env.PORT ?? 3001), () => { void scheduler.drain(); });
