"use client";
import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
/** Retained as a small command utility; the MARCO shell owns primary navigation. */
export function GlobalCommandBar() { return <div className="flex items-center gap-2"><button className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-xs text-[var(--txt-dim)]"><Search size={14}/>Search</button><ThemeToggle/></div>; }
