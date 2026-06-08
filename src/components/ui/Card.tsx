import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("bg-white border border-gray-200 rounded-xl", className)}>{children}</div>;
}
