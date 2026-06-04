# Project: 视频剪辑流 Agent (S5-S8)

## 项目概述
基于 FastAPI + HTML 的视频内容生产 Agent，实现选题→大纲→脚本→对抗审核的完整流水线。
架构范式：Plan-and-Execute + Multi-Agent Debate + Human-in-the-Loop

## 开发偏好
- **必须用 Skill**：每次收到任务时，必须先检查 Skill 清单，有匹配的就自动调用
- **触发条件**：
  - 收到新功能开发任务 → 先调用 `superpowers:writing-plans`
  - 遇到 bug 或异常 → 先调用 `superpowers:systematic-debugging`
  - 做 UI/前端相关 → 调用 `frontend-design:frontend-design`
  - 需要搜索资料 → 用内置 WebSearch（Firecrawl 有额度限制）
  - 需要全文抓取、批量爬取、网页内容提取 → 用 `firecrawl:firecrawl-scrape` 或 `firecrawl:firecrawl-crawl`
  - 完成开发前 → 调用 `superpowers:verification-before-completion`
- **网页搜索优先用内置 WebSearch**：日常搜索用内置工具，Firecrawl 有额度限制，只在需要全文抓取、批量爬取等内置工具做不到的场景才用
- **平台数据采集用 OpenCLI**：需要抓取小红书/B站/知乎/微博/推特等平台数据时，使用 `opencli` 命令行工具
- 输出链接时必须准确，不能出错
- 用 toast 弹窗替代 alert() 提示用户（居中、渐变、1.2秒自动消失、新弹覆盖旧弹）
- 确认弹窗用自定义 showConfirm（居中、带取消/确定按钮）
- 输入框选中颜色用蓝色
- 所有配置项必须真正传输到后端并影响生成结果
- 按钮逻辑不能互相干扰，每个阶段独立
- 失败时保留旧数据不丢失

## 可用 Skill 清单

### 规划与设计
| Skill | 何时用 |
|-------|--------|
| `superpowers:writing-plans` | 开发新功能前，先写实现方案 |
| `superpowers:brainstorming` | 创意工作前，探索需求和设计 |
| `superpowers:executing-plans` | 执行已有计划，分步实现 |

### 开发与调试
| Skill | 何时用 |
|-------|--------|
| `superpowers:systematic-debugging` | 遇到 bug 或异常行为时系统排查 |
| `superpowers:test-driven-development` | 写功能前先写测试 |
| `superpowers:subagent-driven-development` | 多个独立任务并行开发 |
| `superpowers:dispatching-parallel-agents` | 2个以上独立任务可并行处理 |

### 前端
| Skill | 何时用 |
|-------|--------|
| `frontend-design:frontend-design` | UI 界面设计和改版 |

### 代码质量
| Skill | 何时用 |
|-------|--------|
| `superpowers:requesting-code-review` | 完成功能后请求代码审查 |
| `superpowers:receiving-code-review` | 收到审查反馈后处理建议 |
| `superpowers:verification-before-completion` | 声称完成前先验证 |

### 版本控制
| Skill | 何时用 |
|-------|--------|
| `superpowers:finishing-a-development-branch` | 功能完成后决定合并/PR/清理 |
| `superpowers:using-git-worktrees` | 需要隔离环境开发新功能时 |

### 网络数据采集（后期接入数据源用）
| Skill | 何时用 |
|-------|--------|
| `firecrawl:firecrawl-scrape` | 抓取网页内容（竞品视频、评论） |
| `firecrawl:firecrawl-search` | 搜索网络数据（热点、行业报告） |

### Skill 开发
| Skill | 何时用 |
|-------|--------|
| `superpowers:writing-skills` | 创建或编辑 Skill |

## 外部工具
| 工具 | 用途 | 安装状态 |
|------|------|---------|
| Firecrawl | 网页搜索、内容抓取、批量爬取 | ✅ 已安装（需 API Key） |
| OpenCLI | 平台数据采集（小红书/B站/知乎/微博等） | ✅ v1.8.2 |

### 使用规则
- **通用网页搜索/抓取** → Firecrawl Skill
- **特定平台数据（评论、热点、视频信息）** → OpenCLI CLI
- 两者互补，根据场景选择

## 技术栈
- 后端: Python + FastAPI
- 前端: HTML + Tailwind CSS + vanilla JS
- LLM: 小米 MiMo API (OpenAI 兼容)
- 端口: 8000

## 项目结构
```
E:\Agent-L3\
├── app/
│   ├── main.py           # FastAPI 路由 + WebSocket
│   ├── llm.py            # LLM 客户端（MiMo API + JSON容错）
│   ├── pipeline.py       # 流程状态机
│   ├── utils.py          # 公共工具函数
│   ├── agents/
│   │   ├── s5_topic.py
│   │   ├── s6_outline.py
│   │   ├── s7_script.py
│   │   └── s8_adversarial.py
│   └── prompts/
│       ├── s5_topic.txt / s5_eval.txt
│       ├── s6_outline.txt / s6_eval.txt
│       ├── s7_script.txt
│       └── s8_adversarial.txt
├── frontend/
│   ├── 09index(S5-S8).html
│   ├── 09index源文件.html
│   └── static/
├── docs/
│   ├── API文档.md
│   ├── S5-S8完整流程文档.md
│   ├── AI口播脚本提示词整理.md
│   └── 开发进度文档.md
├── CLAUDE.md
├── start_server.py
└── requirements.txt
```

## 启动命令
```bash
python E:\Agent-L3\start_server.py
# 访问 http://localhost:8000/09index.html
```

## LLM 配置
- Provider: 小米 MiMo
- Base URL: https://token-plan-cn.xiaomimimo.com/v1
- Model: mimo-v2.5-pro
- API Key: XIAOMI_API_KEY (在 .env 中)
