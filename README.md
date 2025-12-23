# Cycle Loop

A utility for running precise cyclic operations with busy-wait timing, providing sub-millisecond
precision for cycle loops.

It is a small utility that runs an async function (cycleFn) periodically with a target cycle time
(in milliseconds). It measures how long each call takes and how much time passes between the start
of each cycle, keeps running averages, and exposes those stats via an optional onCycle callback and
getStats(). If a cycle runs late (e.g. cycleFn is slower than the target period), the loop doesn’t
crash; it keeps going, **exposes the timing jitter** in the interval stats, and **self‑corrects by
resetting its next target** time so future cycles are re-aligned to the desired period as closely as
possible.

## Features

- **Sub-millisecond precision**: Uses busy-wait timing for precise cycle intervals
- **Real-time statistics**: Track execution time, interval time, and cycle counts
- **Error handling**: Built-in error handling with optional callbacks
- **TypeScript support**: Fully typed with comprehensive TypeScript definitions

## Installation

```bash
deno add @controlx-io/cycle-loop
```

## Usage

```typescript
import { createCycleLoop } from "@controlx-io/cycle-loop";

const controller = createCycleLoop({
  cycleTimeMs: 1, // 1ms cycle time
  cycleFn: async () => {
    // Your cycle logic here
    // Return a number (e.g., working counter) if needed
    return 1;
  },
  onCycle: (stats) => {
    console.log(`Cycle ${stats.cycleCount}`);
    console.log(`Execution: ${stats.lastExecutionTimeMs.toFixed(3)}ms`);
    console.log(`Interval: ${stats.lastIntervalTimeMs.toFixed(3)}ms`);
    if (stats.wkc !== undefined) {
      console.log(`WKC: ${stats.wkc}`);
    }
  },
  onError: (error) => {
    console.error("Cycle error:", error);
  },
});

// Start the cycle loop
controller.start();

// Later, stop the cycle loop
controller.stop();

// Check if running
if (controller.isRunning()) {
  console.log("Loop is active");
}

// Get current statistics
const stats = controller.getStats();
console.log(`Total cycles: ${stats.cycleCount}`);
```

## API

### `createCycleLoop(options)`

Creates a new cycle loop controller.

#### Options

- `cycleTimeMs` (number): Cycle time in milliseconds
- `cycleFn` (() => Promise<number | void>): Function to execute each cycle
- `onCycle?` ((stats: CycleStats) => void): Optional callback called after each cycle
- `onError?` ((error: Error) => void): Optional callback for errors

#### Returns

A `CycleLoopController` with the following methods:

- `start()`: Start the cycle loop
- `stop()`: Stop the cycle loop gracefully
- `isRunning()`: Check if the loop is currently running
- `getStats()`: Get current cycle statistics

### `CycleStats`

Statistics object provided to the `onCycle` callback:

- `cycleCount` (number): Cycle count since start
- `avgExecutionTimeMs` (number): Average cycle execution time in milliseconds
- `avgIntervalTimeMs` (number): Average interval time (time between cycle starts) in milliseconds
- `lastExecutionTimeMs` (number): Last cycle execution time in milliseconds
- `lastIntervalTimeMs` (number): Last interval time in milliseconds
- `wkc?` (number): Working counter from last cycle (if cycleFn returns a number)

## License

MIT
