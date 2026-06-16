/**
 * @hermes/event-dsl — Event Validation
 *
 * Runtime validation for HermesEvent instances.
 * These validators enforce the structural invariants of the event DSL:
 *   - Correct event tier
 *   - Parent event ID requirements (non-empty for non-genesis)
 *   - Causal depth consistency
 *   - Content hash integrity
 *   - Required payload fields per tier
 */

import { verifyContentHash } from "./hashing";
import type {
  HermesEvent,
  HermesEventTier,
  ModelEventPayload,
  DecisionEventPayload,
  ExecutionEventPayload,
  SystemEventPayload,
  TelemetryEventPayload,
} from "./types";
import { VALID_EVENT_TIERS } from "./types";

// ═══════════════════════════════════════════════════════════════
// Validation Result
// ═══════════════════════════════════════════════════════════════

export interface EventValidationResult {
  valid: boolean;
  errors: EventValidationError[];
}

export interface EventValidationError {
  code: string;
  message: string;
  field?: string;
}

function valid(): EventValidationResult {
  return { valid: true, errors: [] };
}

function invalid(errors: EventValidationError[]): EventValidationResult {
  return { valid: false, errors };
}

function err(code: string, message: string, field?: string): EventValidationError {
  return { code, message, field };
}

// ═══════════════════════════════════════════════════════════════
// Structural Validation
// ═══════════════════════════════════════════════════════════════

/**
 * Validate the structural invariants of a HermesEvent.
 *
 * Checks:
 * 1. Valid event tier
 * 2. Genesis events have depth 0 and empty parentEventIds
 * 3. Non-genesis events have non-empty parentEventIds
 * 4. Causal depth > 0 for non-genesis events
 * 5. Valid timestamp (positive number)
 * 6. Non-empty contentHash
 * 7. Non-empty runId
 * 8. Tier-specific payload validation
 * 9. Content hash integrity
 */
export function validateHermesEvent(event: HermesEvent): EventValidationResult {
  const errors: EventValidationError[] = [];

  // 1. Valid event tier
  if (!VALID_EVENT_TIERS.includes(event.eventType)) {
    errors.push(err(
      "INVALID_EVENT_TYPE",
      `Invalid event type: ${String(event.eventType)}. Must be one of: ${VALID_EVENT_TIERS.join(", ")}`,
      "eventType"
    ));
  }

  // 2 & 3. Parent event requirements
  if (event.causalDepth === 0) {
    if (event.parentEventIds.length > 0) {
      errors.push(err(
        "GENESIS_WITH_PARENTS",
        "Genesis events (depth 0) must have empty parentEventIds",
        "parentEventIds"
      ));
    }
  } else {
    if (event.parentEventIds.length === 0) {
      errors.push(err(
        "ORPHAN_EVENT",
        `Non-genesis event (depth ${event.causalDepth}) must have non-empty parentEventIds`,
        "parentEventIds"
      ));
    }
  }

  // 4. Positive depth for non-genesis
  if (event.causalDepth < 0) {
    errors.push(err(
      "NEGATIVE_DEPTH",
      `Causal depth cannot be negative: ${event.causalDepth}`,
      "causalDepth"
    ));
  }

  // 5. Valid timestamp
  if (event.timestamp <= 0) {
    errors.push(err(
      "INVALID_TIMESTAMP",
      "Timestamp must be a positive number",
      "timestamp"
    ));
  }

  // 6. Non-empty content hash
  if (!event.contentHash || String(event.contentHash).trim() === "") {
    errors.push(err(
      "EMPTY_CONTENT_HASH",
      "Content hash must be non-empty",
      "contentHash"
    ));
  }

  // 7. Non-empty run ID
  if (!event.runId || String(event.runId).trim() === "") {
    errors.push(err(
      "EMPTY_RUN_ID",
      "Run ID must be non-empty",
      "runId"
    ));
  }

  // 8. Tier-specific payload validation
  const payloadErrors = validatePayloadForTier(event.eventType, event.payload);
  errors.push(...payloadErrors);

  // 9. Content hash integrity
  try {
    if (!verifyContentHash(event as unknown as Record<string, unknown> & { contentHash: string })) {
      errors.push(err(
        "HASH_INTEGRITY_FAILURE",
        "Content hash does not match computed hash",
        "contentHash"
      ));
    }
  } catch {
    // Hash verification failed — likely malformed event
    errors.push(err(
      "HASH_VERIFICATION_ERROR",
      "Content hash verification threw an error",
      "contentHash"
    ));
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

// ═══════════════════════════════════════════════════════════════
// Payload Validation per Tier
// ═══════════════════════════════════════════════════════════════

function validatePayloadForTier(
  tier: HermesEventTier,
  payload: Record<string, unknown>
): EventValidationError[] {
  const errors: EventValidationError[] = [];

  switch (tier) {
    case "MODEL":
      errors.push(...validateModelPayload(payload as unknown as ModelEventPayload));
      break;
    case "DECISION":
      errors.push(...validateDecisionPayload(payload as unknown as DecisionEventPayload));
      break;
    case "EXECUTION":
      errors.push(...validateExecutionPayload(payload as unknown as ExecutionEventPayload));
      break;
    case "SYSTEM":
      errors.push(...validateSystemPayload(payload as unknown as SystemEventPayload));
      break;
    case "TELEMETRY":
      errors.push(...validateTelemetryPayload(payload as unknown as TelemetryEventPayload));
      break;
  }

  return errors;
}

function validateModelPayload(payload: ModelEventPayload): EventValidationError[] {
  const errors: EventValidationError[] = [];
  if (!payload.prompt) errors.push(err("MISSING_FIELD", "MODEL payload requires 'prompt'", "payload.prompt"));
  if (!payload.response && payload.response !== "") errors.push(err("MISSING_FIELD", "MODEL payload requires 'response'", "payload.response"));
  if (!payload.modelId) errors.push(err("MISSING_FIELD", "MODEL payload requires 'modelId'", "payload.modelId"));
  return errors;
}

function validateDecisionPayload(payload: DecisionEventPayload): EventValidationError[] {
  const errors: EventValidationError[] = [];
  if (!payload.decision) errors.push(err("MISSING_FIELD", "DECISION payload requires 'decision'", "payload.decision"));
  if (!payload.reasoning) errors.push(err("MISSING_FIELD", "DECISION payload requires 'reasoning'", "payload.reasoning"));
  return errors;
}

function validateExecutionPayload(payload: ExecutionEventPayload): EventValidationError[] {
  const errors: EventValidationError[] = [];
  if (!payload.tool) errors.push(err("MISSING_FIELD", "EXECUTION payload requires 'tool'", "payload.tool"));
  if (!payload.input && payload.input !== "") errors.push(err("MISSING_FIELD", "EXECUTION payload requires 'input'", "payload.input"));
  if (payload.success === undefined) errors.push(err("MISSING_FIELD", "EXECUTION payload requires 'success'", "payload.success"));
  return errors;
}

function validateSystemPayload(payload: SystemEventPayload): EventValidationError[] {
  const errors: EventValidationError[] = [];
  const validSubtypes: SystemEventPayload["subtype"][] = [
    "run_start", "run_complete", "run_error", "run_stopped",
    "agent_registered", "agent_deregistered",
    "checkpoint_created", "branch_created", "branch_merged",
    "policy_applied", "approval_requested", "approval_resolved",
    "config_changed",
  ];
  if (!payload.subtype) {
    errors.push(err("MISSING_FIELD", "SYSTEM payload requires 'subtype'", "payload.subtype"));
  } else if (!validSubtypes.includes(payload.subtype)) {
    errors.push(err("INVALID_SUBTYPE", `Invalid system event subtype: ${payload.subtype}`, "payload.subtype"));
  }
  if (!payload.message) errors.push(err("MISSING_FIELD", "SYSTEM payload requires 'message'", "payload.message"));
  return errors;
}

function validateTelemetryPayload(payload: TelemetryEventPayload): EventValidationError[] {
  const errors: EventValidationError[] = [];
  if (!payload.metric) errors.push(err("MISSING_FIELD", "TELEMETRY payload requires 'metric'", "payload.metric"));
  if (typeof payload.value !== "number") errors.push(err("MISSING_FIELD", "TELEMETRY payload requires 'value' (number)", "payload.value"));
  return errors;
}

// ═══════════════════════════════════════════════════════════════
// Context Validation
// ═══════════════════════════════════════════════════════════════

/**
 * Validate that all parent events of a new event exist in the event log.
 * This requires the set of existing event IDs in the current run.
 */
export function validateParentExistence(
  parentEventIds: readonly string[],
  existingEventIds: Set<string>
): EventValidationResult {
  const errors: EventValidationError[] = [];

  for (const parentId of parentEventIds) {
    if (!existingEventIds.has(parentId)) {
      errors.push(err(
        "MISSING_PARENT_EVENT",
        `Parent event not found in log: ${parentId}`,
        "parentEventIds"
      ));
    }
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validate that a sequence of events maintains causal consistency.
 * Checks that each event's parentEventIds reference earlier events.
 */
export function validateCausalConsistency(events: HermesEvent[]): EventValidationResult {
  const errors: EventValidationError[] = [];
  const eventIds = new Set<string>();

  for (const event of events) {
    // Check parent existence
    for (const parentId of event.parentEventIds) {
      if (!eventIds.has(String(parentId))) {
        errors.push(err(
          "CAUSAL_INCONSISTENCY",
          `Event ${String(event.eventId)} references parent ${String(parentId)} that hasn't been seen yet`,
          "parentEventIds"
        ));
      }
    }

    eventIds.add(String(event.eventId));
  }

  return errors.length > 0 ? invalid(errors) : valid();
}
