"use client";
import { cn } from "@/lib/utils";
import type { PermissionMode } from "@/lib/marco-types";
export function PermissionTri({ value, onChange }: { value: PermissionMode; onChange: (value: PermissionMode) => void }) { return <div className="flex overflow-hidden rounded-md border border-[var(--line)]">{(["always", "ask", "never"] as PermissionMode[]).map((mode) => <button key={mode} type="button" onClick={() => onChange(mode)} className={cn("min-h-8 border-r border-[var(--line)] px-2 text-[10px] uppercase last:border-0", value === mode && (mode === "never" ? "bg-[var(--line-2)] text-[var(--txt)]" : "bg-[var(--red)] text-white"))}>{mode}</button>)}</div>; }
