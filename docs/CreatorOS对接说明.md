# CreatorOS 对接说明

> 对接日期：2026-06-08
> CreatorOS 仓库：https://github.com/cxanh/CreatorOS (dev 分支)
> Vite 前端仓库：https://github.com/cxanh/creatoros-frontend-vite

---

## 架构

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Vite 前端 :3000     │────→│  CreatorOS 后端 :8000 │────→│  Agent-L3 :8001  │
│  creatoros-frontend  │     │  (workflow engine)     │     │  (LLM agents)   │
│  -vite               │     │                        │     │                  │
└─────────────────────┘     └──────────────────────┘     └─────────────────┘
```

前端调 CreatorOS 后端 API → CreatorOS handler 通过 HTTP 调 Agent-L3 → Agent-L3 调 MiMo LLM

---

## Agent-L3 改动（本仓库）

| 文件 | 改动 |
|------|------|
| `start_server.py` | 端口 8000 → 8001 |
| `app/llm.py` | openai 库 → requests 库（绕过代理 SSL 问题） |
| `docs/API_SPEC_V1.md` | 完整接口规范 |

---

## CreatorOS 后端改动（6 个文件）

| 文件 | 改动 |
|------|------|
| `backend/app/domain/types.py` | +STAGE_DEFS_L3 (S5-S17) + stage_defs_for() + WORKFLOW_KIND_VIDEO_PRODUCTION |
| `backend/app/services/workflow_engine.py` | 解锁 L3 运行 + CHAIN_L3 + _advance 按 kind 选链 + IMPLEMENTED_STAGES 加 S5-S8 |
| `backend/app/stages/handlers.py` | +run_s5/s6/s7/s8 handler（调 Agent-L3 HTTP API） |
| `frontend/lib/types.ts` | +S5-S8 artifact 接口 + type guards |
| `frontend/components/StageArtifact.tsx` | +S5-S8 渲染器 |
| `frontend/app/workbench/workbenchViewModel.mjs` | mvpCodes 加 S5-S8 + getReviewAction 支持 S6/S8 |

---

## Vite 前端改动（3 个文件）

| 文件 | 改动 |
|------|------|
| `src/services/dataProvider.ts` | +runWithBackend/approveStage/advanceWorkflow + _syncStages |
| `src/services/workflowClient.ts` | 新增 CreatorOS 后端 API 客户端 |
| `src/components/workbench/SimulateButton.tsx` | 支持真实后端运行 S5-S8 |

---

## 启动方式

```bash
# 终端 1：Agent-L3 (port 8001)
cd E:\Agent-L3 && python start_server.py

# 终端 2：CreatorOS 后端 (port 8000)
cd E:\CreatorOS\backend && python -c "import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=8000)"

# 终端 3：Vite 前端 (port 3000)
cd E:\creatoros-frontend-vite && npx vite --port 3000
```

登录：`admin` / `admin123`

---

## 验证结果（2026-06-08）

| 阶段 | artifact_type | 数据 | 来源 |
|------|--------------|------|------|
| S5 | topic_candidates | 5 个选题 | ✅ MiMo 真实生成 |
| S6 | outline | 7 个章节 | ✅ MiMo 真实生成 |
| S7 | script | 2428 字 | ✅ MiMo 真实生成 |
| S8 | adversarial_review | 5 角色 avg 6.8 | ✅ MiMo 真实生成 |
