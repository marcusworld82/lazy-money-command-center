import type { RuntimeDispatch } from "@/lib/runtime/types";
const priority = { user: 0, agent: 1, automation: 2, background: 3 } as const;
export class Scheduler { private queue: RuntimeDispatch[] = []; enqueue(job: RuntimeDispatch) { this.queue.push(job); this.queue.sort((a, b) => priority[a.lane] - priority[b.lane]); } next() { return this.queue.shift() ?? null; } }
