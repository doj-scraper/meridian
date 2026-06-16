"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import {
  Search,
  PenLine,
  Code,
  Globe,
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { ROLE_COLORS, getRoleColor } from "./agent-canvas";

type AgentNodeData = {
  label: string;
  goal: string;
  role: string;
  tools: string[];
  status: "idle" | "running" | "success" | "error" | "waiting";
  agentRole?: string;
};

const toolIcons: Record<string, React.ReactNode> = {
  search: <Search size={9} />,
  write: <PenLine size={9} />,
  code: <Code size={9} />,
  browser: <Globe size={9} />,
  finish: <CheckCircle size={9} />,
};

const toolColors: Record<string, string> = {
  search: "#00d1ff",
  write: "#22c55e",
  code: "#ffd60a",
  browser: "#8a94a3",
  finish: "#5b6b81",
};

const statusConfig: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  idle: { color: "#2a3441", icon: <Clock size={7} />, label: "READY" },
  running: {
    color: "#00d1ff",
    icon: <Loader2 size={7} className="animate-spin" />,
    label: "RUN",
  },
  success: {
    color: "#22c55e",
    icon: <CheckCircle size={7} />,
    label: "DONE",
  },
  error: {
    color: "#ef4444",
    icon: <AlertCircle size={7} />,
    label: "ERR",
  },
  waiting: { color: "#8a94a3", icon: <Clock size={7} />, label: "WAIT" },
};

// Provider color mapping for left bar
const providerColors: Record<string, string> = {
  "gemini-2.5-pro": "#22c55e",
  "gemini-2.5-flash": "#22c55e",
  "gpt-4o": "#10a37f",
  "gpt-4o-mini": "#10a37f",
  "claude-sonnet-4": "#d4a373",
};

export function AgentNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData;
  const status = nodeData.status || "idle";
  const config = statusConfig[status];
  const roleColor = getRoleColor(nodeData.agentRole);

  // Left bar color — use role color
  const leftBarColor = roleColor;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: roleColor,
          width: 8,
          height: 8,
          border: "2px solid #000",
          borderRadius: 0,
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: 1,
          boxShadow:
            status === "running"
              ? ["4px 4px 0 #000", `4px 4px 0 #000, 0 0 12px ${roleColor}55`, "4px 4px 0 #000"]
              : selected
                ? `4px 4px 0 #000, 0 0 0 2px ${roleColor}60`
                : "4px 4px 0 #000",
        }}
        transition={{
          boxShadow: {
            duration: status === "running" ? 1.5 : 0.3,
            repeat: status === "running" ? Infinity : 0,
          },
        }}
        style={{
          background: "#151d26",
          border: "2px solid #3a4553",
          borderRadius: 0,
          padding: "10px 12px",
          minWidth: "200px",
          maxWidth: "220px",
          cursor: "pointer",
          position: "relative",
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {/* Left color bar */}
        <div
          style={{
            position: "absolute",
            left: -2,
            top: -2,
            bottom: -2,
            width: 4,
            background: leftBarColor,
          }}
        />

        {/* Header: ID + Status */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] tracking-widest uppercase" style={{ color: "#8a94a3" }}>
            AGENT
          </span>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2"
              style={{
                background: status === "running" ? "#00ff88" : status === "success" ? "#22c55e" : status === "error" ? "#ef4444" : "#2a3441",
                border: "1px solid #000",
                boxShadow: status === "running" ? "0 0 6px #00ff8855" : "none",
              }}
            />
            <span className="text-[8px] tracking-wider" style={{ color: config.color }}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-[12px] font-semibold tracking-wider uppercase mb-1.5" style={{ color: "#d7dde5" }}>
          {nodeData.label}
        </div>

        {/* Tool tags */}
        <div className="flex flex-wrap gap-1">
          {(nodeData.tools || []).map((tool: string) => (
            <span
              key={tool}
              className="flex items-center gap-0.5 px-1 py-0 text-[8px] tracking-wider uppercase"
              style={{
                background: "#0c1219",
                border: "1px solid #2a3441",
                color: toolColors[tool] || "#8a94a3",
              }}
            >
              {toolIcons[tool]}
              <span className="ml-0.5">{tool}</span>
            </span>
          ))}
        </div>
      </motion.div>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: roleColor,
          width: 8,
          height: 8,
          border: "2px solid #000",
          borderRadius: 0,
        }}
      />
    </>
  );
}
