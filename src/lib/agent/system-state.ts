import { db } from '@/lib/db';
import type { SystemState } from './types';

export type { SystemState };

export interface SystemStatus {
  state: SystemState;
  activeRuns: number;
  pendingApprovals: number;
  totalAgents: number;
  totalTeams: number;
  lastUpdated: Date;
}

type StatusListener = (status: SystemStatus) => void;

export class SystemStateManager {
  private state: SystemState = 'idle';
  private listeners: StatusListener[] = [];

  /**
   * Get the current system status, computed from live DB data.
   */
  async getStatus(): Promise<SystemStatus> {
    const [activeRuns, pendingApprovals, totalAgents, totalTeams] = await Promise.all([
      db.agentRun.count({ where: { status: 'running' } }),
      db.approvalRequest.count({ where: { status: 'pending' } }),
      db.agent.count(),
      db.team.count(),
    ]);

    // Derive system state from current conditions
    let derivedState: SystemState = 'idle';
    if (activeRuns > 0 && pendingApprovals > 0) {
      derivedState = 'waiting_approval';
    } else if (activeRuns > 0) {
      derivedState = 'running';
    }

    // Use explicitly set state if it hasn't been overridden by conditions
    const currentState = this.state === 'idle' || this.state === 'error' || this.state === 'completed'
      ? derivedState
      : this.state;

    // If we have pending approvals, always prefer waiting_approval
    const finalState = pendingApprovals > 0 && activeRuns > 0
      ? 'waiting_approval'
      : currentState;

    return {
      state: finalState,
      activeRuns,
      pendingApprovals,
      totalAgents,
      totalTeams,
      lastUpdated: new Date(),
    };
  }

  /**
   * Explicitly set the system state.
   * This is useful for signaling planning, error, or completed states.
   */
  setState(newState: SystemState): void {
    this.state = newState;
    this.notify();
  }

  /**
   * Subscribe to system state changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: StatusListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of the current state.
   */
  private notify(): void {
    // Fire and forget — listeners are notified asynchronously
    this.getStatus()
      .then((status) => {
        for (const listener of this.listeners) {
          try {
            listener(status);
          } catch {
            // swallow listener errors
          }
        }
      })
      .catch(() => {
        // swallow errors from getStatus
      });
  }
}

export const systemStateManager = new SystemStateManager();
