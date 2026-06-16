"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type NodeTypes,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAgentStore } from "@/store/agent-store";
import { AgentNode } from "./agent-node";
import { Button } from "@/components/ui/button";
import {
  Play,
  Square,
  Plus,
  Trash2,
  Workflow,
  Sparkles,
} from "lucide-react";
import { AgentRunView } from "./agent-run-view";
import { AgentBuilderWizard } from "./agent-builder-wizard";

// ── Role color mapping ──────────────────────────────────────────────
export const ROLE_COLORS: Record<string, string> = {
  general: "#8a94a3",
  planner: "#00d1ff",
  researcher: "#22c55e",
  executor: "#ffd60a",
  critic: "#f59e0b",
  reviewer: "#ef4444",
};

export function getRoleColor(role: string | undefined): string {
  if (!role) return ROLE_COLORS.general;
  return ROLE_COLORS[role.toLowerCase()] || ROLE_COLORS.general;
}

// ── Orchestration edge styles ────────────────────────────────────────
const ORCHESTRATION_EDGE_STYLES: Record<string, Partial<Edge>> = {
  single: { animated: true, style: { stroke: "#2a3441", strokeWidth: 2 } },
  group: { animated: false, style: { stroke: "#00d1ff", strokeWidth: 2, strokeDasharray: "8 4" } },
  hierarchical: { animated: true, style: { stroke: "#ffd60a", strokeWidth: 3 } },
  pipeline: { animated: true, style: { stroke: "#22c55e", strokeWidth: 2, strokeDasharray: "5 5" } },
  mesh: { animated: false, style: { stroke: "#8a94a3", strokeWidth: 2 } },
};

// ── Node type registration (must be outside component) ───────────────
const nodeTypes: NodeTypes = { agentNode: AgentNode };

// ── Main component ───────────────────────────────────────────────────
export function AgentCanvas() {
  const {
    agents, selectedAgentId, selectAgent, isRunning, currentRunId, events,
    startRun, stopRun, deleteAgent, setBuilderOpen, sidebarOpen, inspectorOpen,
  } = useAgentStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const prevAgentIdsRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistGraphData = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const agentIds = useAgentStore.getState().agents.map((a) => a.id);
          if (agentIds.length === 0) return;
          await fetch("/api/agent/update", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: agentIds[0], graphData: { nodes: currentNodes, edges: currentEdges } }),
          });
        } catch (err) { console.error("Failed to persist canvas:", err); }
      }, 500);
    }, []
  );

  const handleNodesChange: typeof onNodesChange = useCallback(
    (changes) => { onNodesChange(changes); }, [onNodesChange]
  );

  useEffect(() => {
    if (nodes.length > 0) persistGraphData(nodes, edges);
  }, [nodes, edges, persistGraphData]);

  // ── Sync agents to canvas nodes (incremental) ────────────────────
  useEffect(() => {
    const currentAgentIds = new Set(agents.map((a) => a.id));
    const prevIds = prevAgentIdsRef.current;

    if (prevIds.size === 0 && agents.length > 0) {
      prevAgentIdsRef.current = currentAgentIds;
      const agentWithGraph = agents.find((a) => a.graphData?.nodes?.length);
      if (agentWithGraph?.graphData) {
        const restoredNodes: Node[] = agents.map((agent) => {
          const existingNode = agentWithGraph.graphData!.nodes.find((n) => n.id === agent.id);
          return {
            id: agent.id, type: "agentNode",
            position: existingNode?.position || { x: 100 + (agents.indexOf(agent) % 3) * 300, y: 100 + Math.floor(agents.indexOf(agent) / 3) * 220 },
            data: { label: agent.name, goal: agent.goal, role: agent.personality, tools: agent.tools, status: "idle" as const, agentRole: agent.role || agent.personality },
          };
        });
        setNodes(restoredNodes);
      } else {
        const flowNodes: Node[] = agents.map((agent, i) => ({
          id: agent.id, type: "agentNode",
          position: { x: 100 + (i % 3) * 300, y: 100 + Math.floor(i / 3) * 220 },
          data: { label: agent.name, goal: agent.goal, role: agent.personality, tools: agent.tools, status: "idle" as const, agentRole: agent.role || agent.personality },
        }));
        setNodes(flowNodes);
      }
      const flowEdges: Edge[] = agents.slice(0, -1).map((agent, i) => ({
        id: `e-${agent.id}-${agents[i + 1].id}`, source: agent.id, target: agents[i + 1].id,
        animated: true, style: { stroke: "#2a3441", strokeWidth: 2 },
      }));
      setEdges(flowEdges);
      return;
    }

    if (agents.length === 0) {
      prevAgentIdsRef.current = new Set();
      setNodes([]); setEdges([]); return;
    }

    const addedIds = [...currentAgentIds].filter((id) => !prevIds.has(id));
    const removedIds = [...prevIds].filter((id) => !currentAgentIds.has(id));

    if (addedIds.length === 0 && removedIds.length === 0) {
      setNodes((prev) => prev.map((node) => {
        const agent = agents.find((a) => a.id === node.id);
        if (!agent) return node;
        return { ...node, data: { ...node.data, label: agent.name, goal: agent.goal, role: agent.personality, tools: agent.tools, agentRole: agent.role || agent.personality } };
      }));
      prevAgentIdsRef.current = currentAgentIds;
      return;
    }

    prevAgentIdsRef.current = currentAgentIds;

    if (removedIds.length > 0) {
      const removedSet = new Set(removedIds);
      setNodes((prev) => prev.filter((n) => !removedSet.has(n.id)));
      setEdges((prev) => prev.filter((e) => !removedSet.has(e.source) && !removedSet.has(e.target)));
    }

    if (addedIds.length > 0) {
      const newNodes: Node[] = addedIds.map((id) => {
        const agent = agents.find((a) => a.id === id);
        if (!agent) return null;
        const existingCount = agents.indexOf(agent);
        return {
          id: agent.id, type: "agentNode",
          position: { x: 100 + ((existingCount >= 0 ? existingCount : 0) % 3) * 300, y: 100 + Math.floor((existingCount >= 0 ? existingCount : 0) / 3) * 220 },
          data: { label: agent.name, goal: agent.goal, role: agent.personality, tools: agent.tools, status: "idle" as const, agentRole: agent.role || agent.personality },
        } as Node;
      }).filter(Boolean) as Node[];

      setNodes((prev) => [...prev, ...newNodes]);

      setEdges((prev) => {
        const allNodeIds = [...prev.map((e) => e.source), ...prev.map((e) => e.target)].filter(Boolean);
        const lastExistingId = allNodeIds.length > 0 ? allNodeIds[allNodeIds.length - 1] : null;
        const newEdges: Edge[] = [];
        if (lastExistingId && newNodes.length > 0) {
          newEdges.push({ id: `e-${lastExistingId}-${newNodes[0].id}`, source: lastExistingId, target: newNodes[0].id, animated: true, style: { stroke: "#2a3441", strokeWidth: 2 } });
        }
        for (let i = 0; i < newNodes.length - 1; i++) {
          newEdges.push({ id: `e-${newNodes[i].id}-${newNodes[i + 1].id}`, source: newNodes[i].id, target: newNodes[i + 1].id, animated: true, style: { stroke: "#2a3441", strokeWidth: 2 } });
        }
        return [...prev, ...newEdges];
      });
    }
  }, [agents, setNodes, setEdges]);

  // ── Orchestration edges ────────────────────────────────────────────
  const selectedAgent = useMemo(() => agents.find((a) => a.id === selectedAgentId), [agents, selectedAgentId]);
  const orchestrationMode = selectedAgent?.orchestrationMode || "single";

  useEffect(() => {
    if (edges.length === 0) return;
    const orchestrationStyle = ORCHESTRATION_EDGE_STYLES[orchestrationMode] || ORCHESTRATION_EDGE_STYLES.single;
    setEdges((prev) => prev.map((edge) => ({
      ...edge, animated: orchestrationStyle.animated ?? edge.animated,
      style: { ...edge.style, ...orchestrationStyle.style },
    })));
  }, [orchestrationMode, setEdges]);

  // ── Update node status ─────────────────────────────────────────────
  useEffect(() => {
    if (!currentRunId || events.length === 0) return;
    setNodes((nds) => nds.map((node) => {
      if (node.id !== currentRunId && node.id !== useAgentStore.getState().selectedAgentId) return node;
      const lastEvent = events[events.length - 1];
      let status = node.data.status as string;
      if (lastEvent.type === "done") status = "success";
      else if (lastEvent.type === "error") status = "error";
      else if (lastEvent.type === "plan" || lastEvent.type === "action") status = "running";
      else if (lastEvent.type === "thinking") status = "running";
      return { ...node, data: { ...node.data, status } };
    }));
  }, [events, currentRunId, setNodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => { selectAgent(node.id); }, [selectAgent]);

  const onConnect = useCallback(
    (params: Connection) => {
      const orchestrationStyle = ORCHESTRATION_EDGE_STYLES[orchestrationMode] || ORCHESTRATION_EDGE_STYLES.single;
      setEdges((eds) => addEdge({ ...params, animated: orchestrationStyle.animated ?? true, style: { ...orchestrationStyle.style } }, eds));
    }, [setEdges, orchestrationMode]
  );

  const handleRun = async () => { if (!selectedAgentId) return; await startRun(selectedAgentId); };
  const handleStop = async () => { if (currentRunId) await stopRun(currentRunId); };
  const handleDelete = async () => { if (!selectedAgentId) return; await deleteAgent(selectedAgentId); };

  const miniMapNodeColor = useCallback((node: Node) => {
    const role = (node.data as Record<string, unknown>)?.agentRole as string | undefined;
    return getRoleColor(role);
  }, []);

  const showRunView = isRunning || (events.length > 0 && currentRunId);

  return (
    <div className="flex-1 h-full relative" style={{ background: "#05070a" }}>
      {showRunView ? (
        <AgentRunView />
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          style={{ background: "#05070a" }}
          defaultEdgeOptions={{ animated: true, style: { stroke: "#2a3441", strokeWidth: 2 } }}
        >
          <Background variant={BackgroundVariant.Dots} color="#1e2732" gap={22} size={1} />
          <Controls
            position="bottom-right"
            style={{
              background: "#0f141b",
              border: "2px solid #000",
              borderRadius: 0,
              boxShadow: "4px 4px 0 #000",
            }}
          />
          <MiniMap
            style={{
              backgroundColor: "#0f141b",
              border: "2px solid #000",
              borderRadius: 0,
              boxShadow: "4px 4px 0 #000",
              padding: 6,
            }}
            nodeColor={miniMapNodeColor}
            maskColor="rgba(0,0,0,0.5)"
          />

          {/* ── Top-center: Toolbar ── */}
          <Panel position="top-center" className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-1 px-2 py-1"
              style={{
                background: "#0f141b",
                border: "2px solid #000",
                boxShadow: "4px 4px 0 #000",
              }}
            >
              <button
                onClick={() => setBuilderOpen(true)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-wider uppercase transition-colors"
                style={{ color: "#8a94a3" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#d7dde5"; e.currentTarget.style.background = "#1a212b"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#8a94a3"; e.currentTarget.style.background = "transparent"; }}
              >
                <Plus size={10} /> Add Agent
              </button>

              <div className="w-px h-4" style={{ background: "#2a3441" }} />

              {selectedAgentId && (
                <>
                  <button
                    onClick={handleDelete}
                    disabled={isRunning}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-wider uppercase transition-colors"
                    style={{ color: "#ef4444", opacity: isRunning ? 0.5 : 1 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <Trash2 size={10} /> Delete
                  </button>
                  <div className="w-px h-4" style={{ background: "#2a3441" }} />
                </>
              )}

              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-wider uppercase font-semibold"
                  style={{ background: "#ef4444", color: "#fff", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }}
                >
                  <Square size={8} /> Stop
                </button>
              ) : (
                <button
                  onClick={handleRun}
                  disabled={!selectedAgentId}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-wider uppercase font-semibold"
                  style={{
                    background: selectedAgentId ? "#ffd60a" : "#1a212b",
                    color: selectedAgentId ? "#000" : "#5b6b81",
                    border: "2px solid #000",
                    boxShadow: selectedAgentId ? "2px 2px 0 #000" : "none",
                    cursor: selectedAgentId ? "pointer" : "not-allowed",
                  }}
                >
                  <Play size={8} /> Run Agent
                </button>
              )}
            </div>
          </Panel>

          {/* ── Top-right: Selected agent ── */}
          <Panel position="top-right">
            {selectedAgentId && (
              <div
                className="flex items-center gap-2 px-3 py-1.5"
                style={{
                  background: "#0f141b",
                  border: "2px solid #000",
                  boxShadow: "4px 4px 0 #000",
                  borderLeft: `4px solid ${getRoleColor(selectedAgent?.role)}`,
                }}
              >
                <Sparkles size={11} style={{ color: getRoleColor(selectedAgent?.role) }} />
                <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: getRoleColor(selectedAgent?.role) }}>
                  {selectedAgent?.name || "Selected"}
                </span>
                {orchestrationMode !== "single" && (
                  <span
                    className="text-[8px] px-1 py-0 tracking-wider uppercase font-semibold"
                    style={{ background: "#0c1219", border: "1px solid #2a3441", color: "#00d1ff" }}
                  >
                    {orchestrationMode}
                  </span>
                )}
              </div>
            )}
          </Panel>

          {/* ── Empty state ── */}
          {nodes.length === 0 && (
            <Panel position="top-center">
              <div className="text-center mt-8">
                <div
                  className="w-20 h-20 flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: "#0f141b",
                    border: "2px solid #000",
                    boxShadow: "6px 6px 0 #000",
                  }}
                >
                  <Workflow size={32} style={{ color: "#2a3441" }} />
                </div>
                <h3 className="text-[14px] font-semibold tracking-wider uppercase mb-2" style={{ color: "#d7dde5" }}>
                  Build Your AI Workforce
                </h3>
                <p className="text-[11px] mb-4" style={{ color: "#8a94a3", maxWidth: "320px", margin: "0 auto" }}>
                  Create agents, connect them into workflows, and watch them execute in real-time.
                </p>
                <button
                  onClick={() => setBuilderOpen(true)}
                  className="px-3 py-1.5 text-[10px] tracking-wider uppercase font-semibold"
                  style={{ background: "#ffd60a", color: "#000", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }}
                >
                  <Sparkles size={10} className="inline mr-1" />
                  Create First Agent
                </button>
              </div>
            </Panel>
          )}
        </ReactFlow>
      )}

      <AgentBuilderWizard />
    </div>
  );
}
