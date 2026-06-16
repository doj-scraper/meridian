/**
 * @hermes/kernel-spine — State Checkpoints
 *
 * Checkpoint system for fast state recovery.
 * Instead of replaying the entire event log, the reducer can
 * start from a checkpoint and only process events after it.
 *
 * Checkpoints are taken at configurable intervals (every N events)
 * and contain:
 * - The derived HermesState at that point
 * - The event ID at which the checkpoint was taken
 * - A state hash for integrity verification
 *
 * On recovery, the system:
 * 1. Loads the latest checkpoint
 * 2. Replays only events after the checkpoint
 * 3. Verifies the resulting state hash
 */

import type { HermesEvent } from "../event-dsl/types";
import type { HermesState, Checkpoint } from "./types";
import { computeStateHash } from "./reducer";

// ═══════════════════════════════════════════════════════════════
// Checkpoint Manager
// ═══════════════════════════════════════════════════════════════

export class CheckpointManager {
  private readonly checkpoints = new Map<string, Checkpoint[]>();
  private readonly maxCheckpointsPerRun: number;

  constructor(maxCheckpointsPerRun = 10) {
    this.maxCheckpointsPerRun = maxCheckpointsPerRun;
  }

  /**
   * Create a checkpoint from the current state.
   */
  createCheckpoint(
    runId: string,
    atEventId: string,
    eventCount: number,
    state: HermesState
  ): Checkpoint {
    const stateHash = computeStateHash(state);

    const checkpoint: Checkpoint = {
      checkpointId: `ckpt_${runId}_${eventCount}`,
      runId,
      atEventId,
      eventCount,
      state,
      stateHash,
      createdAt: Date.now(),
    };

    // Store checkpoint
    if (!this.checkpoints.has(runId)) {
      this.checkpoints.set(runId, []);
    }
    const runCheckpoints = this.checkpoints.get(runId)!;
    runCheckpoints.push(checkpoint);

    // Enforce max checkpoints (keep latest)
    if (runCheckpoints.length > this.maxCheckpointsPerRun) {
      runCheckpoints.shift();
    }

    return checkpoint;
  }

  /**
   * Get the latest checkpoint for a run.
   */
  getLatestCheckpoint(runId: string): Checkpoint | null {
    const runCheckpoints = this.checkpoints.get(runId);
    if (!runCheckpoints || runCheckpoints.length === 0) return null;
    return runCheckpoints[runCheckpoints.length - 1];
  }

  /**
   * Get the checkpoint closest to a specific event count.
   */
  getCheckpointNearEventCount(runId: string, eventCount: number): Checkpoint | null {
    const runCheckpoints = this.checkpoints.get(runId);
    if (!runCheckpoints || runCheckpoints.length === 0) return null;

    // Find the latest checkpoint at or before the target event count
    let best: Checkpoint | null = null;
    for (const ckpt of runCheckpoints) {
      if (ckpt.eventCount <= eventCount) {
        best = ckpt;
      } else {
        break;
      }
    }
    return best;
  }

  /**
   * Verify a checkpoint's state hash.
   */
  verifyCheckpoint(checkpoint: Checkpoint): boolean {
    const currentHash = computeStateHash(checkpoint.state);
    return currentHash === checkpoint.stateHash;
  }

  /**
   * Clear all checkpoints for a run.
   */
  clearRunCheckpoints(runId: string): void {
    this.checkpoints.delete(runId);
  }

  /**
   * Get all checkpoint event IDs for a run.
   * Used to determine which events to skip during replay.
   */
  getCheckpointEventIds(runId: string): Set<string> {
    const runCheckpoints = this.checkpoints.get(runId) ?? [];
    return new Set(runCheckpoints.map((c) => c.atEventId));
  }
}

// ═══════════════════════════════════════════════════════════════
// Singleton
// ═══════════════════════════════════════════════════════════════

let checkpointManager: CheckpointManager | null = null;

export function getCheckpointManager(): CheckpointManager {
  if (!checkpointManager) {
    checkpointManager = new CheckpointManager();
  }
  return checkpointManager;
}
