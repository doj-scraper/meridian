/**
 * @hermes/ui-topology — Frontier Visualization Projection
 *
 * Projects frontier state into UI-friendly format.
 * This is a PURE PROJECTION — no mutation of kernel state.
 */

import type { FrontierState } from "../frontier/types";
import type { FrontierVisualization } from "./types";

/**
 * Project a FrontierState into a FrontierVisualization.
 */
export function projectFrontierState(
  frontierState: FrontierState | null
): FrontierVisualization {
  if (!frontierState) {
    return {
      frontierNodeIds: [],
      visitedNodeIds: [],
      isExhausted: true,
      activeBranches: [],
      size: 0,
    };
  }

  return {
    frontierNodeIds: Array.from(frontierState.frontier),
    visitedNodeIds: Array.from(frontierState.visited),
    isExhausted: frontierState.frontier.size === 0,
    activeBranches: Array.from(frontierState.activeBranches),
    size: frontierState.frontier.size,
  };
}
