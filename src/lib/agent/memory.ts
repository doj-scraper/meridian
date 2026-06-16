import { MemoryEntry, AgentAction } from "./types";

// In-memory store for active agent runs
// Keyed by runId for concurrent execution
const runMemories = new Map<string, MemoryEntry[]>();

export function getMemory(runId: string): MemoryEntry[] {
  return runMemories.get(runId) || [];
}

export function addMemoryEntry(
  runId: string,
  step: number,
  action: AgentAction,
  result: string
): void {
  const memory = runMemories.get(runId) || [];
  memory.push({
    step,
    action,
    result,
    timestamp: Date.now(),
  });
  runMemories.set(runId, memory);
}

export function clearMemory(runId: string): void {
  runMemories.delete(runId);
}

// Cleanup old memories to prevent unbounded growth
// Called automatically when runs complete
export function cleanupStaleMemories(maxAgeMs: number = 60 * 60 * 1000): void {
  const now = Date.now();
  for (const [runId, entries] of runMemories.entries()) {
    if (entries.length === 0) {
      runMemories.delete(runId);
      continue;
    }
    const lastTimestamp = entries[entries.length - 1].timestamp;
    if (now - lastTimestamp > maxAgeMs) {
      runMemories.delete(runId);
    }
  }
}

export function getAllRunIds(): string[] {
  return Array.from(runMemories.keys());
}
