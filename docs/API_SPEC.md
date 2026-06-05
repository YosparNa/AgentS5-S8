# API 接口规范（V1）

> 版本：v1.0 | 更新：2026-06-05
> 前后端联调接口契约文档

---

## 1. 基本约定

| 项目 | 说明 |
|------|------|
| Base URL（开发） | `http://localhost:8000` |
| Base URL（生产） | `https://api.xxx.com` |
| 统一前缀 | `/api` |
| Content-Type | `application/json` |
| Accept | `application/json` |
| 鉴权（预留） | `Authorization: Bearer <token>` |

---

## 2. 统一响应格式

所有接口统一返回：

```typescript
interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: ApiError | null
  timestamp: string   // ISO 8601
}
```

**成功示例：**
```json
{
  "success": true,
  "data": { "runId": "run_001" },
  "error": null,
  "timestamp": "2026-06-05T13:00:00Z"
}
```

**失败示例：**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_INPUT",
    "message": "topic不能为空"
  },
  "timestamp": "2026-06-05T13:00:00Z"
}
```

---

## 3. 错误码规范

| Code | 含义 | HTTP Status |
|------|------|-------------|
| `INVALID_INPUT` | 参数错误 | 400 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `INTERNAL_ERROR` | 服务内部错误 | 500 |
| `AI_SERVICE_ERROR` | 模型调用失败 | 502 |
| `TASK_RUNNING` | 当前已有任务运行中 | 409 |

---

## 4. 接口列表

### 4.1 获取当前状态

```
GET /api/state
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentStage": "s6",
    "status": "awaiting_user",
    "topicData": { "topics": [...] },
    "selectedTopic": { "id": 1, "title": "..." },
    "outlineData": { "outline": [...] },
    "scriptData": "...",
    "adversarialData": { "roles": [...] }
  },
  "error": null,
  "timestamp": "2026-06-05T13:00:00Z"
}
```

---

### 4.2 初始化流程

```
POST /api/init
```

**Request:**
```json
{
  "userData": "百度热搜数据...",
  "channelDesc": "科技生活区UP主"
}
```

**Response:**
```json
{
  "success": true,
  "data": { "currentStage": "s5", "status": "awaiting_user" },
  "error": null,
  "timestamp": "..."
}
```

---

### 4.3 S5 生成候选选题

```
POST /api/s5/generate
```

**Request:**
```json
{
  "topic": "年轻人消费趋势",
  "language": "zh",
  "count": 5,
  "config": {
    "avoidShock": true,
    "avoidEmpty": true,
    "avoidAi": true,
    "emotionConflict": 7,
    "emotionResonance": 8,
    "emotionCrisis": 6,
    "emotionCuriosity": 9
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": 1,
        "title": "耐克失宠：年轻人的钱流向了哪里？",
        "score": 9.0,
        "angle": "从消费心理学视角切入...",
        "scores": {
          "hotness": 9,
          "relevance": 9,
          "videoability": 9,
          "differentiation": 8,
          "risk": 9,
          "opportunity": 9
        },
        "unique": "差异化卖点...",
        "keywords": ["消费趋势", "品牌信任"],
        "hookIdea": "开场展示百度搜索指数对比...",
        "competitorsCovered": ["半佛仙人"],
        "predictedViews": "200万-350万",
        "riskNotes": ["需平衡..."]
      }
    ]
  },
  "error": null,
  "timestamp": "..."
}
```

---

### 4.4 S5 选择方向

```
POST /api/s5/select
```

**Request:**
```json
{
  "candidateId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "selectedId": 1,
    "title": "耐克失宠：年轻人的钱流向了哪里？"
  },
  "error": null,
  "timestamp": "..."
}
```

---

### 4.5 S6 生成内容规划

```
POST /api/s6/generate
```

**Request:**
```json
{
  "candidateId": 1,
  "config": {
    "hookStrategy": "anti_consensus",
    "crisisDensity": 3,
    "climaxPosition": 78,
    "chapterCount": 8
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "outline": [
      {
        "chapter": 1,
        "title": "数据暴击：耐克真的被抛弃了？",
        "duration": "20s",
        "tension": 10,
        "hook": "直接抛出百度热搜截图...",
        "crisis": false,
        "purpose": "用数据冲击制造悬念",
        "description": "展示搜索指数对比...",
        "transitionToNext": "但这只是表面...",
        "pros": ["用数字冲击开场，3秒内抓住注意力"],
        "cons": ["纯数据图表略显枯燥"]
      }
    ],
    "totalDuration": "6min15s",
    "crisisPoints": [4, 5],
    "climaxPosition": "78%"
  },
  "error": null,
  "timestamp": "..."
}
```

---

### 4.6 S6 确认大纲

```
POST /api/s6/confirm
```

**Request:** `{}`

**Response:**
```json
{
  "success": true,
  "data": { "currentStage": "s7" },
  "error": null,
  "timestamp": "..."
}
```

---

### 4.7 S6 重新生成单个章节

```
POST /api/s6/regen-chapter
```

**Request:**
```json
{
  "chapterIndex": 0,
  "feedback": "钩子太平淡，缺好奇心缺口"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chapter": {
      "chapter": 1,
      "title": "...",
      "tension": 10,
      "hook": "..."
    }
  },
  "error": null,
  "timestamp": "..."
}
```

---

### 4.8 S7 生成脚本

```
POST /api/s7/generate
```

**Request:**
```json
{
  "outline": { "outline": [...] },
  "config": {
    "bannedWords": "综上所述,在当今社会",
    "crisisPerChapter": true,
    "crisisHookInterval": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "script": "说个真事儿。上个月我去杭州灵隐寺...",
    "wordCount": 4311
  },
  "error": null,
  "timestamp": "..."
}
```

---

### 4.9 S7 确认脚本

```
POST /api/s7/confirm
```

**Request:** `{}`

**Response:**
```json
{
  "success": true,
  "data": { "currentStage": "s8" },
  "error": null,
  "timestamp": "..."
}
```

---

### 4.10 S8 执行对抗审核

```
POST /api/s8/run
```

**Request:**
```json
{
  "script": "说个真事儿...",
  "publish": false,
  "config": {
    "enabledRoles": {
      "杠精": true,
      "同行": true,
      "小白": true,
      "老粉": true,
      "合规": true
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "run_001",
    "decision": "pass",
    "averageScore": 7.4,
    "roles": [
      {
        "name": "杠精",
        "emoji": "😤",
        "score": 7,
        "summary": "整体逻辑通顺...",
        "issues": [
          {
            "severity": "medium",
            "location": "第三章",
            "description": "数据来源未标注",
            "suggestion": "补充具体数据出处"
          }
        ],
        "suggestions": ["建议增加反面案例"],
        "highlights": ["开头钩子很强"]
      }
    ],
    "rollbackTarget": null,
    "rollbackReason": null
  },
  "error": null,
  "timestamp": "..."
}
```

---

### 4.11 WebSocket 实时推送

```
ws://localhost:8000/ws
```

**服务端推送统一格式：**
```json
{
  "event": "stage_update",
  "data": {
    "stage": "s7",
    "status": "completed"
  }
}
```

**事件类型：**

| event | 说明 | data |
|-------|------|------|
| `connected` | 连接成功 | 当前完整状态 |
| `stage_update` | 阶段状态变更 | stage + status |
| `progress` | 进度更新 | stage + percent + eta |
| `log` | 日志消息 | stage + message |
| `completed` | 全部完成 | 决策详情 |
| `error` | 错误 | stage + message |

---

## 5. 前端 DataProvider 对应关系

```typescript
// 前端调用方式
dataProvider.s5.generate({ topic, language, count, config })
dataProvider.s5.select({ candidateId })
dataProvider.s6.generate({ candidateId, config })
dataProvider.s6.confirm()
dataProvider.s6.regenChapter({ chapterIndex, feedback })
dataProvider.s7.generate({ outline, config })
dataProvider.s7.confirm()
dataProvider.s8.run({ script, publish, config })
dataProvider.state.get()
dataProvider.ws.connect()
```

| Frontend | Backend |
|----------|---------|
| `dataProvider.s5.generate()` | `POST /api/s5/generate` |
| `dataProvider.s5.select()` | `POST /api/s5/select` |
| `dataProvider.s6.generate()` | `POST /api/s6/generate` |
| `dataProvider.s6.confirm()` | `POST /api/s6/confirm` |
| `dataProvider.s6.regenChapter()` | `POST /api/s6/regen-chapter` |
| `dataProvider.s7.generate()` | `POST /api/s7/generate` |
| `dataProvider.s7.confirm()` | `POST /api/s7/confirm` |
| `dataProvider.s8.run()` | `POST /api/s8/run` |
| `dataProvider.state.get()` | `GET /api/state` |
| `dataProvider.ws.connect()` | `WS /ws` |

---

## 6. Pydantic Model 对应（FastAPI）

```python
# 请求模型
class InitRequest(BaseModel):
    userData: str
    channelDesc: str = ""

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

# 统一响应
class ApiError(BaseModel):
    code: str
    message: str

class ApiResponse(BaseModel):
    success: bool
    data: Any = None
    error: ApiError | None = None
    timestamp: str
```

---

## 7. 后续建议

- FastAPI 直接用 Pydantic Model 作为请求/响应类型，自动生成 `/docs`（Swagger）
- TypeScript 前端用 `openapi-typescript` 从 Swagger 自动生成类型
- 三者（TypeScript ↔ OpenAPI ↔ Pydantic）同一份接口契约，联调零摩擦
