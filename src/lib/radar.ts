// 移植自原型 radarScoreColor / radarHash(09index 行 2271–2273)+ 对比上限逻辑
// E1: added radarGenericCluster (PROTO 2275–2287) + resolveRadarQuery (PROTO 2289–2326, pure/no-mutation)
import type { RadarCluster, RadarSearchResult, VerdictTone } from "@/types/ideas";
import { TRACKS } from "@/data/tracks";
import { RADAR_PRESETS, RADAR_POOLED_RULES, presetItemToCluster } from "@/data/radarPresets";

export function radarHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function scoreColor(s: number): string {
  return s >= 8 ? "text-indigo-600" : s >= 7 ? "text-amber-600" : "text-gray-500";
}

/** 切换某 key 是否在对比列表;最多 4 个,已存在则移除 */
export function clampCompare(list: string[], key: string): string[] {
  if (list.includes(key)) return list.filter((k) => k !== key);
  if (list.length >= 4) return list;
  return [...list, key];
}

/**
 * radarGenericCluster — PROTO 2275–2287 ported as pure function.
 * Returns a RadarCluster for any arbitrary query string using a deterministic hash.
 * Uses enum-key verdictTone (not vcls strings).
 */
export function radarGenericCluster(q: string): RadarCluster {
  const h = radarHash(q);
  const score = Math.round((5.8 + ((h % 18) / 10)) * 10) / 10;
  const rpmLo = 4 + (h % 5);
  const rpmHi = rpmLo + 4 + (h % 4);
  const verdictTone: VerdictTone =
    score >= 7.3 ? "blue" : score >= 6.5 ? "neutral" : "red";
  const verdict =
    score >= 7.3 ? "蓝海 ★★" : score >= 6.5 ? "中性 ★★" : "红海 ★";

  return {
    key: "r_q_" + h,
    pooled: false,
    emoji: "🆕",
    title: q,
    verdict,
    verdictTone,
    rpm: "$" + rpmLo + "-" + rpmHi,
    rpmNote: "搜索新发现 · 近 90d 估算",
    hot: 4 + (h % 16),
    turning: 1 + (h % 5),
    active: String(80 + (h % 500)),
    score,
    badge: null,
    supply: "—",
    window: "待评估",
    windowTone: "pending",
    tag:
      "「" +
      q +
      "」经 LLM 聚类形成的候选赛道。沉淀进监控池后系统将每日采集真实数据,逐步校准评分与画像。",
  };
}

/**
 * resolveRadarQuery — PROTO 2289–2326 ported as PURE function (no mutations).
 * 1) Matches already-monitored tracks via RADAR_POOLED_RULES.
 * 2) Matches preset new-track groups via RADAR_PRESETS.
 * 3) Falls back to radarGenericCluster for any query.
 * Returns RadarSearchResult; discovered clusters returned to caller
 * (dataProvider registers them into discoveredCache — NOT done here).
 */
export function resolveRadarQuery(q: string): RadarSearchResult {
  const lq = q.toLowerCase();
  const has = (...arr: string[]) =>
    arr.some((w) => lq.includes(String(w).toLowerCase()));

  const clusters: RadarCluster[] = [];
  const seen: Record<string, boolean> = {};

  // 1) Already-monitored tracks (RADAR_POOLED_RULES)
  for (const r of RADAR_POOLED_RULES) {
    if (has(...r.keys) && !seen[r.k]) {
      const d = TRACKS[r.k];
      if (!d) continue;
      seen[r.k] = true;
      clusters.push({
        key: r.k,
        pooled: true,
        rank: r.rank,
        emoji: d.emoji,
        title: d.title,
        verdict: d.verdict,
        verdictTone: d.verdictTone,
        rpm: d.rpm,
        rpmNote: d.rpmNote,
        active: d.creators,
        supply: d.supply,
        window: d.window,
        windowTone: d.windowTone,
        tag: d.tag,
        hot: r.hot,
        turning: r.turning,
        score: r.score,
        badge: r.badge ?? null,
      });
    }
  }

  // 2) Preset new-track groups
  for (const p of RADAR_PRESETS) {
    if (has(...p.match)) {
      for (const it of p.items) {
        if (!seen[it.key]) {
          seen[it.key] = true;
          clusters.push(presetItemToCluster(it));
        }
      }
    }
  }

  // 3) Generic fallback
  if (clusters.length === 0) {
    const generic = radarGenericCluster(q);
    clusters.push(generic);
  }

  // Sort by score desc
  clusters.sort((a, b) => b.score - a.score);

  const newCount = clusters.filter((c) => !c.pooled).length;
  const pooledCount = clusters.length - newCount;
  const h = radarHash(q);
  const raw = 600 + (h % 1400);
  const creatorsScanned = 120 + (h % 380);

  return { clusters, newCount, pooledCount, raw, creatorsScanned };
}
