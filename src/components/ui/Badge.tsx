import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "ok" | "warn" | "danger" | "muted" | "info" | "live";

const TONE: Record<BadgeTone, string> = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  muted: "bg-gray-50 text-gray-600 border-gray-200",
  info: "bg-indigo-50 text-indigo-700 border-indigo-200",
  live: "bg-indigo-50 text-indigo-700 border-indigo-200 blink",
};

export function Badge({ tone = "muted", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", TONE[tone], className)}>{children}</span>;
}
