/**
 * @hermes/ui-topology — Agent State Projection
 *
 * Projects agent state from the HermesState into UI-friendly format.
 * This is a PURE PROJECTION — no mutation of kernel state.
 */

import type { AgentState } from "../kernel-spine/types";
import type { AgentStateProjection } from "./types";

/**
 * Role-to-color mapping matching the neo-brutalist theme.
 */
const ROLE_COLORS: Record<string, string> = {
  general: "#8a94a3",
  planner: "#00d1ff",
  researcher: "#22c55e",
  executor: "#ffd60a",
  critic: "#f59e0b",
  reviewer: "#ef4444",
};

/**
 * Project an AgentState into an AgentStateProjection.
 */
export function projectAgentState(agent: AgentState): AgentStateProjection {
  return {
    id: agent.agentId,
    name: agent.name,
    role: agent.role,
    status: agent.status,
    proposalCount: agent.proposalCount,
    executionCount: agent.executionCount,
    color: ROLE_COLORS[agent.role] ?? ROLE_COLORS.general,
    totalTokens: agent.totalTokens,
  };
}

/**
 * Project all agents from a map of AgentStates.
 */
export function projectAgentStates(agents: Map<string, AgentState>): AgentStateProjection[] {
  return Array.from(agents.values()).map(projectAgentState);
}

/**
 * Get the color for a given role.
 */
export function getRoleColor(role: string): string {
  return ROLE_COLORS[role] ?? ROLE_COLORS.general;
}
