// OutputTab — dispatches to container-agnostic artifact components by stage.config.kind.
// 来源 PROTO lines 3676–3734 (renderOutput outer wrapper + kind switch).
//
// Hooks-safety: benchmark-pro and hot-pro need useEffect data loading.
// To avoid conditional hook calls, they are wrapped in tiny loader sub-components
// (BenchmarkArtifactLoader, HotspotArtifactLoader) that always call their
// own hooks unconditionally. The switch renders the loader, not the artifact directly.

import { useState, useEffect } from "react";
import type { StageDef } from "@/types";
import type { Competitor, Hotspot } from "@/types";
import { dataProvider } from "@/services/dataProvider";
import { Icon } from "@/components/icons";

// D2a artifacts
import { NicheArtifact } from "./artifacts/NicheArtifact";
import { BenchmarkArtifact } from "./artifacts/BenchmarkArtifact";
import { HotspotArtifact } from "./artifacts/HotspotArtifact";
import { ViralHubArtifact } from "./artifacts/ViralHubArtifact";

// D2b artifacts
import { TopicArtifact } from "./artifacts/TopicArtifact";
import { OutlineArtifact } from "./artifacts/OutlineArtifact";
import { ScriptArtifact } from "./artifacts/ScriptArtifact";
import { AdversarialArtifact } from "./artifacts/AdversarialArtifact";
import { StoryboardArtifact } from "./artifacts/StoryboardArtifact";
import { CoverArtifact } from "./artifacts/CoverArtifact";
import { FinalArtifact } from "./artifacts/FinalArtifact";
import { PublishArtifact } from "./artifacts/PublishArtifact";
import { AnalyticsArtifact } from "./artifacts/AnalyticsArtifact";

// ── S5-S8 空状态提示 ──────────────────────────────────────────────────────

const EMPTY_HINTS: Record<string, string> = {
  topic: "请在配置页输入数据后点击「AI 生成选题」",
  outline: "请先在 S5 生成选题",
  script: "请先在 S6 生成大纲",
  adversarial: "请先在 S7 生成脚本",
};

function EmptyHint({ kind }: { kind: string }) {
  return (
    <div className="p-4">
      <div className="text-center py-12 text-gray-400">
        <div className="text-3xl mb-3">📭</div>
        <div className="text-[12px]">暂无产物</div>
        <div className="text-[10px] mt-1">{EMPTY_HINTS[kind] || ""}</div>
      </div>
    </div>
  );
}

// ── Loader sub-components (each calls hooks unconditionally) ──────────────────

function BenchmarkArtifactLoader() {
  const [accounts, setAccounts] = useState<Competitor[]>([]);
  useEffect(() => {
    dataProvider.listCompetitors().then(setAccounts);
  }, []);
  return <BenchmarkArtifact accounts={accounts} />;
}

function HotspotArtifactLoader() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  useEffect(() => {
    dataProvider.listHotspots().then(setHotspots);
  }, []);
  return <HotspotArtifact hotspots={hotspots} />;
}

// ── OutputTab ─────────────────────────────────────────────────────────────────

interface Props {
  stage: StageDef;
}

export function OutputTab({ stage }: Props) {
  const o = stage.output ?? {};
  const kind = stage.config.kind as string;

  let content: React.ReactNode;

  switch (kind) {
    case "niche":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content = <NicheArtifact output={o as any} />;
      break;

    case "benchmark-pro":
      content = <BenchmarkArtifactLoader />;
      break;

    case "hot-pro":
      content = <HotspotArtifactLoader />;
      break;

    case "viral-hub":
      content = <ViralHubArtifact />;
      break;

    case "topic": {
      const { topics } = o as { topics: Parameters<typeof TopicArtifact>[0]["topics"] };
      if (!topics || topics.length === 0) {
        content = <EmptyHint kind="topic" />;
      } else {
        content = <TopicArtifact topics={topics} />;
      }
      break;
    }

    case "outline": {
      const { outline } = o as { outline: Parameters<typeof OutlineArtifact>[0]["outline"] };
      if (!outline || outline.length === 0) {
        content = <EmptyHint kind="outline" />;
      } else {
        content = <OutlineArtifact outline={outline} />;
      }
      break;
    }

    case "script": {
      const { excerpt, body_md } = o as { excerpt: string; body_md?: string };
      const scriptText = body_md || excerpt;
      if (!scriptText) {
        content = <EmptyHint kind="script" />;
      } else {
        content = <ScriptArtifact excerpt={scriptText} editable={true} />;
      }
      break;
    }

    case "adversarial": {
      const { roles } = o as { roles: Parameters<typeof AdversarialArtifact>[0]["roles"] };
      if (!roles || roles.length === 0) {
        content = <EmptyHint kind="adversarial" />;
      } else {
        content = <AdversarialArtifact roles={roles} />;
      }
      break;
    }

    case "storyboard": {
      const { shots } = o as { shots: Parameters<typeof StoryboardArtifact>[0]["shots"] };
      content = <StoryboardArtifact shots={shots ?? []} />;
      break;
    }

    case "cover": {
      const { matrix } = o as { matrix: Parameters<typeof CoverArtifact>[0]["matrix"] };
      content = <CoverArtifact matrix={matrix ?? []} />;
      break;
    }

    case "final": {
      const { checklist } = o as { checklist: string[] };
      content = <FinalArtifact checklist={checklist ?? []} />;
      break;
    }

    case "publish": {
      const { publish } = o as { publish: Parameters<typeof PublishArtifact>[0]["publish"] };
      content = <PublishArtifact publish={publish ?? []} />;
      break;
    }

    case "analytics": {
      const { metrics, keywords, candidates } = o as {
        metrics: Parameters<typeof AnalyticsArtifact>[0]["metrics"];
        keywords: Parameters<typeof AnalyticsArtifact>[0]["keywords"];
        candidates: Parameters<typeof AnalyticsArtifact>[0]["candidates"];
      };
      content = (
        <AnalyticsArtifact
          metrics={metrics ?? []}
          keywords={keywords ?? []}
          candidates={candidates ?? []}
        />
      );
      break;
    }

    // Kinds with no artifact yet: l1 / l2 / image / voice / subtitle / qa / edit
    default:
      content = (
        <div className="text-center py-12 text-gray-400 text-[12px]">
          <Icon.Clock size={24} className="mx-auto mb-2 opacity-60" />
          <div>此阶段尚未执行</div>
        </div>
      );
  }

  return <div className="p-4 space-y-3">{content}</div>;
}
