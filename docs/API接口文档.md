# 视频剪辑流 API 接口文档

## 基础信息

| 项目 | 说明 |
|------|------|
| Base URL | `http://localhost:8000` |
| 数据格式 | JSON |
| 编码 | UTF-8 |
| CORS | 已开启（`*`） |

## 架构概览

项目有两套 API，同事对接请使用 **workflow_api**（RESTful 工作流接口）：

| API | 路由文件 | 用途 | 状态 |
|-----|---------|------|------|
| Pipeline API | `app/main.py` | 单用户演示，`/api/s5/generate` 等 | 旧版，不建议对接 |
| **Workflow API** | `app/workflow_api.py` | 多工作流管理，`/api/workflows/...` | **正式接口** |

---

## 一、Workflow API（正式接口）

### 1.1 创建工作流

```
POST /api/workflows
```

**请求体：**
```json
{
  "kind": "video_production",       // 可选，默认 "video_production"
  "user_data": "热点数据、素材等",    // 必填，传入给 S5 的原始数据
  "channel_desc": "频道定位描述"     // 可选
}
```

**响应：** `WorkflowView`（见下方数据结构）

---

### 1.2 获取所有工作流

```
GET /api/workflows
```

**响应：**
```json
{
  "workflows": [
    { "id": "wf_xxx", "status": "running", "current_stage": "S5", "kind": "video_production", ... }
  ]
}
```

---

### 1.3 获取单个工作流详情

```
GET /api/workflows/{wf_id}
```

**响应：** `WorkflowView`

---

### 1.4 运行指定阶段

```
POST /api/workflows/{wf_id}/stages/{stage_code}/run
```

**路径参数：**
- `stage_code`：`S5` | `S6` | `S7` | `S8`（大写）

**请求体：**
```json
{
  "config": {
    "exclude_shock_title": true,
    "cognitive_conflict": 7
  }
}
```

**响应：** `WorkflowView`（stage status 变为 `completed` 或 `awaiting_review`）

**阶段依赖：**
- S6 需要 S5 已完成（自动从 S5 artifact 取选题）
- S7 需要 S6 已完成（自动从 S6 artifact 取大纲）
- S8 需要 S7 已完成（自动从 S7 artifact 取脚本）

---

### 1.5 运行下一个待执行阶段

```
POST /api/workflows/{wf_id}/run
```

无请求体，自动找到 `status=active` 的阶段运行。

---

### 1.6 审核通过

```
POST /api/workflows/{wf_id}/stages/{stage_code}/approve
```

将 `awaiting_review` 状态的阶段标记为 `completed`，自动推进到下一阶段。

适用阶段：S6（大纲审核）、S8（对抗审核）

---

### 1.7 驳回 / 回滚

```
POST /api/workflows/{wf_id}/stages/{stage_code}/reject
```

**请求体：**
```json
{
  "reason": "用户驳回原因",
  "rollback_to": "S5"    // 可选：S5 | S6 | S7，不传则只重置当前阶段
}
```

**回滚行为：**
- `rollback_to = "S5"`：清空 S5~当前阶段，S5 变为 active
- `rollback_to = "S6"`：清空 S6~当前阶段，S6 变为 active
- `rollback_to = "S7"`：清空 S7~当前阶段，S7 变为 active
- 不传 `rollback_to`：只重置当前阶段为 pending

---

### 1.8 SSE 事件流（占位）

```
GET /api/workflows/{wf_id}/events/stream
```

当前只发送心跳，未接入实际事件推送。

---

## 二、工作流状态机

### Stage Status（阶段状态）

```
pending → active → running → completed
                            → awaiting_review → completed
                                              → failed
```

| status | 说明 |
|--------|------|
| `pending` | 等待执行 |
| `active` | 当前待执行阶段 |
| `running` | Agent 正在运行 |
| `completed` | 已完成 |
| `awaiting_review` | 等待人工审核（S6、S8） |
| `failed` | 执行失败 |

### Workflow Status（工作流状态）

| status | 说明 |
|--------|------|
| `running` | 流程进行中 |
| `awaiting_review` | 某阶段等待审核 |
| `completed` | 全部完成 |

### 自动推进规则

| 阶段 | `needs_review` | 完成后行为 |
|------|---------------|-----------|
| S5 | `false` | 自动推进到 S6（active） |
| S6 | `true` | 停在 `awaiting_review`，等用户 approve/reject |
| S7 | `false` | 自动推进到 S8（active） |
| S8 | `true` | 停在 `awaiting_review`，等用户 approve/reject |

---

## 三、各阶段 Config 参数规范

### S5 选题 config

```json
{
  "exclude_shock_title": true,       // bool - 排除震惊体标题
  "exclude_empty_buzzwords": true,   // bool - 排除假大空内容
  "exclude_ai_filler": true,         // bool - 排除AI套话
  "cognitive_conflict": 7,           // int 1-10 - 认知冲突权重
  "resonance": 8,                    // int 1-10 - 共鸣权重
  "crisis": 6,                       // int 1-10 - 危机感权重
  "curiosity": 9                     // int 1-10 - 好奇心权重
}
```

### S6 大纲 config

```json
{
  "hook_type": "conflict_suspense",  // string - 钩子类型
  "crisis_density": 3,               // int 1-10 - 危机点密度
  "climax_pct": 78,                  // int 1-100 - 高潮位置百分比
  "chapter_count": 8                 // int 1-15 - 章节数
}
```

**hook_type 可选值：**
- `"counterintuitive"` — 反直觉钩子
- `"conflict_suspense"` — 冲突悬念钩子
- `"number_impact"` — 数据冲击钩子
- `"visual_promise"` — 视觉承诺钩子

### S7 脚本 config

```json
{
  "spoken_style_bans": "禁用：综上所述 / 在当今时代",  // string - 额外禁用词
  "one_twist_per_chapter": true,    // bool - 每章至少1个反预期转折点
  "hook_every_2_3_min": true        // bool - 每2-3分钟设置一个留人钩子
}
```

### S8 对抗审核 config

```json
{
  "nitpicker": true,    // bool - 杠精（事实核查）
  "peer": true,         // bool - 同行（专业审核）
  "novice": true,       // bool - 小白（易懂性）
  "fan": true,          // bool - 老粉（观众体验）
  "compliance": true    // bool - 合规（平台政策）
}
```

也支持旧格式 `enabled_roles`：
```json
{
  "enabled_roles": { "杠精": true, "同行": true, "小白": false, "老粉": true, "合规": true }
}
```

---

## 四、Artifact 产物数据结构

### S5 Topics（选题）

```json
{
  "artifact_type": "topic_candidates",
  "topics": [
    {
      "rank": 1,
      "title": "选题标题",
      "score": 8.5,
      "unique": "差异化角度",
      "locked": false
    }
  ]
}
```

### S6 Outline（大纲）

```json
{
  "artifact_type": "outline",
  "outline": [
    {
      "ch": "第1章标题",
      "dur": "30s",
      "tension": 7,
      "hook": "开头钩子文本",
      "crisis": false,
      "description": "章节描述",
      "purpose": "章节目的"
    }
  ]
}
```

### S7 Script（脚本）

```json
{
  "artifact_type": "script",
  "body_md": "完整的口播脚本文本...",
  "word_count": 1500,
  "excerpt": "前200字摘要..."
}
```

### S8 Adversarial Review（对抗审核）

```json
{
  "artifact_type": "adversarial_review",
  "average_score": 7.2,
  "roles": [
    {
      "role_key": "nitpicker",
      "name": "杠精",
      "issues": 3,
      "note": "存在2个事实错误...",
      "avatar": "f624"
    }
  ]
}
```

---

## 五、WorkflowView 响应结构

所有涉及阶段运行/审批/驳回的接口都返回统一的 `WorkflowView` 格式：

```json
{
  "workflow": {
    "id": "wf_a1b2c3d4",
    "channel_id": null,
    "status": "running",
    "current_stage": "S6",
    "kind": "video_production",
    "input": {
      "user_data": "...",
      "channel_desc": "..."
    },
    "created_at": "2026-06-09T12:00:00+00:00"
  },
  "stages": [
    {
      "id": "sr_xxx",
      "stage_code": "S5",
      "stage_name": "选题",
      "stage_slug": "topic",
      "order": 1,
      "status": "completed",
      "output_artifact": { "topics": [...] },
      "error": null,
      "started_at": "2026-06-09T12:00:01+00:00",
      "completed_at": "2026-06-09T12:00:38+00:00"
    },
    {
      "id": "sr_yyy",
      "stage_code": "S6",
      "stage_name": "大纲",
      "stage_slug": "outline",
      "order": 2,
      "status": "awaiting_review",
      "output_artifact": { "outline": [...] },
      "error": null,
      "started_at": "2026-06-09T12:00:38+00:00",
      "completed_at": "2026-06-09T12:01:18+00:00"
    }
  ]
}
```

---

## 六、前端调用示例

### 6.1 完整 S5-S8 流程（TypeScript）

```typescript
const API = "http://localhost:8000";

// 1. 创建工作流
const wf = await fetch(`${API}/api/workflows`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_data: "热点数据...", channel_desc: "频道定位" }),
}).then(r => r.json());
const wfId = wf.workflow.id;

// 2. 运行 S5（选题）
const s5 = await fetch(`${API}/api/workflows/${wfId}/stages/S5/run`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ config: { exclude_shock_title: true, cognitive_conflict: 7 } }),
}).then(r => r.json());
// s5.stages[0].output_artifact.topics → 5个候选选题

// 3. 运行 S6（大纲）- 自动从 S5 取选题
const s6 = await fetch(`${API}/api/workflows/${wfId}/stages/S6/run`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ config: { hook_type: "conflict_suspense", chapter_count: 8 } }),
}).then(r => r.json());
// s6.stages[1].status === "awaiting_review"

// 4. 审核通过 S6
const s6approved = await fetch(`${API}/api/workflows/${wfId}/stages/S6/approve`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
}).then(r => r.json());
// s6approved: S7 变为 active

// 5. 运行 S7（脚本）- 自动从 S6 取大纲
const s7 = await fetch(`${API}/api/workflows/${wfId}/stages/S7/run`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ config: { one_twist_per_chapter: true } }),
}).then(r => r.json());
// s7.stages[2].output_artifact.body_md → 脚本全文

// 6. 运行 S8（对抗审核）- 自动从 S7 取脚本
const s8 = await fetch(`${API}/api/workflows/${wfId}/stages/S8/run`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ config: { nitpicker: true, peer: true, novice: true, fan: true, compliance: true } }),
}).then(r => r.json());
// s8.stages[3].status === "awaiting_review"

// 7. 审核通过 S8
await fetch(`${API}/api/workflows/${wfId}/stages/S8/approve`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
// workflow.status === "completed"
```

### 6.2 驳回并回滚

```typescript
// 驳回 S8，回滚到 S7 重新生成脚本
const rejected = await fetch(`${API}/api/workflows/${wfId}/stages/S8/reject`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ reason: "脚本需要调整", rollback_to: "S7" }),
}).then(r => r.json());
// rejected: S5=completed, S6=completed, S7=active, S8=pending
```

### 6.3 用 Python requests

```python
import requests

API = "http://localhost:8000"

# 创建
wf = requests.post(f"{API}/api/workflows", json={
    "user_data": "热点数据...",
    "channel_desc": "频道定位"
}).json()
wf_id = wf["workflow"]["id"]

# S5
s5 = requests.post(f"{API}/api/workflows/{wf_id}/stages/S5/run", json={
    "config": {"exclude_shock_title": True, "cognitive_conflict": 7}
}).json()
print(s5["stages"][0]["output_artifact"]["topics"])
```

---

## 七、前端调用对应关系

前端通过 `workflowClient.ts` 调用后端，对应关系如下：

| 前端函数 | HTTP 请求 | 说明 |
|---------|-----------|------|
| `createWorkflow()` | `POST /api/workflows` | 创建工作流 |
| `runStage(wfId, "S5")` | `POST /api/workflows/{id}/stages/S5/run` | 运行S5 |
| `runStage(wfId, "S6")` | `POST /api/workflows/{id}/stages/S6/run` | 运行S6 |
| `runStage(wfId, "S7")` | `POST /api/workflows/{id}/stages/S7/run` | 运行S7 |
| `runStage(wfId, "S8")` | `POST /api/workflows/{id}/stages/S8/run` | 运行S8 |
| `approveStage(wfId, "S6")` | `POST /api/workflows/{id}/stages/S6/approve` | S6审核通过 |
| `approveStage(wfId, "S8")` | `POST /api/workflows/{id}/stages/S8/approve` | S8审核通过 |
| `rejectStage(wfId, "S8", reason, "S5")` | `POST /api/workflows/{id}/stages/S8/reject` | S8驳回→回滚S5 |
| `getWorkflow(wfId)` | `GET /api/workflows/{id}` | 获取当前状态 |

前端 `configStore.ts` 的 `getS5Config()` / `getS6Config()` / `getS7Config()` / `getS8Config()` 生成 config dict，通过 `runStage` 的 `config` 参数传入后端。

---

## 八、环境配置与启动

```env
XIAOMI_API_KEY=your_api_key_here
```

### 启动命令

需要同时启动**后端**和**前端**两个服务：

```bash
# 终端1：启动后端（FastAPI，端口 8000）
cd E:\creatoros-integrated
python start_server.py

# 终端2：启动前端（Vite，端口 3000）
cd E:\creatoros-integrated
npm run dev
```

| 服务 | 地址 | 说明 |
|------|------|------|
| 后端 API | `http://localhost:8000` | FastAPI，提供 `/api/workflows` 等接口 |
| 前端页面 | `http://localhost:3000` | Vite 开发服务器，访问 UI |

前端通过 `VITE_API_BASE` 环境变量连接后端，默认 `http://localhost:8000`。

### 生产环境部署

```bash
# 构建前端静态文件
npm run build

# 后端启动后访问 http://localhost:8000
# 需要在 main.py 中挂载 dist 静态目录（或用 nginx 反代）
```

依赖：
```
fastapi
uvicorn
openai
pydantic
```
