/**
 * @hermes/event-dsl — Event DSL with compile-time enforcement
 *
 * The Event DSL is the ONLY authorized way to create HermesEvent instances.
 * It enforces:
 *   - Every non-genesis event has non-empty parentEventIds
 *   - causalDepth is derived from parent relationships
 *   - Content hashes are computed via SHA-256 of JCS-canonicalized events
 *   - Event IDs are branded to prevent forgery
 *
 * PACKAGE DEPENDENCY LAW:
 * Depends on: @hermes/test-harness (brands, validators)
 * Forbidden reverse: test-harness must NOT import from event-dsl
 */

// ── Types ──
export {
  // Event tier enumeration
  HermesEventTier,
  VALID_EVENT_TIERS,
  type HermesEventTier as HermesEventTierType,

  // Event payload types
  type ModelEventPayload,
  type DecisionEventPayload,
  type ExecutionEventPayload,
  type SystemEventPayload,
  type TelemetryEventPayload,
  type EventPayloadMap,
  type EventPayload,

  // Canonical event type
  type HermesEvent,

  // Construction input
  type EventConstructionInput,

  // Causal edge types
  CausalEdgeType,
  type CausalEdgeType as CausalEdgeTypeType,
  type CausalEdge,
} from "./types";

// ── Canonicalization ──
export {
  canonicalize,
  canonicalizeForHash,
  canonicalizeForSignature,
  canonicalizeForTieBreak,
} from "./canonicalize";

// ── Hashing ──
export {
  computeContentHash,
  computeTieBreakHash,
  verifyContentHash,
  sha256,
  deriveEventFingerprint,
} from "./hashing";

// ── Constructors (THE ONLY WAY TO CREATE EVENTS) ──
export {
  // Core constructors
  createGenesisEvent,
  createModelEvent,
  createDecisionEvent,
  createExecutionEvent,
  createSystemEvent,
  createTelemetryEvent,

  // ID creation
  createRunId,
  createAgentId,

  // Legacy adapter
  legacyIdAdapter,
} from "./constructors";

// ── Validation ──
export {
  type EventValidationResult,
  type EventValidationError,
  validateHermesEvent,
  validateParentExistence,
  validateCausalConsistency,
} from "./validate";
