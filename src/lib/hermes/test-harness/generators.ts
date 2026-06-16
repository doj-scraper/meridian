/**
 * @hermes/test-harness — Graph Generators
 *
 * Deterministic graph generators for testing and verification.
 * Each generator produces a valid CausalGraphCandidate that
 * can be verified and branded via verifyAndBrandCausalGraph().
 *
 * These generators are essential for:
 *   - Property-based testing of frontier solver
 *   - Stress-testing topological sort
 *   - Validating reducer correctness over diverse topologies
 *   - Regression testing of DAG invariants
 */

import type {
  CausalGraphCandidate,
  CausalNodeCandidate,
  CausalEdgeCandidate,
} from "./validators";
import { verifyAndBrandCausalGraph } from "./validators";
import type { VerifiedCausalGraph } from "./brands";

// ═══════════════════════════════════════════════════════════════
// Utility
// ═══════════════════════════════════════════════════════════════

let idCounter = 0;

/**
 * Generate a deterministic event ID for testing.
 * Format: evt_{generator}_{index}
 */
export function testEventId(generator: string, index: number): string {
  return `evt_${generator}_${index}`;
}

/**
 * Reset the global ID counter (for test isolation).
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Generate a unique ID with an auto-incrementing counter.
 */
export function nextId(prefix: string): string {
  return `${prefix}_${++idCounter}`;
}

// ═══════════════════════════════════════════════════════════════
// Linear Chain Generator
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a linear chain: A → B → C → D → ...
 * Every event has exactly one parent (except genesis).
 * Causal depth equals position in chain.
 *
 * @param length - Number of events in the chain
 * @param runId - Run ID for all events
 */
export function linearChain(length: number, runId = "test-run"): CausalGraphCandidate {
  const nodes: CausalNodeCandidate[] = [];
  const edges: CausalEdgeCandidate[] = [];

  for (let i = 0; i < length; i++) {
    const id = testEventId("chain", i);
    const parentEventIds = i === 0 ? [] : [testEventId("chain", i - 1)];

    nodes.push({
      id,
      causalDepth: i,
      parentEventIds,
    });

    if (i > 0) {
      edges.push({
        source: testEventId("chain", i - 1),
        target: id,
        edgeType: "causal",
      });
    }
  }

  return { nodes, edges };
}

/**
 * Generate and verify a linear chain as a VerifiedCausalGraph.
 */
export function verifiedLinearChain(length: number, runId?: string): VerifiedCausalGraph {
  return verifyAndBrandCausalGraph(linearChain(length, runId));
}

// ═══════════════════════════════════════════════════════════════
// Diamond DAG Generator
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a diamond DAG:
 *
 *       A
 *      / \
 *     B   C
 *      \ /
 *       D
 *
 * A is genesis, B and C both depend on A, D depends on both B and C.
 * The frontier after visiting A is {B, C}.
 *
 * @param width - Number of parallel branches (default 2)
 * @param depth - Number of levels per branch (default 1)
 * @param runId - Run ID for all events
 */
export function diamondDAG(
  width = 2,
  depth = 1,
  runId = "test-run"
): CausalGraphCandidate {
  const nodes: CausalNodeCandidate[] = [];
  const edges: CausalEdgeCandidate[] = [];

  // Genesis node
  const genesisId = testEventId("diamond", 0);
  nodes.push({ id: genesisId, causalDepth: 0, parentEventIds: [] });

  // Branch nodes at each depth level
  let nodeId = 1;
  const branchTails: string[][] = [[genesisId]]; // At depth 0, all branches start from genesis

  for (let d = 1; d <= depth; d++) {
    const currentLevelIds: string[] = [];

    for (let b = 0; b < width; b++) {
      const id = testEventId("diamond", nodeId++);
      const parentIds = branchTails[d - 1];

      nodes.push({ id, causalDepth: d, parentEventIds: [...parentIds] });

      for (const parentId of parentIds) {
        edges.push({ source: parentId, target: id, edgeType: "causal" });
      }

      currentLevelIds.push(id);
    }

    branchTails.push(currentLevelIds);
  }

  // Convergence node (if depth > 0)
  if (depth > 0) {
    const convergenceId = testEventId("diamond", nodeId);
    const convergenceParents = branchTails[depth];

    nodes.push({
      id: convergenceId,
      causalDepth: depth + 1,
      parentEventIds: [...convergenceParents],
    });

    for (const parentId of convergenceParents) {
      edges.push({ source: parentId, target: convergenceId, edgeType: "causal" });
    }
  }

  return { nodes, edges };
}

/**
 * Generate and verify a diamond DAG as a VerifiedCausalGraph.
 */
export function verifiedDiamondDAG(width?: number, depth?: number, runId?: string): VerifiedCausalGraph {
  return verifyAndBrandCausalGraph(diamondDAG(width, depth, runId));
}

// ═══════════════════════════════════════════════════════════════
// Wide Fan Generator
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a wide fan-out from a single genesis:
 *
 *    A → B₁
 *    A → B₂
 *    A → B₃
 *    ...
 *    A → Bₙ
 *
 * All fan-out nodes are simultaneously in the frontier after visiting A.
 * Useful for testing concurrent frontier processing.
 *
 * @param fanWidth - Number of fan-out nodes (default 5)
 * @param runId - Run ID for all events
 */
export function wideFan(fanWidth = 5, runId = "test-run"): CausalGraphCandidate {
  const nodes: CausalNodeCandidate[] = [];
  const edges: CausalEdgeCandidate[] = [];

  // Genesis node
  const genesisId = testEventId("fan", 0);
  nodes.push({ id: genesisId, causalDepth: 0, parentEventIds: [] });

  // Fan-out nodes
  for (let i = 1; i <= fanWidth; i++) {
    const id = testEventId("fan", i);
    nodes.push({ id, causalDepth: 1, parentEventIds: [genesisId] });
    edges.push({ source: genesisId, target: id, edgeType: "causal" });
  }

  return { nodes, edges };
}

/**
 * Generate and verify a wide fan as a VerifiedCausalGraph.
 */
export function verifiedWideFan(fanWidth?: number, runId?: string): VerifiedCausalGraph {
  return verifyAndBrandCausalGraph(wideFan(fanWidth, runId));
}

// ═══════════════════════════════════════════════════════════════
// Random DAG Generator
// ═══════════════════════════════════════════════════════════════

/**
 * Seeded pseudo-random number generator (LCG) for deterministic tests.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    // Linear Congruential Generator (Lehmer)
    this.state = (this.state * 1664525 + 1013904223) & 0xffffffff;
    return (this.state >>> 0) / 0xffffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  pickN<T>(array: T[], n: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, n);
  }
}

/**
 * Generate a random DAG with controlled parameters.
 *
 * Strategy: Generate events in causal-depth order, ensuring each
 * non-genesis event has at least one parent from the previous depth.
 * This guarantees acyclicity by construction.
 *
 * @param nodeCount - Total number of nodes
 * @param maxDepth - Maximum causal depth
 * @param maxParents - Maximum number of parents per node
 * @param seed - RNG seed for deterministic generation
 * @param runId - Run ID for all events
 */
export function randomDAG(
  nodeCount = 20,
  maxDepth = 5,
  maxParents = 3,
  seed = 42,
  runId = "test-run"
): CausalGraphCandidate {
  const rng = new SeededRNG(seed);
  const nodes: CausalNodeCandidate[] = [];
  const edges: CausalEdgeCandidate[] = [];

  // Distribute nodes across depth levels
  const depthLevels: string[][] = [];
  let remaining = nodeCount;

  for (let d = 0; d <= maxDepth && remaining > 0; d++) {
    const countAtDepth = d === 0
      ? Math.max(1, Math.ceil(remaining / (maxDepth + 1)))
      : Math.min(remaining, rng.nextInt(1, Math.ceil(remaining / (maxDepth - d + 1))));

    const actualCount = Math.min(countAtDepth, remaining);
    const levelIds: string[] = [];

    for (let i = 0; i < actualCount; i++) {
      const id = testEventId("random", nodes.length);
      const parentEventIds: string[] = [];

      if (d === 0) {
        // Genesis level — no parents
      } else {
        // Must have at least one parent from a previous depth
        const previousDepthIds = depthLevels.slice(0, d).flat();
        const numParents = rng.nextInt(1, Math.min(maxParents, previousDepthIds.length));
        const selectedParents = rng.pickN(previousDepthIds, numParents);
        parentEventIds.push(...selectedParents.sort());

        // Create edges for each parent
        for (const parentId of selectedParents) {
          edges.push({ source: parentId, target: id, edgeType: "causal" });
        }
      }

      nodes.push({ id, causalDepth: d, parentEventIds });

      levelIds.push(id);
    }

    depthLevels.push(levelIds);
    remaining -= actualCount;
  }

  return { nodes, edges };
}

/**
 * Generate and verify a random DAG as a VerifiedCausalGraph.
 */
export function verifiedRandomDAG(
  nodeCount?: number,
  maxDepth?: number,
  maxParents?: number,
  seed?: number,
  runId?: string
): VerifiedCausalGraph {
  return verifyAndBrandCausalGraph(randomDAG(nodeCount, maxDepth, maxParents, seed, runId));
}

// ═══════════════════════════════════════════════════════════════
// Branched DAG Generator
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a DAG with explicit branch labels for frontier branch testing.
 *
 *     [genesis]
 *      /    \
 *  [branch:A] [branch:B]
 *     |         |
 *  [A:step1]  [B:step1]
 *     |         |
 *  [A:step2]  [B:step2]
 *
 * @param branchCount - Number of parallel branches
 * @param branchLength - Events per branch (excluding genesis)
 * @param runId - Run ID for all events
 */
export function branchedDAG(
  branchCount = 2,
  branchLength = 3,
  runId = "test-run"
): CausalGraphCandidate {
  const nodes: CausalNodeCandidate[] = [];
  const edges: CausalEdgeCandidate[] = [];

  // Genesis node
  const genesisId = testEventId("branch", 0);
  nodes.push({ id: genesisId, causalDepth: 0, parentEventIds: [] });

  let nodeId = 1;

  for (let b = 0; b < branchCount; b++) {
    const branchLabel = `branch-${b}`;
    let previousId = genesisId;

    for (let s = 0; s < branchLength; s++) {
      const id = testEventId("branch", nodeId++);
      nodes.push({
        id,
        causalDepth: s + 1,
        parentEventIds: [previousId],
        branch: branchLabel,
      });

      edges.push({
        source: previousId,
        target: id,
        edgeType: s === 0 ? "branch" : "causal",
      });

      previousId = id;
    }
  }

  return { nodes, edges };
}

/**
 * Generate and verify a branched DAG as a VerifiedCausalGraph.
 */
export function verifiedBranchedDAG(
  branchCount?: number,
  branchLength?: number,
  runId?: string
): VerifiedCausalGraph {
  return verifyAndBrandCausalGraph(branchedDAG(branchCount, branchLength, runId));
}

// ═══════════════════════════════════════════════════════════════
// Complex DAG Generator (Multi-pattern)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a complex DAG combining multiple patterns:
 * genesis → fan-out → chain per branch → convergence → fan-out → convergence
 *
 * This is a representative "real-world" agent workflow DAG.
 *
 * @param stages - Number of fan-out → convergence stages
 * @param fanWidth - Width of each fan-out
 * @param chainLength - Chain length between fan-out and convergence
 * @param runId - Run ID
 */
export function complexDAG(
  stages = 2,
  fanWidth = 3,
  chainLength = 2,
  runId = "test-run"
): CausalGraphCandidate {
  const nodes: CausalNodeCandidate[] = [];
  const edges: CausalEdgeCandidate[] = [];
  let nodeId = 0;
  let currentDepth = 0;

  function addNode(parentIds: string[], depth: number, branch?: string): string {
    const id = testEventId("complex", nodeId++);
    nodes.push({ id, causalDepth: depth, parentEventIds: [...parentIds], branch });
    for (const pid of parentIds) {
      edges.push({ source: pid, target: id, edgeType: "causal" });
    }
    return id;
  }

  // Genesis
  let convergenceId = addNode([], 0);
  currentDepth = 0;

  for (let s = 0; s < stages; s++) {
    currentDepth++;

    // Fan-out
    const fanIds: string[] = [];
    for (let f = 0; f < fanWidth; f++) {
      fanIds.push(addNode([convergenceId], currentDepth, `stage-${s}-fan-${f}`));
    }

    // Chains per branch
    const chainEnds: string[] = [];
    for (let f = 0; f < fanWidth; f++) {
      let chainPrev = fanIds[f];
      for (let c = 0; c < chainLength; c++) {
        currentDepth++;
        chainPrev = addNode([chainPrev], currentDepth, `stage-${s}-chain-${f}-${c}`);
      }
      chainEnds.push(chainPrev);
    }

    // Convergence
    currentDepth++;
    convergenceId = addNode(chainEnds, currentDepth);
  }

  return { nodes, edges };
}

/**
 * Generate and verify a complex DAG as a VerifiedCausalGraph.
 */
export function verifiedComplexDAG(
  stages?: number,
  fanWidth?: number,
  chainLength?: number,
  runId?: string
): VerifiedCausalGraph {
  return verifyAndBrandCausalGraph(complexDAG(stages, fanWidth, chainLength, runId));
}
