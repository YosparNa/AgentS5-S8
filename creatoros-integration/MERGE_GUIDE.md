# CreatorOS + Agent-L3 合并指南

> 给同事：拉取此仓库后，按以下步骤合并到你的 CreatorOS 和前端仓库。

---

## 仓库结构

```
AgentS5-S8/
├── app/                              # Agent-L3 后端（可直接部署）
├── creatoros-integration/
│   ├── backend-patches/              # CreatorOS 后端需要改的 3 个文件
│   │   ├── types.py                  # → 替换 CreatorOS/backend/app/domain/types.py
│   │   ├── workflow_engine.py        # → 替换 CreatorOS/backend/app/services/workflow_engine.py
│   │   └── handlers.py               # → 替换 CreatorOS/backend/app/stages/handlers.py
│   └── frontend-patches/             # Vite 前端需要改的 3 个文件
│       ├── dataProvider.ts           # → 替换 src/services/dataProvider.ts
│       ├── workflowClient.ts         # → 新增到 src/services/workflowClient.ts
│       └── SimulateButton.tsx        # → 替换 src/components/workbench/SimulateButton.tsx
├── docs/
│   ├── API_SPEC_V1.md                # 完整接口规范
│   └── CreatorOS对接说明.md           # 架构 + 改动清单
└── start_server.py                   # 启动脚本（端口 8001）
```

---

## 合并步骤

### 1. CreatorOS 后端（3 个文件替换）

```bash
# 在 CreatorOS 仓库根目录
cp <AgentS5-S8路径>/creatoros-integration/backend-patches/types.py backend/app/domain/types.py
cp <AgentS5-S8路径>/creatoros-integration/backend-patches/workflow_engine.py backend/app/services/workflow_engine.py
cp <AgentS5-S8路径>/creatoros-integration/backend-patches/handlers.py backend/app/stages/handlers.py
```

**改动摘要：**
- `types.py`：+STAGE_DEFS_L3 (S5-S17) + stage_defs_for() + WORKFLOW_KIND_VIDEO_PRODUCTION
- `workflow_engine.py`：解除 L3 运行拦截 + CHAIN_L3 + IMPLEMENTED_STAGES 加 S5-S8
- `handlers.py`：+run_s5/s6/s7/s8 handler（通过 HTTP 调 Agent-L3）

### 2. Vite 前端（2 个文件替换 + 1 个新增）

```bash
# 在 creatoros-frontend-vite 仓库根目录
cp <AgentS5-S8路径>/creatoros-integration/frontend-patches/dataProvider.ts src/services/dataProvider.ts
cp <AgentS5-S8路径>/creatoros-integration/frontend-patches/workflowClient.ts src/services/workflowClient.ts
cp <AgentS5-S8路径>/creatoros-integration/frontend-patches/SimulateButton.tsx src/components/workbench/SimulateButton.tsx
```

**改动摘要：**
- `dataProvider.ts`：login/logout 接入真实后端 + 新增 runWithBackend/approveStage/advanceWorkflow
- `workflowClient.ts`：新增，CreatorOS 后端 API 客户端
- `SimulateButton.tsx`：支持真实后端运行 S5-S8

### 3. 启动三个服务

```bash
# 终端 1：Agent-L3 (port 8001)
cd AgentS5-S8 && python start_server.py

# 终端 2：CreatorOS 后端 (port 8000)
cd CreatorOS/backend && python -c "import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=8000)"

# 终端 3：Vite 前端 (port 3000)
cd creatoros-frontend-vite && npx vite --port 3000
```

### 4. 登录测试

- 打开 http://localhost:3000
- 登录 `admin` / `admin123`
- 进入工作台 → 点"运行 S5-S8"

---

## 验证结果（2026-06-08 已通过）

| 阶段 | artifact_type | 数据 | 来源 |
|------|--------------|------|------|
| S5 | topic_candidates | 5 个选题 | ✅ MiMo LLM |
| S6 | outline | 7 个章节 | ✅ MiMo LLM |
| S7 | script | 2428 字 | ✅ MiMo LLM |
| S8 | adversarial_review | 5 角色 avg 6.8 | ✅ MiMo LLM |

---

## 注意事项

- Agent-L3 端口改为 **8001**（与 CreatorOS 后端 8000 共存）
- Agent-L3 的 LLM 客户端用 `requests` 库（绕过 httpx 代理 SSL 问题）
- 认证账号配置在 `CreatorOS/configs/users.local.json`
- MiMo API Key 配置在 `AgentS5-S8/.env`
