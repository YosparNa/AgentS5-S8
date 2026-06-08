// 移植自原型 layerBadge()(09index 行 3542)
import { cn } from "@/lib/cn";
import type { StageLayer } from "@/types";

const MAP: Record<StageLayer, { n: string; c: string }> = {
  central: { n: "L1", c: "layer-central" },
  channel: { n: "L2", c: "layer-channel" },
  video: { n: "L3", c: "layer-video" },
};

export function LayerBadge({ layer }: { layer: StageLayer }) {
  const m = MAP[layer];
  return <span className={cn("layer-pill text-[10px] font-bold px-1.5 py-0.5 rounded mono", m.c)}>{m.n}</span>;
}
