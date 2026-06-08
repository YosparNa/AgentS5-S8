import { cn } from "@/lib/cn";

export function ScoreBar({ value, max = 10, gray = false }: { value: number; max?: number; gray?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full", gray ? "bg-gray-300" : "bg-indigo-500")} style={{ width: `${pct}%` }} />
    </div>
  );
}
