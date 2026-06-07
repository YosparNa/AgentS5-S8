"""FastAPI 主入口（V1 API Spec，无旧兼容）"""

import json
import asyncio
from datetime import datetime, timezone
from typing import Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.pipeline import PipelineState, PipelineStatus, Stage, RollbackEvent, evaluate_adversarial_result
from app.agents import s5_topic, s6_outline, s7_script, s8_adversarial

app = FastAPI(title="视频剪辑流 Agent", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

state = PipelineState()
ws_connections: list[WebSocket] = []


# ===== 统一响应 =====

def ok(data: Any = None) -> dict:
    return {"success": True, "data": data, "error": None, "timestamp": datetime.now(timezone.utc).isoformat()}

def fail(code: str, message: str) -> dict:
    return {"success": False, "data": None, "error": {"code": code, "message": message}, "timestamp": datetime.now(timezone.utc).isoformat()}

async def broadcast(event: str, data: Any = None):
    text = json.dumps({"event": event, "data": data}, ensure_ascii=False)
    dead = []
    for ws in ws_connections:
        try:
            await ws.send_text(text)
        except Exception:
            dead.append(ws)
    for ws in dead:
        ws_connections.remove(ws)


# ===== Pydantic 请求模型 =====

class InitRequest(BaseModel):
    userData: str
    channelDesc: str = ""

class StageConfig(BaseModel):
    config: dict = {}

class S5GenerateRequest(BaseModel):
    topic: str = ""
    language: str = "zh"
    count: int = 5
    config: dict = {}

class S5SelectRequest(BaseModel):
    candidateId: int

class S6GenerateRequest(BaseModel):
    candidateId: int = 0
    config: dict = {}

class S6RegenChapterRequest(BaseModel):
    chapterIndex: int
    feedback: str = ""

class S7GenerateRequest(BaseModel):
    outline: dict = {}
    config: dict = {}

class S8RunRequest(BaseModel):
    script: str = ""
    publish: bool = False
    config: dict = {}


# ===== 页面路由 =====

@app.get("/")
async def index():
    return FileResponse("frontend/static/index.html")

@app.get("/09index.html")
async def index09():
    import glob
    files = glob.glob("frontend/09index*.html")
    if files:
        return FileResponse(files[0], media_type="text/html")
    return FileResponse("frontend/static/index.html")


# ===== API 路由 =====

@app.get("/api/state")
async def get_state():
    return ok(state.to_dict())


@app.post("/api/init")
async def init_pipeline(req: InitRequest):
    global state
    state = PipelineState()
    state.user_data = req.userData
    state.channel_desc = req.channelDesc
    state.status = PipelineStatus.AWAITING_USER
    state.current_stage = Stage.S5_TOPIC
    state.add_history("init", "流程初始化")
    await broadcast("state_update", state.to_dict())
    return ok({"currentStage": "s5", "status": "awaiting_user"})


async def _run_stage(config, agent_fn, stage_id, label, save_fn):
    state.stage_config = config
    state.status = PipelineStatus.RUNNING
    state.add_history(f"{stage_id}_generate", f"开始生成{label}...")
    await broadcast("stage_start", {"stage": stage_id, "message": f"正在生成{label}..."})
    try:
        result = await asyncio.to_thread(agent_fn, state)
        save_fn(result)
        state.status = PipelineStatus.AWAITING_USER
        state.add_history(f"{stage_id}_done", f"{label}完成")
        await broadcast("stage_done", {"stage": stage_id, "data": result})
        await broadcast("state_update", state.to_dict())
        return ok(result)
    except Exception as e:
        state.status = PipelineStatus.IDLE
        await broadcast("error", {"stage": stage_id, "message": str(e)})
        return fail("AI_SERVICE_ERROR", str(e))


@app.post("/api/s5/generate")
async def s5_generate(req: S5GenerateRequest = S5GenerateRequest()):
    def save(r):
        state.topic_data = r
        state.topic_version += 1
    return await _run_stage(req.config, s5_topic.run, "s5", "选题", save)


@app.post("/api/s5/select")
async def s5_select(req: S5SelectRequest):
    topics = state.topic_data.get("topics", []) if state.topic_data else []
    if req.candidateId < 0 or req.candidateId >= len(topics):
        return fail("INVALID_INPUT", "无效的选题索引")
    state.selected_topic = topics[req.candidateId]
    state.current_stage = Stage.S6_OUTLINE
    state.add_history("s5_select", f"锁定选题 #{req.candidateId + 1}: {state.selected_topic.get('title', '')}")
    await broadcast("state_update", state.to_dict())
    return ok({"selectedId": req.candidateId, "title": state.selected_topic.get("title", "")})


@app.post("/api/s6/generate")
async def s6_generate(req: S6GenerateRequest = S6GenerateRequest()):
    if not state.selected_topic:
        return fail("INVALID_INPUT", "请先选择选题")
    def save(r):
        state.outline_data = r
        state.outline_version += 1
    return await _run_stage(req.config, s6_outline.run, "s6", "大纲", save)


@app.post("/api/s6/confirm")
async def s6_confirm():
    if not state.outline_data:
        return fail("INVALID_INPUT", "请先生成大纲")
    state.current_stage = Stage.S7_SCRIPT
    state.add_history("s6_confirm", "大纲确认")
    await broadcast("state_update", state.to_dict())
    return ok({"currentStage": "s7"})


@app.post("/api/s6/regen-chapter")
async def s6_regen_chapter(req: S6RegenChapterRequest):
    if not state.outline_data or not state.outline_data.get("outline"):
        return fail("INVALID_INPUT", "请先生成大纲")
    outline = state.outline_data["outline"]
    if req.chapterIndex < 0 or req.chapterIndex >= len(outline):
        return fail("INVALID_INPUT", "无效的章节索引")
    try:
        new_chapter = await asyncio.to_thread(
            s6_outline.regen_chapter, state, outline[req.chapterIndex], req.chapterIndex, len(outline), req.feedback
        )
        outline[req.chapterIndex] = new_chapter
        state.outline_version += 1
        await broadcast("state_update", state.to_dict())
        return ok({"chapter": new_chapter})
    except Exception as e:
        return fail("AI_SERVICE_ERROR", str(e))


@app.post("/api/s7/generate")
async def s7_generate(req: S7GenerateRequest = S7GenerateRequest()):
    if not state.outline_data:
        return fail("INVALID_INPUT", "请先生成大纲")
    def save(r):
        state.script_data = r.get("body_md", "")
        state.script_version += 1
    return await _run_stage(req.config, s7_script.run, "s7", "脚本", save)


@app.post("/api/s7/confirm")
async def s7_confirm():
    if not state.script_data:
        return fail("INVALID_INPUT", "请先生成脚本")
    state.current_stage = Stage.S8_ADVERSARIAL
    state.add_history("s7_confirm", "脚本确认")
    await broadcast("state_update", state.to_dict())
    return ok({"currentStage": "s8"})


@app.post("/api/s8/run")
async def s8_run(req: S8RunRequest = S8RunRequest()):
    if not state.script_data:
        return fail("INVALID_INPUT", "请先生成脚本")
    state.stage_config = req.config
    state.status = PipelineStatus.RUNNING
    state.add_history("s8_run", "开始 5 角色对抗审核...")
    await broadcast("stage_start", {"stage": "s8", "message": "5 个角色正在并行审核..."})

    try:
        result = await asyncio.to_thread(s8_adversarial.run, state)
        state.adversarial_data = result
        state.adversarial_version += 1
        await broadcast("stage_done", {"stage": "s8", "data": result})

        decision, detail = evaluate_adversarial_result(result)
        state.add_history("s8_evaluate", f"判定: {decision}")

        rollback_target = None
        rollback_reason = None

        if decision == "pass":
            state.status = PipelineStatus.COMPLETED
            state.add_history("pipeline_done", "全部通过")
            await broadcast("completed", {"detail": detail})
        elif decision == "rollback_s7":
            state.status = PipelineStatus.ROLLBACK
            rb = RollbackEvent(Stage.S8_ADVERSARIAL, Stage.S7_SCRIPT, detail.get("reason", ""), detail.get("scores"))
            state.rollbacks.append(rb)
            old_script = state.script_data
            state.script_data = None
            state.current_stage = Stage.S7_SCRIPT
            rollback_target = "s7"
            rollback_reason = detail.get("reason", "")
            state.add_history("rollback_s7", rollback_reason)
            await broadcast("rollback", {"from": "s8", "to": "s7", "reason": rollback_reason})
            feedback = json.dumps(result, ensure_ascii=False)
            try:
                new_result = await asyncio.to_thread(s7_script.re_run_with_feedback, state, feedback, old_script)
                state.script_data = new_result.get("body_md", "")
                state.script_version += 1
                state.status = PipelineStatus.AWAITING_USER
                state.add_history("s7_redone", f"脚本修补完成")
            except Exception as e:
                state.status = PipelineStatus.AWAITING_USER
                await broadcast("error", {"stage": "s7", "message": str(e)})
        else:
            state.status = PipelineStatus.ROLLBACK
            rb = RollbackEvent(Stage.S8_ADVERSARIAL, Stage.S5_TOPIC, detail.get("reason", ""), detail.get("scores"))
            state.rollbacks.append(rb)
            state.topic_data = None
            state.selected_topic = None
            state.outline_data = None
            state.script_data = None
            state.current_stage = Stage.S5_TOPIC
            rollback_target = "s5"
            rollback_reason = detail.get("reason", "")
            state.add_history("rollback_s5", rollback_reason)
            await broadcast("rollback", {"from": "s8", "to": "s5", "reason": rollback_reason})
            feedback = json.dumps(result, ensure_ascii=False)
            try:
                new_topics = await asyncio.to_thread(s5_topic.re_run_with_feedback, state, feedback)
                state.topic_data = new_topics
                state.topic_version += 1
                state.status = PipelineStatus.AWAITING_USER
                state.add_history("s5_redone", "选题重新生成")
            except Exception as e:
                state.status = PipelineStatus.AWAITING_USER
                await broadcast("error", {"stage": "s5", "message": str(e)})

        await broadcast("state_update", state.to_dict())
        return ok({
            "artifact_id": result.get("artifact_id"),
            "artifact_type": "adversarial_review",
            "stage_code": "S8",
            "produced_at": result.get("produced_at"),
            "runId": f"run_{state.id}",
            "decision": decision,
            "averageScore": result.get("average_score", 0),
            "roles": result.get("roles", []),
            "rollbackTarget": rollback_target,
            "rollbackReason": rollback_reason,
        })
    except Exception as e:
        state.status = PipelineStatus.IDLE
        await broadcast("error", {"stage": "s8", "message": str(e)})
        return fail("AI_SERVICE_ERROR", str(e))


# ===== WebSocket =====

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    ws_connections.append(ws)
    try:
        await ws.send_text(json.dumps({"event": "connected", "data": state.to_dict()}, ensure_ascii=False))
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if ws in ws_connections:
            ws_connections.remove(ws)
