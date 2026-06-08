"""Agent 公共工具函数"""

from app.pipeline import PipelineState


def get_config(state: PipelineState) -> dict:
    """从 state 中安全获取配置。"""
    return getattr(state, 'stage_config', {}) or {}


def build_config_instructions(config: dict, mapping: list[tuple]) -> str:
    """
    从前端配置 dict 生成提示词附加指令。

    mapping: [(config_key, label, value_map), ...]
      - config_key: 配置字段名
      - label: 提示词中的描述
      - value_map: 值到提示词的映射 dict，或 None 表示直接使用值

    示例：
      build_config_instructions(config, [
          ('avoid_shock', '排除震惊体标题', {True: '是', False: '否'}),
          ('emotion_conflict', '认知冲突权重', None),
          ('hook_strategy', '钩子策略', {'anti_consensus': '反常识开头'}),
      ])
    """
    parts = []
    for key, label, value_map in mapping:
        val = config.get(key)
        if val is None:
            continue
        if isinstance(value_map, dict):
            text = value_map.get(val)
            if text:
                parts.append(f"{label}：{text}")
        elif isinstance(val, bool):
            if val:
                parts.append(label)
        else:
            parts.append(f"{label}={val}")
    return "\n".join(parts) if parts else ""
