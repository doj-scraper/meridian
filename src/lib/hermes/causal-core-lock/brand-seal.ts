/**
 * @hermes/causal-core-lock — Brand Seal
 *
 * The seal mechanism that prevents unauthorized construction of
 * VerifiedCausalGraph instances. The brand seal works through
 * TypeScript's type system — only code that imports the seal
 * functions from this module can create branded types.
 *
 * AUTHORIZED SEAL HOLDERS:
 *   - @hermes/test-harness (brands.ts — sealVerifiedCausalGraph)
 *   - @hermes/causal-core-lock (this module — re-exports seal)
 *
 * Any other package that attempts to create a VerifiedCausalGraph
 * will get a TypeScript compilation error.
 *
 * This is a compile-time enforcement mechanism. At runtime, the
 * branded types are structurally identical to their base types.
 * The safety comes from TypeScript preventing construction outside
 * the authorized paths.
 */

import {
  sealVerifiedCausalGraph,
  sealVerifiedTopologicalOrder,
  type VerifiedCausalGraph,
  type VerifiedTopologicalOrder,
} from "../test-harness/brands";

// ═══════════════════════════════════════════════════════════════
// Re-exported Seal Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Seal a CausalGraph as a VerifiedCausalGraph.
 *
 * AUTHORIZED USE ONLY:
 * - graph-builder.ts in this package
 * - generators.ts in @hermes/test-harness
 *
 * Any other use is a violation of the CCL invariant.
 */
export const sealGraph = sealVerifiedCausalGraph;

/**
 * Seal a TopologicalOrdering as a VerifiedTopologicalOrder.
 *
 * AUTHORIZED USE ONLY:
 * - graph-builder.ts in this package
 */
export const sealOrder = sealVerifiedTopologicalOrder;

// ═══════════════════════════════════════════════════════════════
// Type Guards
// ═══════════════════════════════════════════════════════════════

/**
 * Type guard: check if a value is a VerifiedCausalGraph.
 *
 * At runtime, this checks for the structural properties of a
 * CausalGraph (events map, edges array, genesisEventId).
 * The brand is a compile-time construct and doesn't exist at runtime.
 */
export function isVerifiedCausalGraph(value: unknown): value is VerifiedCausalGraph {
  if (value === null || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.events instanceof Map &&
    Array.isArray(obj.edges) &&
    typeof obj.genesisEventId === "string" &&
    typeof obj.maxDepth === "number" &&
    typeof obj.eventCount === "number"
  );
}

/**
 * Type guard: check if a value is a VerifiedTopologicalOrder.
 */
export function isVerifiedTopologicalOrder(value: unknown): value is VerifiedTopologicalOrder {
  if (value === null || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.orderedEventIds) &&
    obj.rankMap instanceof Map &&
    typeof obj.totalEvents === "number"
  );
}

// ═══════════════════════════════════════════════════════════════
// Unbrand Utilities (for internal use only)
// ═══════════════════════════════════════════════════════════════

/**
 * Unwrap a VerifiedCausalGraph to its base CausalGraph type.
 * Use ONLY when you need to access the structural properties
 * without the brand — e.g., for serialization or projection.
 *
 * This does NOT remove the brand at runtime — it merely
 * widens the type for downstream use.
 */
export function unbrandGraph(graph: VerifiedCausalGraph): Record<string, unknown> {
  return graph as unknown as Record<string, unknown>;
}

/**
 * Unwrap a VerifiedTopologicalOrder to its base type.
 */
export function unbrandOrder(order: VerifiedTopologicalOrder): Record<string, unknown> {
  return order as unknown as Record<string, unknown>;
}
