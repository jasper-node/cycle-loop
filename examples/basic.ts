/**
 * Basic example demonstrating the cycle loop utility.
 *
 * This example runs a cycle loop with a 10ms cycle time and demonstrates:
 * - Starting and stopping the loop
 * - Monitoring cycle statistics
 * - Handling errors
 */

import { createCycleLoop } from "../src/mod.ts";

// Simulate some work that takes a variable amount of time
async function simulateWork(): Promise<number> {
  // Simulate work that takes 1-3ms
  const workTime = Math.random() * 2 + 1;
  await new Promise((resolve) => setTimeout(resolve, workTime));

  // Return a simulated working counter
  return Math.floor(Math.random() * 10) + 1;
}

// Create the cycle loop controller
const controller = createCycleLoop({
  cycleTimeMs: 10, // 10ms cycle time
  cycleFn: async () => {
    const wkc = await simulateWork();
    return wkc;
  },
  onCycle: (stats) => {
    // Log statistics every 10 cycles
    if (stats.cycleCount % 10 === 0) {
      console.log(
        `Cycle ${stats.cycleCount} | ` +
          `Exec: ${stats.lastExecutionTimeMs.toFixed(3)}ms | ` +
          `Interval: ${stats.lastIntervalTimeMs.toFixed(3)}ms | ` +
          `WKC: ${stats.wkc} | ` +
          `Avg Exec: ${stats.avgExecutionTimeMs.toFixed(3)}ms | ` +
          `Avg Interval: ${stats.avgIntervalTimeMs.toFixed(3)}ms`,
      );
    }
  },
  onError: (error) => {
    console.error("Cycle loop error:", error);
  },
});

// Handle graceful shutdown
let shutdown = false;
const shutdownHandler = () => {
  if (!shutdown) {
    shutdown = true;
    console.log("\nShutting down...");
    controller.stop();

    // Wait a bit for the loop to stop
    setTimeout(() => {
      const finalStats = controller.getStats();
      console.log("\nFinal Statistics:");
      console.log(`  Total cycles: ${finalStats.cycleCount}`);
      console.log(`  Average execution time: ${finalStats.avgExecutionTimeMs.toFixed(3)}ms`);
      console.log(`  Average interval time: ${finalStats.avgIntervalTimeMs.toFixed(3)}ms`);
      Deno.exit(0);
    }, 100);
  }
};

Deno.addSignalListener("SIGINT", shutdownHandler);
Deno.addSignalListener("SIGTERM", shutdownHandler);

// Start the cycle loop
console.log("Starting cycle loop (10ms cycle time)...");
console.log("Press Ctrl+C to stop\n");
controller.start();

// Run for 5 seconds, then stop
setTimeout(() => {
  shutdownHandler();
}, 5000);
