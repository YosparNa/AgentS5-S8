# S7/S8 状态同步保护修复总结

## 问题描述
S6 审核通过后，工作台（FlowStrip）立即显示 S7 和 S8 为完成状态，但实际上 S7 还在后端生成中（需要90秒）。

## 根本原因分析

### 核心问题
`_syncStagesToRun()` 函数在同步后端状态到前端时，没有检查当前的工作流阶段，会盲目地根据后端返回的 `completed` 状态来覆盖 `run.nodes` 中的状态。

### 详细流程

1. **S6 审核通过时**
   - 前端调用 `approveStage("S6")`
   - 后端返回 workflow 状态
   - 前端手动设置 S6=done, S7=active
   - 调用 `loadStages()` 刷新界面

2. **S7 运行期间（90秒）**
   - 前端启动进度计时器，每100ms更新 `progressPct`
   - **关键问题**：后端可能同时返回 S7/S8 的状态为 "completed"
   - `_syncStagesToRun()` 不加过滤地同步所有 stages

3. **状态覆盖发生**
   ```typescript
   // 问题代码（第 137-144 行）
   const isDone = s.status === "completed" || s.status === "done";
   runNodes[key] = {
     status: isDone ? "done" : status,  // ← S7/S8 被设为 done
     percent: isDone ? 100 : ...,        // ← percent 被设为 100
   };
   ```

### 代码注释证据
第 879-880 行注释已明确指出：
```
// S7 完成后，手动设置 S7=done, S8=pending（不使用 _syncStagesToRun，
// 因为后端返回的 workflow 会把 S8 标记为 active，跳过用户确认阶段）
```

## 修复方案

### 修复 1: 增强 `_syncStagesToRun` 的阶段感知机制
**文件**: `src/store/runStore.ts`
**行号**: 第 132-160 行

修改后的逻辑：
```typescript
function _syncStagesToRun(wfv: WorkflowView, set: Function, get: Function) {
  const runNodes: Record<string, NodeRun> = { ...get().run.nodes };
  const currentAutoStep = get().currentAutoStep;

  // 保护正在运行或待确认的阶段
  const protectedStages = new Set<string>();
  if (currentAutoStep === "s7" || currentAutoStep === "s7_edit") protectedStages.add("s7");
  if (currentAutoStep === "s8" || currentAutoStep === "s8_review") protectedStages.add("s8");

  for (const s of wfv.stages) {
    const key = s.stage_code.toLowerCase();

    // 跳过受保护的阶段，避免覆盖正在进行的状态
    if (protectedStages.has(key)) continue;

    const status = s.status as RunStatus;
    const isDone = s.status === "completed" || s.status === "done";
    runNodes[key] = {
      ...runNodes[key],
      status: isDone ? "done" : status,
      percent: isDone ? 100 : status === "active" ? 50 : 0,
      doneCount: isDone ? 1 : 0,
      totalCount: 1,
    };
  }
  // ... 后续逻辑
}
```

**改进点**：
- 在同步前检查 `currentAutoStep`
- 如果当前正处于 S7/S8 的运行或审核阶段，则跳过对该阶段的状态覆盖
- 保护了正在进行的阶段不被后端预设的状态干扰

### 修复 2: 防止 WorkbenchView 重挂载导致的状态重置
**文件**: `src/store/runStore.ts`
**行号**: 第 430-443 行

修改 `loadRun()` 函数，增加缓存检查：
```typescript
loadRun(wfId) {
  // 如果 wfId 未改变且 run 已有状态，则跳过重新加载（避免状态重置）
  if (wfId && get().wfId === wfId && Object.keys(get().run.nodes).length > 0) {
    return;
  }
  // Load per-stage simulate targets too...
  dataProvider.getStageRunMock().then((m) => set({ stageRunMock: m }));
  dataProvider.getRunFlow(wfId).then((loaded) => {
    clearAllTimers();
    set({
      run: loaded,
      currentNodeId: loaded.currentNodeId,
      simPhase: "idle",
      pendingNodeId: null,
    });
  });
},
```

**改进点**：
- 当 WorkbenchView 重新 mount 时，如果 `wfId` 没有改变，则跳过重新加载
- 避免了由于 React 重渲染导致的状态重置问题
- 特别保护了 S7/S8 运行期间的状态

### 修复 3: 增强 LiveTab 的运行状态显示
**文件**: `src/components/drawer/LiveTab.tsx`
**行号**: 第 290-310 行

改进标题卡片显示逻辑：
```tsx
<div className="text-[10px] text-gray-500 mt-0.5">
  {isRunning ? (
    <span className="text-indigo-600 blink">正在运行...</span>
  ) : otherStageRunning ? (
    <span className="text-amber-600">
      {STAGE_META[runningStage!]?.title ?? runningStage} 正在运行
    </span>
  ) : pct >= 100 ? (
    <span className="text-emerald-600">执行完成</span>
  ) : (
    <span>等待执行</span>
  )}
</div>
```

**改进点**：
- 添加 `otherStageRunning` 检测，当其他阶段在运行时显示提示
- 用户能清楚地看到当前是哪个阶段在运行
- 避免了 S7/S8 状态闪烁时的混淆

## 测试验证

创建了单元测试 `src/store/statusProtection.test.ts`，包含 5 个测试用例：

1. ✅ 当 currentAutoStep 为 s7 时，不应该覆盖 S7 状态
2. ✅ 当 currentAutoStep 为 s8_review 时，不应该覆盖 S8 状态
3. ✅ 当 currentAutoStep 为 idle 时，应该允许覆盖所有状态
4. ✅ 当 wfId 相同时不应该重新加载
5. ✅ 当 wfId 改变时应该重新加载

所有测试通过：**5 passed**

## 影响范围

### 受影响文件
- `src/store/runStore.ts` - 核心修复
- `src/components/drawer/LiveTab.tsx` - UI 改进

### 不受影响
- 其他阶段（S1-S6）的状态同步逻辑保持不变
- 自动化工作流的后续阶段（S8 审核）不受影响
- 后端 API 调用保持不变

## 后续建议

1. **考虑缓存真实状态**：长期来看，`getRunFlow()` 应该从后端 API 获取真实状态，而不是 mock 数据
2. **添加状态版本控制**：为 `run.nodes` 添加版本号，避免竞态条件
3. **优化进度同步**：考虑使用 WebSocket 实时推送阶段状态，而不是轮询

## 修复验证步骤

1. 运行测试：`npm test -- statusProtection.test.ts`
2. 手动验证：
   - 创建新的 workflow
   - 运行 S5/S6
   - S6 审核通过后，观察 S7 的状态
   - S7 应该显示为 "active" 而非立即显示 "done"
   - LiveTab 应该正确显示 S7 的进度
