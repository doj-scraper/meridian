"use client";

/**
 * Hermes Causal Graph — React Flow visualization of the causal DAG.
 *
 * This component is a STRICT PROJECTION of the causal graph.
 * React Flow is a dumb renderer — it NEVER infers causality
 * or defines truth. All data comes from the Hermes store,
 * which projects from the event log.
 */

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useHermesStore, type CausalNodeView } from "@/store/hermes-store";
import { DEFAULT_LAYOUT_CONFIG } from "@/lib/hermes/ui-topology/types";

// ═══════════════════════════════════════════════════════════════
// Custom Causal Event Node
// ═══════════════════════════════════════════════════════════════

const tierColorMap: Record<string, string> = DEFAULT_LAYOUT_CONFIG.tierColors;

function CausalEventNode({ data }: { data: CausalNodeView }) {
  const borderColor = tierColorMap[data.tier] ?? "#8a94a3";
  const bgColor = data.isFrontier
    ? "rgba(255, 214, 10, 0.1)"
    : data.isVisited
      ? "#1a2332"
      : "#0f141b";

  return (
    <div
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        boxShadow: data.isFrontier
          ? `2px 2px 0 ${borderColor}, 0 0 12px ${borderColor}40`
          : "2px 2px 0 #000",
        padding: "8px 12px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "11px",
        color: "#e8eaed",
        minWidth: "120px",
        maxWidth: "180px",
        position: "relative",
      }}
    >
      {/* Left color bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          background: borderColor,
        }}
      />

      <Handle type="target" position={Position.Top} style={{ background: borderColor }} />

      {/* Tier badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <span
          style={{
            background: borderColor,
            color: "#000",
            padding: "1px 4px",
            fontSize: "9px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {data.tier}
        </span>
        {data.isFrontier && (
          <span
            style={{
              background: "#ffd60a",
              color: "#000",
              padding: "1px 4px",
              fontSize: "8px",
              fontWeight: 700,
              animation: "pulse 2s infinite",
            }}
          >
            FRONTIER
          </span>
        )}
      </div>

      {/* Label */}
      <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {data.label}
      </div>

      {/* Agent */}
      {data.agentName && (
        <div style={{ color: "#8a94a3", fontSize: "9px", marginTop: "2px" }}>
          {data.agentName}
        </div>
      )}

      {/* Depth */}
      <div style={{ color: "#5a6577", fontSize: "9px", marginTop: "2px" }}>
        depth: {data.depth}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: borderColor }} />
    </div>
  );
}

const nodeTypes = {
  causalEvent: CausalEventNode,
};

// ═══════════════════════════════════════════════════════════════
// Causal Graph Component
// ═══════════════════════════════════════════════════════════════

export function HermesCausalGraph() {
  const causalNodes = useHermesStore((s) => s.causalNodes);
  const causalEdges = useHermesStore((s) => s.causalEdges);
  const selectedEventId = useHermesStore((s) => s.selectedEventId);
  const setSelectedEvent = useHermesStore((s) => s.setSelectedEvent);

  // Convert store data to React Flow format
  const flowNodes: Node[] = useMemo(
    () =>
      causalNodes.map((node) => ({
        id: node.id,
        type: "causalEvent",
        position: node.position,
        data: node,
        selected: node.id === selectedEventId,
      })),
    [causalNodes, selectedEventId]
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      causalEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: edge.animated,
        style: {
          stroke: edge.type === "branch" ? "#00d1ff" : "#3a4556",
          strokeWidth: edge.animated ? 2 : 1,
        },
        label: edge.label,
        labelStyle: {
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          fill: "#8a94a3",
        },
      })),
    [causalEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync store data to React Flow state
  React.useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  React.useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedEvent(node.id === selectedEventId ? null : node.id);
    },
    [selectedEventId, setSelectedEvent]
  );

  if (causalNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#05070a" }}>
        <div className="text-center">
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "13px",
              color: "#5a6577",
              border: "2px solid #2a3441",
              padding: "16px 24px",
              boxShadow: "4px 4px 0 #000",
              background: "#0f141b",
            }}
          >
            <div style={{ color: "#ffd60a", fontWeight: 700, marginBottom: "8px" }}>
              HERMES CAUSAL GRAPH
            </div>
            <div>No active run. Start a Hermes run to see the causal DAG.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", background: "#05070a" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: "#05070a" }}
      >
        <Background
          color="#1e2732"
          gap={20}
          size={1}
        />
        <Controls
          style={{
            background: "#0f141b",
            border: "2px solid #2a3441",
            boxShadow: "2px 2px 0 #000",
            borderRadius: 0,
          }}
        />
        <MiniMap
          style={{
            background: "#0f141b",
            border: "2px solid #2a3441",
            boxShadow: "2px 2px 0 #000",
            borderRadius: 0,
          }}
          nodeColor={(node) => {
            const data = node.data as CausalNodeView;
            return tierColorMap[data?.tier] ?? "#8a94a3";
          }}
        />
      </ReactFlow>
    </div>
  );
}
