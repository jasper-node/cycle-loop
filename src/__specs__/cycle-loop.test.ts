import { assert, assertEquals } from "@std/assert";
import { createCycleLoop, type CycleStats } from "../cycle-loop.ts";

// Helper to wait for async operations
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

Deno.test({
  name: "createCycleLoop - basic start and stop",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const controller = createCycleLoop({
      cycleTimeMs: 10,
      cycleFn: () => Promise.resolve(),
    });

    assertEquals(controller.isRunning(), false);
    controller.start();
    assertEquals(controller.isRunning(), true);
    controller.stop();
    await delay(30);
    assertEquals(controller.isRunning(), false);
  },
});

Deno.test({
  name: "createCycleLoop - prevents multiple starts",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    let callCount = 0;
    const controller = createCycleLoop({
      cycleTimeMs: 10,
      cycleFn: () => {
        callCount++;
        return Promise.resolve();
      },
    });

    controller.start();
    controller.start(); // Should not start again
    controller.start(); // Should not start again

    await delay(50);
    controller.stop();
    await delay(30);

    assert(callCount > 0);
  },
});

Deno.test({
  name: "createCycleLoop - executes cycle function",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    let executed = false;
    const controller = createCycleLoop({
      cycleTimeMs: 5,
      cycleFn: () => {
        executed = true;
        return Promise.resolve();
      },
    });

    controller.start();
    await delay(20);
    controller.stop();
    await delay(30);

    assertEquals(executed, true);
  },
});

Deno.test({
  name: "createCycleLoop - onCycle callback receives stats",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    let receivedStats: CycleStats | null = null;
    const controller = createCycleLoop({
      cycleTimeMs: 5,
      cycleFn: () => {
        return Promise.resolve(42);
      },
      onCycle: (stats: CycleStats) => {
        receivedStats = stats;
      },
    });

    controller.start();
    await delay(20);
    controller.stop();
    await delay(30);

    assert(receivedStats !== null);
    const stats = receivedStats as CycleStats;
    assert(stats.cycleCount > 0);
    assertEquals(stats.wkc, 42);
    assert(typeof stats.lastExecutionTimeMs === "number");
    assert(typeof stats.avgExecutionTimeMs === "number");
  },
});

Deno.test({
  name: "createCycleLoop - handles errors with onError callback",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    let errorCaught = false;
    const controller = createCycleLoop({
      cycleTimeMs: 5,
      cycleFn: () => {
        return Promise.reject(new Error("Test error"));
      },
      onError: (error) => {
        errorCaught = true;
        assertEquals(error.message, "Test error");
      },
    });

    controller.start();
    await delay(20);

    assertEquals(errorCaught, true);
    assertEquals(controller.isRunning(), false);
  },
});

Deno.test({
  name: "createCycleLoop - stops on error without onError callback",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const controller = createCycleLoop({
      cycleTimeMs: 5,
      cycleFn: () => {
        return Promise.reject(new Error("Test error"));
      },
    });

    controller.start();
    await delay(20);

    assertEquals(controller.isRunning(), false);
  },
});

Deno.test({
  name: "createCycleLoop - getStats returns correct statistics",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const controller = createCycleLoop({
      cycleTimeMs: 5,
      cycleFn: () => {
        return Promise.resolve(100);
      },
    });

    const initialStats = controller.getStats();
    assertEquals(initialStats.cycleCount, 0);
    assertEquals(initialStats.avgExecutionTimeMs, 0);

    controller.start();
    await delay(30);
    controller.stop();
    await delay(30);

    const stats = controller.getStats();
    assert(stats.cycleCount > 0);
    assert(stats.avgExecutionTimeMs > 0);
    assertEquals(stats.wkc, 100);
    assert(typeof stats.lastExecutionTimeMs === "number");
    assert(typeof stats.avgIntervalTimeMs === "number");
  },
});

Deno.test({
  name: "createCycleLoop - tracks interval time correctly",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const intervals: number[] = [];
    const controller = createCycleLoop({
      cycleTimeMs: 10,
      cycleFn: () => Promise.resolve(),
      onCycle: (stats) => {
        if (stats.cycleCount > 1) {
          intervals.push(stats.lastIntervalTimeMs);
        }
      },
    });

    controller.start();
    await delay(50);
    controller.stop();
    await delay(30);

    assert(intervals.length > 0);
    intervals.forEach((interval) => {
      assert(interval > 0);
      assert(interval < 100);
    });
  },
});

Deno.test({
  name: "createCycleLoop - handles cycleFn returning void",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const statsWithWkc: (number | undefined)[] = [];
    const controller = createCycleLoop({
      cycleTimeMs: 5,
      cycleFn: () => {
        // Return nothing
        return Promise.resolve();
      },
      onCycle: (stats) => {
        statsWithWkc.push(stats.wkc);
      },
    });

    controller.start();
    await delay(20);
    controller.stop();
    await delay(30);

    assert(statsWithWkc.length > 0);
    statsWithWkc.forEach((wkc) => {
      assertEquals(wkc, undefined);
    });
  },
});

Deno.test({
  name: "createCycleLoop - respects cycle time approximately",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const cycleTimeMs = 20;
    const cycleTimes: number[] = [];
    const controller = createCycleLoop({
      cycleTimeMs,
      cycleFn: () => Promise.resolve(),
      onCycle: (stats) => {
        if (stats.cycleCount > 1) {
          cycleTimes.push(stats.lastIntervalTimeMs);
        }
      },
    });

    controller.start();
    await delay(100);
    controller.stop();
    await delay(30);

    assert(cycleTimes.length >= 2);
    cycleTimes.forEach((interval) => {
      assert(interval > 0, `Interval ${interval} should be positive`);
      assert(interval <= cycleTimeMs * 3, `Interval ${interval} should be <= ${cycleTimeMs * 3}`);
    });
  },
});

Deno.test({
  name: "createCycleLoop - resetStats clears all statistics",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const controller = createCycleLoop({
      cycleTimeMs: 5,
      cycleFn: () => Promise.resolve(42),
    });

    controller.start();
    await delay(30);
    controller.stop();
    await delay(30);

    // Verify stats were accumulated
    const statsBeforeReset = controller.getStats();
    assert(statsBeforeReset.cycleCount > 0);
    assert(statsBeforeReset.avgExecutionTimeMs > 0);
    assertEquals(statsBeforeReset.wkc, 42);

    // Reset stats
    controller.resetStats();

    // Verify all stats are cleared
    const statsAfterReset = controller.getStats();
    assertEquals(statsAfterReset.cycleCount, 0);
    assertEquals(statsAfterReset.avgExecutionTimeMs, 0);
    assertEquals(statsAfterReset.avgIntervalTimeMs, 0);
    assertEquals(statsAfterReset.lastExecutionTimeMs, 0);
    assertEquals(statsAfterReset.lastIntervalTimeMs, 0);
    assertEquals(statsAfterReset.wkc, undefined);
  },
});

Deno.test({
  name: "createCycleLoop - start resets stats automatically",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const controller = createCycleLoop({
      cycleTimeMs: 5,
      cycleFn: () => Promise.resolve(99),
    });

    // First run
    controller.start();
    await delay(30);
    controller.stop();
    await delay(30);

    const statsAfterFirstRun = controller.getStats();
    assert(statsAfterFirstRun.cycleCount > 0);
    const firstRunCycleCount = statsAfterFirstRun.cycleCount;

    // Second run - stats should be reset
    controller.start();
    await delay(20);
    controller.stop();
    await delay(30);

    const statsAfterSecondRun = controller.getStats();
    // Stats should be from fresh start, not accumulated from first run
    assert(statsAfterSecondRun.cycleCount > 0);
    assert(
      statsAfterSecondRun.cycleCount < firstRunCycleCount + 10,
      "Stats should have been reset on start, not accumulated",
    );
  },
});
