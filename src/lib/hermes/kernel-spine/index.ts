/**
 * @hermes/kernel-spine — Single Deterministic Transition Loop
 *
 * The Kernel Spine implements the kernel inversion:
 *   BEFORE: action → mutate state → emit logs
 *   AFTER:  action → emit event → reducer applies state
 *
 * KEY PRINCIPLES:
 * - Event Log = Truth, Reducer = Canonical Interpretation
 * - No dual-state systems
 * - Agents are pure proposers
 * - The kernel transition loop is deterministic and replayable
 *
 * PACKAGE DEPENDENCY LAW:
 * Depends on: @hermes/test-harness, @hermes/event-dsl, @hermes/causal-core-lock
 */

// ── Types ──
export {
  // Run lifecycle
  type RunStatus,
  type HermesRunConfig,

  // Agent proposal system
  type AgentProposal,
  type ProposalAction,
  type ToolAction,
  type FinishAction,
  type DelegateAction,
  type BranchAction,
  type WaitAction,

  // Kernel transition
  type KernelTransition,

  // State types
  type HermesState,
  type RunState,
  type AgentState,
  type FrontierInfo,
  type HermesMetadata,

  // Checkpoint
  type Checkpoint,

  // Event store interface
  type IEventStore,
} from "./types";

// ── Event Store ──
export {
  EventStore,
  getEventStore,
} from "./event-store";

// ── Reducer ──
export {
  createInitialState,
  reduceEvents,
  reduceFromCheckpoint,
  computeStateHash,
  getRunState,
  getAgentState,
  getFrontierInfo,
} from "./reducer";

// ── Checkpoint ──
export {
  CheckpointManager,
  getCheckpointManager,
} from "./checkpoint";

// ── Proposer ──
export {
  type ProposerConfig,
  type ProposerContext,
  type IAgentProposer,
  LLMAgentProposer,
  createProposer,
} from "./proposer";

// ── Kernel ──
export {
  HermesKernel,
  getKernel,
} from "./kernel";
