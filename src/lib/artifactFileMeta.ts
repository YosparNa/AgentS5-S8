// 来源 计划 D-E ④ — 每个阶段的产物文件描述(artifact metadata)
import type { StageDef } from "@/types";

/**
 * 容器无关的产物文件元数据。ChatArtifactCard 与 FileModal 均从此对象渲染,
 * 不再各自从 stage 推断字段。后端接入后由真实 artifact 响应填充同一形状。
 */
export interface ArtifactFile {
  /** 稳定 id:`${stageId}:${index}:${fileName}`,供 key / 选中 / 去重 */
  artifactId: string;
  stageId: string;
  /** mock:与 stageId 相同;保留以备后端 nodeId ≠ stageId */
  nodeId?: string;
  /** stage.config.kind,决定正文渲染器 / 媒体预览 */
  kind: string;
  /** stage.title,人类可读标题 */
  title: string;
  fileName: string;
  ext: string;
  /** Icon map key(@/components/icons.tsx) */
  icon: string;
  meta: string;
  /** 产物生成时间(若已知);来自 runFlow 节点的 producedAt */
  updatedAt?: string;
}

/** 调用方注入的上下文(stageId 必填;nodeId/updatedAt 由运行态提供) */
export interface ArtifactFileContext {
  stageId: string;
  nodeId?: string;
  updatedAt?: string;
}

interface RawFile {
  fileName: string;
  ext: string;
  meta: string;
}

/** Icon key by file extension */
const EXT_ICON: Record<string, string> = {
  md: "FileText",
  csv: "FileSpreadsheet",
  json: "Database",
  srt: "FileText",
  mp3: "Music",
  zip: "FileArchive",
};

function iconFor(ext: string): string {
  return EXT_ICON[ext] ?? "FileText";
}

function r(fileName: string, ext: string, meta: string): RawFile {
  return { fileName, ext, meta };
}

/** 按 kind 返回该阶段的原始文件三元组(fileName/ext/meta) */
function rawFiles(stage: StageDef): RawFile[] {
  const kind = stage.config.kind as string;
  switch (kind) {
    case "niche":         return [r("赛道评分卡.md", "md", "锁定建议 · 8.4 分")];
    case "benchmark-pro": return [r("对标矩阵_12账号.csv", "csv", "核心 3 · 候选 9")];
    case "viral-hub":     return [r("爆款解构_6样本.json", "json", "6 样本 · 4 规则")];
    case "hot-pro":       return [r("今日热点_5条.json", "json", "推荐 2 · 待审 3")];
    case "topic": {
      const topics = (stage.output?.topics ?? []) as Array<Record<string, unknown>>;
      const best = topics.length > 0 ? topics.reduce((max, t) => ((t.score as number) > (max.score as number) ? t : max), topics[0]) : null;
      const scoreStr = best ? `${best.score} 分` : "待生成";
      const countStr = topics.length > 0 ? `${topics.length} 选题` : "";
      return [r("选题卡.md", "md", countStr ? `${countStr} · ${scoreStr}` : scoreStr)];
    }
    case "outline": {
      const outline = (stage.output?.outline ?? []) as Array<Record<string, unknown>>;
      const totalDur = stage.output?.total_duration as string | undefined;
      const chCount = outline.length;
      const metaStr = chCount > 0 ? `${chCount} 章` : "待生成";
      return [r("大纲.md", "md", totalDur ? `${metaStr} · ${totalDur}` : metaStr)];
    }
    case "script": {
      const wc = stage.output?.word_count as number | undefined;
      const body = stage.output?.body_md as string | undefined;
      const count = wc ?? (body ? body.length : 0);
      const metaStr = count > 0 ? `${count.toLocaleString()} 字` : "待生成";
      return [r("脚本.md", "md", metaStr)];
    }
    case "adversarial": {
      const roles = (stage.output?.roles ?? []) as Array<Record<string, unknown>>;
      const avg = stage.output?.average_score as number | undefined;
      const count = roles.length;
      const scoreStr = avg ? ` · ${avg}分` : "";
      return [r("对抗质疑.md", "md", `${count} 角色${scoreStr}`)];
    }
    case "storyboard":    return [r("分镜表_38.csv", "csv", "38 镜 · 图像待 S10")];
    case "image":         return [r("分镜图_×38.zip", "zip", "图像库")];
    case "voice":         return [r("配音_zh.mp3", "mp3", "音轨")];
    case "subtitle":      return [r("字幕.srt", "srt", "SRT")];
    case "cover":         return [r("封面标题_5×3.json", "json", "5×3 矩阵")];
    case "qa":            return [r("质检报告.json", "json", "质检")];
    case "final":         return [r("终审清单.md", "md", "发布许可")];
    case "publish":       return [r("发布计划.md", "md", "多平台")];
    case "analytics":     return [r("数据复盘.json", "json", "复盘 + 候选")];
    case "l1":
    case "l2":            return []; // S0/S3 config stages — no artifact files
    default:              return [r(`${stage.code}_产物.md`, "md", stage.subtitle)];
  }
}

/** 返回某阶段的产物文件元数据列表。ctx.stageId 必填(运行态注入)。 */
export function artifactFileMeta(stage: StageDef, ctx: ArtifactFileContext): ArtifactFile[] {
  const kind = stage.config.kind as string;
  return rawFiles(stage).map((raw, i) => ({
    artifactId: `${ctx.stageId}:${i}:${raw.fileName}`,
    stageId: ctx.stageId,
    nodeId: ctx.nodeId ?? ctx.stageId,
    kind,
    title: stage.title,
    fileName: raw.fileName,
    ext: raw.ext,
    icon: iconFor(raw.ext),
    meta: raw.meta,
    updatedAt: ctx.updatedAt,
  }));
}
