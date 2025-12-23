/**
 * @module
 * Cycle Loop - A utility for running precise cyclic operations with busy-wait timing.
 *
 * Provides sub-millisecond precision for cycle loops, ideal for EtherCAT and other
 * real-time applications requiring precise timing.
 *
 * @example
 * ```typescript
 * import { createCycleLoop } from "@controlx-io/cycle-loop";
 *
 * const controller = createCycleLoop({
 *   cycleTimeMs: 1, // 1ms cycle time
 *   cycleFn: async () => {
 *     // Your cycle logic here
 *     return 1; // Optional: return working counter
 *   },
 *   onCycle: (stats) => {
 *     console.log(`Cycle ${stats.cycleCount}, WKC: ${stats.wkc}`);
 *   }
 * });
 *
 * controller.start();
 * // ... later
 * controller.stop();
 * ```
 */

export {
  createCycleLoop,
  type CycleLoopController,
  type CycleLoopOptions,
  type CycleStats,
} from "./cycle-loop.ts";
