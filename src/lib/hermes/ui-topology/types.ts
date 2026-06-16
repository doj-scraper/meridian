/**
 * @hermes/ui-topology — Types
 *
 * The UI topology is a STRICT PROJECTION subsystem.
 * It NEVER defines truth — it only displays it.
 *
 * React Flow = dumb renderer (no causality inference)
 * XState = epistemic UI state only (loading/viewing/error)
 *
 * View models are pure projections from HermesEvent log.
 * The UI cannot mutate kernel semantics — it can only read
 * and display the state derived from the event log.
 */

import type { HermesEvent, HermesEventTier, CausalEdge } from "../event-dsl/types";
import type { HermesState, RunState, AgentState } from "../kernel-spine/types";
import type { FrontierState } from "../frontier/types";

// ═══════════════════════════════════════════════════════════════
// React Flow Projection Types
// ═══════════════════════════════════════════════════════════════

/**
 * A node in the React Flow visualization.
 * This is a PROJECTION — it contains only display information.
 * The causal structure is in the VerifiedCausalGraph, not here.
 */
export interface CausalNodeProjection {
  /** React Flow node ID (same as event ID) */
  id: string;
  /** Display position (computed from topological layout) */
  position: { x: number; y: number };
  /** Display data */
  data: CausalNodeData;
  /** React Flow node type */
  type: "causalEvent";
}

/**
 * Display data for a causal event node.
 * Contains only what's needed for rendering.
 */
export interface CausalNodeData {
  /** Event tier (determines color) */
  tier: HermesEventTier;
  /** Short label for the event */
  label: string;
  /** Causal depth */
  depth: number;
  /** Agent name (if applicable) */
  agentName?: string;
  /** Branch label (if applicable) */
  branch?: string;
  /** Whether this node is in the frontier */
  isFrontier: boolean;
  /** Whether this node has been visited */
  isVisited: boolean;
  /** Tool name (for EXECUTION events) */
  tool?: string;
  /** Decision summary (for DECISION events) */
  decision?: string;
  /** Success status (for EXECUTION events) */
  success?: boolean;
  /** Event timestamp */
  timestamp: number;
}

/**
 * An edge in the React Flow visualization.
 * This is a PROJECTION — the causal structure is in the
 * VerifiedCausalGraph, not here.
 */
export interface CausalEdgeProjection {
  /** React Flow edge ID */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Edge type (determines styling) */
  type: "causal" | "temporal" | "branch";
  /** Whether this edge is animated (frontier-related) */
  animated: boolean;
  /** Edge label */
  label?: string;
}

// ═══════════════════════════════════════════════════════════════
// Event Stream Projection Types
// ═══════════════════════════════════════════════════════════════

/**
 * A projected event for the UI event stream (timeline).
 * Simplified from HermesEvent for display purposes.
 */
export interface EventStreamEntry {
  /** Event ID */
  id: string;
  /** Event tier */
  tier: HermesEventTier;
  /** Display label */
  label: string;
  /** Causal depth */
  depth: number;
  /** Agent name */
  agentName?: string;
  /** Timestamp */
  timestamp: number;
  /** Summary text */
  summary: string;
  /** Whether this is a frontier event */
  isFrontier: boolean;
  /** Branch label */
  branch?: string;
  /** Parent event IDs */
  parentIds: string[];
}

// ═══════════════════════════════════════════════════════════════
// Agent State Projection Types
// ═══════════════════════════════════════════════════════════════

/**
 * Projected agent state for the UI.
 */
export interface AgentStateProjection {
  /** Agent ID */
  id: string;
  /** Agent name */
  name: string;
  /** Agent role */
  role: string;
  /** Agent status */
  status: "idle" | "proposing" | "executing" | "waiting" | "done";
  /** Number of proposals made */
  proposalCount: number;
  /** Number of executions completed */
  executionCount: number;
  /** Color based on role */
  color: string;
  /** Total tokens consumed */
  totalTokens: number;
}

// ═══════════════════════════════════════════════════════════════
// Frontier Visualization Types
// ═══════════════════════════════════════════════════════════════

/**
 * Projected frontier state for visualization.
 */
export interface FrontierVisualization {
  /** IDs of nodes in the frontier */
  frontierNodeIds: string[];
  /** IDs of visited nodes */
  visitedNodeIds: string[];
  /** Whether the frontier is exhausted */
  isExhausted: boolean;
  /** Active branches */
  activeBranches: string[];
  /** Frontier size */
  size: number;
}

// ═══════════════════════════════════════════════════════════════
// Layout Configuration
// ═══════════════════════════════════════════════════════════════

export interface LayoutConfig {
  /** Horizontal spacing between nodes */
  nodeSpacingX: number;
  /** Vertical spacing between depth levels */
  nodeSpacingY: number;
  /** Whether to show branch labels */
  showBranchLabels: boolean;
  /** Whether to animate frontier edges */
  animateFrontier: boolean;
  /** Color scheme for event tiers */
  tierColors: Record<HermesEventTier, string>;
  /** Color for frontier nodes */
  frontierColor: string;
  /** Color for visited nodes */
  visitedColor: string;
}

/**
 * Default layout configuration matching the neo-brutalist theme.
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeSpacingX: 220,
  nodeSpacingY: 120,
  showBranchLabels: true,
  animateFrontier: true,
  tierColors: {
    MODEL: "#ffd60a",       // Yellow
    DECISION: "#00d1ff",    // Cyan
    EXECUTION: "#22c55e",   // Green
    SYSTEM: "#8a94a3",      // Gray
    TELEMETRY: "#f59e0b",   // Amber
  },
  frontierColor: "#ffd60a", // Yellow highlight
  visitedColor: "#2a3441",  // Dark panel
};
