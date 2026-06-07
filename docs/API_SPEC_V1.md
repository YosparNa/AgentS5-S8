# CreatorOS S5-S8 接口规范（V1）

> 基于实际联调验证 | 2026-06-08

---

## 1. 基本约定

| 项目 | 说明 |
|------|------|
| CreatorOS 后端 | `http://localhost:8000` |
| Agent-L3 后端 | `http://localhost:8001` |
| 前端（Vite SPA） | `http://localhost:3000` |
| Content-Type | `application/json` |
| 鉴权 | Cookie session（`credentials: "include"`） |

---

## 2. 统一响应格式

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-06-08T12:00:00Z"
}
```

失败：
```json
{
  "success": false,
  "data": null,
  "error": { "code": "INVALID_INPUT", "message": "请先选择选题" },
  "timestamp": "..."
}
```

---

## 3. 认证

### 3.1 登录
```
POST /api/auth/login
```
```json
{ "username": "admin", "password": "admin123" }
```
→ `{ "username": "admin" }`

### 3.2 登出
```
POST /api/auth/logout
```

### 3.3 当前用户
```
GET /api/auth/me
```
→ `{ "username": "admin" }` 或 401

---

## 4. Workflow API

### 4.1 创建 workflow
```
POST /api/workflows
```
```json
{
  "seed_keywords": ["AI工具"],
  "platform": "youtube",
  "language": "zh",
  "kind": "video_production",
  "user_data": "百度热搜数据...",
  "channel_desc": "科技生活区UP主"
}
```
→ `{ "workflow": { "id": "wf_xxx", "kind": "video_production", "status": "pending", ... }, "stages": [...] }`

### 4.2 获取 workflow
```
GET /api/workflows/{wf_id}
```
→ `{ "workflow": {...}, "stages": [...] }`

### 4.3 列出 workflows
```
GET /api/workflows
```
→ `{ "workflows": [...] }`

### 4.4 运行主链下一阶段
```
POST /api/workflows/{wf_id}/run
```
→ `{ "workflow": {...}, "stages": [...] }`

### 4.5 审核通过
```
POST /api/workflows/{wf_id}/stages/{stage_code}/approve
```
```json
{ "notes": "可选审核备注" }
```

### 4.6 驳回
```
POST /api/workflows/{wf_id}/stages/{stage_code}/reject
```
```json
{ "reason": "驳回原因" }
```

### 4.7 WebSocket 事件流
```
WS /api/workflows/{wf_id}/events/stream
```

---

## 5. L3 主链流程（video_production）

```
S5 选题 → S6 大纲(审核) → S7 脚本 → S8 对抗(审核)
```

| 阶段 | needs_review | 审核后操作 |
|------|-------------|-----------|
| S5 | ❌ | 自动推进到 S6 |
| S6 | ✅ | approve → run → 推进到 S7 |
| S7 | ❌ | 自动推进到 S8 |
| S8 | ✅ | approve → 完成 |

---

## 6. Artifact Schema

### S5 `topic_candidates`
```json
{
  "artifact_type": "topic_candidates",
  "topics": [
    {
      "rank": 1,
      "title": "耐克失宠：年轻人的钱流向了哪里？",
      "score": 9.0,
      "locked": true,
      "unique": "不只讲现象，更深入分析消费心理变化",
      "angle": "从消费心理学视角切入...",
      "keywords": ["消费趋势", "品牌信任"],
      "rationale": "结合百度热搜数据..."
    }
  ]
}
```

### S6 `outline`
```json
{
  "artifact_type": "outline",
  "outline": [
    {
      "ch": "数据暴击：耐克真的被抛弃了？",
      "dur": "20s",
      "tension": 10,
      "hook": "直接抛出百度热搜截图...",
      "crisis": false,
      "description": "展示搜索指数对比...",
      "purpose": "用数据冲击制造悬念",
      "pros": ["用数字冲击开场"],
      "cons": ["纯数据图表略显枯燥"]
    }
  ],
  "total_duration": "6min15s",
  "crisis_points": [4, 5],
  "climax_position": "78%"
}
```

### S7 `script`
```json
{
  "artifact_type": "script",
  "excerpt": "前200字预览...",
  "body_md": "全文脚本...",
  "word_count": 4311
}
```

### S8 `adversarial_review`
```json
{
  "artifact_type": "adversarial_review",
  "roles": [
    {
      "role_key": "nitpicker",
      "name": "杠精",
      "avatar": "😤",
      "score": 7,
      "issues": [
        {
          "severity": "medium",
          "location": "第三章",
          "description": "数据来源未标注",
          "suggestion": "补充具体数据出处"
        }
      ],
      "note": "整体逻辑通顺，2处数据需补充来源",
      "suggestions": ["建议增加反面案例"],
      "highlights": ["开头钩子很强"]
    }
  ],
  "averageScore": 7.4,
  "decision": "pass"
}
```

---

## 7. 配置参数

### S5 config
| key | 类型 | 默认 | 说明 |
|-----|------|------|------|
| `exclude_shock_title` | bool | true | 排除震惊体 |
| `exclude_empty_buzzwords` | bool | true | 排除假大空 |
| `exclude_ai_filler` | bool | true | 排除AI套话 |
| `cognitive_conflict` | int 0-10 | 7 | 认知冲突权重 |
| `resonance` | int 0-10 | 8 | 共鸣度权重 |
| `crisis` | int 0-10 | 6 | 危机感权重 |
| `curiosity` | int 0-10 | 9 | 好奇驱动权重 |

### S6 config
| key | 类型 | 默认 | 说明 |
|-----|------|------|------|
| `hook_type` | enum | `counterintuitive` | 钩子策略 |
| `crisis_density` | int 0-5 | 3 | 危机点密度 |
| `climax_pct` | int 0-100 | 78 | 高潮位 |
| `chapter_count` | int 0-12 | 8 | 章节数 |

### S7 config
| key | 类型 | 默认 | 说明 |
|-----|------|------|------|
| `spoken_style_bans` | text | — | 禁用词 |
| `one_twist_per_chapter` | bool | true | 每章反转 |
| `hook_every_2_3_min` | bool | true | 留人钩子 |

### S8 config
| key | 类型 | 默认 | 说明 |
|-----|------|------|------|
| `nitpicker` | bool | true | 杠精 |
| `peer` | bool | true | 同行 |
| `novice` | bool | true | 小白 |
| `fan` | bool | true | 老粉 |
| `compliance` | bool | true | 合规 |

---

## 8. 前端 DataProvider 对应

```typescript
// creatoros-frontend-vite/src/services/dataProvider.ts
dataProvider.runWithBackend(user_data, channel_desc)  → POST /api/workflows + /run
dataProvider.approveStage(wfId, code)                 → POST /stages/{code}/approve
dataProvider.advanceWorkflow(wfId)                     → POST /workflows/{id}/run
dataProvider.getWorkflow(wfId)                         → GET /workflows/{id}
```

---

## 9. 验证状态（2026-06-08）

| 接口 | 状态 | 数据来源 |
|------|------|---------|
| POST /api/auth/login | ✅ | 真实认证 |
| POST /api/workflows | ✅ | video_production |
| POST /api/workflows/{id}/run | ✅ | Agent-L3 → MiMo LLM |
| POST /stages/S6/approve | ✅ | 审核闸 |
| POST /stages/S8/approve | ✅ | 审核闸 |
| S5 topic_candidates | ✅ | 5 个真实选题 |
| S6 outline | ✅ | 7 个真实章节 |
| S7 script | ✅ | 2428 字真实脚本 |
| S8 adversarial_review | ✅ | 5 角色真实审核 |
