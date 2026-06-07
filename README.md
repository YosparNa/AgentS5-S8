# 视频剪辑流 Agent (S5-S8)

视频内容生产流水线：**选题 → 大纲 → 脚本 → 对抗审核**

架构：Plan-and-Execute + Multi-Agent Debate + Human-in-the-Loop

## 快速启动

```bash
pip install -r requirements.txt
python start_server.py
```

- 前端：http://localhost:8000/09index.html
- Swagger：http://localhost:8000/docs

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Python + FastAPI + WebSocket |
| 前端 | HTML + Tailwind CSS + vanilla JS |
| LLM | 小米 MiMo API (mimo-v2.5-pro) |

## 项目结构

```
app/
├── main.py              # FastAPI 路由 + WebSocket
├── llm.py               # LLM 客户端（MiMo API + JSON 容错）
├── pipeline.py           # 流程状态机 + 回滚判定
├── utils.py              # 公共工具
├── agents/
│   ├── s5_topic.py       # S5 选题（6维评分 + 50钩子模板）
│   ├── s6_outline.py     # S6 大纲（三幕式 + 张力曲线）
│   ├── s7_script.py      # S7 脚本（角色人格 + 去AI味）
│   └── s8_adversarial.py # S8 对抗（5角色并行审核）
└── prompts/
    ├── s5_topic.txt
    ├── s6_outline.txt
    ├── s7_script.txt
    └── s8_adversarial.txt

frontend/
├── 09index(S5-S8).html   # 主前端页面
└── static/

docs/
├── API_SPEC.md           # 接口契约（V1）
├── 交付对接文档.md        # 前端对接指南
├── S5-S8全功能流程说明文档.md
└── 开发进度文档.md
```

## API 接口

详见 [`docs/API_SPEC.md`](docs/API_SPEC.md)

统一响应格式：
```json
{
  "success": true,
  "data": { "artifact_type": "topic_candidates", "topics": [...] },
  "error": null,
  "timestamp": "2026-06-07T..."
}
```

## 配置

`.env` 文件：
```
XIAOMI_API_KEY=your_key_here
```

## 对接指南

详见 [`docs/交付对接文档.md`](docs/交付对接文档.md)
