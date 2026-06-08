import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Pill({ on, onClick, className, children }: { on?: boolean; onClick?: () => void; className?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("pill", on && "pill-on", className)}>
      {children}
    </button>
  );
}
