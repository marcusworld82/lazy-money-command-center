import { createServer } from "node:http";
import { Scheduler } from "./scheduler";
const scheduler = new Scheduler();
const secret = process.env.MARCO_WORKER_SECRET;
if (!secret) throw new Error("MARCO_WORKER_SECRET is required.");
createServer(async (req, res) => { if (req.url === "/health") { res.writeHead(200).end("ok"); return; } if (req.url === "/internal/dispatch" && req.headers.authorization === `Bearer ${secret}`) { let body = ""; for await (const chunk of req) body += chunk; scheduler.enqueue(JSON.parse(body)); res.writeHead(202, { "content-type": "application/json" }).end(JSON.stringify({ accepted: true })); return; } res.writeHead(401).end(); }).listen(Number(process.env.PORT ?? 3001));
