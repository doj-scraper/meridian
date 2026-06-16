"use client";

// ═══════════════════════════════════════════════════════════════════════
// PIPELINE STUDIO — Single-agent pipeline visualization shell.
// Renders lanes, nodes, connectors, artifact memory, narrative strip,
// and a decision panel. All backend decoupled — uses local simulation.
// Refactored to match the neo-brutalist design system:
//   IBM Plex Mono, #05070a bg, #ffd60a accent, 2px borders, offset shadows
// ═══════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DEVOPS_PIPELINE, PipelineSimulator, type NodeState } from "./pipeline-data";
import { PipelineIcon } from "./pipeline-icons";
import { GitBranch, Play, Square, RotateCcw, Bug, Shield, ChevronDown } from "lucide-react";

// ── Color system (matching main project neo-brutalist theme) ───────────
const C = {
  bg: "#05070a",
  panel: "#0f141b",
  panelAlt: "#141b23",
  lane: "#0b1118",
  laneAlt: "#0f1720",
  border: "#2a3441",
  borderLight: "#1e2732",
  textMain: "#d7dde5",
  textSub: "#8a94a3",
  textMuted: "#5b6b81",
  accent: "#ffd60a",
  accent2: "#00d1ff",

  sIdle: "#475569",
  sActive: "#00d1ff",
  sSuccess: "#22c55e",
  sWarning: "#f59e0b",
  sFailure: "#ef4444",
  sRecovery: "#a855f7",

  rGate: "#f43f5e",
  rEntry: "#ec4899",
  rExit: "#22c55e",
};

type PipelineStatus = "idle" | "running" | "completed" | "failed" | "awaiting_decision" | "paused";

const SEVERITY_RANK = { clean: 0, warning: 1, critical: 2 } as const;

function bumpMemory(current: "clean" | "warning" | "critical", severity: "clean" | "warning" | "critical"): "clean" | "warning" | "critical" {
  return (SEVERITY_RANK[severity] > SEVERITY_RANK[current]) ? severity : current;
}

// ── Main Component ──────────────────────────────────────────────────────
export function PipelineStudio() {
  const workflow = DEVOPS_PIPELINE;

  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});
  const [activeEdges, setActiveEdges] = useState<Record<string, "clean" | "warning" | "critical">>({});
  const [phaseMemory, setPhaseMemory] = useState<Record<string, "clean" | "warning" | "critical">>({});
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<{ text: string; severity: "clean" | "warning" | "critical" }[]>([]);
  const [pendingDecision, setPendingDecision] = useState<{
    nodeId: string;
    intent: string;
    options: { action_id: string; label: string; severity: "clean" | "warning" | "critical" }[];
    policyHint?: { source: string; confidence: number; reasoning: string };
  } | null>(null);
  const [chaosMode, setChaosMode] = useState(false);
  const [policyOverride, setPolicyOverride] = useState("human");
  const [phaseTimers, setPhaseTimers] = useState<Record<string, number>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"events" | "traces" | "circuits">("events");
  const [events, setEvents] = useState<{ seq: number; type: string; description: string; severity: "clean" | "warning" | "critical" }[]>([]);
  const [systemLocked, setSystemLocked] = useState(false);
  const [finalOutcome, setFinalOutcome] = useState<"completed" | "failed" | null>(null);

  const simulatorRef = useRef<PipelineSimulator | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const connectorSvgRef = useRef<SVGSVGElement | null>(null);
  const activePhaseStartRef = useRef<Record<string, number>>({});
  const eventSeqRef = useRef(0);

  // Phase timer tick
  useEffect(() => {
    if (!activePhase || systemLocked) return undefined;
    const iv = setInterval(() => {
      setPhaseTimers((t) => {
        const start = activePhaseStartRef.current[activePhase] || Date.now();
        return { ...t, [activePhase]: (Date.now() - start) / 1000 };
      });
    }, 100);
    return () => clearInterval(iv);
  }, [activePhase, systemLocked]);

  // ── Connector rendering ─────────────────────────────────────────────
  const renderConnectors = useCallback(() => {
    if (!stageRef.current || !connectorSvgRef.current) return;
    const svg = connectorSvgRef.current;
    svg.innerHTML = "";
    const stageRect = stageRef.current.getBoundingClientRect();

    workflow.edges.forEach((edge) => {
      const n1 = document.getElementById(`pnode-${edge.from}`);
      const n2 = document.getElementById(`pnode-${edge.to}`);
      if (!n1 || !n2) return;
      const r1 = n1.getBoundingClientRect();
      const r2 = n2.getBoundingClientRect();
      const scrollLeft = stageRef.current!.scrollLeft;
      const x1 = r1.left + r1.width / 2 - stageRect.left + scrollLeft;
      const y1 = r1.top + r1.height / 2 - stageRect.top;
      const x2 = r2.left + r2.width / 2 - stageRect.left + scrollLeft;
      const y2 = r2.top + r2.height / 2 - stageRect.top;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.classList.add("pconn-path");
      path.id = `pconn-${edge.from}-${edge.to}`;

      const fromNode = workflow.nodes.find((n) => n.id === edge.from);
      const toNode = workflow.nodes.find((n) => n.id === edge.to);
      if (fromNode && toNode && fromNode.phase !== toNode.phase) path.classList.add("phandoff");
      if (fromNode && toNode && fromNode.phase === toNode.phase && x2 < x1) path.classList.add("ploop");

      const key = `${edge.from}->${edge.to}`;
      const sev = activeEdges[key];
      if (sev) {
        path.classList.add("pactive");
        if (sev === "warning") path.classList.add("pwarning");
        if (sev === "critical") path.classList.add("pcritical");
      }

      const dx = Math.abs(x2 - x1);
      const d =
        dx < 30
          ? `M${x1},${y1} C${x1 + 60},${y1} ${x1 + 60},${y2} ${x2},${y2}`
          : `M${x1},${y1} C${x1 + dx / 2},${y1} ${x2 - dx / 2},${y2} ${x2},${y2}`;
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
  }, [workflow, activeEdges]);

  useLayoutEffect(() => { renderConnectors(); }, [renderConnectors, nodeStates]);

  useEffect(() => {
    const onResize = () => renderConnectors();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [renderConnectors]);

  // ── Event handlers from simulator ───────────────────────────────────
  const addSimEvent = useCallback((type: string, description: string, severity: "clean" | "warning" | "critical" = "clean") => {
    eventSeqRef.current += 1;
    setEvents((prev) => [...prev, { seq: eventSeqRef.current, type, description, severity }]);
  }, []);

  const simulatorCallbacks = useMemo(() => ({
    onPhaseEntered: (phase: string) => {
      setActivePhase(phase);
      if (!activePhaseStartRef.current[phase]) activePhaseStartRef.current[phase] = Date.now();
      setPhaseMemory((m) => ({ ...m, [phase]: m[phase] || "clean" }));
      addSimEvent("phase_entered", `Entered phase: ${phase}`);
    },
    onPhaseCompleted: (phase: string, memory: "clean" | "warning" | "critical") => {
      setPhaseMemory((m) => ({ ...m, [phase]: bumpMemory(m[phase] || "clean", memory) }));
      addSimEvent("phase_completed", `Completed phase: ${phase}`, memory);
    },
    onNodeStarted: (nodeId: string) => {
      setNodeStates((s) => ({ ...s, [nodeId]: "active" }));
      const node = workflow.nodes.find((n) => n.id === nodeId);
      addSimEvent("node_started", `${node?.name || nodeId} started`);
    },
    onNodeCompleted: (nodeId: string) => {
      setNodeStates((s) => ({ ...s, [nodeId]: s[nodeId] === "warning" ? "warning" : "success" }));
      const node = workflow.nodes.find((n) => n.id === nodeId);
      addSimEvent("node_completed", `${node?.name || nodeId} completed`);
    },
    onNodeRetry: (nodeId: string) => {
      setNodeStates((s) => ({ ...s, [nodeId]: "warning" }));
      const node = workflow.nodes.find((n) => n.id === nodeId);
      addSimEvent("node_retry", `${node?.name || nodeId} retrying`, "warning");
    },
    onNodeFailed: (nodeId: string) => {
      setNodeStates((s) => ({ ...s, [nodeId]: "failure" }));
      const node = workflow.nodes.find((n) => n.id === nodeId);
      addSimEvent("node_failed", `${node?.name || nodeId} failed`, "critical");
    },
    onEdgeTraversed: (from: string, to: string, severity: "clean" | "warning" | "critical", narrative?: string) => {
      const key = `${from}->${to}`;
      setActiveEdges((m) => ({ ...m, [key]: severity }));
      if (narrative) {
        setNarrative((n) => [...n, { text: narrative, severity }]);
      }
      const fromNode = workflow.nodes.find((n) => n.id === from);
      if (fromNode) setPhaseMemory((m) => ({ ...m, [fromNode.phase]: bumpMemory(m[fromNode.phase] || "clean", severity) }));
      addSimEvent("edge_traversed", `${from} → ${to}: ${narrative || severity}`, severity);
    },
    onDecisionRequired: (nodeId: string, intent: string, options: { action_id: string; label: string; severity: "clean" | "warning" | "critical" }[], policyHint?: { source: string; confidence: number; reasoning: string }) => {
      setNodeStates((s) => ({ ...s, [nodeId]: "decision-active" }));
      setStatus("awaiting_decision");
      setPendingDecision({ nodeId, intent, options, policyHint });
      addSimEvent("decision_required", `Decision required: ${intent}`, "warning");
    },
    onWorkflowCompleted: () => {
      setStatus("completed");
      setSystemLocked(true);
      setFinalOutcome("completed");
      addSimEvent("workflow_completed", "Pipeline completed successfully", "clean");
    },
    onWorkflowFailed: () => {
      setStatus("failed");
      setSystemLocked(true);
      setFinalOutcome("failed");
      addSimEvent("workflow_failed", "Pipeline failed", "critical");
    },
    onCompensationTriggered: (description: string) => {
      setNarrative((n) => [...n, { text: description, severity: "warning" }]);
      addSimEvent("compensation", description, "warning");
    },
    onCircuitOpened: (description: string) => {
      setNarrative((n) => [...n, { text: description, severity: "critical" }]);
      addSimEvent("circuit_opened", description, "critical");
    },
  }), [workflow, addSimEvent]);

  // ── Controls ────────────────────────────────────────────────────────
  const resetUi = useCallback(() => {
    setNodeStates({});
    setActiveEdges({});
    setPhaseMemory({});
    setActivePhase(null);
    setNarrative([]);
    setPendingDecision(null);
    setPhaseTimers({});
    setEvents([]);
    setSystemLocked(false);
    setFinalOutcome(null);
    eventSeqRef.current = 0;
    activePhaseStartRef.current = {};
  }, []);

  const handleRun = () => {
    if (simulatorRef.current) {
      simulatorRef.current.stop();
    }
    resetUi();
    setStatus("running");

    const sim = new PipelineSimulator(workflow, simulatorCallbacks);
    simulatorRef.current = sim;
    sim.start(chaosMode, policyOverride);
  };

  const handleReset = () => {
    if (simulatorRef.current) {
      simulatorRef.current.stop();
      simulatorRef.current = null;
    }
    setStatus("idle");
    resetUi();
  };

  const handleDecision = (actionId: string) => {
    if (!pendingDecision) return;
    const edge = workflow.edges.find((e) => e.from === pendingDecision.nodeId && e.action_id === actionId);
    if (edge) {
      setActiveEdges((m) => ({ ...m, [`${edge.from}->${edge.to}`]: edge.severity }));
      if (edge.narrative) setNarrative((n) => [...n, { text: edge.narrative!, severity: edge.severity }]);
      const srcNode = workflow.nodes.find((n) => n.id === edge.from);
      if (srcNode) setPhaseMemory((m) => ({ ...m, [srcNode.phase]: bumpMemory(m[srcNode.phase] || "clean", edge.severity) }));
    }
    setNodeStates((s) => ({ ...s, [pendingDecision.nodeId]: "success" }));
    setPendingDecision(null);
    setStatus("running");
    addSimEvent("decision_made", `Decision: ${actionId}`, edge?.severity || "clean");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulatorRef.current) simulatorRef.current.stop();
    };
  }, []);

  // ── Derived state ───────────────────────────────────────────────────
  const phases = workflow.phases;
  const nodesByPhase = useMemo(() => {
    const map: Record<string, typeof workflow.nodes> = {};
    workflow.nodes.forEach((n) => {
      if (!map[n.phase]) map[n.phase] = [];
      map[n.phase].push(n);
    });
    return map;
  }, [workflow.nodes]);

  const releasePhaseId = phases.length ? phases[phases.length - 1].id : null;
  const artifactSegments = phases.map((p) => p.id);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: C.bg }}>
      {/* ═══ HEADER ═══ */}
      <header
        className="h-11 flex items-center gap-3 px-3 shrink-0"
        style={{ background: C.panel, borderBottom: "2px solid #000", boxShadow: "0 2px 0 #000" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 grid place-items-center text-xs font-bold" style={{ background: C.accent, border: "2px solid #000", boxShadow: "2px 2px 0 #000", color: "#000" }}>
            P
          </div>
          <span className="text-[13px] font-semibold tracking-wide" style={{ color: C.textMain }}>
            Pipeline Studio{" "}
            <span style={{ color: C.textMuted, fontWeight: 400 }}>pro</span>
          </span>
          {status !== "idle" && (
            <span className="flex items-center gap-1.5 text-[10px] ml-2" style={{ color: C.textSub, fontFamily: "'IBM Plex Mono', monospace" }}>
              <span
                className="w-2 h-2"
                style={{
                  background: status === "running" ? C.sSuccess : status === "awaiting_decision" ? C.sRecovery : status === "completed" ? C.sSuccess : status === "failed" ? C.sFailure : C.sIdle,
                  border: "1px solid #000",
                  boxShadow: status === "running" ? `0 0 8px ${C.sSuccess}` : "none",
                }}
              />
              {status.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Chaos mode toggle */}
          <label className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase cursor-pointer" style={{ color: C.textSub }}>
            <input
              type="checkbox"
              checked={chaosMode}
              onChange={(e) => setChaosMode(e.target.checked)}
              className="accent-[#ffd60a]"
            />
            <Bug size={10} />
            Chaos
          </label>

          {/* Policy selector */}
          <select
            value={policyOverride}
            onChange={(e) => setPolicyOverride(e.target.value)}
            className="h-6 px-2 text-[10px] tracking-wider uppercase"
            style={{
              background: C.lane,
              border: "2px solid #000",
              color: C.textSub,
              fontFamily: "'IBM Plex Mono', monospace",
              boxShadow: "2px 2px 0 #000",
              borderRadius: 0,
            }}
          >
            <option value="human">Human</option>
            <option value="probabilistic">Probabilistic</option>
            <option value="rule">Rule-based</option>
            <option value="llm">LLM Agent</option>
          </select>

          {/* Events toggle */}
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className="h-6 px-2 text-[10px] tracking-wider uppercase font-semibold"
            style={{
              background: drawerOpen ? C.panelAlt : C.lane,
              border: "2px solid #000",
              color: drawerOpen ? C.accent : C.textSub,
              boxShadow: "2px 2px 0 #000",
            }}
          >
            Events
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="h-6 px-2 text-[10px] tracking-wider uppercase font-semibold"
            style={{
              background: C.lane,
              border: "2px solid #000",
              color: C.textSub,
              boxShadow: "2px 2px 0 #000",
            }}
          >
            <RotateCcw size={10} className="inline mr-0.5" />
            Reset
          </button>

          {/* Run */}
          {status === "running" || status === "awaiting_decision" ? (
            <button
              onClick={handleReset}
              className="h-6 px-3 text-[10px] tracking-wider uppercase font-semibold flex items-center gap-1"
              style={{ background: C.sFailure, border: "2px solid #000", color: "#fff", boxShadow: "2px 2px 0 #000" }}
            >
              <Square size={8} /> Stop
            </button>
          ) : (
            <button
              onClick={handleRun}
              className="h-6 px-3 text-[10px] tracking-wider uppercase font-semibold flex items-center gap-1"
              style={{ background: C.accent, border: "2px solid #000", color: "#000", boxShadow: "2px 2px 0 #000" }}
            >
              <Play size={8} /> Run Pipeline
            </button>
          )}
        </div>
      </header>

      {/* ═══ STAGE ═══ */}
      <div className="flex-1 flex min-h-0 relative">
        <div
          ref={stageRef}
          className={`flex-1 overflow-x-auto ${systemLocked ? "pointer-events-none" : ""}`}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${phases.length}, minmax(220px, 1fr))`,
            background: C.bg,
            gap: 1,
            position: "relative",
          }}
        >
          {phases.map((phase) => {
            const isActive = activePhase === phase.id;
            const timerSec = phaseTimers[phase.id] || 0;
            const mem = phaseMemory[phase.id] || "clean";
            const isComplete = mem !== "clean" || (systemLocked && activePhase !== phase.id);

            return (
              <div
                key={phase.id}
                id={`plane-${phase.id}`}
                className="flex flex-col relative transition-all"
                style={{
                  background: isActive ? "rgba(0,209,255,0.04)" : C.lane,
                  borderRight: "1px solid " + C.borderLight,
                  opacity: systemLocked && !isComplete ? 0.3 : 1,
                  filter: systemLocked && !isComplete ? "grayscale(0.6)" : "none",
                  minHeight: 0,
                }}
              >
                {/* Lane header */}
                <div
                  className="flex items-center justify-between px-3 py-2 shrink-0"
                  style={{
                    background: isActive ? "rgba(0,209,255,0.06)" : C.panelAlt,
                    borderBottom: `2px solid ${isActive ? C.sActive : C.border}`,
                    boxShadow: isActive ? `0 2px 0 ${C.sActive}40` : "none",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span className="w-1.5 h-1.5 animate-pulse" style={{ background: C.sActive, border: "1px solid #000" }} />
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: isActive ? C.accent2 : C.textSub }}>
                      {phase.name}
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-semibold"
                    style={{
                      color: isActive ? C.accent2 : C.textMuted,
                      fontFamily: "'IBM Plex Mono', monospace",
                      opacity: isActive ? 1 : 0,
                      transition: "opacity 0.3s",
                    }}
                  >
                    {timerSec.toFixed(1)}s
                  </span>
                </div>

                {/* Lane content — nodes */}
                <div
                  className="flex-1 flex flex-col items-center gap-5 py-6 px-3 overflow-y-auto"
                  style={{ position: "relative", zIndex: 2 }}
                >
                  {(nodesByPhase[phase.id] || []).map((node) => {
                    const st = nodeStates[node.id] || "idle";
                    const isDecisionActive = st === "decision-active";

                    // Node styling based on role
                    let nodeBorderColor = C.border;
                    let nodeBg = C.lane;
                    let iconColor = C.sIdle;

                    if (node.role === "gate") nodeBorderColor = C.rGate;
                    else if (node.role === "entry") nodeBorderColor = C.rEntry;
                    else if (node.role === "exit") nodeBorderColor = C.rExit;
                    else if (node.role === "recovery") nodeBorderColor = C.sRecovery;

                    if (st === "active") { nodeBorderColor = C.sActive; nodeBg = "rgba(0,209,255,0.08)"; iconColor = C.sActive; }
                    else if (st === "success") { nodeBorderColor = C.sSuccess; nodeBg = "rgba(34,197,94,0.08)"; iconColor = C.sSuccess; }
                    else if (st === "warning") { nodeBorderColor = C.sWarning; nodeBg = "rgba(245,158,11,0.08)"; iconColor = C.sWarning; }
                    else if (st === "failure") { nodeBorderColor = C.sFailure; nodeBg = "rgba(239,68,68,0.08)"; iconColor = C.sFailure; }
                    else if (isDecisionActive) { nodeBorderColor = C.sRecovery; nodeBg = "rgba(168,85,247,0.1)"; iconColor = C.sRecovery; }

                    return (
                      <div
                        key={node.id}
                        id={`pnode-${node.id}`}
                        className="relative flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-14 h-14 flex items-center justify-center transition-all"
                          style={{
                            background: nodeBg,
                            border: `2px solid ${nodeBorderColor}`,
                            boxShadow: st === "active"
                              ? `0 0 16px ${C.sActive}40, 2px 2px 0 #000`
                              : isDecisionActive
                              ? `0 0 20px ${C.sRecovery}50, 2px 2px 0 #000`
                              : "2px 2px 0 #000",
                            transform: node.role === "gate" ? "rotate(45deg)" : "none",
                            borderRadius: 0,
                          }}
                        >
                          <PipelineIcon
                            name={node.icon}
                            style={{
                              width: 22,
                              height: 22,
                              stroke: iconColor,
                              fill: "none",
                              strokeWidth: 1.5,
                              transform: node.role === "gate" ? "rotate(-45deg)" : "none",
                              transition: "stroke 0.3s",
                            }}
                          />
                        </div>
                        <span
                          className="text-[9px] font-semibold whitespace-nowrap"
                          style={{ color: C.textSub }}
                        >
                          {node.name}
                        </span>
                        {/* Node type indicator */}
                        {node.type === "decision" && (
                          <span
                            className="text-[7px] px-1 tracking-wider uppercase font-bold"
                            style={{
                              background: isDecisionActive ? C.sRecovery + "20" : C.lane,
                              border: `1px solid ${isDecisionActive ? C.sRecovery + "60" : C.border}`,
                              color: isDecisionActive ? C.sRecovery : C.textMuted,
                            }}
                          >
                            DECISION
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Artifact Memory — only on release phase */}
                {phase.id === releasePhaseId && (
                  <div className="absolute bottom-4 right-4 w-24 h-24 pointer-events-none" style={{ zIndex: 50, opacity: 0.4, transition: "all 0.5s" }}>
                    <svg viewBox="0 0 100 100" width="100%" height="100%">
                      {artifactSegments.map((segId, i) => {
                        const paths = [
                          "M50 50 L50 5 L93 35 Z",
                          "M50 50 L93 35 L78 88 Z",
                          "M50 50 L78 88 L22 88 Z",
                          "M50 50 L22 88 L7 35 Z",
                          "M50 50 L7 35 L50 5 Z",
                        ];
                        const mem = phaseMemory[segId];
                        const fill = mem === "critical" ? C.sFailure : mem === "warning" ? C.sWarning : mem === "clean" ? C.sSuccess : C.lane;
                        return <path key={segId} d={paths[i]} fill={fill} stroke={C.border} strokeWidth="1" style={{ transition: "all 0.5s", filter: mem ? `drop-shadow(0 0 6px ${fill})` : "none" }} />;
                      })}
                      <circle cx="50" cy="50" r="8" fill="#000" stroke={C.border} strokeWidth="1" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          {/* SVG Connectors */}
          <svg ref={connectorSvgRef} className="pconnector-svg" />

          {/* Decision Panel */}
          {pendingDecision && (
            <div
              className="absolute z-[100] flex flex-col gap-2 p-4"
              style={{
                bottom: 120,
                left: "50%",
                transform: "translateX(-50%)",
                width: 340,
                background: "rgba(15,20,27,0.96)",
                border: `2px solid ${C.sRecovery}`,
                boxShadow: `0 0 30px ${C.sRecovery}30, 6px 6px 0 #000`,
              }}
            >
              <div
                className="text-[10px] uppercase tracking-widest font-bold pb-2"
                style={{ color: C.sRecovery, borderBottom: `1px solid ${C.border}` }}
              >
                {pendingDecision.intent.toUpperCase()}
              </div>
              {pendingDecision.policyHint && pendingDecision.policyHint.source !== "human" && (
                <div
                  className="text-[9px] px-2 py-1.5"
                  style={{
                    color: C.textSub,
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: "rgba(168,85,247,0.06)",
                    borderLeft: `2px solid ${C.sRecovery}`,
                  }}
                >
                  {pendingDecision.policyHint.source.toUpperCase()} · confidence{" "}
                  {pendingDecision.policyHint.confidence.toFixed(2)}
                  {pendingDecision.policyHint.reasoning ? ` · ${pendingDecision.policyHint.reasoning}` : ""}
                </div>
              )}
              {pendingDecision.options.map((opt) => (
                <button
                  key={opt.action_id}
                  onClick={() => handleDecision(opt.action_id)}
                  className="flex items-center gap-2 px-3 py-2 text-[11px] text-left transition-all"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${C.border}`,
                    color: C.textMain,
                    boxShadow: "2px 2px 0 #000",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(168,85,247,0.1)"; e.currentTarget.style.borderColor = C.sRecovery; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = C.border; }}
                >
                  <span style={{ color: opt.severity === "clean" ? C.sSuccess : opt.severity === "warning" ? C.sWarning : C.sFailure }}>◆</span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ═══ EVENT DRAWER ═══ */}
        <div
          className="shrink-0 flex flex-col transition-all"
          style={{
            width: drawerOpen ? 320 : 0,
            background: C.panel,
            borderLeft: drawerOpen ? "2px solid #000" : "none",
            overflow: "hidden",
          }}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ background: C.panelAlt, borderBottom: "1px solid " + C.border }}>
            <div className="flex gap-1">
              {(["events", "traces", "circuits"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDrawerTab(t)}
                  className="px-2 py-1 text-[9px] uppercase tracking-wider font-semibold"
                  style={{
                    background: drawerTab === t ? C.panelAlt : "transparent",
                    border: `1px solid ${drawerTab === t ? C.border : "transparent"}`,
                    color: drawerTab === t ? C.accent : C.textMuted,
                    boxShadow: drawerTab === t ? "2px 2px 0 #000" : "none",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <button onClick={() => setDrawerOpen(false)} style={{ color: C.textSub, background: "transparent", border: "none", cursor: "pointer", fontSize: 14 }}>
              ✕
            </button>
          </div>

          {/* Drawer body */}
          <div className="flex-1 overflow-y-auto" style={{ background: C.bg }}>
            {drawerTab === "events" && events.map((ev) => (
              <div
                key={ev.seq}
                className="flex items-start gap-2 px-3 py-1.5 text-[10px]"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.02)",
                  borderLeft: `2px solid ${ev.severity === "critical" ? C.sFailure : ev.severity === "warning" ? C.sWarning : C.sSuccess}`,
                  background: "rgba(255,255,255,0.01)",
                }}
              >
                <span style={{ color: C.textMuted, fontFamily: "'IBM Plex Mono', monospace", width: 24, flexShrink: 0 }}>#{ev.seq}</span>
                <div>
                  <div style={{ color: C.accent2, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em" }}>{ev.type}</div>
                  <div style={{ color: C.textMain }}>{ev.description}</div>
                </div>
              </div>
            ))}
            {drawerTab === "traces" && (
              <div className="p-4 text-[10px]" style={{ color: C.textMuted }}>
                {status !== "idle" ? "Trace spans will appear here when backend is connected" : "Start an execution to view traces"}
              </div>
            )}
            {drawerTab === "circuits" && (
              <div className="p-4 text-[10px]" style={{ color: C.textMuted }}>
                No circuit breakers registered (shell mode)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ NARRATIVE STRIP ═══ */}
      <footer
        className="h-9 flex items-center px-4 gap-2 shrink-0 overflow-x-auto whitespace-nowrap"
        style={{
          background: "#000",
          borderTop: `2px solid ${finalOutcome === "completed" ? C.sSuccess : finalOutcome === "failed" ? C.sFailure : C.border}`,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: C.textSub,
          zIndex: 40,
        }}
      >
        {narrative.length === 0 ? (
          <span style={{ color: C.textMuted }}>
            {status !== "idle" ? "Awaiting first narrative event…" : "READY — Click Run Pipeline to begin simulation"}
          </span>
        ) : (
          narrative.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              <span style={{
                color: item.severity === "critical" ? C.sFailure : item.severity === "warning" ? C.sWarning : C.sSuccess,
              }}>
                {item.text}
              </span>
              {i < narrative.length - 1 && <span style={{ color: C.border, margin: "0 4px" }}>→</span>}
            </span>
          ))
        )}
      </footer>
    </div>
  );
}
