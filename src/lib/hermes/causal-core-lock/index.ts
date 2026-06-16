/**
 * @hermes/causal-core-lock — CCL Type-System Firewall
 *
 * The Causal Core Lock is the central enforcement mechanism of the
 * Hermes architecture. It provides:
 *
 * 1. VerifiedCausalGraph — a branded type that guarantees graph validity
 * 2. Graph construction from HermesEvent sequences
 * 3. Topological ordering with deterministic tie-breaking
 * 4. Incremental graph extension
 * 5. Comprehensive integrity verification
 *
 * PACKAGE DEPENDENCY LAW:
 * Depends on: @hermes/test-harness, @hermes/event-dsl
 * Forbidden reverse: test-harness must NOT import from causal-core-lock
 */

// ── Types ──
export {
  type CausalGraph,
  type TopologicalOrdering,
  type GraphConstructionResult,
  type GraphConstructionWarning,
  type EventDepthContext,
  type ComputedDepth,
  type GraphIntegrityReport,
  type IntegrityViolation,
} from "./types";

// ── Graph Builder (AUTHORIZED CONSTRUCTION PATH) ──
export {
  buildCausalGraph,
  extendCausalGraph,
  computeCausalDepth,
  buildDepthContext,
  verifyGraphIntegrity,
} from "./graph-builder";

// ── Topological Sort ──
export {
  topologicalSort,
  assignTopologicalRanks,
  groupByDepth,
  computeGraphWidth,
  computeCriticalPathLength,
} from "./topological-sort";

// ── Brand Seal ──
export {
  sealGraph,
  sealOrder,
  isVerifiedCausalGraph,
  isVerifiedTopologicalOrder,
  unbrandGraph,
  unbrandOrder,
} from "./brand-seal";

// Re-export branded types from test-harness for convenience
export type {
  VerifiedCausalGraph,
  VerifiedTopologicalOrder,
} from "../test-harness/brands";
