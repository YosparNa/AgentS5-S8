// WorkbenchView — 1:1 还原 PROTO lines 2635–2967.
// 三列布局: ProbePanel | 中央工作台 | StudioPanel
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { useRun } from "@/store/runStore";
import { useUi } from "@/store/uiStore";
import { dataProvider } from "@/services/dataProvider";
import type { StageDef } from "@/types";
import { EditModeBanner } from "@/components/workbench/EditModeBanner";
import { FlowStrip } from "@/components/workbench/FlowStrip";
import { AgentStream } from "@/components/workbench/AgentStream";
import { SimulateButton } from "@/components/workbench/SimulateButton";
import { ProbePanel } from "@/components/workbench/ProbePanel";
import { StudioPanel } from "@/components/workbench/StudioPanel";

export function WorkbenchView() {
  const { wfId } = useParams<{ wfId: string }>();

  // Load run + nodes + stage defs on mount
  useEffect(() => {
    const r = useRun.getState();
    r.loadRun(wfId);
    r.loadNodes(wfId);
    r.loadStages();
  }, [wfId]);

  const editMode = useUi((s) => s.editMode);
  const openStage = useUi((s) => s.openStage);
  const run = useRun((s) => s.run);
  const nodes = useRun((s) => s.nodes);
  const currentNodeId = useRun((s) => s.currentNodeId);

  // Find the currently active node stageId for the "看 Agent 实时" button
  const activeNode = nodes.find((n) => run.nodes[n.nodeId]?.status === "active");
  const activeStageId = activeNode?.stageId ?? currentNodeId ?? "s9";

  // Current running stage label for the live status chip (via dataProvider)
  const [statusStage, setStatusStage] = useState<StageDef | undefined>();
  useEffect(() => {
    dataProvider.getStage(activeStageId).then(setStatusStage);
  }, [activeStageId]);

  // Command input echo state
  const [echoes, setEchoes] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const msg = inputVal.trim();
    if (!msg) return;
    setEchoes((prev) => [...prev, msg]);
    setInputVal("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="h-full flex overflow-hidden">
      {/* ── Left: ProbePanel ─────────────────────────────────────────────── */}
      <ProbePanel />

      {/* ── Middle: main workbench column ─────────────────────────────────── */}
      <section
        className={cn(
          "flex-1 flex flex-col bg-[#fafbfc] min-w-0 relative",
          editMode && "edit-mode"
        )}
      >
        {/* Edit mode banner */}
        <EditModeBanner />

        {/* Task header (PROTO 2726–2922) */}
        <div className="bg-white border-b border-gray-200 px-4 pt-3 pb-2 shrink-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-[16px] font-bold">Manus vs NotebookLM 长视频</h1>
                <span className="layer-pill layer-video text-[10px] font-bold px-1.5 py-0.5 rounded">
                  L3
                </span>
                <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1 h-1 bg-amber-500 rounded-full blink" />
                  {statusStage?.code ?? "S9"} · {statusStage?.title ?? "分镜"}中
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                YT 长视频 · 受众：中文独立开发者 ·{" "}
                <span className="text-indigo-600 cursor-pointer">长视频默认 17 阶段</span>
              </p>
            </div>

            <div className="flex gap-1.5">
              <button className="text-[11px] border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 flex items-center">
                <Icon.Pause size={9} className="mr-1" />
                暂停
              </button>
              <SimulateButton />
              <button
                onClick={() => openStage(activeStageId, true)}
                className="text-[11px] bg-indigo-600 text-white px-2.5 py-1 rounded hover:bg-indigo-700 flex items-center gap-1"
              >
                <Icon.Eye size={9} />
                看 Agent 实时
              </button>
            </div>
          </div>

          {/* FlowStrip inside the white header card */}
          <FlowStrip />
        </div>

        {/* Agent stream — scrollable */}
        <AgentStream extraUserBubbles={echoes} />

        {/* Command input bar — absolute bottom (PROTO 2958–2966) */}
        <div className="absolute bottom-4 left-6 right-6 z-10">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-4xl mx-auto">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent border-none focus:ring-0 resize-none px-3 py-2.5 text-[12px] min-h-[44px] outline-none"
              placeholder="对当前 Stage 发指令..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex gap-1">
                <button className="w-6 h-6 grid place-items-center rounded text-gray-400 hover:bg-gray-100">
                  <Icon.Paperclip size={11} />
                </button>
              </div>
              <button
                onClick={handleSend}
                className="bg-indigo-600 hover:bg-indigo-700 text-white w-6 h-6 rounded grid place-items-center"
              >
                <Icon.ArrowUp size={10} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Right: StudioPanel ────────────────────────────────────────────── */}
      <StudioPanel />
    </section>
  );
}
