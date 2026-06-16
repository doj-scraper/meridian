/**
 * @hermes/event-dsl — Canonical Event Types
 *
 * Defines the HermesEvent type — the fundamental unit of the
 * causal execution substrate. Every state transition in the system
 * is represented as a HermesEvent in the append-only event log.
 *
 * KEY INVARIANTS:
 * - NO eventSequence field — linear chronological sequence is PERMANENTLY
 *   ERADICATED. Ordering is emergent from causal relationships.
 * - Every non-genesis event MUST have non-empty parentEventIds
 * - causalDepth is derived from parent relationships, never manually set
 * - contentHash is SHA-256 of JCS-canonicalized event (minus hash field)
 * - Events are immutable after construction
 *
 * EVENT TIERS (from Hermes Master Dossier):
 * - MODEL:     LLM interactions (prompt → response)
 * - DECISION:  Agent decisions (tool selection, branch choice)
 * - EXECUTION: Tool execution results
 * - SYSTEM:    Infrastructure events (run start/stop, errors)
 * - TELEMETRY: Observability events (metrics, timing, health)
 */

import type {
  BrandedEventId,
  BrandedRunId,
  BrandedAgentId,
  BrandedContentHash,
} from "../test-harness/brands";

// ═══════════════════════════════════════════════════════════════
// Event Tier Enumeration
// ═══════════════════════════════════════════════════════════════

/**
 * The five Hermes event tiers, ordered by abstraction level.
 * Higher tiers = more abstract, lower tiers = more concrete.
 */
export const HermesEventTier = {
  /** LLM model interactions — prompts, completions, embeddings */
  MODEL: "MODEL",
  /** Agent decisions — tool selection, branch choices, goal evaluation */
  DECISION: "DECISION",
  /** Tool execution — search results, code output, browser data */
  EXECUTION: "EXECUTION",
  /** System infrastructure — run lifecycle, errors, config changes */
  SYSTEM: "SYSTEM",
  /** Observability — metrics, timing, health, resource usage */
  TELEMETRY: "TELEMETRY",
} as const;

export type HermesEventTier = (typeof HermesEventTier)[keyof typeof HermesEventTier];

/**
 * All valid event tier values for runtime validation.
 */
export const VALID_EVENT_TIERS: readonly string[] = Object.values(HermesEventTier);

// ═══════════════════════════════════════════════════════════════
// Event Payload Types
// ═══════════════════════════════════════════════════════════════

/**
 * Payload for MODEL tier events.
 * Captures LLM interactions with full context.
 */
export interface ModelEventPayload {
  /** The prompt sent to the LLM */
  prompt: string;
  /** The LLM response (may be streaming — final chunk only in event) */
  response: string;
  /** Model identifier (e.g., "gemini-2.5-pro") */
  modelId: string;
  /** Token usage: { promptTokens, completionTokens, totalTokens } */
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Latency in milliseconds */
  latencyMs?: number;
  /** Temperature and other generation params */
  generationConfig?: Record<string, unknown>;
}

/**
 * Payload for DECISION tier events.
 * Captures agent reasoning and choices.
 */
export interface DecisionEventPayload {
  /** The decision made (e.g., "use_search", "finish", "branch_left") */
  decision: string;
  /** The agent's reasoning for this decision */
  reasoning: string;
  /** Available alternatives that were considered */
  alternatives?: string[];
  /** Confidence score (0-1) */
  confidence?: number;
  /** The goal or context that motivated this decision */
  goalContext?: string;
}

/**
 * Payload for EXECUTION tier events.
 * Captures tool execution results.
 */
export interface ExecutionEventPayload {
  /** Tool name that was executed */
  tool: string;
  /** Input provided to the tool */
  input: string;
  /** Output produced by the tool */
  output: string;
  /** Whether execution succeeded */
  success: boolean;
  /** Execution duration in milliseconds */
  durationMs?: number;
  /** Verification status if tool output was verified */
  verificationStatus?: "verified" | "failed" | "needs_review";
  /** Verification details */
  verificationDetails?: Record<string, unknown>;
}

/**
 * Payload for SYSTEM tier events.
 * Captures infrastructure and lifecycle events.
 */
export interface SystemEventPayload {
  /** System event subtype */
  subtype:
    | "run_start"
    | "run_complete"
    | "run_error"
    | "run_stopped"
    | "agent_registered"
    | "agent_deregistered"
    | "checkpoint_created"
    | "branch_created"
    | "branch_merged"
    | "policy_applied"
    | "approval_requested"
    | "approval_resolved"
    | "config_changed";
  /** Human-readable message */
  message: string;
  /** Additional structured data */
  details?: Record<string, unknown>;
}

/**
 * Payload for TELEMETRY tier events.
 * Captures observability data.
 */
export interface TelemetryEventPayload {
  /** Metric name */
  metric: string;
  /** Metric value */
  value: number;
  /** Unit of measurement */
  unit?: string;
  /** Tags for filtering/grouping */
  tags?: Record<string, string>;
}

/**
 * Union of all event payload types, keyed by tier.
 */
export type EventPayloadMap = {
  MODEL: ModelEventPayload;
  DECISION: DecisionEventPayload;
  EXECUTION: ExecutionEventPayload;
  SYSTEM: SystemEventPayload;
  TELEMETRY: TelemetryEventPayload;
};

/**
 * Generic event payload — the actual type depends on the event tier.
 */
export type EventPayload = EventPayloadMap[HermesEventTier];

// ═══════════════════════════════════════════════════════════════
// Canonical HermesEvent
// ═══════════════════════════════════════════════════════════════

/**
 * The canonical HermesEvent — the fundamental atom of the
 * causal execution substrate.
 *
 * CONSTRUCTION: Events can ONLY be created through the Event DSL
 * constructors in @hermes/event-dsl/constructors. Direct object
 * literal construction is prevented by the branded ID types.
 *
 * IMMUTABILITY: All fields are readonly. Events are never modified
 * after construction — they are appended to the event log.
 *
 * ORDERING: There is NO eventSequence field. Ordering is derived
 * from the causal structure (parentEventIds → causalDepth →
 * topologicalRank). Linear chronological sequence is permanently
 * eradicated from the Hermes architecture.
 */
export interface HermesEvent {
  /** Globally unique event identifier (branded to prevent forgery) */
  readonly eventId: BrandedEventId;

  /** Event tier (MODEL | DECISION | EXECUTION | SYSTEM | TELEMETRY) */
  readonly eventType: HermesEventTier;

  /**
   * Causal parent event IDs.
   * MUST be non-empty for all non-genesis events.
   * MUST be empty for genesis events (depth 0).
   * Ordering is emergent from these relationships.
   */
  readonly parentEventIds: readonly BrandedEventId[];

  /**
   * Causal depth in the DAG.
   * Derived: depth = max(parentDepths) + 1
   * Genesis events have depth 0.
   * NEVER manually set — always computed from parent relationships.
   */
  readonly causalDepth: number;

  /**
   * Topological rank from topological sort.
   * Assigned by the Causal Core Lock during graph construction.
   * Provides a deterministic total order consistent with causality.
   * Set to -1 if not yet assigned by CCL.
   */
  readonly topologicalRank: number;

  /** Event-specific payload (type depends on eventType) */
  readonly payload: Record<string, unknown>;

  /** Epoch millisecond timestamp when event was created */
  readonly timestamp: number;

  /** SHA-256 content hash of JCS-canonicalized event (minus hash field) */
  readonly contentHash: BrandedContentHash;

  /** Run identifier (branded to prevent cross-run contamination) */
  readonly runId: BrandedRunId;

  /** Agent that produced this event (optional for system events) */
  readonly agentId?: BrandedAgentId;

  /** Branch label for conditional execution paths */
  readonly branch?: string;

  /** Ed25519 signature (optional — for verified execution) */
  readonly signature?: string;
}

// ═══════════════════════════════════════════════════════════════
// Event Construction Input
// ═══════════════════════════════════════════════════════════════

/**
 * Input for constructing a HermesEvent.
 * The Event DSL constructors accept this and produce a fully
 * validated, hashed, and branded HermesEvent.
 *
 * parentEventIds and causalDepth are computed by the constructor,
 * not provided directly.
 */
export interface EventConstructionInput<T extends HermesEventTier = HermesEventTier> {
  /** Event tier */
  eventType: T;
  /** Parent event IDs (branded — must reference existing events) */
  parentEventIds: BrandedEventId[];
  /** Event-specific payload */
  payload: EventPayloadMap[T];
  /** Run identifier */
  runId: BrandedRunId;
  /** Agent identifier (optional) */
  agentId?: BrandedAgentId;
  /** Branch label (optional) */
  branch?: string;
}

// ═══════════════════════════════════════════════════════════════
// Causal Edge Type
// ═══════════════════════════════════════════════════════════════

/**
 * Types of causal relationships between events.
 */
export const CausalEdgeType = {
  /** Direct causal dependency (A caused B) */
  CAUSAL: "causal",
  /** Temporal ordering (A happened before B, but didn't cause it) */
  TEMPORAL: "temporal",
  /** Branch divergence (A is the branch point, B is on a branch) */
  BRANCH: "branch",
} as const;

export type CausalEdgeType = (typeof CausalEdgeType)[keyof typeof CausalEdgeType];

/**
 * A causal edge in the event graph.
 */
export interface CausalEdge {
  readonly source: BrandedEventId;
  readonly target: BrandedEventId;
  readonly edgeType: CausalEdgeType;
}
