import { describe, it, expect } from "vitest";
import { radarHash, scoreColor, clampCompare, radarGenericCluster, resolveRadarQuery } from "./radar";

describe("radar utils", () => {
  it("radarHash is stable & non-negative", () => {
    expect(radarHash("ai")).toBe(radarHash("ai"));
    expect(radarHash("x")).toBeGreaterThanOrEqual(0);
  });
  it("scoreColor thresholds", () => {
    expect(scoreColor(8.1)).toContain("indigo");
    expect(scoreColor(7.2)).toContain("amber");
    expect(scoreColor(5)).toContain("gray");
  });
  it("clampCompare caps at 4 and toggles", () => {
    expect(clampCompare(["a", "b", "c", "d"], "e")).toEqual(["a", "b", "c", "d"]);
    expect(clampCompare(["a"], "b")).toEqual(["a", "b"]);
    expect(clampCompare(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("radarGenericCluster", () => {
  it("returns a cluster with valid verdictTone (no vcls string)", () => {
    const c = radarGenericCluster("烹饪教学");
    expect(["blue", "neutral", "red"]).toContain(c.verdictTone);
    // must NOT contain a Tailwind bg- class string
    expect(c.verdictTone).not.toMatch(/bg-/);
  });

  it("is deterministic for the same query", () => {
    const a = radarGenericCluster("fitness tips");
    const b = radarGenericCluster("fitness tips");
    expect(a.score).toBe(b.score);
    expect(a.key).toBe(b.key);
  });

  it("key starts with r_q_ prefix", () => {
    expect(radarGenericCluster("随机词汇").key).toMatch(/^r_q_/);
  });

  it("windowTone is pending for generic cluster", () => {
    expect(radarGenericCluster("anything").windowTone).toBe("pending");
  });
});

describe("resolveRadarQuery", () => {
  it("hits a pooled cluster when query matches monitored track keyword ('ai')", () => {
    const r = resolveRadarQuery("ai 工具");
    expect(r.pooledCount).toBeGreaterThanOrEqual(1);
    const pooled = r.clusters.find((c) => c.pooled);
    expect(pooled).toBeDefined();
    expect(pooled?.key).toBe("ai");
  });

  it("returns preset new clusters for '存钱' query", () => {
    const r = resolveRadarQuery("存钱挑战");
    expect(r.newCount).toBeGreaterThanOrEqual(1);
    const keys = r.clusters.map((c) => c.key);
    expect(keys).toContain("r_save");
  });

  it("falls back to generic cluster for random string", () => {
    const q = "xyzzy_无法匹配的关键词";
    const r = resolveRadarQuery(q);
    expect(r.clusters).toHaveLength(1);
    expect(r.clusters[0].pooled).toBe(false);
    expect(r.clusters[0].key).toMatch(/^r_q_/);
  });

  it("clusters are sorted by score descending", () => {
    const r = resolveRadarQuery("老年银发退休");
    for (let i = 0; i < r.clusters.length - 1; i++) {
      expect(r.clusters[i].score).toBeGreaterThanOrEqual(r.clusters[i + 1].score);
    }
  });

  it("newCount + pooledCount equals clusters.length", () => {
    const r = resolveRadarQuery("投资理财");
    expect(r.newCount + r.pooledCount).toBe(r.clusters.length);
  });

  it("raw and creatorsScanned are positive integers", () => {
    const r = resolveRadarQuery("健康");
    expect(r.raw).toBeGreaterThan(0);
    expect(r.creatorsScanned).toBeGreaterThan(0);
  });

  it("no cluster carries a vcls/wcls/scoreCls string field", () => {
    const r = resolveRadarQuery("ai fitness sleep");
    for (const c of r.clusters) {
      // none of these legacy fields should exist
      const obj = c as unknown as Record<string, unknown>;
      expect(obj["vcls"]).toBeUndefined();
      expect(obj["wcls"]).toBeUndefined();
      expect(obj["scoreCls"]).toBeUndefined();
    }
  });
});
