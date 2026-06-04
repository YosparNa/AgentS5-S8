# 视频剪辑流 Agent — API 接口文档

**Base URL:** `http://localhost:8000`
**Content-Type:** `application/json`
**所有 POST 请求 Body 为空时传 `{}`**
**LLM Token 预算：** S5/S6/S7 使用 max_tokens=32768（MiMo 推理模型需要额外推理 token），S8 每角色 max_tokens=8000

---

## 1. 获取流程状态

```
GET /api/state
```

返回完整 PipelineState JSON。

---

## 2. 初始化流程

```
POST /api/init
```

**Body:**
```json
{ "user_data": "用户输入数据", "channel_desc": "频道定位描述" }
```

**返回:** `{ "ok": true, "state": {...} }`

---

## 3. S5 选题

### 3.1 生成选题
```
POST /api/s5/generate
Body: { "config": { "avoid_shock": true, "emotion_conflict": 9, ... } }
```
**返回:** `{ "ok": true, "data": { "topics": [...] } }`

### 3.2 锁定选题
```
POST /api/s5/select
Body: { "index": 0 }
```
**返回:** `{ "ok": true, "topic": {...} }`

---

## 4. S6 大纲

### 4.1 生成大纲
```
POST /api/s6/generate
Body: { "config": { "hook_strategy": "anti_consensus", "chapter_count": 6, ... } }
```
**返回:** `{ "ok": true, "data": { "outline": [...], "total_duration": "...", "crisis_points": [...], "climax_position": "..." } }`

### 4.2 确认大纲
```
POST /api/s6/confirm
Body: {}
```

### 4.3 重新生成/改进单个章节
```
POST /api/s6/regen-chapter
Body: { "chapter_index": 0, "feedback": "可选：优缺点反馈" }
```
- `feedback` 为空时全新重做
- `feedback` 有内容时为改进模式（针对 cons 修复）
**返回:** `{ "ok": true, "chapter": {...} }`

---

## 5. S7 脚本

### 5.1 生成脚本
```
POST /api/s7/generate
Body: { "config": { "banned_words": "内卷,赋能", "crisis_per_chapter": true } }
```
**返回:** `{ "ok": true, "data": { "script": "...", "word_count": 2409 } }`

### 5.2 确认脚本
```
POST /api/s7/confirm
Body: {}
```

---

## 6. S8 对抗审核

### 6.1 运行审核
```
POST /api/s8/run
Body: { "config": { "enabled_roles": { "杠精": true, "同行": false, ... } } }
```
**返回:**
```json
{
  "ok": true,
  "decision": "pass|rollback_s7|rollback_s5",
  "detail": { "average": 8.2, "scores": {...} },
  "data": { "roles": [...], "average_score": 8.2 }
}
```

---

## 7. WebSocket 实时推送

```
ws://localhost:8000/ws
```

**推送消息类型：**
| type | 说明 |
|------|------|
| `connected` | 连接成功，附带当前状态 |
| `state_update` | 状态变更 |
| `stage_start` | 阶段开始 |
| `stage_done` | 阶段完成 |
| `rollback` | 回滚触发 |
| `pipeline_done` | 全部通过 |
| `error` | 错误 |

---

## 8. 调用流程

```
POST /api/init → POST /api/s5/generate → POST /api/s5/select
→ POST /api/s6/generate → [POST /api/s6/regen-chapter] → POST /api/s6/confirm
→ POST /api/s7/generate → POST /api/s7/confirm
→ POST /api/s8/run
```

---

## 9. 配置参数说明

### S5 config
| 参数 | 类型 | 说明 |
|------|------|------|
| avoid_shock | bool | 排除震惊体 |
| avoid_empty | bool | 排除假大空 |
| avoid_ai | bool | 排除AI套话 |
| emotion_conflict | int | 认知冲突权重 0-10 |
| emotion_resonance | int | 共鸣度权重 0-10 |
| emotion_crisis | int | 危机感权重 0-10 |
| emotion_curiosity | int | 好奇驱动权重 0-10 |

### S6 config
| 参数 | 类型 | 说明 |
|------|------|------|
| hook_strategy | string | 反常识/冲突悬念/数字冲击/画面承诺 |
| crisis_density | int | 危机点密度（每N章一个） |
| climax_position | int | 高潮位置百分比 |
| chapter_count | int | 章节数 |

### S7 config
| 参数 | 类型 | 说明 |
|------|------|------|
| banned_words | string | 额外禁用词（逗号分隔） |
| crisis_per_chapter | bool | 每章反预期转折 |
| crisis_hook_interval | bool | 每2-3分钟留人钩子 |

### S8 config
| 参数 | 类型 | 说明 |
|------|------|------|
| enabled_roles | object | 各角色开关 {"杠精":true, ...} |
