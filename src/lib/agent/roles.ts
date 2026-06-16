import { AgentTool } from "./types";

// ============ Agent Role System ============
// Research basis: Specialization reduces context overload and makes multi-agent
// systems easier to debug. The "combo effect" — weaker delegative planner +
// strong solver > single dominant model (agentsNotebooklm.md).

export type AgentRole = "general" | "planner" | "researcher" | "executor" | "critic" | "reviewer";

export interface RolePermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
  approve: boolean;
  delegate: boolean;
}

export interface RoleDefinition {
  name: string;
  color: string;           // Hex color for canvas badge
  icon: string;            // Lucide icon name
  defaultTools: AgentTool[];
  promptModifier: string;  // Appended to agent's personality
  permissions: RolePermissions;
  defaultPersonality: string;
}

export const ROLE_DEFINITIONS: Record<AgentRole, RoleDefinition> = {
  general: {
    name: "General",
    color: "#8B5CF6",  // violet
    icon: "Bot",
    defaultTools: ["search", "write", "code", "browser"],
    promptModifier: "",
    permissions: { read: true, write: true, execute: true, approve: false, delegate: false },
    defaultPersonality: "helpful and thorough",
  },
  planner: {
    name: "Planner",
    color: "#7C3AED",  // purple
    icon: "GitBranch",
    defaultTools: ["search", "write"],
    promptModifier: "Focus on creating detailed execution plans and delegating tasks to specialized agents. You break complex goals into actionable sub-tasks and coordinate the overall strategy.",
    permissions: { read: true, write: true, execute: false, approve: true, delegate: true },
    defaultPersonality: "strategic and organized",
  },
  researcher: {
    name: "Researcher",
    color: "#22C55E",  // green
    icon: "Search",
    defaultTools: ["search", "browser"],
    promptModifier: "Gather comprehensive, factual information. Do not make up details. Cite sources where possible and distinguish between confirmed facts and plausible inferences.",
    permissions: { read: true, write: true, execute: true, approve: false, delegate: false },
    defaultPersonality: "thorough and analytical",
  },
  executor: {
    name: "Executor",
    color: "#3B82F6",  // blue
    icon: "Play",
    defaultTools: ["code", "write"],
    promptModifier: "Execute tasks with high accuracy and precision. Focus on producing working, correct output. Verify your work before finishing.",
    permissions: { read: true, write: true, execute: true, approve: false, delegate: false },
    defaultPersonality: "efficient and precise",
  },
  critic: {
    name: "Critic",
    color: "#F59E0B",  // amber
    icon: "Shield",
    defaultTools: ["write"],
    promptModifier: "Provide detailed, constructive critique. Be objective and thorough. Identify specific issues and suggest concrete improvements. If the output meets quality standards, explicitly approve it.",
    permissions: { read: true, write: true, execute: false, approve: true, delegate: false },
    defaultPersonality: "objective and constructive",
  },
  reviewer: {
    name: "Reviewer",
    color: "#EF4444",  // red
    icon: "CheckCircle",
    defaultTools: ["search", "write"],
    promptModifier: "Review work for completeness, accuracy, and quality. Focus on edge cases, logical consistency, and whether the output fully addresses the goal.",
    permissions: { read: true, write: false, execute: false, approve: true, delegate: false },
    defaultPersonality: "meticulous and quality-focused",
  },
};

/**
 * Get the effective personality for an agent by combining base personality
 * with the role's prompt modifier.
 */
export function getEffectivePersonality(
  basePersonality: string,
  role: AgentRole
): string {
  const roleDef = ROLE_DEFINITIONS[role];
  if (!roleDef || !roleDef.promptModifier) return basePersonality;
  return `${basePersonality}. ${roleDef.promptModifier}`;
}

/**
 * Get the default tools for a given role.
 */
export function getDefaultToolsForRole(role: AgentRole): AgentTool[] {
  return ROLE_DEFINITIONS[role]?.defaultTools || ["search", "write"];
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(
  role: AgentRole,
  permission: keyof RolePermissions
): boolean {
  return ROLE_DEFINITIONS[role]?.permissions[permission] ?? false;
}

/**
 * Get all role values as an array.
 */
export function getAllRoles(): AgentRole[] {
  return Object.keys(ROLE_DEFINITIONS) as AgentRole[];
}
