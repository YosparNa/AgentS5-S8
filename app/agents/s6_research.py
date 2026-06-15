"""S6.5 素材补充 Agent：扫描大纲中缺少真实案例的章节，搜索补充素材"""

import re
from duckduckgo_search import DDGS


def _extract_search_queries(outline: list[dict]) -> list[dict]:
    """从大纲中提取需要补充素材的章节和搜索关键词。"""
    queries = []
    for ch in outline:
        desc = ch.get("description", "")
        title = ch.get("title", "")
        # 检查是否有 [需补充案例] 标记
        if "[需补充案例]" in desc or "[需补充" in desc:
            # 提取关键词：用章节标题 + 描述中的核心名词
            clean_desc = re.sub(r'\[需补充[^\]]*\]', '', desc).strip()
            query = f"{title} {clean_desc}"[:80]
            queries.append({
                "chapter": ch.get("chapter", 0),
                "title": title,
                "query": query,
                "original_desc": desc,
            })
    return queries


def _search_cases(query: str, max_results: int = 3) -> list[dict]:
    """用 DuckDuckGo 搜索真实案例。"""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results, region="cn-zh"))
            return [
                {
                    "title": r.get("title", ""),
                    "snippet": r.get("body", "")[:200],
                    "url": r.get("href", ""),
                }
                for r in results
            ]
    except Exception as e:
        return [{"title": "搜索失败", "snippet": str(e), "url": ""}]


def research(outline_data: dict) -> dict:
    """扫描大纲，搜索补充素材。返回 {chapter: int, cases: [...]} 列表。"""
    outline = outline_data.get("outline", [])
    if not outline:
        return {"results": [], "total_searched": 0}

    queries = _extract_search_queries(outline)
    if not queries:
        return {"results": [], "total_searched": 0}

    results = []
    for q in queries:
        cases = _search_cases(q["query"])
        results.append({
            "chapter": q["chapter"],
            "title": q["title"],
            "query": q["query"],
            "cases": cases,
        })

    return {
        "results": results,
        "total_searched": len(queries),
    }


def build_research_context(research_result: dict) -> str:
    """将搜索结果格式化为 S7 prompt 可用的上下文文本。"""
    if not research_result or not research_result.get("results"):
        return ""

    lines = ["## 搜索到的真实素材（用于替换 [需补充案例] 标记）\n"]
    for r in research_result["results"]:
        lines.append(f"### 第{r['chapter']}章：{r['title']}")
        lines.append(f"搜索关键词：{r['query']}")
        for i, case in enumerate(r["cases"], 1):
            lines.append(f"  {i}. **{case['title']}**")
            lines.append(f"     {case['snippet']}")
            if case.get("url"):
                lines.append(f"     来源：{case['url']}")
        lines.append("")

    return "\n".join(lines)
