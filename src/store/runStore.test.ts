// Regression test for the workbench simulate engine (Codex BCD acceptance item 3/6).
// Guarantees:
//   - simulate() advances through the audit gates S3/S6/S8 (with approveReview)
//   - terminal state: S9 is 'active' WITH full run state (percent / checklist / currentItem)
//   - the run-state selector returns the real status, not an empty fallback
//
// The engine uses window.setTimeout; the test env is node, so we stub window→globalThis
// and drive the timer chain with fake timers.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useRun } from "./runStore";

/** flush a few microtask ticks so dataProvider (Promise.resolve) loads settle */
async function flushMicrotasks() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

describe("runStore simulate engine", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
    vi.useFakeTimers();
  });
  afterEach(() => {
    useRun.getState().stopSim();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("S1→S8 (approving audit gates) ends with S9 active + full run state", async () => {
    const r = useRun.getState();
    r.loadRun();
    r.loadNodes();
    r.loadStages();
    await flushMicrotasks();

    // sanity: S1 active at the start, S9 pending
    expect(useRun.getState().run.nodes["s1"].status).toBe("active");
    expect(useRun.getState().run.nodes["s9"].status).toBe("pending");

    useRun.getState().simulate();

    // Drive the timer chain; approve at each audit pause (S3①/S6②/S8③).
    const approved: string[] = [];
    for (let i = 0; i < 400 && useRun.getState().simPhase !== "done"; i++) {
      await vi.advanceTimersByTimeAsync(250);
      const st = useRun.getState();
      if (st.simPhase === "awaiting_review" && st.pendingNodeId) {
        approved.push(st.pendingNodeId);
        st.approveReview();
      }
    }

    const st = useRun.getState();

    // Reached terminal state.
    expect(st.simPhase).toBe("done");

    // The three audit gates within S1..S8 paused and were approved → done.
    expect(approved).toEqual(["s3", "s6", "s8"]);
    expect(st.run.nodes["s3"].status).toBe("done");
    expect(st.run.nodes["s6"].status).toBe("done");
    expect(st.run.nodes["s8"].status).toBe("done");

    // S9 is the active running stage WITH full run state.
    const s9 = st.run.nodes["s9"];
    expect(s9.status).toBe("active");
    expect(s9.percent).toBeGreaterThan(0);
    expect(s9.totalCount).toBeGreaterThan(0);
    expect(s9.currentItem).toBeTruthy();
    expect(s9.checklist && s9.checklist.length).toBeGreaterThan(0);
    // partial progress (not an all-false / empty checklist)
    expect(s9.checklist?.some((c) => c.done)).toBe(true);

    // Selector returns the real status, not a generic 'pending' fallback.
    expect(useRun.getState().nodeStatus("s9")).toBe("active");
  });

  it("resetSim returns to the S1 起步 state", async () => {
    const r = useRun.getState();
    r.resetSim();
    await flushMicrotasks();
    const st = useRun.getState();
    expect(st.simPhase).toBe("idle");
    expect(st.run.nodes["s1"].status).toBe("active");
    expect(st.run.nodes["s9"].status).toBe("pending");
  });
});
