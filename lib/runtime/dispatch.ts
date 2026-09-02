import "server-only";
import type { RuntimeDispatch } from "./types";

export async function notifyWorker(dispatch: RuntimeDispatch) {
  const secret = process.env.MARCO_WORKER_SECRET;
  const url = process.env.MARCO_WORKER_URL;
  if (!secret || !url) return { delivered: false, reason: "Worker is not configured." };
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/internal/dispatch`, { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify(dispatch), cache: "no-store" });
    return { delivered: response.ok, reason: response.ok ? null : `Worker responded ${response.status}.` };
  } catch { return { delivered: false, reason: "Worker could not be reached. The Run remains queued." }; }
}
