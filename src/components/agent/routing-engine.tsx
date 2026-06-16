"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAgentStore } from "@/store/agent-store";

// ═══════════════════════════════════════════════════════════════════════
// ROUTING ENGINE MODULE
// AI LLM Routing Engine with ε-greedy policy, Q-learning table,
// real-time telemetry, and multi-provider routing visualization.
// Shell only — no backend hooks yet.
// ═══════════════════════════════════════════════════════════════════════

type EngineState = "off" | "running" | "paused";

const AGENTS = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"];
const TASKS = ["PLAN", "ROUTE", "RETR", "CODE", "EXEC", "VERF", "MEM", "TOOL", "AUDT"];
const PROVIDERS = [
  { name: "OpenAI", color: "#10a37f" },
  { name: "Anthropic", color: "#d4a373" },
  { name: "Google", color: "#4285f4" },
  { name: "Mistral", color: "#ff7a00" },
];

// ─── Sparkline component ────────────────────────────────────────────
function Sparkline({ data, color = "#ffd60a", height = 56 }: { data: number[]; color?: string; height?: number }) {
  const width = 300;
  if (data.length < 2) return null;
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const rg = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - 4 - ((v - mn) / rg) * (height - 8)}`).join(" ");
  const fillPts = `0,${height} ${pts} ${width},${height}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline fill="url(#sparkGrad)" points={fillPts} />
      <polyline fill="none" stroke={color} strokeWidth={1.8} opacity={0.95} points={pts} />
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#1e2732" strokeWidth={0.5} strokeDasharray="2 3" />
    </svg>
  );
}

// ─── Q-Table Heatmap ────────────────────────────────────────────────
function QTableHeatmap({ qTable }: { qTable: number[][] }) {
  const states = qTable.length;
  const actions = qTable[0]?.length || 0;
  const maxVal = Math.max(...qTable.flat());
  const minVal = Math.min(...qTable.flat());
  const range = maxVal - minVal || 1;

  return (
    <div className="overflow-auto" style={{ background: "#05070b", padding: 4 }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 10 }}>
        <thead>
          <tr>
            <th style={{ color: "#566272", padding: "4px 3px", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid #2a3441" }}></th>
            {Array.from({ length: actions }, (_, i) => (
              <th key={i} style={{ color: "#566272", padding: "4px 2px", fontSize: 9, textAlign: "center", borderBottom: "1px solid #2a3441" }}>
                A{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {qTable.map((row, si) => (
            <tr key={si}>
              <td style={{ color: "#566272", padding: "3px 4px", fontSize: 9, textAlign: "right", borderRight: "1px solid #2a3441" }}>
                S{String(si).padStart(2, "0")}
              </td>
              {row.map((v, ai) => {
                const intensity = Math.min(0.85, Math.max(0.08, ((v - minVal) / range) * 0.7 + 0.08));
                const isBold = v > minVal + range * 0.7;
                return (
                  <td key={ai} style={{
                    background: `rgba(255,214,10,${intensity})`,
                    color: isBold ? "#000" : "#d7dde5",
                    fontWeight: isBold ? 600 : 400,
                    padding: "3px 2px",
                    textAlign: "center",
                    fontSize: 10,
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    borderRight: ai < actions - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}>
                    {v.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Telemetry Log ──────────────────────────────────────────────────
function TelemetryLog({ entries }: { entries: { agent: string; task: string; reward: number; qValue: number; ts: string }[] }) {
  return (
    <div style={{ maxHeight: 260, overflowY: "auto", background: "#05070b", padding: "4px 6px", fontSize: 10, lineHeight: "18px", border: "1px solid #2a3441", borderRadius: 0 }}>
      {entries.map((e, i) => (
        <div key={i} className="flex items-center gap-2 px-1 py-0.5 transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}
          onMouseEnter={(ev) => { ev.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
          onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ color: "#8a94a3", width: 24, textAlign: "center" }}>{e.agent}</span>
          <span style={{ color: "#d7dde5", flex: 1, textAlign: "center" }}>{e.task}</span>
          <span style={{ color: e.reward >= 0 ? "#ffd60a" : "#64748b", width: 48, textAlign: "center" }}>
            {e.reward >= 0 ? "+" : ""}{e.reward.toFixed(2)}
          </span>
          <span style={{ color: "#8a94a3", width: 40, textAlign: "center" }}>{e.qValue.toFixed(2)}</span>
          <span style={{ color: "#475569", width: 90, textAlign: "right", fontSize: 9 }}>{e.ts}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN ROUTING ENGINE COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export function RoutingEngine() {
  const { agents } = useAgentStore();

  // ── Engine state ─────────────────────────────────────────────────
  const [engineState, setEngineState] = useState<EngineState>("off");
  const [epsilon, setEpsilon] = useState(1.0);
  const [decisions, setDecisions] = useState(0);
  const [activeRoutes, setActiveRoutes] = useState(0);
  const [gridLatency, setGridLatency] = useState<string>("—");
  const [convergence, setConvergence] = useState(68);
  const [ingress, setIngress] = useState(0);
  const [queueDepth, setQueueDepth] = useState(0);
  const [p95Latency, setP95Latency] = useState(0);
  const [streamRate, setStreamRate] = useState(0);
  const [activeProvider, setActiveProvider] = useState(0);

  // ── Data ─────────────────────────────────────────────────────────
  const [sparkData, setSparkData] = useState<number[]>(Array(60).fill(0).map(() => 25 + Math.random() * 10));
  const [qTable, setQTable] = useState<number[][]>(
    Array(12).fill(0).map(() => Array(6).fill(0).map(() => Math.random() * 0.8 + 0.1))
  );
  const [telemetry, setTelemetry] = useState<{ agent: string; task: string; reward: number; qValue: number; ts: string }[]>([]);
  const [priorities, setPriorities] = useState([8, 40, 50, 5]);
  const [packetPos, setPacketPos] = useState({ x: 100, y: 60 });
  const [activePath, setActivePath] = useState("");
  const [routeDecisionsPerSec, setRouteDecisionsPerSec] = useState(0);

  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const pathIndexRef = useRef(0);

  // Route path segments for the SVG animation
  const routeSegments = [
    [100, 60, 300, 60], [300, 60, 540, 60], [540, 60, 540, 130],
    [540, 130, 540, 200], [540, 200, 300, 200], [300, 200, 100, 200],
    [100, 200, 100, 130], [100, 130, 100, 60],
  ];

  // ── Simulation tick ──────────────────────────────────────────────
  const tick = useCallback(() => {
    setSparkData(prev => {
      const next = [...prev.slice(1), Math.max(8, Math.min(52, prev[prev.length - 1] + (Math.random() - 0.5) * 8))];
      return next;
    });
    setIngress(840 + (Math.random() * 80) | 0);
    setQueueDepth(115 + (Math.random() * 30) | 0);
    setP95Latency(38 + (Math.random() * 10) | 0);
    setPriorities([8, 40, 50, 5].map(p => p + (Math.random() * 10) | 0));

    setEpsilon(prev => Math.max(0.01, prev * 0.9985));
    setRouteDecisionsPerSec((1.8 + Math.random() * 0.6));

    // Update Q-table
    setQTable(prev => prev.map(row => row.map(v => {
      const delta = (Math.random() - 0.5) * 0.1;
      return Math.max(0, Math.min(0.99, v + delta));
    })));

    setConvergence(65 + Math.sin(Date.now() / 9000) * 5 + Math.random() * 2);
    setStreamRate(18 + Math.random() * 6);

    // Add telemetry
    const now = new Date();
    const ts = now.toTimeString().slice(0, 8) + "." + String(now.getMilliseconds()).padStart(3, "0");
    const agent = AGENTS[Math.random() * 9 | 0];
    const task = TASKS[Math.random() * 9 | 0] + (100 + Math.random() * 900 | 0);
    const reward = (Math.random() - 0.3) * 0.5;
    const qv = 0.5 + Math.random() * 0.45;

    setTelemetry(prev => [{ agent, task, reward, qValue: qv, ts }, ...prev].slice(0, 20));
  }, []);

  // ── Route animation ──────────────────────────────────────────────
  const animateRoute = useCallback(() => {
    const seg = routeSegments[pathIndexRef.current];
    if (!seg) return;
    const [x1, y1, x2, y2] = seg;
    setActivePath(`M${x1} ${y1} L${x2} ${y2}`);

    const start = performance.now();
    const dur = 800;
    const animate = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setPacketPos({ x: x1 + (x2 - x1) * p, y: y1 + (y2 - y1) * p });
      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        pathIndexRef.current = (pathIndexRef.current + 1) % routeSegments.length;
        setDecisions(prev => prev + 1);
      }
    };
    requestAnimationFrame(animate);
    setActiveRoutes(1);
    setGridLatency((10 + Math.random() * 4).toFixed(1) + "ms");
  }, [routeSegments]);

  // ── Provider cycling ─────────────────────────────────────────────
  const cycleProvider = useCallback(() => {
    setActiveProvider(prev => (prev + 1) % 4);
  }, []);

  // ── Engine control ───────────────────────────────────────────────
  const startEngine = useCallback(() => {
    if (engineState === "running") return;
    setEngineState("running");
    tick();
    animateRoute();
    cycleProvider();
    intervalsRef.current = [
      setInterval(tick, 450),
      setInterval(animateRoute, 950),
      setInterval(cycleProvider, 2200),
    ];
  }, [engineState, tick, animateRoute, cycleProvider]);

  const stopEngine = useCallback(() => {
    setEngineState("off");
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    setActiveRoutes(0);
    setStreamRate(0);
    setGridLatency("—");
  }, []);

  const pauseEngine = useCallback(() => {
    setEngineState("paused");
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    setActiveRoutes(0);
  }, []);

  const toggleEngine = () => {
    if (engineState === "off") startEngine();
    else if (engineState === "running") pauseEngine();
    else startEngine();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  // Seed initial telemetry
  useEffect(() => {
    const initial = Array.from({ length: 5 }, () => {
      const now = new Date();
      return {
        agent: AGENTS[Math.random() * 9 | 0],
        task: TASKS[Math.random() * 9 | 0] + (100 + Math.random() * 900 | 0),
        reward: (Math.random() - 0.3) * 0.5,
        qValue: 0.5 + Math.random() * 0.45,
        ts: now.toTimeString().slice(0, 8) + "." + String(now.getMilliseconds()).padStart(3, "0"),
      };
    });
    setTelemetry(initial);
  }, []);

  const statusColor = engineState === "running" ? "#22c55e" : engineState === "paused" ? "#ef4444" : "#2a3441";
  const statusGlow = engineState === "running" ? "0 0 12px rgba(34,197,94,0.55)" : engineState === "paused" ? "0 0 12px rgba(239,68,68,0.55)" : "none";

  return (
    <div className="flex-1 flex" style={{ background: "#05070a" }}>
      {/* ═══ LEFT COLUMN ═══ */}
      <div className="flex flex-col gap-3 p-3" style={{ width: "280px" }}>
        {/* Task Ingress Module */}
        <div style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 30%), #0f141b", border: "1px solid #2a3441", borderRadius: 0, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))", borderBottom: "1px solid #2a3441", padding: "8px 12px", textAlign: "center" }}>
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#9aa4b2" }}>Task Ingress</span>
          </div>
          <div style={{ padding: 12 }}>
            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "Ingress", value: ingress || "—", unit: "tasks/min" },
                { label: "Queue", value: queueDepth || "—", unit: "depth" },
                { label: "Latency", value: p95Latency || "—", unit: "ms p95" },
              ].map((m) => (
                <div key={m.label} style={{ background: "radial-gradient(220px 90px at 50% -10%, rgba(255,214,10,0.09), transparent 70%), #07090d", border: "1px solid #2a3441", padding: "10px 6px", textAlign: "center" }}>
                  <div className="text-[8px] uppercase tracking-wider" style={{ color: "#5b6b81" }}>{m.label}</div>
                  <div className="text-xl font-semibold" style={{ color: "#f8fafc", textShadow: "0 0 18px rgba(255,214,10,0.14)" }}>{m.value}</div>
                  <div className="text-[8px]" style={{ color: "#475569" }}>{m.unit}</div>
                </div>
              ))}
            </div>

            {/* Sparkline */}
            <div style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent), #07090d", border: "1px solid #2a3441", padding: 8, position: "relative" }}>
              <span className="absolute top-1.5 left-2 text-[8px] uppercase tracking-wider" style={{ color: "#4b5563" }}>Throughput // 60s</span>
              <Sparkline data={sparkData} />
            </div>

            {/* Priority pills */}
            <div className="grid grid-cols-4 gap-1 mt-2">
              {priorities.map((p, i) => (
                <div key={i} className="flex justify-between px-1.5 py-1 text-[9px]" style={{ background: "#07090d", border: "1px solid #2a3441" }}>
                  <span style={{ color: "#5b6b81" }}>P{i}</span>
                  <span style={{ color: "#8a94a3" }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Telemetry Module */}
        <div className="flex-1 flex flex-col" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 30%), #0f141b", border: "1px solid #2a3441", borderRadius: 0, overflow: "hidden", minHeight: 300 }}>
          <div style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))", borderBottom: "1px solid #2a3441", padding: "8px 12px", textAlign: "center" }}>
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#9aa4b2" }}>Telemetry</span>
          </div>
          {/* Header row */}
          <div className="grid grid-cols-5 gap-1 px-2 py-1 text-[8px] uppercase tracking-wider" style={{ background: "#07090d", borderBottom: "1px solid #2a3441", color: "#566272", textAlign: "center" }}>
            <span>Agent</span><span>Task</span><span>Reward</span><span>Q-Val</span><span>Time</span>
          </div>
          <TelemetryLog entries={telemetry} />
          <div className="flex items-center justify-between px-3 py-1.5 text-[9px]" style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid #2a3441" }}>
            <span className="uppercase tracking-wider" style={{ color: "#475569" }}>Stream Rate</span>
            <span style={{ color: "#ffd60a" }}>{streamRate.toFixed(1)} ev/s</span>
          </div>
        </div>
      </div>

      {/* ═══ CENTER COLUMN ═══ */}
      <div className="flex-1 flex flex-col p-3">
        <div className="flex-1 flex flex-col" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 30%), #0f141b", border: "1px solid #2a3441", borderRadius: 0, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))", borderBottom: "1px solid #2a3441", padding: "8px 12px", textAlign: "center" }}>
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#9aa4b2" }}>Routing</span>
          </div>

          {/* Triple stats */}
          <div className="grid grid-cols-3 text-center" style={{ background: "#07090d", borderBottom: "1px solid #2a3441" }}>
            <div className="py-2.5" style={{ borderRight: "1px solid #2a3441" }}>
              <div className="text-[8px] uppercase tracking-wider" style={{ color: "#5b6b81" }}>Epsilon</div>
              <div className="text-lg font-semibold" style={{ color: "#ffd60a" }}>{epsilon.toFixed(3)}</div>
              <div className="mx-auto mt-1" style={{ width: "80%", height: 3, background: "#0a0f18", border: "1px solid #2a3441", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg,#d97706,#ffd60a)", width: `${epsilon * 100}%`, boxShadow: "0 0 10px rgba(255,214,10,0.35)" }} />
              </div>
            </div>
            <div className="py-2.5" style={{ borderRight: "1px solid #2a3441" }}>
              <div className="text-[8px] uppercase tracking-wider" style={{ color: "#5b6b81" }}>Decisions</div>
              <div className="text-lg font-semibold" style={{ color: "#d7dde5" }}>{decisions}</div>
              <div className="text-[9px] mt-1" style={{ color: "#8a94a3" }}>{routeDecisionsPerSec.toFixed(1)}/s</div>
            </div>
            <div className="py-2.5">
              <div className="text-[8px] uppercase tracking-wider" style={{ color: "#5b6b81" }}>Policy</div>
              <div className="text-[12px] mt-0.5 font-semibold" style={{ color: "#d7dde5" }}>ε-GREEDY</div>
              <div className="text-[9px] mt-0.5" style={{ color: "#8a94a3" }}>UCB1 backup</div>
            </div>
          </div>

          {/* SVG Routing Grid */}
          <div className="flex-1 flex items-center justify-center" style={{ background: "#05070b", padding: 16 }}>
            <svg width="100%" height="260" viewBox="0 0 640 260">
              <defs>
                <filter id="routerGlow">
                  <feGaussianBlur stdDeviation="2" />
                  <feFlood floodColor="#ffd60a" floodOpacity={0.65} />
                  <feComposite in2="SourceGraphic" operator="in" />
                  <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1f2937" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#0b1220" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <rect width="640" height="260" fill="#05070b" />
              {/* Grid lines */}
              <g stroke="url(#gridGrad)" strokeWidth={1.2} opacity={0.8} fill="none">
                <path d="M100 60 H540 M100 130 H540 M100 200 H540 M100 60 V200 M300 60 V200 M540 60 V200" />
              </g>
              {/* Active path */}
              {activePath && (
                <g stroke="#ffd60a" strokeWidth={2.8} fill="none" filter="url(#routerGlow)" opacity={0.95}>
                  <path d={activePath} />
                </g>
              )}
              {/* Packet */}
              <g fill="#fbbf24">
                <circle r={4} cx={packetPos.x} cy={packetPos.y} />
              </g>
              {/* Agent nodes */}
              <g style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }} textAnchor="middle">
                {/* Top row */}
                {[100, 300, 540].map((x, i) => (
                  <g key={`t${i}`} transform={`translate(${x},60)`}>
                    <rect x={-28} y={-15} width={56} height={30} fill="#0a0f18" stroke={i === 0 ? "#ffd60a" : "#1e293b"} strokeWidth={i === 0 ? 1.5 : 1} rx={0} />
                    {i === 0 && <rect x={-28} y={-15} width={3} height={30} fill="#ffd60a" opacity={0.9} />}
                    <text y={5} fill="#e2e8f0">{AGENTS[i]}</text>
                  </g>
                ))}
                {/* Middle row */}
                {[540, 300, 100].map((x, i) => (
                  <g key={`m${i}`} transform={`translate(${x},130)`}>
                    <rect x={-28} y={-15} width={56} height={30} fill="#0a0f18" stroke={i === 1 ? "#ffd60a" : "#1e293b"} strokeWidth={i === 1 ? 1.5 : 1} rx={0} />
                    {i === 1 && <rect x={-28} y={-15} width={3} height={30} fill="#ffd60a" />}
                    <text y={5} fill="#e2e8f0">{AGENTS[3 + i]}</text>
                  </g>
                ))}
                {/* Bottom row */}
                {[100, 300, 540].map((x, i) => (
                  <g key={`b${i}`} transform={`translate(${x},200)`}>
                    <rect x={-28} y={-15} width={56} height={30} fill="#0a0f18" stroke="#1e293b" strokeWidth={1} rx={0} />
                    {i === 2 && <rect x={-28} y={-15} width={3} height={30} fill="#ffd60a" opacity={0.7} />}
                    <text y={5} fill="#e2e8f0">{AGENTS[6 + i]}</text>
                  </g>
                ))}
              </g>
            </svg>
          </div>

          {/* Provider bar */}
          <div className="grid grid-cols-4 gap-2 px-3 py-2" style={{ borderTop: "1px solid #2a3441" }}>
            {PROVIDERS.map((p, i) => (
              <div
                key={p.name}
                className="text-center py-2 px-1 transition-all"
                style={{
                  background: activeProvider === i ? "radial-gradient(180px 60px at 50% 0%, rgba(255,214,10,0.16), transparent 70%), #0e0a04" : "#07090d",
                  border: activeProvider === i ? "1px solid rgba(255,214,10,0.55)" : "1px solid #2a3441",
                }}
              >
                <div className="text-[9px] uppercase tracking-wider" style={{ color: activeProvider === i ? "#fbbf24" : "#7b8699" }}>
                  {p.name}
                </div>
                <div
                  className="mx-auto mt-1.5"
                  style={{
                    width: 8, height: 8, background: activeProvider === i ? "#ffd60a" : "#2a3242",
                    border: "1px solid #000",
                    boxShadow: activeProvider === i ? "0 0 8px rgba(255,214,10,0.8)" : "none",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-1.5 text-[9px]" style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid #2a3441" }}>
            <span className="uppercase tracking-wider" style={{ color: "#475569" }}>
              Grid Latency: <span style={{ color: "#8a94a3" }}>{gridLatency}</span>
            </span>
            <span className="uppercase tracking-wider" style={{ color: "#475569" }}>
              Active Routes: <span style={{ color: "#ffd60a" }}>{activeRoutes}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT COLUMN ═══ */}
      <div className="flex flex-col p-3" style={{ width: "300px" }}>
        <div className="flex-1 flex flex-col" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 30%), #0f141b", border: "1px solid #2a3441", borderRadius: 0, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))", borderBottom: "1px solid #2a3441", padding: "8px 12px", textAlign: "center" }}>
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#9aa4b2" }}>Q-Table Heatmap</span>
          </div>

          {/* Q params */}
          <div className="grid grid-cols-3 text-center text-[9px]" style={{ background: "#07090d", borderBottom: "1px solid #2a3441", padding: 8 }}>
            <div>
              <div className="uppercase tracking-wider text-[8px]" style={{ color: "#556274" }}>α</div>
              <div>0.12</div>
            </div>
            <div>
              <div className="uppercase tracking-wider text-[8px]" style={{ color: "#556274" }}>γ</div>
              <div>0.95</div>
            </div>
            <div>
              <div className="uppercase tracking-wider text-[8px]" style={{ color: "#556274" }}>τ</div>
              <div>0.80</div>
            </div>
          </div>

          {/* Q table */}
          <div className="flex-1 overflow-auto p-1" style={{ background: "#05070b" }}>
            <QTableHeatmap qTable={qTable} />
          </div>

          {/* Convergence footer */}
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid #2a3441" }}>
            <span className="text-[9px] uppercase tracking-wider" style={{ color: "#475569" }}>Convergence</span>
            <div className="flex items-center gap-2">
              <div style={{ width: 80, height: 3, background: "#0a0f18", border: "1px solid #2a3441", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg,#d97706,#ffd60a)", width: `${convergence}%`, boxShadow: "0 0 10px rgba(255,214,10,0.35)" }} />
              </div>
              <span className="text-[9px]" style={{ color: "#8a94a3" }}>{convergence.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Engine Control */}
        <div className="mt-3 p-3" style={{ background: "#0f141b", border: "1px solid #2a3441" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#9aa4b2" }}>Engine Control</span>
            <button
              onClick={toggleEngine}
              className="w-8 h-8 flex items-center justify-center transition-all"
              style={{
                background: engineState === "running" ? "#22c55e" : engineState === "paused" ? "#ef4444" : "#1a1f2b",
                border: "2px solid #000",
                boxShadow: `0 0 0 2px rgba(0,0,0,0.6), ${statusGlow}`,
                borderRadius: "50%",
              }}
              title={engineState === "off" ? "Start" : engineState === "running" ? "Pause" : "Resume"}
            >
              <div
                style={{
                  width: 10, height: 10,
                  background: statusColor,
                  border: "1px solid #000",
                }}
              />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[9px]">
            <button
              onClick={startEngine}
              className="py-1.5 uppercase tracking-wider font-semibold transition-all"
              style={{
                background: engineState === "running" ? "#22c55e" : "#1a212b",
                color: engineState === "running" ? "#000" : "#8a94a3",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #000",
              }}
            >
              RUN
            </button>
            <button
              onClick={pauseEngine}
              className="py-1.5 uppercase tracking-wider font-semibold transition-all"
              style={{
                background: engineState === "paused" ? "#ef4444" : "#1a212b",
                color: engineState === "paused" ? "#fff" : "#8a94a3",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #000",
              }}
            >
              PAUSE
            </button>
            <button
              onClick={stopEngine}
              className="py-1.5 uppercase tracking-wider font-semibold transition-all"
              style={{
                background: "#1a212b",
                color: "#8a94a3",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #000",
              }}
            >
              OFF
            </button>
          </div>

          {/* Q-Learning params (editable shell) */}
          <div className="mt-3 space-y-2">
            <div className="text-[8px] uppercase tracking-widest font-semibold" style={{ color: "#5b6b81" }}>Q-Learning Parameters</div>
            {[
              { label: "Learning Rate (α)", value: "0.12" },
              { label: "Discount (γ)", value: "0.95" },
              { label: "Temperature (τ)", value: "0.80" },
              { label: "Epsilon Decay", value: "0.9985" },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between text-[9px]">
                <span style={{ color: "#8a94a3" }}>{p.label}</span>
                <span className="px-1.5 py-0.5" style={{ background: "#0b1118", border: "1px solid #2a3441", color: "#ffd60a" }}>
                  {p.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
