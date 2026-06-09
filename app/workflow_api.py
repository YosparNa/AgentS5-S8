"""CreatorOS 前端 API 适配层
对接 workflowClient.ts 期望的端点，映射到现有 S5-S8 agent 函数。
"""

import json
import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.agents import s5_topic, s6_outline, s7_script, s8_adversarial

router = APIRouter()

# ===== 内存存储 =====

_sessions: dict[str, dict] = {}  # session_id -> user info
_workflows: dict[str, dict] = {}  # wf_id -> workflow data

STAGE_DEFS = [
    {"code": "S5", "name": "选题", "slug": "topic", "order": 1, "needs_review": False},
    {"code": "S6", "name": "大纲", "slug": "outline", "order": 2, "needs_review": True},
    {"code": "S7", "name": "脚本", "slug": "script", "order": 3, "needs_review": False},
    {"code": "S8", "name": "对抗审核", "slug": "adversarial", "order": 4, "needs_review": True},
]


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _gen_id(prefix="wf"):
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def _make_artifact(stage_code: str, slug: str, data) -> dict:
    """将 agent 返回的数据包装为 artifact 格式。"""
    base = {
        "artifact_id": _gen_id("art"),
        "artifact_type": {
            "topic": "topic_candidates",
            "outline": "outline",
            "script": "script",
            "adversarial": "adversarial_review",
        }.get(slug, slug),
        "produced_at": _now_iso(),
        "stage_code": stage_code,
    }
    if stage_code == "S5":
        topics = data.get("topics", []) if isinstance(data, dict) else []
        base["topics"] = [
            {"rank": t.get("rank", i + 1), "title": t.get("title", ""), "score": t.get("score", 0), "unique": t.get("unique", ""), "locked": t.get("locked", False)}
            for i, t in enumerate(topics)
        ]
    elif stage_code == "S6":
        outline = data.get("outline", []) if isinstance(data, dict) else []
        base["outline"] = [
            {
                "ch": ch.get("title", f"第{ch.get('chapter', i+1)}章"),
                "dur": ch.get("duration", ""),
                "tension": ch.get("tension", 5),
                "hook": ch.get("hook", ""),
                "crisis": ch.get("crisis", False),
                "description": ch.get("description", ""),
                "purpose": ch.get("purpose", ""),
            }
            for i, ch in enumerate(outline)
        ]
    elif stage_code == "S7":
        text = data if isinstance(data, str) else str(data)
        base["excerpt"] = text[:200]
        base["body_md"] = text
        base["word_count"] = len(text)
    elif stage_code == "S8":
        roles_raw = data.get("roles", []) if isinstance(data, dict) else []
        role_key_map = {"杠精": "nitpicker", "同行": "peer", "小白": "novice", "老粉": "fan", "合规": "compliance"}
        base["roles"] = [
            {"role_key": role_key_map.get(r.get("name", ""), r.get("name", "")), "name": r.get("name", ""), "issues": len(r.get("issues", [])), "note": r.get("summary", "")[:100], "avatar": r.get("emoji", "")}
            for r in roles_raw
        ]
        base["average_score"] = data.get("average_score", 0)
    return base


def _make_workflow_view(wf: dict) -> dict:
    """构造前端期望的 WorkflowView 响应。"""
    return {
        "workflow": {
            "id": wf["id"],
            "channel_id": wf.get("channel_id"),
            "status": wf["status"],
            "current_stage": wf.get("current_stage"),
            "kind": wf.get("kind", "video_production"),
            "input": wf.get("input", {}),
            "created_at": wf["created_at"],
        },
        "stages": [
            {
                "id": sr["id"],
                "stage_code": sr["code"],
                "stage_name": sr["name"],
                "stage_slug": sr["slug"],
                "order": sr["order"],
                "status": sr["status"],
                "output_artifact": sr.get("artifact"),
                "error": sr.get("error"),
                "started_at": sr.get("started_at"),
                "completed_at": sr.get("completed_at"),
            }
            for sr in wf["stages"]
        ],
    }


# ===== Auth =====

@router.post("/api/auth/login")
async def auth_login(body: dict):
    username = body.get("username", "admin")
    sid = _gen_id("sess")
    _sessions[sid] = {"username": username}
    return {"username": username}


@router.post("/api/auth/logout")
async def auth_logout():
    return {"ok": True}


@router.get("/api/auth/me")
async def auth_me(request: Request):
    return {"username": "admin"}


# ===== Workflow CRUD =====

class CreateWorkflowRequest(BaseModel):
    seed_keywords: Optional[list] = None
    platform: Optional[str] = None
    language: Optional[str] = None
    kind: Optional[str] = "video_production"
    title: Optional[str] = None
    user_data: Optional[str] = ""
    channel_desc: Optional[str] = ""


@router.post("/api/workflows")
async def create_workflow(req: CreateWorkflowRequest):
    wf_id = _gen_id("wf")
    stages = []
    for sd in STAGE_DEFS:
        stages.append({
            "id": _gen_id("sr"),
            "code": sd["code"],
            "name": sd["name"],
            "slug": sd["slug"],
            "order": sd["order"],
            "status": "pending",
            "artifact": None,
            "error": None,
            "started_at": None,
            "completed_at": None,
            "needs_review": sd["needs_review"],
            "config": {},
        })
    # S5 默认 active
    stages[0]["status"] = "active"

    wf = {
        "id": wf_id,
        "channel_id": None,
        "status": "running",
        "current_stage": "S5",
        "kind": req.kind or "video_production",
        "input": {
            "user_data": req.user_data or "",
            "channel_desc": req.channel_desc or "",
            "seed_keywords": req.seed_keywords or [],
            "platform": req.platform or "",
            "language": req.language or "",
            "title": req.title or "",
        },
        "created_at": _now_iso(),
        "stages": stages,
        "_state": None,  # PipelineState 实例，运行时创建
    }
    _workflows[wf_id] = wf
    return _make_workflow_view(wf)


@router.get("/api/workflows")
async def list_workflows():
    return {"workflows": [_make_workflow_view(wf)["workflow"] for wf in _workflows.values()]}


@router.get("/api/workflows/{wf_id}")
async def get_workflow(wf_id: str):
    wf = _workflows.get(wf_id)
    if not wf:
        return {"detail": "Not found"}, 404
    return _make_workflow_view(wf)


# ===== Stage Run/Approve/Reject =====

def _get_stage(wf: dict, code: str):
    for s in wf["stages"]:
        if s["code"] == code:
            return s
    return None


def _get_agent_fn(code: str):
    return {
        "S5": s5_topic.run,
        "S6": s6_outline.run,
        "S7": s7_script.run,
        "S8": s8_adversarial.run,
    }.get(code)


async def _run_agent(wf: dict, stage: dict, config_override: dict = None):
    """运行一个阶段的 agent。"""
    from app.pipeline import PipelineState, PipelineStatus

    # 初始化或复用 PipelineState
    if not wf.get("_state"):
        ps = PipelineState()
        ps.user_data = wf["input"].get("user_data", "")
        ps.channel_desc = wf["input"].get("channel_desc", "")
        wf["_state"] = ps
    ps = wf["_state"]

    code = stage["code"]
    agent_fn = _get_agent_fn(code)
    if not agent_fn:
        raise ValueError(f"No agent for {code}")

    # 设置配置
    cfg = {**stage.get("config", {}), **(config_override or {})}
    ps.stage_config = cfg

    # 前置依赖检查
    if code == "S6" and not ps.selected_topic:
        s5_stage = _get_stage(wf, "S5")
        if s5_stage and s5_stage.get("artifact"):
            topics = s5_stage["artifact"].get("topics", [])
            if topics:
                ps.selected_topic = {"title": topics[0].get("title", ""), "angle": topics[0].get("unique", ""), "score": topics[0].get("score", 0)}
    if code == "S7" and not ps.outline_data:
        s6_stage = _get_stage(wf, "S6")
        if s6_stage and s6_stage.get("artifact"):
            ps.outline_data = {"outline": [{"chapter": i+1, "title": ch.get("ch", ""), "duration": ch.get("dur", ""), "tension": ch.get("tension", 5), "hook": ch.get("hook", ""), "crisis": ch.get("crisis", False)} for i, ch in enumerate(s6_stage["artifact"].get("outline", []))]}
    if code == "S8" and not ps.script_data:
        s7_stage = _get_stage(wf, "S7")
        if s7_stage and s7_stage.get("artifact"):
            ps.script_data = s7_stage["artifact"].get("body_md", "")

    stage["status"] = "running"
    stage["started_at"] = _now_iso()

    result = await asyncio.to_thread(agent_fn, ps)

    # 保存结果到 PipelineState
    if code == "S5":
        ps.topic_data = result
        ps.selected_topic = result.get("topics", [{}])[0] if result.get("topics") else None
    elif code == "S6":
        ps.outline_data = result
    elif code == "S7":
        ps.script_data = result if isinstance(result, str) else str(result)
    elif code == "S8":
        ps.adversarial_data = result

    artifact = _make_artifact(code, stage["slug"], result)
    stage["artifact"] = artifact
    stage["completed_at"] = _now_iso()

    if stage.get("needs_review"):
        stage["status"] = "awaiting_review"
        wf["status"] = "awaiting_review"
        wf["current_stage"] = code
    else:
        stage["status"] = "completed"
        # 自动推进到下一阶段
        _advance_workflow(wf, code)

    return artifact


def _advance_workflow(wf: dict, completed_code: str):
    """完成一个阶段后自动推进。"""
    codes = [s["code"] for s in STAGE_DEFS]
    idx = codes.index(completed_code)
    if idx + 1 < len(codes):
        next_code = codes[idx + 1]
        next_stage = _get_stage(wf, next_code)
        if next_stage:
            next_stage["status"] = "active"
            wf["current_stage"] = next_code
            wf["status"] = "running"
    else:
        wf["status"] = "completed"
        wf["current_stage"] = None


@router.post("/api/workflows/{wf_id}/stages/{code}/run")
async def run_stage(wf_id: str, code: str, body: dict = None):
    wf = _workflows.get(wf_id)
    if not wf:
        return {"detail": "Not found"}, 404
    stage = _get_stage(wf, code)
    if not stage:
        return {"detail": f"Stage {code} not found"}, 404
    try:
        config_override = (body or {}).get("config", {})
        await _run_agent(wf, stage, config_override)
        return _make_workflow_view(wf)
    except Exception as e:
        stage["status"] = "failed"
        stage["error"] = str(e)
        stage["completed_at"] = _now_iso()
        return _make_workflow_view(wf)


@router.post("/api/workflows/{wf_id}/run")
async def run_workflow(wf_id: str):
    """运行下一个待执行阶段。"""
    wf = _workflows.get(wf_id)
    if not wf:
        return {"detail": "Not found"}, 404
    # 找到当前 active 阶段
    for stage in wf["stages"]:
        if stage["status"] == "active":
            try:
                await _run_agent(wf, stage)
                return _make_workflow_view(wf)
            except Exception as e:
                stage["status"] = "failed"
                stage["error"] = str(e)
                return _make_workflow_view(wf)
    return _make_workflow_view(wf)


@router.post("/api/workflows/{wf_id}/stages/{code}/approve")
async def approve_stage(wf_id: str, code: str, body: dict = None):
    wf = _workflows.get(wf_id)
    if not wf:
        return {"detail": "Not found"}, 404
    stage = _get_stage(wf, code)
    if not stage:
        return {"detail": f"Stage {code} not found"}, 404
    stage["status"] = "completed"
    _advance_workflow(wf, code)
    return _make_workflow_view(wf)


@router.post("/api/workflows/{wf_id}/stages/{code}/reject")
async def reject_stage(wf_id: str, code: str, body: dict = None):
    wf = _workflows.get(wf_id)
    if not wf:
        return {"detail": "Not found"}, 404
    stage = _get_stage(wf, code)
    if not stage:
        return {"detail": f"Stage {code} not found"}, 404

    rollback_to = (body or {}).get("rollback_to")

    if rollback_to:
        # 验证 rollback_to 只能是 S5/S6/S7
        valid_targets = {"S5", "S6", "S7"}
        if rollback_to not in valid_targets:
            return {"detail": f"Invalid rollback_to: {rollback_to}. Must be one of S5, S6, S7"}, 400

        # 回滚：清空目标阶段及之后所有阶段的 artifact
        codes = [s["code"] for s in STAGE_DEFS]
        start_idx = codes.index(rollback_to)
        end_idx = codes.index(code)
        for i in range(start_idx, end_idx + 1):
            s = _get_stage(wf, codes[i])
            if s:
                s["status"] = "pending"
                s["artifact"] = None
                s["error"] = None
                s["started_at"] = None
                s["completed_at"] = None
        # 将目标阶段设为 active
        target_stage = _get_stage(wf, rollback_to)
        if target_stage:
            target_stage["status"] = "active"
        wf["current_stage"] = rollback_to
        wf["status"] = "running"
    else:
        # 普通驳回：只重置当前阶段
        stage["status"] = "pending"
        stage["artifact"] = None
        stage["error"] = (body or {}).get("reason", "Rejected")
        stage["started_at"] = None
        stage["completed_at"] = None
        wf["status"] = "running"
        wf["current_stage"] = code

    return _make_workflow_view(wf)


# ===== SSE =====

@router.get("/api/workflows/{wf_id}/events/stream")
async def sse_stream(wf_id: str):
    """SSE 实时事件流。"""
    async def event_generator():
        yield f"data: {json.dumps({'type': 'connected', 'workflow_id': wf_id})}\n\n"
        while True:
            await asyncio.sleep(30)
            yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
