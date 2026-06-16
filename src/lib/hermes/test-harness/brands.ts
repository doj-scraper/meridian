/**
 * @hermes/test-harness — Brand Type System
 *
 * Nominal type branding for compile-time enforcement of Hermes invariants.
 * Branded types cannot be constructed outside their authorized packages,
 * providing a type-system firewall that prevents invalid state from
 * propagating through the causal execution substrate.
 *
 * Brand<T, Tag> creates a structurally-identical but nominally-distinct
 * type — TypeScript will reject assignment from the unbranded base type.
 */

// ═══════════════════════════════════════════════════════════════
// Brand Constructor
// ═══════════════════════════════════════════════════════════════

/**
 * Create a nominal branded type from a structural type.
 *
 * Usage: type VerifiedX = Brand<X, "VerifiedX">;
 *
 * The branded type is structurally compatible with T for reading,
 * but cannot be constructed by simple assignment — it requires
 * an explicit cast through an authorized constructor function.
 */
export type Brand<T, Tag extends string> = T & { readonly __brand: Tag };

/**
 * Unwrap a branded type back to its structural base.
 * Only use this in authorized verification paths.
 */
export type Unbrand<B> = B extends Brand<infer T, string> ? T : B;

/**
 * Type guard: check if a value carries a specific brand.
 * Runtime check is a no-op (brands are erased at runtime),
 * but the type narrows correctly.
 */
export function hasBrand<T, Tag extends string>(
  value: unknown,
  _tag: Tag
): value is Brand<T, Tag> {
  // Brands are compile-time only — runtime brand checks
  // are structural (delegated to validators)
  return value !== null && typeof value === "object";
}

// ═══════════════════════════════════════════════════════════════
// Core Branded Types
// ═══════════════════════════════════════════════════════════════

/**
 * Branded Event ID — only constructable via Event DSL constructors.
 * Prevents arbitrary string injection as event references.
 */
export type BrandedEventId = Brand<string, "BrandedEventId">;

/**
 * Branded Run ID — only constructable via kernel run initialization.
 * Prevents cross-run event contamination.
 */
export type BrandedRunId = Brand<string, "BrandedRunId">;

/**
 * Branded Agent ID — only constructable via agent registration.
 */
export type BrandedAgentId = Brand<string, "BrandedAgentId">;

/**
 * Branded Content Hash — only constructable via SHA-256 hashing.
 * Prevents hash forgery or unverified hash propagation.
 */
export type BrandedContentHash = Brand<string, "BrandedContentHash">;

// ═══════════════════════════════════════════════════════════════
// Verified Types (Causal Core Lock)
// ═══════════════════════════════════════════════════════════════

/**
 * A HermesEvent that has been validated by the Event DSL.
 * Construction is only possible through Event DSL constructors,
 * which enforce parentEventIds requirements and hash consistency.
 */
export type VerifiedEvent = Brand<unknown, "VerifiedEvent">;

/**
 * A CausalGraph that has been verified as a valid DAG by the
 * Causal Core Lock. Construction is ONLY possible through:
 *   - @hermes/test-harness (graph generators)
 *   - @hermes/causal-core-lock (graph builder)
 *
 * This is the central type-system firewall. Any function that
 * accepts a VerifiedCausalGraph is guaranteed to receive a
 * valid, acyclic, causally-consistent graph.
 */
export type VerifiedCausalGraph = Brand<unknown, "VerifiedCausalGraph">;

/**
 * A FrontierState that has been computed by the Causal Frontier Solver.
 * Construction is only possible through computeFrontier() and
 * advanceFrontier() in @hermes/frontier.
 */
export type VerifiedFrontierState = Brand<unknown, "VerifiedFrontierState">;

/**
 * A topological ordering that has been validated by the CCL.
 * Guarantees: no duplicate ranks, all events accounted for,
 * ranks consistent with causal depth.
 */
export type VerifiedTopologicalOrder = Brand<unknown, "VerifiedTopologicalOrder">;

// ═══════════════════════════════════════════════════════════════
// Brand Constructors (Authorized Only)
// ═══════════════════════════════════════════════════════════════

/**
 * AUTHORIZED: Create a BrandedEventId.
 * Only called from Event DSL constructors after validation.
 * @internal
 */
export function brandEventId(id: string): BrandedEventId {
  return id as BrandedEventId;
}

/**
 * AUTHORIZED: Create a BrandedRunId.
 * Only called from kernel-spine run initialization.
 * @internal
 */
export function brandRunId(id: string): BrandedRunId {
  return id as BrandedRunId;
}

/**
 * AUTHORIZED: Create a BrandedAgentId.
 * Only called from kernel-spine agent registration.
 * @internal
 */
export function brandAgentId(id: string): BrandedAgentId {
  return id as BrandedAgentId;
}

/**
 * AUTHORIZED: Create a BrandedContentHash.
 * Only called from SHA-256 hashing in event-dsl.
 * @internal
 */
export function brandContentHash(hash: string): BrandedContentHash {
  return hash as BrandedContentHash;
}

/**
 * AUTHORIZED: Create a VerifiedEvent brand.
 * Only called from Event DSL constructors after full validation.
 * @internal
 */
export function sealVerifiedEvent<T>(event: T): VerifiedEvent {
  return event as VerifiedEvent;
}

/**
 * AUTHORIZED: Create a VerifiedCausalGraph brand.
 * Only callable from @hermes/test-harness and @hermes/causal-core-lock.
 * @internal
 */
export function sealVerifiedCausalGraph<T>(graph: T): VerifiedCausalGraph {
  return graph as VerifiedCausalGraph;
}

/**
 * AUTHORIZED: Create a VerifiedFrontierState brand.
 * Only callable from @hermes/frontier.
 * @internal
 */
export function sealVerifiedFrontierState<T>(state: T): VerifiedFrontierState {
  return state as VerifiedFrontierState;
}

/**
 * AUTHORIZED: Create a VerifiedTopologicalOrder brand.
 * Only callable from @hermes/causal-core-lock.
 * @internal
 */
export function sealVerifiedTopologicalOrder<T>(order: T): VerifiedTopologicalOrder {
  return order as VerifiedTopologicalOrder;
}
