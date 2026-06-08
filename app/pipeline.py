"""流程引擎：S5→S6→S7→S8 + 回滚状态机"""

import uuid
import time
from dataclasses import dataclass, field
from enum import Enum


class Stage(str, Enum):
    S5_TOPIC = "s5"
    S6_OUTLINE = "s6"
    S7_SCRIPT = "s7"
    S8_ADVERSARIAL = "s8"


class PipelineStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    AWAITING_USER = "awaiting_user"  # 等待用户选择/确认
    COMPLETED = "completed"
    ROLLBACK = "rollback"


@dataclass
class StageResult:
    stage: Stage
    data: dict  # 各阶段的输出数据
    version: int = 1
    timestamp: float = field(default_factory=time.time)


@dataclass
class RollbackEvent:
    from_stage: Stage
    to_stage: Stage
    reason: str
    scores: dict | None = None
    timestamp: float = field(default_factory=time.time)


@dataclass
class PipelineState:
    """单次视频制作流程的完整状态。"""

    id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    status: PipelineStatus = PipelineStatus.IDLE
    current_stage: Stage = Stage.S5_TOPIC

    # 各阶段结果（可有多版本，回滚后递增）
    topic_data: dict | None = None      # S5 输出
    topic_version: int = 0
    selected_topic: dict | None = None   # 用户选中的选题

    outline_data: dict | None = None    # S6 输出
    outline_version: int = 0

    script_data: str | None = None      # S7 输出（纯文本）
    script_version: int = 0

    adversarial_data: dict | None = None  # S8 输出
    adversarial_version: int = 0

    # 用户输入
    user_data: str = ""       # 用户喂入的数据
    channel_desc: str = ""    # 频道定位描述
    stage_config: dict = field(default_factory=dict)  # 当前阶段配置

    # 历史记录
    history: list[dict] = field(default_factory=list)
    rollbacks: list[RollbackEvent] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "status": self.status.value,
            "current_stage": self.current_stage.value,
            "topic_data": self.topic_data,
            "topic_version": self.topic_version,
            "selected_topic": self.selected_topic,
            "outline_data": self.outline_data,
            "outline_version": self.outline_version,
            "script_data": self.script_data,
            "script_version": self.script_version,
            "adversarial_data": self.adversarial_data,
            "adversarial_version": self.adversarial_version,
            "user_data": self.user_data,
            "channel_desc": self.channel_desc,
            "stage_config": self.stage_config,
            "history": self.history,
            "rollbacks": [
                {
                    "from": r.from_stage.value,
                    "to": r.to_stage.value,
                    "reason": r.reason,
                    "scores": r.scores,
                    "time": r.timestamp,
                }
                for r in self.rollbacks
            ],
        }

    def add_history(self, action: str, detail: str = ""):
        self.history.append({
            "action": action,
            "detail": detail,
            "stage": self.current_stage.value,
            "time": time.time(),
        })


# ===== 回滚判定逻辑 =====

def evaluate_adversarial_result(result: dict) -> tuple[str, dict]:
    """
    评估 S8 对抗结果，返回 (决策, 详情)。
    决策: "pass" | "rollback_s7" | "rollback_s5"
    """
    roles = result.get("roles", [])
    if not roles:
        return "rollback_s7", {"reason": "对抗结果为空"}

    scores = {r["name"]: r.get("score", 5) for r in roles}
    avg_score = sum(scores.values()) / len(scores)
    min_score = min(scores.values())
    min_role = min(scores, key=lambda k: scores[k])

    detail = {
        "average": round(avg_score, 1),
        "min": min_score,
        "min_role": min_role,
        "scores": scores,
    }

    if avg_score >= 7 and min_score >= 4:
        return "pass", detail
    elif avg_score >= 5:
        return "rollback_s7", {**detail, "reason": f"平均分 {avg_score:.1f}，需修补脚本"}
    else:
        return "rollback_s5", {**detail, "reason": f"平均分 {avg_score:.1f}，选题方向需重做"}
