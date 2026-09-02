import { createServer } from "node:http";
const secret = process.env.MARCO_WORKER_SECRET;
if (!secret) throw new Error("MARCO_WORKER_SECRET is required.");
createServer((req, res) => { if (req.url === "/health") { res.writeHead(200).end("ok"); return; } if (req.url === "/internal/dispatch" && req.headers.authorization === `Bearer ${secret}`) { res.writeHead(202, { "content-type": "application/json" }).end(JSON.stringify({ accepted: true })); return; } res.writeHead(401).end(); }).listen(Number(process.env.PORT ?? 3001));
