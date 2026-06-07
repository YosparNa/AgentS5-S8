"""Workflow / StageRun / RunEvent 领域类型(里程碑 2)。

只承载编排骨架所需的最小结构。S 编号为正式阶段标识(见 docs/20-domain-model.md、CLAUDE.md)。
不含评分/业务字段——那些留到各 stage 的真实实现阶段。
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


class StageStatus(str, Enum):
    pending = "pending"
    running = "running"
    awaiting_review = "awaiting_review"
    completed = "completed"
    failed = "failed"
    skipped = "skipped"


class WorkflowStatus(str, Enum):
    pending = "pending"
    running = "running"
    awaiting_review = "awaiting_review"
    completed = "completed"
    failed = "failed"


class EventKind(str, Enum):
    workflow_created = "workflow_created"
    workflow_started = "workflow_started"
    workflow_completed = "workflow_completed"
    workflow_failed = "workflow_failed"
    stage_started = "stage_started"
    stage_awaiting_review = "stage_awaiting_review"
    stage_approved = "stage_approved"
    stage_rejected = "stage_rejected"
    stage_completed = "stage_completed"
    stage_failed = "stage_failed"
    context_mounted = "context_mounted"
    artifact_created = "artifact_created"
    knowledge_candidate_created = "knowledge_candidate_created"
    knowledge_candidate_resolved = "knowledge_candidate_resolved"
    knowledge_item_created = "knowledge_item_created"


class CandidateStatus(str, Enum):
    pending = "pending"
    remembered = "remembered"
    session_only = "session_only"
    ignored = "ignored"


class StageDef(BaseModel):
    code: str           # S 编号(正式)
    name: str
    slug: str           # 实现名
    needs_review: bool
    in_chain: bool      # 是否在 S1→S2→S2.5 主链上


# MVP 阶段定义。S0=工作流引擎(本文件之外,不作为 stage_run);S3/S5-S17 不在 MVP。
STAGE_DEFS: list[StageDef] = [
    StageDef(code="S1", name="赛道分析", slug="track_analysis", needs_review=True, in_chain=True),
    StageDef(code="S2", name="对标发现", slug="competitor_discovery", needs_review=True, in_chain=True),
    StageDef(code="S2.5", name="爆款拆解", slug="viral_extraction", needs_review=False, in_chain=True),
    StageDef(code="S4", name="热点雷达", slug="hotspot_radar", needs_review=False, in_chain=False),
]

# 主链顺序(S4 独立,不在链上,里程碑 2 保持 pending)。
CHAIN: list[str] = ["S1", "S2", "S2.5"]

# 工作流类型(WorkflowRun.kind)。channel_intelligence=频道情报(L2,默认);video_production=视频生产(L3=mission)。
WORKFLOW_KIND_CHANNEL_INTELLIGENCE = "channel_intelligence"
WORKFLOW_KIND_VIDEO_PRODUCTION = "video_production"

# 视频生产(L3)阶段拓扑(S5–S17 + 终审,共 14 个),供 video_production workflow 建 stage_runs。
# ⚠ stage_code 必须与前端 wire 串 byte-for-byte 对齐(前端按 stage_code merge 运行态);
#   终审 wire code = "FINAL"(前端 lib/configWire.ts:wireCodeFor,final→"FINAL",其余=StageDef.code)。
# needs_review = S6/S8/S10/S11/S12/FINAL(docs/53 §4)。order 经 enumerate 给出,只需相对次序正确。
# 注:S5–S17 handler 尚未实装(Twy=S5–S8 / Zxd=S9–S15;cxan=S16/S17/终审);本表仅脚手架——
#   create_workflow 据此建 pending stage_runs + /api/missions 投影,真正运行待 handler 接入(见 docs/54 §5)。
STAGE_DEFS_L3: list[StageDef] = [
    StageDef(code="S5", name="选题", slug="topic", needs_review=False, in_chain=True),
    StageDef(code="S6", name="大纲", slug="outline", needs_review=True, in_chain=True),
    StageDef(code="S7", name="脚本", slug="script", needs_review=False, in_chain=True),
    StageDef(code="S8", name="对抗质疑", slug="adversarial", needs_review=True, in_chain=True),
    StageDef(code="S9", name="分镜", slug="storyboard", needs_review=False, in_chain=True),
    StageDef(code="S10", name="图像素材", slug="image", needs_review=True, in_chain=True),
    StageDef(code="S11", name="语音 TTS", slug="voice", needs_review=True, in_chain=True),
    StageDef(code="S12", name="字幕", slug="subtitle", needs_review=True, in_chain=True),
    StageDef(code="S13", name="剪辑", slug="edit", needs_review=False, in_chain=True),
    StageDef(code="S14", name="封面+标题", slug="cover", needs_review=False, in_chain=True),
    StageDef(code="S15", name="质检", slug="qa", needs_review=False, in_chain=True),
    StageDef(code="FINAL", name="人工终审", slug="final", needs_review=True, in_chain=True),
    StageDef(code="S16", name="运营发布", slug="publish", needs_review=False, in_chain=True),
    StageDef(code="S17", name="数据分析复盘", slug="analytics", needs_review=False, in_chain=True),
]


def stage_defs_for(kind: str) -> list[StageDef]:
    """按工作流类型返回阶段集。video_production=L3(S5–S17+终审);其余(含默认)=L2(S1/S2/S2.5/S4)。"""
    if kind == WORKFLOW_KIND_VIDEO_PRODUCTION:
        return STAGE_DEFS_L3
    return STAGE_DEFS


class StageRun(BaseModel):
    id: str
    workflow_id: str
    stage_code: str
    stage_name: str
    stage_slug: str
    order: int
    status: StageStatus = StageStatus.pending
    output_artifact: dict | None = None
    # S0 召回装配:跑本阶段前注入的频道记忆/规则/对标/爆款规律(见 docs/31-workflow-engine.md)。
    mounted_context: dict | None = None
    review_decision: str | None = None
    review_reason: str | None = None
    error: str | None = None
    started_at: str | None = None
    completed_at: str | None = None


class WorkflowRun(BaseModel):
    id: str
    channel_id: str | None = None
    # 创建该 workflow 的登录用户名(数据隔离);旧数据为 None → 对所有用户不可见。
    owner_id: str | None = None
    # 工作流类型(docs/53 §9、54 §2.1):channel_intelligence(频道情报,默认)| video_production(=mission)。
    kind: str = "channel_intelligence"
    status: WorkflowStatus = WorkflowStatus.pending
    current_stage: str | None = None
    # S 各阶段输入(mock 阶段:seed_keywords / platform / language 等)。
    input: dict = Field(default_factory=dict)
    created_at: str = Field(default_factory=now_iso)


class RunEvent(BaseModel):
    id: str
    workflow_id: str
    stage_code: str | None = None
    kind: EventKind
    message: str = ""
    payload: dict = Field(default_factory=dict)
    created_at: str = Field(default_factory=now_iso)


class KnowledgeCandidate(BaseModel):
    """待确认是否沉淀为长期知识的候选项(见 docs/21-memory-system.md、32 §5.3-bis)。"""
    id: str
    workflow_id: str
    channel_id: str | None = None
    stage_code: str | None = None
    source: str          # review_feedback | llm_summary | artifact_distillation | source_document | manual_note
    kind: str            # track | competitor | viral_pattern | rule | preference | imported ...
    scope: str = "channel"
    summary: str = ""
    payload: dict = Field(default_factory=dict)
    status: CandidateStatus = CandidateStatus.pending
    resolved_knowledge_id: str | None = None
    created_at: str = Field(default_factory=now_iso)
    resolved_at: str | None = None


class KnowledgeItem(BaseModel):
    """可复用知识(索引 + 精炼摘要层),不取代 typed 表(见 docs/32 §5.3)。"""
    id: str
    workflow_id: str | None = None
    channel_id: str | None = None
    scope: str = "channel"
    kind: str = "track"
    summary: str = ""
    body: dict = Field(default_factory=dict)
    ref_type: str = "none"      # track | competitor | viral_pattern | hotspot | none
    ref_id: str | None = None
    provenance_type: str = "review"   # artifact | source | review | manual
    provenance_id: str | None = None
    status: str = "active"      # active | archived
    importance: int = 0
    applied_count: int = 0
    created_by: str = "system"
    created_at: str = Field(default_factory=now_iso)


class Track(BaseModel):
    id: str
    workflow_id: str | None = None
    channel_id: str | None = None
    track_name: str
    seed_keywords: list[str] = Field(default_factory=list)
    expanded_keywords: list[str] = Field(default_factory=list)
    scores: dict = Field(default_factory=dict)
    verdict: str | None = None
    provenance_artifact_id: str | None = None
    status: str = "locked"
    created_at: str = Field(default_factory=now_iso)


class Competitor(BaseModel):
    id: str
    workflow_id: str | None = None
    channel_id: str | None = None
    competitor_channel_id: str
    title: str | None = None
    subs: int = 0
    tier: str | None = None
    score_total: float = 0
    source_path: str | None = None
    provenance_artifact_id: str | None = None
    status: str = "selected"
    created_at: str = Field(default_factory=now_iso)


class ViralPattern(BaseModel):
    id: str
    workflow_id: str | None = None
    channel_id: str | None = None
    cluster_id: str | None = None
    pattern_type: str | None = None
    summary: str = ""
    supporting_video_ids: list[str] = Field(default_factory=list)
    confidence: float = 0
    provenance_artifact_id: str | None = None
    status: str = "active"
    created_at: str = Field(default_factory=now_iso)


class Hotspot(BaseModel):
    id: str
    workflow_id: str | None = None
    channel_id: str | None = None
    source_hotspot_id: str | None = None
    source: str | None = None
    title: str | None = None
    opportunity_score: float = 0
    matched_keywords: list[str] = Field(default_factory=list)
    adapted_angle: str | None = None
    expires_at: str | None = None
    verdict: str | None = None
    provenance_artifact_id: str | None = None
    status: str = "active"
    created_at: str = Field(default_factory=now_iso)


class Channel(BaseModel):
    """频道(L2 实体);按 owner 隔离。workflow.channel_id 指向 Channel.id。

    stats(subs/videos/monthly_views)域内存扁平,API 投影时组装成嵌套 stats{}(对齐 docs/52 §5 C1)。
    """
    id: str
    owner_id: str | None = None
    name: str
    emoji: str | None = None
    platform: str = "youtube"
    tier: str | None = None
    status: str = "active"          # active | paused | locked | draft
    description: str = ""
    subs: int = 0
    videos: int = 0
    monthly_views: int = 0
    created_at: str = Field(default_factory=now_iso)


class ChannelSnapshot(BaseModel):
    id: str
    channel_id: str
    snapshot_date: str
    subs: int
    total_views: int
    video_count: int
    created_at: str


class VideoSnapshot(BaseModel):
    id: str
    video_id: str
    snapshot_date: str
    views: int
    likes: int
    comments: int
    created_at: str


class ModelCallLog(BaseModel):
    id: str
    workflow_id: str | None = None
    stage_code: str | None = None
    alias: str | None = None
    provider_name: str
    provider_type: str
    model: str | None = None
    task: str
    attempt: str
    status: str
    latency_ms: int
    input_tokens: int | None = None
    output_tokens: int | None = None
    error: str | None = None
    created_at: str
