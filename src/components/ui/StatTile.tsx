import type { ReactNode } from "react";

export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-2.5">
      <div className="text-[9px] text-gray-500 uppercase">{label}</div>
      <div className="text-[18px] font-black mono mt-0.5">{value}</div>
      {sub ? <div className="text-[9px] text-gray-500">{sub}</div> : null}
    </div>
  );
}
