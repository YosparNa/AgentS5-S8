"""LLM 客户端封装（小米 MiMo）— 使用 requests 绕过代理 SSL 问题"""

import os
import json
import re
import requests
from pathlib import Path
from dotenv import load_dotenv

# 加载项目根目录的 .env
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

API_KEY = os.getenv("XIAOMI_API_KEY", "")
BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1"
DEFAULT_MODEL = "mimo-v2.5-pro"


def _call_api(messages: list[dict], model: str, temperature: float, max_tokens: int, response_format: dict | None = None) -> str:
    """直接调用 MiMo API，使用 requests（绕过 httpx/openai 的代理 SSL 问题）。"""
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_format:
        payload["response_format"] = response_format

    resp = requests.post(
        f"{BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=300,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def chat(
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 4096,
    response_format: dict | None = None,
) -> str:
    """单次对话调用，返回文本。"""
    return _call_api(messages, model, temperature, max_tokens, response_format)


def chat_json(
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> dict:
    """对话调用，强制返回 JSON 对象。"""
    text = _call_api(messages, model, temperature, max_tokens, {"type": "json_object"})
    return _extract_json(text)


def _fix_control_chars(s: str) -> str:
    """修复 JSON 字符串中的裸控制字符。"""
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
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass
    try:
        return json.loads(_fix_control_chars(s))
    except (json.JSONDecodeError, ValueError):
        pass
    try:
        cleaned = re.sub(r',\s*([}\]])', r'\1', s)
        return json.loads(_fix_control_chars(cleaned))
    except (json.JSONDecodeError, ValueError):
        pass
    try:
        cleaned = s.replace("'", '"')
        return json.loads(_fix_control_chars(cleaned))
    except (json.JSONDecodeError, ValueError):
        pass
    return None


def _extract_json(text: str) -> dict:
    """从 LLM 回复中提取 JSON，处理各种格式。"""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if "```" in text:
            text = text.rsplit("```", 1)[0]
        text = text.strip()
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()

    result = _try_parse(text)
    if result is not None:
        return result

    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        result = _try_parse(match.group())
        if result is not None:
            return result

    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        result = _try_parse(match.group())
        if result is not None:
            return result

    raise ValueError(f"无法从 LLM 回复中提取 JSON: {text[:300]}")
