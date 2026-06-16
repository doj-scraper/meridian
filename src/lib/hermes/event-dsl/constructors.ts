/**
 * @hermes/event-dsl — Event DSL Constructors
 *
 * THE ONLY authorized way to create HermesEvent instances.
 *
 * These constructors enforce compile-time and runtime invariants:
 *   - Genesis events MUST have empty parentEventIds and depth 0
 *   - Non-genesis events MUST have non-empty parentEventIds
 *   - causalDepth is ALWAYS derived from parent depths
 *   - contentHash is ALWAYS computed via SHA-256 of JCS-canonicalized event
 *   - Event IDs are ALWAYS branded to prevent forgery
 *
 * Events created outside these constructors are INVALID by construction.
 * The branded type system prevents any other code from producing a
 * valid HermesEvent without going through these constructors.
 */

import { v7 as uuidv7 } from "uuid";
import {
  brandEventId,
  brandRunId,
  brandAgentId,
  sealVerifiedEvent,
  type BrandedEventId,
  type BrandedRunId,
  type BrandedAgentId,
  type VerifiedEvent,
} from "../test-harness/brands";
import { computeContentHash } from "./hashing";
import type {
  HermesEvent,
  HermesEventTier,
  EventPayloadMap,
  ModelEventPayload,
  DecisionEventPayload,
  ExecutionEventPayload,
  SystemEventPayload,
  TelemetryEventPayload,
} from "./types";

// ═══════════════════════════════════════════════════════════════
// ID Generation
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a new branded event ID using UUIDv7 (time-ordered).
 * UUIDv7 provides both uniqueness and temporal ordering.
 */
function generateEventId(): BrandedEventId {
  return brandEventId(uuidv7());
}

/**
 * Create a branded run ID from a string.
 * Only used during run initialization.
 */
export function createRunId(id: string): BrandedRunId {
  return brandRunId(id);
}

/**
 * Create a branded agent ID from a string.
 * Only used during agent registration.
 */
export function createAgentId(id: string): BrandedAgentId {
  return brandAgentId(id);
}

// ═══════════════════════════════════════════════════════════════
// Core Event Construction
// ═══════════════════════════════════════════════════════════════

/**
 * Internal constructor that builds a HermesEvent with all invariants enforced.
 * This is the single point of event creation — all public constructors
 * delegate to this function.
 */
function constructEvent<T extends HermesEventTier>(
  eventType: T,
  parentEventIds: BrandedEventId[],
  payload: EventPayloadMap[T],
  runId: BrandedRunId,
  agentId: BrandedAgentId | undefined,
  branch: string | undefined,
  parentDepths: number[]
): HermesEvent {
  const eventId = generateEventId();

  // Derive causal depth from parent depths
  const causalDepth = parentEventIds.length === 0
    ? 0
    : Math.max(...parentDepths) + 1;

  // topologicalRank is -1 until assigned by Causal Core Lock
  const topologicalRank = -1;

  const timestamp = Date.now();

  // Build the event object (without contentHash first)
  const eventWithoutHash: Omit<HermesEvent, "contentHash"> = {
    eventId,
    eventType,
    parentEventIds,
    causalDepth,
    topologicalRank,
    payload: payload as unknown as Record<string, unknown>,
    timestamp,
    runId,
    ...(agentId !== undefined && { agentId }),
    ...(branch !== undefined && { branch }),
  };

  // Compute content hash over the canonical form
  const contentHash = computeContentHash(eventWithoutHash as Record<string, unknown>);

  const event: HermesEvent = {
    ...eventWithoutHash,
    contentHash,
  };

  return event;
}

// ═══════════════════════════════════════════════════════════════
// Public DSL Constructors
// ═══════════════════════════════════════════════════════════════

/**
 * Create a genesis event — the root of a new run's event log.
 *
 * Genesis events have:
 * - Empty parentEventIds (no causal parents)
 * - causalDepth = 0
 * - SYSTEM tier
 * - No agentId (system-generated)
 *
 * @param runId - The run this genesis event belongs to
 * @param payload - System event payload describing run initialization
 * @param branch - Optional branch label
 * @returns A verified HermesEvent with genesis invariants enforced
 */
export function createGenesisEvent(
  runId: BrandedRunId,
  payload: SystemEventPayload,
  branch?: string
): HermesEvent & VerifiedEvent {
  const event = constructEvent(
    "SYSTEM",
    [], // Genesis: no parents
    payload,
    runId,
    undefined, // Genesis: no agent
    branch,
    [] // No parent depths
  );

  return sealVerifiedEvent(event) as HermesEvent & VerifiedEvent;
}

/**
 * Create a MODEL tier event — LLM interactions.
 *
 * @param parentEventIds - Causal parent events (MUST be non-empty)
 * @param runId - The run this event belongs to
 * @param agentId - The agent producing this event
 * @param payload - Model interaction details
 * @param parentDepths - Causal depths of parent events (for depth derivation)
 * @param branch - Optional branch label
 */
export function createModelEvent(
  parentEventIds: BrandedEventId[],
  runId: BrandedRunId,
  agentId: BrandedAgentId,
  payload: ModelEventPayload,
  parentDepths: number[],
  branch?: string
): HermesEvent & VerifiedEvent {
  if (parentEventIds.length === 0) {
    throw new Error("MODEL event requires non-empty parentEventIds. Use createGenesisEvent for genesis events.");
  }
  if (parentDepths.length !== parentEventIds.length) {
    throw new Error("parentDepths must match parentEventIds length.");
  }

  const event = constructEvent(
    "MODEL",
    parentEventIds,
    payload,
    runId,
    agentId,
    branch,
    parentDepths
  );

  return sealVerifiedEvent(event) as HermesEvent & VerifiedEvent;
}

/**
 * Create a DECISION tier event — agent decisions.
 *
 * @param parentEventIds - Causal parent events (MUST be non-empty)
 * @param runId - The run this event belongs to
 * @param agentId - The agent making this decision
 * @param payload - Decision details
 * @param parentDepths - Causal depths of parent events
 * @param branch - Optional branch label
 */
export function createDecisionEvent(
  parentEventIds: BrandedEventId[],
  runId: BrandedRunId,
  agentId: BrandedAgentId,
  payload: DecisionEventPayload,
  parentDepths: number[],
  branch?: string
): HermesEvent & VerifiedEvent {
  if (parentEventIds.length === 0) {
    throw new Error("DECISION event requires non-empty parentEventIds. Use createGenesisEvent for genesis events.");
  }
  if (parentDepths.length !== parentEventIds.length) {
    throw new Error("parentDepths must match parentEventIds length.");
  }

  const event = constructEvent(
    "DECISION",
    parentEventIds,
    payload,
    runId,
    agentId,
    branch,
    parentDepths
  );

  return sealVerifiedEvent(event) as HermesEvent & VerifiedEvent;
}

/**
 * Create an EXECUTION tier event — tool execution results.
 *
 * @param parentEventIds - Causal parent events (MUST be non-empty)
 * @param runId - The run this event belongs to
 * @param agentId - The agent that triggered execution
 * @param payload - Execution details
 * @param parentDepths - Causal depths of parent events
 * @param branch - Optional branch label
 */
export function createExecutionEvent(
  parentEventIds: BrandedEventId[],
  runId: BrandedRunId,
  agentId: BrandedAgentId,
  payload: ExecutionEventPayload,
  parentDepths: number[],
  branch?: string
): HermesEvent & VerifiedEvent {
  if (parentEventIds.length === 0) {
    throw new Error("EXECUTION event requires non-empty parentEventIds. Use createGenesisEvent for genesis events.");
  }
  if (parentDepths.length !== parentEventIds.length) {
    throw new Error("parentDepths must match parentEventIds length.");
  }

  const event = constructEvent(
    "EXECUTION",
    parentEventIds,
    payload,
    runId,
    agentId,
    branch,
    parentDepths
  );

  return sealVerifiedEvent(event) as HermesEvent & VerifiedEvent;
}

/**
 * Create a SYSTEM tier event — infrastructure events.
 * Non-genesis system events still require parentEventIds.
 *
 * @param parentEventIds - Causal parent events (empty ONLY for genesis)
 * @param runId - The run this event belongs to
 * @param payload - System event details
 * @param parentDepths - Causal depths of parent events (empty for genesis)
 * @param branch - Optional branch label
 */
export function createSystemEvent(
  parentEventIds: BrandedEventId[],
  runId: BrandedRunId,
  payload: SystemEventPayload,
  parentDepths: number[],
  branch?: string
): HermesEvent & VerifiedEvent {
  // System events can be genesis (empty parents) or non-genesis
  if (parentEventIds.length === 0) {
    // Genesis path — only allowed for run_start subtypes
    if (payload.subtype !== "run_start") {
      throw new Error("Only run_start system events can be genesis events.");
    }
  } else {
    if (parentDepths.length !== parentEventIds.length) {
      throw new Error("parentDepths must match parentEventIds length.");
    }
  }

  const event = constructEvent(
    "SYSTEM",
    parentEventIds,
    payload,
    runId,
    undefined, // System events don't have an agent
    branch,
    parentDepths
  );

  return sealVerifiedEvent(event) as HermesEvent & VerifiedEvent;
}

/**
 * Create a TELEMETRY tier event — observability data.
 *
 * @param parentEventIds - Causal parent events (MUST be non-empty)
 * @param runId - The run this event belongs to
 * @param payload - Telemetry data
 * @param parentDepths - Causal depths of parent events
 * @param branch - Optional branch label
 */
export function createTelemetryEvent(
  parentEventIds: BrandedEventId[],
  runId: BrandedRunId,
  payload: TelemetryEventPayload,
  parentDepths: number[],
  branch?: string
): HermesEvent & VerifiedEvent {
  if (parentEventIds.length === 0) {
    throw new Error("TELEMETRY event requires non-empty parentEventIds.");
  }
  if (parentDepths.length !== parentEventIds.length) {
    throw new Error("parentDepths must match parentEventIds length.");
  }

  const event = constructEvent(
    "TELEMETRY",
    parentEventIds,
    payload,
    runId,
    undefined, // Telemetry events don't have an agent
    branch,
    parentDepths
  );

  return sealVerifiedEvent(event) as HermesEvent & VerifiedEvent;
}

// ═══════════════════════════════════════════════════════════════
// Convenience: Unbranded ID Acceptors
// ═══════════════════════════════════════════════════════════════

/**
 * Accept unbranded string IDs and convert them to branded IDs.
 * This is a convenience layer for callers that don't have branded IDs yet.
 * Use this ONLY during integration with legacy code.
 */
export const legacyIdAdapter = {
  toEventId: brandEventId,
  toRunId: createRunId,
  toAgentId: createAgentId,
};
