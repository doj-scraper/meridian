/**
 * @hermes/ui-topology — Graph Renderer
 *
 * Projects a causal graph into React Flow nodes and edges.
 * This is a PURE PROJECTION — React Flow is a dumb renderer.
 * It NEVER infers causality or defines truth.
 */

import type { HermesEvent, HermesEventTier, CausalEdge } from "../event-dsl/types";
import type { FrontierState } from "../frontier/types";
import type {
  CausalNodeProjection,
  CausalEdgeProjection,
  CausalNodeData,
  LayoutConfig,
} from "./types";
import { DEFAULT_LAYOUT_CONFIG } from "./types";

// ═══════════════════════════════════════════════════════════════
// Graph Projection
// ═══════════════════════════════════════════════════════════════

/**
 * Project a list of HermesEvents into React Flow nodes.
 *
 * Layout strategy:
 * - Horizontal position: determined by causal depth
 * - Vertical position: distributed within each depth level
 * - Branches are offset vertically
 *
 * This is a PURE FUNCTION — same input always produces the same output.
 */
export function projectToNodes(
  events: HermesEvent[],
  frontierState: FrontierState | null,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): CausalNodeProjection[] {
  // Group events by depth
  const depthGroups = new Map<number, HermesEvent[]>();
  for (const event of events) {
    const depth = event.causalDepth;
    if (!depthGroups.has(depth)) {
      depthGroups.set(depth, []);
    }
    depthGroups.get(depth)!.push(event);
  }

  const nodes: CausalNodeProjection[] = [];

  // Compute node positions
  for (const [depth, depthEvents] of Array.from(depthGroups.entries())) {
    // Sort events within depth by branch, then by timestamp
    const sorted = [...depthEvents].sort((a, b) => {
      const branchA = a.branch ?? "";
      const branchB = b.branch ?? "";
      if (branchA !== branchB) return branchA.localeCompare(branchB);
      return a.timestamp - b.timestamp;
    });

    sorted.forEach((event, index) => {
      const eventId = String(event.eventId);
      const isFrontier = frontierState?.frontier.has(eventId) ?? false;
      const isVisited = frontierState?.visited.has(eventId) ?? false;

      // Compute position
      const x = depth * config.nodeSpacingX + 100;
      const branchOffset = event.branch
        ? (hashString(event.branch) % 3 - 1) * 60
        : 0;
      const y = index * config.nodeSpacingY + 100 + branchOffset;

      nodes.push({
        id: eventId,
        position: { x, y },
        type: "causalEvent",
        data: extractNodeData(event, isFrontier, isVisited),
      });
    });
  }

  return nodes;
}

/**
 * Project causal edges from events into React Flow edges.
 * Each parent-child relationship becomes a directed edge.
 */
export function projectToEdges(
  events: HermesEvent[],
  frontierState: FrontierState | null,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): CausalEdgeProjection[] {
  const edges: CausalEdgeProjection[] = [];
  const frontierSet = frontierState?.frontier ?? new Set<string>();

  for (const event of events) {
    const targetId = String(event.eventId);

    for (const parentId of event.parentEventIds) {
      const sourceId = String(parentId);
      const isFrontierEdge = frontierSet.has(sourceId) || frontierSet.has(targetId);

      // Determine edge type
      const edgeType = event.branch ? "branch" : "causal";

      edges.push({
        id: `edge-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        type: edgeType,
        animated: config.animateFrontier && isFrontierEdge,
        label: edgeType === "branch" ? event.branch : undefined,
      });
    }
  }

  return edges;
}

/**
 * Project a complete causal graph into React Flow format.
 */
export function projectToReactFlow(
  events: HermesEvent[],
  frontierState: FrontierState | null,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): {
  nodes: CausalNodeProjection[];
  edges: CausalEdgeProjection[];
} {
  return {
    nodes: projectToNodes(events, frontierState, config),
    edges: projectToEdges(events, frontierState, config),
  };
}

// ═══════════════════════════════════════════════════════════════
// Node Data Extraction
// ═══════════════════════════════════════════════════════════════

/**
 * Extract display data from a HermesEvent.
 */
function extractNodeData(
  event: HermesEvent,
  isFrontier: boolean,
  isVisited: boolean
): CausalNodeData {
  const payload = event.payload as Record<string, unknown>;

  return {
    tier: event.eventType,
    label: getEventLabel(event),
    depth: event.causalDepth,
    agentName: event.agentId ? String(event.agentId) : undefined,
    branch: event.branch,
    isFrontier,
    isVisited,
    tool: event.eventType === "EXECUTION" ? (payload as { tool?: string }).tool : undefined,
    decision: event.eventType === "DECISION" ? (payload as { decision?: string }).decision : undefined,
    success: event.eventType === "EXECUTION" ? (payload as { success?: boolean }).success : undefined,
    timestamp: event.timestamp,
  };
}

/**
 * Get a short display label for an event.
 */
function getEventLabel(event: HermesEvent): string {
  const payload = event.payload as Record<string, unknown>;
  switch (event.eventType) {
    case "MODEL":
      return `LLM: ${(payload as { modelId?: string }).modelId ?? "call"}`;
    case "DECISION":
      return `→ ${(payload as { decision?: string }).decision ?? "decide"}`;
    case "EXECUTION": {
      const tool = (payload as { tool?: string }).tool ?? "exec";
      const success = (payload as { success?: boolean }).success;
      return success === false ? `✗ ${tool}` : `✓ ${tool}`;
    }
    case "SYSTEM":
      return `⚙ ${(payload as { subtype?: string }).subtype ?? "system"}`;
    case "TELEMETRY":
      return `📊 ${(payload as { metric?: string }).metric ?? "metric"}`;
    default:
      return "event";
  }
}

// ═══════════════════════════════════════════════════════════════
// Utility
// ═══════════════════════════════════════════════════════════════

/**
 * Simple string hash for deterministic vertical offset.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit integer
  }
  return Math.abs(hash);
}
