// 来源 PROTO 2742-2921 + 计划 D-E ④
// Pure typed constants — no logic. Simulate engine lives in runStore.

import type { RunFlow, NodeRun } from "@/types";

export const INITIAL_RUN: RunFlow = {
  currentNodeId: "s1",
  nodes: {
    s0: { status: "done" },
    s1: {
      status: "active",
      percent: 0,
      doneCount: 0,
      totalCount: 3,
      currentItem: "拉候选词",
      checklist: [
        { label: "拉候选词", done: false },
        { label: "双轨打分", done: false },
        { label: "出评分卡", done: false },
      ],
      mountedContext: [
        { layer: "central", label: "赛道评分模型" },
        { layer: "channel", label: "定位" },
      ],
    },
    s2: { status: "pending" },
    s25: { status: "pending" },
    s3: { status: "pending" },
    s4: { status: "pending" },
    s5: { status: "pending" },
    s6: { status: "pending" },
    s7: { status: "pending" },
    s8: { status: "pending" },
    s9: { status: "pending" },
    s10: { status: "pending" },
    s11: { status: "pending" },
    s12: { status: "pending" },
    s13: { status: "pending" },
    s14: { status: "pending" },
    s15: { status: "pending" },
    final: { status: "pending" },
    s16: { status: "pending" },
    s17: { status: "pending" },
  },
};

/**
 * Per-stage simulate targets used by the simulate engine in runStore.
 * Checklist items all start done:false; the engine ticks them one-by-one.
 */
export const STAGE_RUN_MOCK: Record<string, Partial<NodeRun>> = {
  s1: {
    mountedContext: [
      { layer: "central", label: "赛道评分模型" },
      { layer: "channel", label: "定位" },
    ],
    checklist: [
      { label: "拉候选词", done: false },
      { label: "双轨打分", done: false },
      { label: "出评分卡", done: false },
    ],
    totalCount: 3,
  },
  s2: {
    mountedContext: [
      { layer: "channel", label: "S1 关键词组" },
      { layer: "video", label: "选题" },
    ],
    checklist: [
      { label: "多路发现", done: false },
      { label: "去重", done: false },
      { label: "LLM 分层", done: false },
    ],
    totalCount: 12,
    currentItem: "12 账号",
  },
  s25: {
    mountedContext: [
      { layer: "central", label: "解构模板" },
      { layer: "channel", label: "12 对标" },
    ],
    checklist: [
      { label: "取样 6", done: false },
      { label: "转写", done: false },
      { label: "6 维解构", done: false },
    ],
    totalCount: 6,
  },
  s3: {
    mountedContext: [{ layer: "channel", label: "S1+S2" }],
    checklist: [
      { label: "提炼频道核心定位", done: false },
      { label: "确定目标受众画像", done: false },
      { label: "输出频道 DNA", done: false },
    ],
    totalCount: 3,
  },
  s4: {
    mountedContext: [
      { layer: "central", label: "热点规则" },
      { layer: "channel", label: "关键词" },
    ],
    checklist: [
      { label: "抓取", done: false },
      { label: "相关性", done: false },
      { label: "机会分", done: false },
    ],
    totalCount: 5,
  },
  s5: {
    mountedContext: [
      { layer: "video", label: "用户指令" },
      { layer: "channel", label: "频道定位" },
      { layer: "central", label: "L1 选题套路" },
    ],
    checklist: [
      { label: "生成候选选题", done: false },
      { label: "多维评分", done: false },
      { label: "锁定最优选题", done: false },
    ],
    totalCount: 3,
  },
  s6: {
    mountedContext: [{ layer: "video", label: "热点" }],
    checklist: [
      { label: "选题打分", done: false },
      { label: "定题", done: false },
      { label: "生成大纲", done: false },
    ],
    totalCount: 11,
  },
  s7: {
    mountedContext: [{ layer: "video", label: "S6 大纲" }],
    checklist: [
      { label: "写初稿", done: false },
      { label: "5 角色质疑", done: false },
      { label: "改 V3", done: false },
    ],
    totalCount: 4820,
    currentItem: "4,820 字",
  },
  s8: {
    mountedContext: [{ layer: "video", label: "大纲" }],
    checklist: [
      { label: "写初稿", done: false },
      { label: "5 角色质疑", done: false },
      { label: "改 V3", done: false },
    ],
    totalCount: 4820,
    currentItem: "4,820 字",
  },
  s9: {
    mountedContext: [
      { layer: "central", label: "Skill_Storyboard_02" },
      { layer: "channel", label: "12 对标" },
      { layer: "video", label: "脚本 V3" },
    ],
    checklist: [
      { label: "读脚本 V3", done: false },
      { label: "应用 Skill", done: false },
      { label: "生成 38 分镜", done: false },
    ],
    totalCount: 38,
    doneCount: 29,
    percent: 76,
    currentItem: "M-018",
  },
};
