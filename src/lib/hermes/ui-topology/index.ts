/**
 * @hermes/ui-topology — Strict Projection Subsystem
 *
 * The UI topology is a STRICT PROJECTION subsystem.
 * It NEVER defines truth — it only displays it.
 *
 * React Flow = dumb renderer (no causality inference)
 * XState = epistemic UI state only (loading/viewing/error)
 *
 * PACKAGE DEPENDENCY LAW:
 * Depends on: @hermes/test-harness, @hermes/event-dsl, @hermes/frontier
 * Forbidden reverse: frontier must NOT import from ui-topology
 */

// ── Types ──
export {
  type CausalNodeProjection,
  type CausalNodeData,
  type CausalEdgeProjection,
  type EventStreamEntry,
  type AgentStateProjection,
  type FrontierVisualization,
  type LayoutConfig,
  DEFAULT_LAYOUT_CONFIG,
} from "./types";

// ── Graph Renderer ──
export {
  projectToNodes,
  projectToEdges,
  projectToReactFlow,
} from "./graph-renderer";

// ── Event Stream Projection ──
export {
  projectToEventStream,
} from "./event-projection";

// ── Agent State Projection ──
export {
  projectAgentState,
  projectAgentStates,
  getRoleColor,
} from "./agent-projection";

// ── Frontier Visualization ──
export {
  projectFrontierState,
} from "./frontier-viz";
