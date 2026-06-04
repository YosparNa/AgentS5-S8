"""OpenAI 兼容的 LLM 客户端封装（小米 MiMo）"""

import os
import json
import re
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# 加载项目根目录的 .env
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

client = OpenAI(
    api_key=os.getenv("XIAOMI_API_KEY", ""),
    base_url="https://token-plan-cn.xiaomimimo.com/v1",
)

DEFAULT_MODEL = "mimo-v2.5-pro"


def chat(
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 4096,
    response_format: dict | None = None,
) -> str:
    """单次对话调用，返回文本。"""
    kwargs = dict(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    if response_format:
        kwargs["response_format"] = response_format
    resp = client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content


def chat_json(
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> dict:
    """对话调用，强制返回 JSON 对象。"""
    text = chat(
        messages=messages,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )
    return _extract_json(text)


def _fix_control_chars(s: str) -> str:
    """修复 JSON 字符串中的裸控制字符。
    LLM 经常在 JSON 字符串值里生成裸换行符/制表符，
    违反 JSON 规范导致 json.loads 失败。"""
    result = []
    in_string = False
    escape_next = False
    for c in s:
        if escape_next:
            result.append(c)
            escape_next = False
            continue
        if c == '\\' and in_string:
            result.append(c)
            escape_next = True
            continue
        if c == '"':
            in_string = not in_string
            result.append(c)
            continue
        if in_string and c in ('\n', '\r', '\t'):
            result.append({'\n': '\\n', '\r': '\\r', '\t': '\\t'}[c])
            continue
        result.append(c)
    return ''.join(result)


def _try_parse(s: str):
    """尝试多种方式解析 JSON。"""
    # 1. 直接解析
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass

    # 2. 修复控制字符
    try:
        return json.loads(_fix_control_chars(s))
    except (json.JSONDecodeError, ValueError):
        pass

    # 3. 修复尾逗号
    try:
        cleaned = re.sub(r',\s*([}\]])', r'\1', s)
        return json.loads(_fix_control_chars(cleaned))
    except (json.JSONDecodeError, ValueError):
        pass

    # 4. 修复单引号
    try:
        cleaned = s.replace("'", '"')
        return json.loads(_fix_control_chars(cleaned))
    except (json.JSONDecodeError, ValueError):
        pass

    return None


def _extract_json(text: str) -> dict:
    """从 LLM 回复中提取 JSON，处理各种格式。"""
    text = text.strip()

    # 去掉 markdown 代码块
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if "```" in text:
            text = text.rsplit("```", 1)[0]
        text = text.strip()

    # 去掉 <think>...</think> 标签
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()

    # 先尝试完整文本
    result = _try_parse(text)
    if result is not None:
        return result

    # 提取第一个 { ... } 块
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        result = _try_parse(match.group())
        if result is not None:
            return result

    # 提取第一个 [ ... ] 块
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        result = _try_parse(match.group())
        if result is not None:
            return result

    raise ValueError(f"无法从 LLM 回复中提取 JSON: {text[:300]}")
