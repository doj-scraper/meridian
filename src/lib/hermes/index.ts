/**
 * @hermes — Causal DAG Architecture
 *
 * The Hermes Causal DAG Architecture replaces implicit mutation
 * with explicit causal event topology.
 *
 * KERNEL INVERSION:
 *   BEFORE: action → mutate state → emit logs
 *   AFTER:  action → emit event → reducer applies state
 *
 * PACKAGE DEPENDENCY LAW (UNIDIRECTIONAL):
 *   test-harness → causal-core-lock → kernel-spine → frontier → hqa → ui-topology
 *
 * Sub-packages:
 * - @hermes/test-harness:    Formal verification layer (brands, validators, generators)
 * - @hermes/event-dsl:       Event DSL with compile-time enforcement
 * - @hermes/causal-core-lock: CCL type-system firewall
 * - @hermes/kernel-spine:    Single deterministic transition loop
 * - @hermes/frontier:        Causal Frontier Solver
 * - @hermes/ui-topology:     Strict projection subsystem
 * - @hermes/hqa:             Hermes Query Algebra
 */

// ── Test Harness (Phase 0.5) ──
export * from "./test-harness";

// ── Event DSL (Phase 1.0) ──
export * from "./event-dsl";

// ── Causal Core Lock (Phase 1.1) ──
export * from "./causal-core-lock";

// ── Kernel Spine (Phase 1.5) ──
export * from "./kernel-spine";

// ── Frontier Solver (Phase 2.0) ──
export * from "./frontier";

// ── UI Topology (Phase 2.5) ──
export * from "./ui-topology";

// ── HQA (Phase 3.0) ──
export * from "./hqa";
