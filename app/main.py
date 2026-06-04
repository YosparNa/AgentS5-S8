"""FastAPI 主入口：路由 + WebSocket 实时推送"""

import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.pipeline import PipelineState, PipelineStatus, Stage, RollbackEvent, evaluate_adversarial_result
from app.agents import s5_topic, s6_outline, s7_script, s8_adversarial

app = FastAPI(title="视频剪辑流 Agent")

# CORS：允许本地文件和 localhost 访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

# 全局状态（单用户演示用）
state = PipelineState()

# WebSocket 连接管理
ws_connections: list[WebSocket] = []


async def broadcast(msg: dict):
    """向所有连接的客户端广播消息。"""
    text = json.dumps(msg, ensure_ascii=False)
    dead = []
    for ws in ws_connections:
        try:
            await ws.send_text(text)
        except Exception:
            dead.append(ws)
    for ws in dead:
        ws_connections.remove(ws)


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
    return state.to_dict()


class InitRequest(BaseModel):
    user_data: str
    channel_desc: str = ""


class StageConfig(BaseModel):
    """阶段配置参数，来自前端配置面板。"""
    config: dict = {}


@app.post("/api/init")
async def init_pipeline(req: InitRequest):
    """初始化流程，设置用户数据和频道定位。"""
    global state
    state = PipelineState()
    state.user_data = req.user_data
    state.channel_desc = req.channel_desc
    state.status = PipelineStatus.AWAITING_USER
    state.current_stage = Stage.S5_TOPIC
    state.add_history("init", "流程初始化，准备进入 S5 选题")
    await broadcast({"type": "state_update", "data": state.to_dict()})
    return {"ok": True, "state": state.to_dict()}


async def _run_stage(config, agent_fn, stage_id, label, count_fn, save_fn):
    """S5/S6/S7 公共路由：设置配置→运行Agent→保存结果→广播。"""
    state.stage_config = config
    state.status = PipelineStatus.RUNNING
    state.add_history(f"{stage_id}_generate", f"开始生成{label}...")
    await broadcast({"type": "stage_start", "stage": stage_id, "message": f"正在生成{label}..."})
    try:
        result = await asyncio.to_thread(agent_fn, state)
        save_fn(result)
        state.status = PipelineStatus.AWAITING_USER
        state.add_history(f"{stage_id}_done", f"{label} {count_fn(result)}")
        await broadcast({"type": "stage_done", "stage": stage_id, "data": result})
        await broadcast({"type": "state_update", "data": state.to_dict()})
        return {"ok": True, "data": result}
    except Exception as e:
        state.status = PipelineStatus.IDLE
        await broadcast({"type": "error", "stage": stage_id, "message": str(e)})
        return {"ok": False, "error": str(e)}


@app.post("/api/s5/generate")
async def s5_generate(req: StageConfig = StageConfig()):
    """S5：生成候选选题。"""
    def save(r):
        state.topic_data = r; state.topic_version += 1
    return await _run_stage(req.config, s5_topic.run, "s5", "选题",
                            lambda r: len(r.get('topics', [])), save)


class SelectTopicRequest(BaseModel):
    index: int  # 0-based


@app.post("/api/s5/select")
async def s5_select(req: SelectTopicRequest):
    """S5：用户选择一个选题。"""
    topics = state.topic_data.get("topics", [])
    if req.index < 0 or req.index >= len(topics):
        return {"ok": False, "error": "无效的选题索引"}
    state.selected_topic = topics[req.index]
    state.current_stage = Stage.S6_OUTLINE
    state.add_history("s5_select", f"锁定选题 #{req.index + 1}: {state.selected_topic.get('title', '')}")
    await broadcast({"type": "topic_selected", "topic": state.selected_topic})
    await broadcast({"type": "state_update", "data": state.to_dict()})
    return {"ok": True, "topic": state.selected_topic}


@app.post("/api/s6/generate")
async def s6_generate(req: StageConfig = StageConfig()):
    """S6：根据选题生成大纲。"""
    if not state.selected_topic:
        return {"ok": False, "error": "请先选择选题"}
    def save(r):
        state.outline_data = r; state.outline_version += 1
    return await _run_stage(req.config, s6_outline.run, "s6", "大纲",
                            lambda r: len(r.get('outline', [])), save)


@app.post("/api/s6/confirm")
async def s6_confirm():
    """S6：用户确认大纲，进入 S7。"""
    if not state.outline_data:
        return {"ok": False, "error": "请先生成大纲"}
    state.current_stage = Stage.S7_SCRIPT
    state.add_history("s6_confirm", "大纲确认，进入 S7 脚本")
    await broadcast({"type": "state_update", "data": state.to_dict()})
    return {"ok": True}


class RegenChapterRequest(BaseModel):
    chapter_index: int  # 0-based
    feedback: str = ""  # 可选：优缺点反馈用于改进


@app.post("/api/s6/regen-chapter")
async def s6_regen_chapter(req: RegenChapterRequest):
    """S6：重新生成单个章节。传入 feedback 时为改进模式。"""
    if not state.outline_data or not state.outline_data.get("outline"):
        return {"ok": False, "error": "请先生成大纲"}
    outline = state.outline_data["outline"]
    if req.chapter_index < 0 or req.chapter_index >= len(outline):
        return {"ok": False, "error": "无效的章节索引"}
    old_chapter = outline[req.chapter_index]
    try:
        new_chapter = await asyncio.to_thread(
            s6_outline.regen_chapter, state, old_chapter, req.chapter_index, len(outline), req.feedback
        )
        outline[req.chapter_index] = new_chapter
        state.outline_version += 1
        await broadcast({"type": "state_update", "data": state.to_dict()})
        return {"ok": True, "chapter": new_chapter}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.post("/api/s7/generate")
async def s7_generate(req: StageConfig = StageConfig()):
    """S7：根据大纲生成脚本。"""
    if not state.outline_data:
        return {"ok": False, "error": "请先生成大纲"}
    def save(r):
        state.script_data = r; state.script_version += 1
    return await _run_stage(req.config, s7_script.run, "s7", "脚本",
                            lambda r: len(r) if isinstance(r, str) else 0, save)


@app.post("/api/s7/confirm")
async def s7_confirm():
    """S7：用户确认脚本，进入 S8。"""
    if not state.script_data:
        return {"ok": False, "error": "请先生成脚本"}
    state.current_stage = Stage.S8_ADVERSARIAL
    state.add_history("s7_confirm", "脚本确认，进入 S8 对抗审核")
    await broadcast({"type": "state_update", "data": state.to_dict()})
    return {"ok": True}


@app.post("/api/s8/run")
async def s8_run(req: StageConfig = StageConfig()):
    """S8：运行 5 角色对抗审核。"""
    if not state.script_data:
        return {"ok": False, "error": "请先生成脚本"}
    state.stage_config = req.config
    state.status = PipelineStatus.RUNNING
    state.add_history("s8_run", "开始 5 角色对抗审核...")
    await broadcast({"type": "stage_start", "stage": "s8", "message": "5 个角色正在并行审核脚本..."})

    try:
        result = await asyncio.to_thread(s8_adversarial.run, state)
        state.adversarial_data = result
        state.adversarial_version += 1
        state.add_history("s8_done", f"对抗审核完成，平均分 {result.get('average_score', 0)}")
        await broadcast({"type": "stage_done", "stage": "s8", "data": result})

        # 评估结果
        decision, detail = evaluate_adversarial_result(result)
        state.add_history("s8_evaluate", f"判定: {decision}, 详情: {json.dumps(detail, ensure_ascii=False)}")

        if decision == "pass":
            state.status = PipelineStatus.COMPLETED
            state.add_history("pipeline_done", "全部阶段通过！")
            await broadcast({"type": "pipeline_done", "data": result, "detail": detail})
        elif decision == "rollback_s7":
            state.status = PipelineStatus.ROLLBACK
            rb = RollbackEvent(Stage.S8_ADVERSARIAL, Stage.S7_SCRIPT, detail.get("reason", ""), detail.get("scores"))
            state.rollbacks.append(rb)
            old_script = state.script_data  # 先保存，供 re_run_with_feedback 使用
            state.script_data = None  # 清空，需要重新生成
            state.current_stage = Stage.S7_SCRIPT
            state.add_history("rollback_s7", detail.get("reason", ""))
            await broadcast({"type": "rollback", "from": "s8", "to": "s7", "reason": detail.get("reason", ""), "scores": detail.get("scores")})
            # 自动用反馈重新生成脚本
            await broadcast({"type": "stage_start", "stage": "s7", "message": "回滚到 S7，正在根据审核反馈修补脚本..."})
            feedback = json.dumps(result, ensure_ascii=False)
            try:
                new_script = await asyncio.to_thread(s7_script.re_run_with_feedback, state, feedback, old_script)
                state.script_data = new_script
                state.script_version += 1
                state.status = PipelineStatus.AWAITING_USER
                state.add_history("s7_redone", f"脚本修补完成，{len(new_script)} 字")
                await broadcast({"type": "stage_done", "stage": "s7", "data": {"script": new_script, "word_count": len(new_script), "is_rollback": True}})
            except Exception as e:
                state.status = PipelineStatus.AWAITING_USER
                await broadcast({"type": "error", "stage": "s7", "message": f"脚本修补失败: {e}"})
        else:  # rollback_s5
            state.status = PipelineStatus.ROLLBACK
            rb = RollbackEvent(Stage.S8_ADVERSARIAL, Stage.S5_TOPIC, detail.get("reason", ""), detail.get("scores"))
            state.rollbacks.append(rb)
            state.topic_data = None
            state.selected_topic = None
            state.outline_data = None
            state.script_data = None
            state.current_stage = Stage.S5_TOPIC
            state.add_history("rollback_s5", detail.get("reason", ""))
            await broadcast({"type": "rollback", "from": "s8", "to": "s5", "reason": detail.get("reason", ""), "scores": detail.get("scores")})
            # 自动用反馈重新选题
            await broadcast({"type": "stage_start", "stage": "s5", "message": "回滚到 S5，正在根据审核反馈重新选题..."})
            feedback = json.dumps(result, ensure_ascii=False)
            try:
                new_topics = await asyncio.to_thread(s5_topic.re_run_with_feedback, state, feedback)
                state.topic_data = new_topics
                state.topic_version += 1
                state.status = PipelineStatus.AWAITING_USER
                state.add_history("s5_redone", f"重新生成 {len(new_topics.get('topics', []))} 个选题")
                await broadcast({"type": "stage_done", "stage": "s5", "data": new_topics, "is_rollback": True})
            except Exception as e:
                state.status = PipelineStatus.AWAITING_USER
                await broadcast({"type": "error", "stage": "s5", "message": f"选题重新生成失败: {e}"})

        await broadcast({"type": "state_update", "data": state.to_dict()})
        return {"ok": True, "decision": decision, "detail": detail, "data": result}
    except Exception as e:
        state.status = PipelineStatus.IDLE
        await broadcast({"type": "error", "stage": "s8", "message": str(e)})
        return {"ok": False, "error": str(e)}


# ===== WebSocket =====

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    ws_connections.append(ws)
    try:
        await ws.send_text(json.dumps({"type": "connected", "data": state.to_dict()}, ensure_ascii=False))
        while True:
            await ws.receive_text()  # 保持连接
    except WebSocketDisconnect:
        pass
    finally:
        if ws in ws_connections:
            ws_connections.remove(ws)
