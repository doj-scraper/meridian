/**
 * @hermes/test-harness — Formal Verification Layer
 *
 * The foundational package of the Hermes Causal DAG Architecture.
 * Provides nominal type branding, runtime validators, graph generators,
 * and property-based testing infrastructure.
 *
 * PACKAGE DEPENDENCY LAW:
 * This package has ZERO dependencies on other Hermes packages.
 * All other Hermes packages may depend on this one.
 *
 * AUTHORITY:
 * This package is one of only TWO authorized sources for
 * VerifiedCausalGraph construction (the other being @hermes/causal-core-lock).
 */

// ── Brands ──
export {
  // Brand type utilities
  type Brand,
  type Unbrand,
  hasBrand,

  // Core branded types
  type BrandedEventId,
  type BrandedRunId,
  type BrandedAgentId,
  type BrandedContentHash,

  // Verified types (CCL)
  type VerifiedEvent,
  type VerifiedCausalGraph,
  type VerifiedFrontierState,
  type VerifiedTopologicalOrder,

  // Brand constructors (authorized only)
  brandEventId,
  brandRunId,
  brandAgentId,
  brandContentHash,
  sealVerifiedEvent,
  sealVerifiedCausalGraph,
  sealVerifiedFrontierState,
  sealVerifiedTopologicalOrder,
} from "./brands";

// ── Validators ──
export {
  // Validation result types
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type DetailedValidationResult,

  // Causal graph validation
  type CausalGraphCandidate,
  type CausalNodeCandidate,
  type CausalEdgeCandidate,
  validateCausalGraph,
  checkAcyclicity,

  // Event validation
  type HermesEventTier,
  type HermesEventCandidate,
  validateEvent,
  validateEventInContext,

  // Frontier state validation
  type FrontierStateCandidate,
  validateFrontierState,

  // Verified graph construction
  verifyAndBrandCausalGraph,
  tryVerifyCausalGraph,
} from "./validators";

// ── Generators ──
export {
  // Utility
  testEventId,
  resetIdCounter,
  nextId,
  SeededRNG,

  // Generator functions
  linearChain,
  diamondDAG,
  wideFan,
  randomDAG,
  branchedDAG,
  complexDAG,

  // Verified generator functions
  verifiedLinearChain,
  verifiedDiamondDAG,
  verifiedWideFan,
  verifiedRandomDAG,
  verifiedBranchedDAG,
  verifiedComplexDAG,
} from "./generators";

// ── Properties ──
export {
  // Property check types
  type PropertyCheckResult,

  // Graph invariants
  property_acyclicity,
  property_depthMonotonicity,
  property_genesisUniqueness,
  property_parentExistence,
  property_depthConsistency,
  property_noOrphanEvents,
  property_edgeParentConsistency,

  // Frontier invariants
  property_frontierVisitedDisjoint,
  property_frontierParentsVisited,
  property_frontierCompleteness,

  // Batch checking
  checkAllGraphProperties,
  checkAllFrontierProperties,
  regressionTestAllGenerators,
} from "./properties";
