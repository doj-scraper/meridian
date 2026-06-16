"use client";

import { ROLE_DEFINITIONS, type AgentRole } from "@/lib/agent/roles";

const ROLE_COLORS: Record<string, string> = {
  general: "#8a94a3",
  planner: "#00d1ff",
  researcher: "#22c55e",
  executor: "#ffd60a",
  critic: "#f59e0b",
  reviewer: "#ef4444",
};

interface RoleBadgeProps {
  role: string;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  const color = ROLE_COLORS[role] || ROLE_COLORS.general;
  const roleDef = ROLE_DEFINITIONS[role as AgentRole];
  const label = roleDef?.name || role.charAt(0).toUpperCase() + role.slice(1);

  if (size === "md") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1"
        style={{
          background: color + "20",
          color: color,
          border: `1px solid ${color}40`,
          borderRadius: 0,
        }}
      >
        <span className="w-2 h-2" style={{ background: color, border: "1px solid #000" }} />
        {label}
      </span>
    );
  }

  return (
    <span
      className="text-[8px] px-1.5 py-0 inline-flex items-center gap-1"
      style={{
        background: color + "20",
        color: color,
        border: `1px solid ${color}40`,
        borderRadius: 0,
      }}
    >
      <span className="w-1.5 h-1.5" style={{ background: color }} />
      {label}
    </span>
  );
}
