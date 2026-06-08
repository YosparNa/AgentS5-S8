import { cn } from "@/lib/cn";

export function Toggle({ on, onChange, className }: { on: boolean; onChange?: (v: boolean) => void; className?: string }) {
  return (
    <div
      className={cn("toggle", on && "on", className)}
      role="switch"
      aria-checked={on}
      onClick={() => onChange?.(!on)}
    />
  );
}
