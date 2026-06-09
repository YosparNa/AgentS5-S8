// 来源 PROTO lines 3687–3688 (renderOutput adversarial branch)
// Container-agnostic: takes `roles` and optional `synthesis` prop.

interface Issue {
  severity?: string;
  description?: string;
  [key: string]: unknown;
}

interface Role {
  avatar: string;
  name: string;
  score?: number;
  focus?: string;
  issues: Issue[] | number;
  suggestions?: string[];
  highlights?: string[];
  summary?: string;
  note?: string;
}

interface Synthesis {
  top_issues?: string[];
  all_highlights?: string[];
  issue_count?: { high?: number; medium?: number; low?: number };
}

interface Props {
  roles: Role[];
  synthesis?: Synthesis;
  averageScore?: number;
}

export function AdversarialArtifact({ roles, synthesis, averageScore }: Props) {
  return (
    <div className="space-y-3">
      {/* 综合评分 */}
      {averageScore != null && averageScore > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-3">
          <span className="text-lg">📊</span>
          <div>
            <span className="text-[12px] font-bold text-amber-800">综合评分 </span>
            <span className="text-[14px] font-bold text-amber-900">{averageScore}</span>
            <span className="text-[11px] text-amber-600"> / 10</span>
          </div>
          {synthesis?.issue_count && (
            <div className="ml-auto flex gap-2 text-[10px]">
              {synthesis.issue_count.high != null && synthesis.issue_count.high > 0 && (
                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">高 {synthesis.issue_count.high}</span>
              )}
              {synthesis.issue_count.medium != null && synthesis.issue_count.medium > 0 && (
                <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">中 {synthesis.issue_count.medium}</span>
              )}
              {synthesis.issue_count.low != null && synthesis.issue_count.low > 0 && (
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">低 {synthesis.issue_count.low}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 各角色审核卡片 */}
      {roles.map((r, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
          {/* 头部：头像 + 名称 + 评分 + 关注点 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{r.avatar}</span>
            <span className="text-[12px] font-bold">{r.name}</span>
            {r.score != null && r.score > 0 && (
              <span className="text-[10px] mono bg-gray-100 px-1.5 rounded">{r.score}/10</span>
            )}
          </div>
          {r.focus && (
            <div className="text-[10px] text-gray-500 mb-2">关注：{r.focus}</div>
          )}

          {/* 问题列表 */}
          {Array.isArray(r.issues) && r.issues.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] font-bold text-red-600 mb-1">发现问题 ({r.issues.length} 条)</div>
              <ul className="space-y-1">
                {r.issues.map((issue, j) => (
                  <li key={j} className="text-[11px] text-gray-700 flex items-start gap-1">
                    <span className="text-red-400 shrink-0">•</span>
                    <span>{typeof issue === "string" ? issue : issue.description || JSON.stringify(issue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* 兼容旧格式：issues 是数字 */}
          {!Array.isArray(r.issues) && r.issues > 0 && (
            <div className="text-[10px] text-red-600 mb-2">{r.issues} 条问题</div>
          )}

          {/* 建议 */}
          {r.suggestions && r.suggestions.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] font-bold text-indigo-600 mb-1">改进建议</div>
              <ul className="space-y-1">
                {r.suggestions.map((s, j) => (
                  <li key={j} className="text-[11px] text-gray-700 flex items-start gap-1">
                    <span className="text-indigo-400 shrink-0">→</span>
                    <span>{typeof s === "string" ? s : (s as Record<string, unknown>).description as string || JSON.stringify(s)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 亮点 */}
          {r.highlights && r.highlights.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] font-bold text-emerald-600 mb-1">亮点</div>
              <ul className="space-y-1">
                {r.highlights.map((h, j) => (
                  <li key={j} className="text-[11px] text-gray-700 flex items-start gap-1">
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span>{typeof h === "string" ? h : (h as Record<string, unknown>).description as string || JSON.stringify(h)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 总结 */}
          {r.summary && (() => {
            const summaryText = typeof r.summary === "string" ? r.summary : String(r.summary);
            // 检测是否是 JSON 字符串
            let displayText = summaryText;
            try {
              if (summaryText.startsWith("{")) {
                const parsed = JSON.parse(summaryText);
                displayText = parsed.summary || parsed.text || summaryText;
              }
            } catch { /* 不是 JSON，直接显示 */ }
            return <div className="text-[11px] text-gray-600 bg-gray-50 rounded p-2 mt-1 whitespace-pre-wrap">{displayText}</div>;
          })()}
          {/* 兼容旧格式：note */}
          {!r.summary && r.note && (
            <div className="text-[11px] text-gray-600 bg-gray-50 rounded p-2 mt-1">{typeof r.note === "string" ? r.note : JSON.stringify(r.note)}</div>
          )}
        </div>
      ))}

      {/* 综合意见 */}
      {synthesis?.top_issues && synthesis.top_issues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
          <div className="text-[11px] font-bold text-red-700 mb-1">重点问题</div>
          <ul className="space-y-1">
            {synthesis.top_issues.map((issue, i) => (
              <li key={i} className="text-[11px] text-red-800">{typeof issue === "string" ? issue : JSON.stringify(issue)}</li>
            ))}
          </ul>
        </div>
      )}
      {synthesis?.all_highlights && synthesis.all_highlights.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
          <div className="text-[11px] font-bold text-emerald-700 mb-1">共同亮点</div>
          <ul className="space-y-1">
            {synthesis.all_highlights.map((h, i) => (
              <li key={i} className="text-[11px] text-emerald-800">{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
