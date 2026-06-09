// FileModal — Task D2d.
// Opens when activeModal === 'file'. Shows artifact file metadata in a toolbar,
// then dispatches body content:
//   - MEDIA kinds (image/voice/subtitle) → custom mock previews
//   - DOCUMENT kinds → reuses <OutputTab stage={stage} /> (same renderer as the drawer)
// Overlay uses .modal-mask / .modal-mask.show (z-50), stacks above the drawer (z-40).
import { useState, useEffect } from "react";
import type { StageDef } from "@/types";
import { useUi } from "@/store/uiStore";
import { useRun } from "@/store/runStore";
import { dataProvider } from "@/services/dataProvider";
import { artifactFileMeta } from "@/lib/artifactFileMeta";
import type { ArtifactFile } from "@/lib/artifactFileMeta";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { OutputTab } from "@/components/drawer/OutputTab";

// ── Icon dispatcher for file ext icons ────────────────────────────────────────

function FileIcon({ name, size = 14 }: { name: string; size?: number }) {
  const C = (Icon as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
  if (!C) return <Icon.FileText size={size} />;
  return <C size={size} />;
}

// ── Media preview components ───────────────────────────────────────────────────

/** S10 分镜图 — 4-column thumbnail grid */
function ImagePreview() {
  const tiles = Array.from({ length: 12 }, (_, i) => `IMG-${String(i + 1).padStart(2, "0")}`);
  return (
    <div className="p-4">
      <div className="grid grid-cols-4 gap-2">
        {tiles.map((label) => (
          <div
            key={label}
            className="aspect-video rounded bg-gradient-to-br from-gray-200 to-gray-300 flex items-end p-1"
          >
            <span className="mono text-[9px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-3 text-center">
        38 镜头 · 图像库占位（后端接入后替换真实图像）
      </p>
    </div>
  );
}

/** S11 配音 — fake audio player + waveform bars */
const WAVE_HEIGHTS = [16, 24, 12, 30, 22, 18, 28, 14, 26, 20, 32, 16, 24, 12, 28, 22, 18, 30, 14, 26, 20, 16, 24, 12, 30];

function VoicePreview() {
  return (
    <div className="p-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4">
        <button className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 hover:bg-indigo-700 transition-colors">
          <Icon.Play size={14} />
        </button>
        {/* Fake waveform */}
        <div className="flex-1 flex items-center gap-[2px] h-10">
          {WAVE_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-sm bg-indigo-400 opacity-70"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <span className="mono text-[11px] text-gray-500 shrink-0">3:42</span>
      </div>
      <p className="text-[11px] text-gray-400 mt-3 text-center">
        配音_zh.mp3 · 普通话 · 音频占位（后端接入后播放真实音频）
      </p>
    </div>
  );
}

/** S12 字幕 — SRT-style subtitle list */
const MOCK_SUBS = [
  { tc: "00:00 → 00:04", text: "大家好，欢迎来到今天的 AI 工具深度评测。" },
  { tc: "00:04 → 00:08", text: "今天我们要聊的是最近爆火的一款智能体框架。" },
  { tc: "00:08 → 00:13", text: "它能在 5 分钟内完成原本需要 2 小时的内容生产流程。" },
  { tc: "00:13 → 00:17", text: "我亲自测试了 30 个场景，结果令我非常惊讶。" },
  { tc: "00:17 → 00:21", text: "首先，我们来看第一个核心功能——自动脚本生成。" },
  { tc: "00:21 → 00:26", text: "只需输入一个主题，系统就能产出完整的分镜和旁白。" },
];

function SubtitlePreview() {
  return (
    <div className="p-4 space-y-2">
      {MOCK_SUBS.map(({ tc, text }, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-lg px-3 py-2 flex gap-3 items-start">
          <span className="mono text-[10px] text-indigo-500 shrink-0 pt-0.5">{tc}</span>
          <span className="text-[12px] text-gray-700">{text}</span>
        </div>
      ))}
      <p className="text-[11px] text-gray-400 mt-2 text-center">
        字幕.srt · 6 条预览（占位）
      </p>
    </div>
  );
}

// ── File header row (single file entry) ──────────────────────────────────────

function FileRow({ file }: { file: ArtifactFile }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
      <FileIcon name={file.icon} size={13} />
      <span className="mono text-[11px] text-gray-700 font-medium">{file.fileName}</span>
      <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 rounded px-1.5 py-0.5 font-bold uppercase">
        {file.ext}
      </span>
      <span className="text-[10px] text-gray-400 ml-1">{file.meta}</span>
    </div>
  );
}

// ── Body dispatcher ────────────────────────────────────────────────────────────

function ModalBody({ stage }: { stage: StageDef }) {
  const kind = stage.config.kind as string;

  if (kind === "image") return <ImagePreview />;
  if (kind === "voice") return <VoicePreview />;
  if (kind === "subtitle") return <SubtitlePreview />;

  // All document kinds — reuse the same container-agnostic artifact renderer
  return <OutputTab stage={stage} />;
}

// ── FileModal ─────────────────────────────────────────────────────────────────

export function FileModal() {
  const activeModal = useUi((s) => s.activeModal);
  const fileStageId = useUi((s) => s.fileStageId);
  const closeModal = useUi((s) => s.closeModal);
  const producedAt = useRun((s) => (fileStageId ? s.run.nodes[fileStageId]?.producedAt : undefined));
  // 优先从 runStore.stages 读取（始终是最新的，包含 _syncStages 写入的数据）
  const runStages = useRun((s) => s.stages);
  const stageVersion = useRun((s) => s.stageVersion);

  const open = activeModal === "file" && !!fileStageId;

  const [stage, setStage] = useState<StageDef | undefined>(undefined);

  useEffect(() => {
    if (fileStageId) {
      // 先从 runStore 读（最快，数据最新）
      const fromStore = runStages[fileStageId];
      if (fromStore && fromStore.output && Object.keys(fromStore.output).length > 0) {
        setStage(fromStore);
      } else {
        // fallback: 从 dataProvider 读
        dataProvider.getStage(fileStageId).then(setStage);
      }
    }
  }, [fileStageId, stageVersion, runStages]);

  if (!open || !stage || !fileStageId) return null;

  const files: ArtifactFile[] = artifactFileMeta(stage, { stageId: fileStageId, updatedAt: producedAt });
  const primaryFile = files[0];

  return (
    <div
      className={cn("modal-mask", "show")}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      {/* Card */}
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-xl">

        {/* ── Toolbar / Header ── */}
        <div className="px-5 py-3 border-b border-gray-200 shrink-0">
          {/* Top row: stage code + title + close */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="mono text-[10px] text-gray-400">{stage.code}</span>
                <span className="text-[10px] text-gray-400">·</span>
                <span className="text-[10px] text-gray-400">{stage.subtitle}</span>
                {primaryFile?.updatedAt && (
                  <>
                    <span className="text-[10px] text-gray-400">·</span>
                    <span className="text-[10px] text-gray-400">更新 {primaryFile.updatedAt.slice(0, 10)}</span>
                  </>
                )}
              </div>
              <h3 className="text-[14px] font-bold text-gray-900 leading-tight">
                {primaryFile ? primaryFile.fileName : stage.title}
              </h3>
            </div>
            <button
              onClick={closeModal}
              className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center shrink-0 text-gray-500"
            >
              <Icon.Close size={14} />
            </button>
          </div>

          {/* File rows */}
          {files.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {files.map((f) => (
                <FileRow key={f.fileName} file={f} />
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-gray-400">此阶段暂无产物文件</div>
          )}

          {/* Action buttons row */}
          <div className="flex items-center gap-2 mt-2">
            <button className="flex items-center gap-1.5 text-[11px] text-gray-500 border border-gray-200 rounded px-2.5 py-1 hover:bg-gray-50 transition-colors">
              <Icon.Copy size={11} />
              复制
            </button>
            <button className="flex items-center gap-1.5 text-[11px] text-gray-500 border border-gray-200 rounded px-2.5 py-1 hover:bg-gray-50 transition-colors">
              <Icon.Download size={11} />
              下载
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <ModalBody stage={stage} />
        </div>

      </div>
    </div>
  );
}
