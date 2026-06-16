/**
 * @hermes/kernel-spine — Types
 *
 * The Kernel Spine is the single deterministic transition loop of the
 * Hermes architecture. It implements the kernel inversion:
 *
 *   BEFORE: action → mutate state → emit logs
 *   AFTER:  action → emit event → reducer applies state
 *
 * KEY PRINCIPLES:
 * - Event Log = Truth, Reducer = Canonical Interpretation
 * - No dual-state systems (the log IS the state source)
 * - Agents are pure proposers — never execute tools or mutate state
 * - The kernel transition loop is deterministic and replayable
 * - State is always derivable from the event log
 */

import type { BrandedRunId, BrandedAgentId, BrandedEventId } from "../test-harness/brands";
import type { HermesEvent, HermesEventTier } from "../event-dsl/types";

// ═══════════════════════════════════════════════════════════════
// Run Lifecycle
// ═══════════════════════════════════════════════════════════════

export type RunStatus =
  | "pending"     // Created but not started
  | "running"     // Actively executing transitions
  | "paused"      // Paused by user or policy
  | "completed"   // Goal achieved
  | "failed"      // Error occurred
  | "stopped";    // Stopped by user

/**
 * Configuration for a Hermes run.
 */
export interface HermesRunConfig {
  /** The goal this run is trying to achieve */
  goal: string;
  /** Maximum number of kernel transitions */
  maxTransitions: number;
  /** Maximum concurrent agents */
  maxConcurrency: number;
  /** Whether to auto-advance the frontier */
  autoAdvance: boolean;
  /** Delay between transitions (ms) for safety */
  transitionDelayMs: number;
  /** Checkpoint interval (every N events) */
  checkpointInterval: number;
  /** Run ID (branded) */
  runId: BrandedRunId;
  /** Initial context for the run */
  initialContext?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// Agent Proposal System
// ═══════════════════════════════════════════════════════════════

/**
 * An agent's proposal for the next action.
 *
 * Agents are PURE PROPOSERS — they never execute tools or
 * mutate state directly. They observe the current state and
 * propose actions. The kernel decides whether to execute.
 */
export interface AgentProposal {
  /** The agent making this proposal */
  agentId: BrandedAgentId;
  /** The proposed action type */
  actionType: "use_tool" | "finish" | "delegate" | "branch" | "wait";
  /** The proposed action details */
  action: ProposalAction;
  /** The agent's reasoning for this proposal */
  justification: string;
  /** Events this proposal causally depends on */
  parentEventIds: BrandedEventId[];
  /** Confidence in this proposal (0-1) */
  confidence: number;
  /** Priority hint for frontier solver (higher = more urgent) */
  priority: number;
}

/**
 * The specific action an agent is proposing.
 */
export type ProposalAction =
  | ToolAction
  | FinishAction
  | DelegateAction
  | BranchAction
  | WaitAction;

export interface ToolAction {
  type: "use_tool";
  tool: string;
  input: string;
  parameters?: Record<string, unknown>;
}

export interface FinishAction {
  type: "finish";
  result: string;
  summary?: string;
}

export interface DelegateAction {
  type: "delegate";
  targetAgentId: BrandedAgentId;
  task: string;
  context?: Record<string, unknown>;
}

export interface BranchAction {
  type: "branch";
  branchLabel: string;
  condition: string;
  alternativeAction: ProposalAction;
}

export interface WaitAction {
  type: "wait";
  reason: string;
  waitForEventIds: BrandedEventId[];
}

// ═══════════════════════════════════════════════════════════════
// Kernel Transition
// ═══════════════════════════════════════════════════════════════

/**
 * A single kernel transition — the fundamental unit of execution.
 *
 * The transition loop:
 * 1. Compute frontier (which events can execute next)
 * 2. Select event from frontier (or agent proposes)
 * 3. Execute the event (side-effect boundary)
 * 4. Emit result event
 * 5. Reducer derives new state
 */
export interface KernelTransition {
  /** Unique transition ID */
  transitionId: string;
  /** The run this transition belongs to */
  runId: BrandedRunId;
  /** The event being executed in this transition */
  executedEventId: BrandedEventId;
  /** The event tier of the executed event */
  eventType: HermesEventTier;
  /** Events produced by this transition */
  producedEventIds: BrandedEventId[];
  /** State hash before this transition */
  stateHashBefore: string;
  /** State hash after this transition */
  stateHashAfter: string;
  /** Duration of this transition in ms */
  durationMs: number;
  /** Whether this transition succeeded */
  success: boolean;
  /** Error message if transition failed */
  error?: string;
  /** Timestamp of transition start */
  startedAt: number;
  /** Timestamp of transition end */
  completedAt: number;
}

// ═══════════════════════════════════════════════════════════════
// Hermes State (Reducer Output)
// ═══════════════════════════════════════════════════════════════

/**
 * The canonical state derived from the event log by the reducer.
 *
 * This state is NEVER mutated directly — it is always computed
 * from the event log. The reducer is a pure function:
 *
 *   HermesState = f(HermesEvent[])
 *
 * The event log IS the state. The reducer is merely an
 * interpretation layer for efficient access.
 */
export interface HermesState {
  /** All runs in the system, indexed by runId */
  runs: Map<string, RunState>;
  /** All agents in the system, indexed by agentId */
  agents: Map<string, AgentState>;
  /** Current frontier for each run */
  frontiers: Map<string, FrontierInfo>;
  /** Visited events for each run */
  visited: Map<string, Set<string>>;
  /** Active branches for each run */
  activeBranches: Map<string, Set<string>>;
  /** System-level metadata */
  metadata: HermesMetadata;
}

export interface RunState {
  runId: string;
  status: RunStatus;
  goal: string;
  eventCount: number;
  maxDepth: number;
  totalTokens: number;
  totalLatencyMs: number;
  errorCount: number;
  startedAt?: number;
  completedAt?: number;
  result?: string;
}

export interface AgentState {
  agentId: string;
  name: string;
  role: string;
  status: "idle" | "proposing" | "executing" | "waiting" | "done";
  currentRunId?: string;
  proposalCount: number;
  executionCount: number;
  errorCount: number;
  totalTokens: number;
}

export interface FrontierInfo {
  frontierEventIds: Set<string>;
  size: number;
  maxDepth: number;
}

export interface HermesMetadata {
  /** Total events across all runs */
  totalEvents: number;
  /** Total transitions across all runs */
  totalTransitions: number;
  /** System status */
  systemStatus: "idle" | "running" | "paused" | "error";
  /** Last state update timestamp */
  lastUpdatedAt: number;
  /** Version of the state schema */
  schemaVersion: number;
}

// ═══════════════════════════════════════════════════════════════
// Checkpoint
// ═══════════════════════════════════════════════════════════════

/**
 * A state checkpoint — a snapshot of the HermesState at a point in time.
 * Used for fast replay from a known good state.
 */
export interface Checkpoint {
  /** Unique checkpoint ID */
  checkpointId: string;
  /** The run this checkpoint belongs to */
  runId: string;
  /** The event ID at which this checkpoint was taken */
  atEventId: string;
  /** The event count at checkpoint time */
  eventCount: number;
  /** The state snapshot */
  state: HermesState;
  /** SHA-256 hash of the state for integrity verification */
  stateHash: string;
  /** Timestamp when checkpoint was created */
  createdAt: number;
}

// ═══════════════════════════════════════════════════════════════
// Event Store
// ═══════════════════════════════════════════════════════════════

/**
 * Interface for the append-only event store.
 * The event store persists HermesEvents and provides
 * retrieval by runId, eventId, or causal depth.
 */
export interface IEventStore {
  /** Append an event to the store (immutable — events cannot be modified) */
  append(event: HermesEvent): Promise<void>;

  /** Get an event by its ID */
  get(eventId: string): Promise<HermesEvent | null>;

  /** Get all events for a run */
  getByRunId(runId: string): Promise<HermesEvent[]>;

  /** Get events at a specific causal depth within a run */
  getByDepth(runId: string, depth: number): Promise<HermesEvent[]>;

  /** Get the count of events for a run */
  count(runId: string): Promise<number>;

  /** Get events in causal order (topological sort) */
  getCausalOrder(runId: string): Promise<HermesEvent[]>;

  /** Check if an event exists */
  has(eventId: string): Promise<boolean>;

  /** Get all event IDs for a run */
  getEventIds(runId: string): Promise<Set<string>>;
}
