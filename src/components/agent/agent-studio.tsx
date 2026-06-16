"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore, type AgentEvent, type AppModule } from "@/store/agent-store";
import { AgentSidebar } from "./agent-sidebar";
import { AgentCanvas } from "./agent-canvas";
import { AgentInspector } from "./agent-inspector";
import { AgentBuilderWizard } from "./agent-builder-wizard";
import { SystemIndicator } from "./system-indicator";
import { ApprovalModal } from "./approval-modal";
import { RoutingEngine } from "./routing-engine";
import { PipelineStudio } from "@/components/pipeline/pipeline-studio";
import { HermesCausalGraph } from "./hermes-causal-graph";
import { HermesEventStream } from "./hermes-event-stream";
import { HermesFrontierPanel } from "./hermes-frontier-panel";
import { useHermesStore } from "@/store/hermes-store";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarCheckboxItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarShortcut,
} from "@/components/ui/menubar";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Workflow,
  Route,
  GitBranch,
  Palette,
  Sparkles,
  Bot,
  Users,
  Settings,
  Keyboard,
  Info,
  FileText,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// SSE reconnection constants
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

// V2 event types that the SSE handler recognizes
const V2_EVENT_TYPES = new Set<string>([
  "status", "plan", "action", "result", "thinking",
  "error", "done", "reflection", "policy", "handoff", "group_message",
]);

const NAV_ITEMS: { key: AppModule; label: string; icon: React.ReactNode }[] = [
  { key: "canvas", label: "Agents", icon: <Workflow size={12} /> },
  { key: "hermes", label: "Hermes", icon: <Sparkles size={12} /> },
  { key: "router", label: "Router", icon: <Route size={12} /> },
  { key: "pipeline", label: "Pipeline", icon: <GitBranch size={12} /> },
  { key: "workflow", label: "Studio", icon: <Palette size={12} /> },
];

// ═══════════════════════════════════════════════════════════════
// Hermes Module — Causal DAG Architecture View
// ═══════════════════════════════════════════════════════════════

function HermesModule() {
  const { startRun, stopRun, runStatus, runGoal, viewMode, setViewMode } = useHermesStore();
  const [goalInput, setGoalInput] = useState("");
  const [agentName, setAgentName] = useState("Hermes Agent");
  const eventStream = useHermesStore((s) => s.eventStream);
  const frontier = useHermesStore((s) => s.frontier);
  const agents = useHermesStore((s) => s.agents);
  const totalEvents = useHermesStore((s) => s.totalEvents);
  const transitionCount = useHermesStore((s) => s.transitionCount);

  return (
    <div className="flex-1 flex" style={{ background: "#05070a", minHeight: 0 }}>
      {/* Left: Event Stream */}
      <div style={{ width: "280px", borderRight: "2px solid #000", flexShrink: 0 }}>
        <HermesEventStream />
      </div>

      {/* Center: Causal Graph or other views */}
      <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
        {/* Toolbar */}
        <div
          style={{
            height: "42px",
            borderBottom: "2px solid #000",
            background: "#0f141b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: "4px" }}>
            {(["causal-graph", "event-stream", "frontier"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  background: viewMode === mode ? "#ffd60a" : "transparent",
                  color: viewMode === mode ? "#000" : "#8a94a3",
                  border: viewMode === mode ? "2px solid #ffd60a" : "2px solid transparent",
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "'IBM Plex Mono', monospace",
                  boxShadow: viewMode === mode ? "2px 2px 0 #000" : "none",
                }}
              >
                {mode.replace("-", " ")}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#5a6577", fontSize: "9px" }}>
              {totalEvents} events · {transitionCount} transitions
            </span>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1" style={{ minHeight: 0 }}>
          {viewMode === "causal-graph" && <HermesCausalGraph />}
          {viewMode === "event-stream" && (
            <div style={{ padding: "12px", overflowY: "auto", height: "100%" }}>
              <HermesEventStream />
            </div>
          )}
          {viewMode === "frontier" && <HermesFrontierPanel />}
        </div>

        {/* Bottom: Run controls */}
        <div
          style={{
            height: "48px",
            borderTop: "2px solid #000",
            background: "#0f141b",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 12px",
            flexShrink: 0,
          }}
        >
          <input
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder="Enter goal for Hermes run..."
            style={{
              flex: 1,
              background: "#05070a",
              border: "2px solid #2a3441",
              boxShadow: "inset 1px 1px 0 #000",
              padding: "6px 8px",
              color: "#e8eaed",
              fontSize: "11px",
              fontFamily: "'IBM Plex Mono', monospace",
              outline: "none",
            }}
          />
          {runStatus === "running" ? (
            <button
              onClick={() => stopRun()}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #000",
                padding: "4px 12px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
                textTransform: "uppercase",
              }}
            >
              Stop
            </button>
          ) : (
            <button
              onClick={() => {
                if (goalInput.trim()) {
                  startRun(goalInput);
                }
              }}
              disabled={!goalInput.trim()}
              style={{
                background: goalInput.trim() ? "#ffd60a" : "#2a3441",
                color: goalInput.trim() ? "#000" : "#5a6577",
                border: "2px solid #000",
                boxShadow: goalInput.trim() ? "2px 2px 0 #000" : "none",
                padding: "4px 12px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: goalInput.trim() ? "pointer" : "default",
                fontFamily: "'IBM Plex Mono', monospace",
                textTransform: "uppercase",
              }}
            >
              Run
            </button>
          )}
        </div>
      </div>

      {/* Right: Frontier Panel */}
      <div style={{ width: "260px", borderLeft: "2px solid #000", flexShrink: 0 }}>
        <HermesFrontierPanel />
      </div>
    </div>
  );
}

export function AgentStudio() {
  const router = useRouter();
  const {
    fetchAgents,
    fetchRuns,
    currentRunId,
    addEvent,
    clearEvents,
    setIsRunning,
    sidebarOpen,
    inspectorOpen,
    setSidebarOpen,
    setInspectorOpen,
    selectedAgentId,
    selectAgent,
    agents,
    error,
    clearError,
    deleteAgent,
    builderOpen,
    setBuilderOpen,
    activeModule,
    setActiveModule,
  } = useAgentStore();

  const { toast } = useToast();
  const [teamBuilderOpen, setTeamBuilderOpen] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCleaningUpRef = useRef<boolean>(false);
  const connectSSERef = useRef<(runId: string) => void>(() => {});

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        setInspectorOpen(!inspectorOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sidebarOpen, inspectorOpen, setSidebarOpen, setInspectorOpen]);

  // Show toast notification when error state is set
  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  const handleClearError = useCallback(() => {
    if (error) clearError();
  }, [error, clearError]);

  const getReconnectDelay = useCallback((attempt: number): number => {
    const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, attempt);
    return Math.min(delay, MAX_RECONNECT_DELAY_MS);
  }, []);

  const closeEventSource = useCallback(() => {
    isCleaningUpRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
  }, []);

  const attemptReconnect = useCallback(
    (runId: string) => {
      if (isCleaningUpRef.current) return;
      const attempt = reconnectAttemptsRef.current;
      if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        useAgentStore.setState({
          isRunning: false,
          error: `Connection lost after ${MAX_RECONNECT_ATTEMPTS} reconnection attempts`,
        });
        return;
      }
      const delay = getReconnectDelay(attempt);
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isCleaningUpRef.current) return;
        connectSSERef.current(runId);
      }, delay);
    },
    [getReconnectDelay]
  );

  const connectSSE = useCallback(
    (runId: string) => {
      if (isCleaningUpRef.current) return;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      const url = `/api/agent/stream?runId=${encodeURIComponent(runId)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data: AgentEvent = JSON.parse(event.data);
          addEvent(data);
          reconnectAttemptsRef.current = 0;
          if (data.type === "done") {
            setIsRunning(false);
            es.close();
            eventSourceRef.current = null;
            fetchRuns();
          }
          if (data.type === "error") {
            useAgentStore.setState({ error: data.message });
          }
        } catch (parseError) {
          console.error("SSE parse error:", parseError);
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        if (!isCleaningUpRef.current) {
          attemptReconnect(runId);
        }
      };
    },
    [addEvent, setIsRunning, fetchRuns, attemptReconnect]
  );

  useEffect(() => {
    connectSSERef.current = connectSSE;
  }, [connectSSE]);

  useEffect(() => {
    if (!currentRunId) return;
    isCleaningUpRef.current = false;
    reconnectAttemptsRef.current = 0;
    clearEvents();
    connectSSE(currentRunId);
    return () => {
      closeEventSource();
    };
  }, [currentRunId, clearEvents, connectSSE, closeEventSource]);

  useEffect(() => {
    return () => {
      isCleaningUpRef.current = true;
      closeEventSource();
    };
  }, [closeEventSource]);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" style={{ background: "#05070a" }} onClick={handleClearError}>
      {/* ═══ TOPBAR ═══ */}
      <header
        className="h-11 flex items-center shrink-0 relative z-10"
        style={{
          background: "#0f141b",
          borderBottom: "2px solid #000",
          boxShadow: "0 2px 0 #000",
        }}
      >
        {/* Logo — always clean, never crushed */}
        <div className="flex items-center gap-2.5 px-3 shrink-0">
          <div
            className="w-6 h-6 grid place-items-center text-xs font-bold shrink-0"
            style={{
              background: "#ffd60a",
              border: "2px solid #000",
              boxShadow: "2px 2px 0 #000",
              color: "#000",
            }}
          >
            A
          </div>
          <span className="text-[13px] font-semibold tracking-wide whitespace-nowrap" style={{ color: "#d7dde5" }}>
            Agent Studio OS{" "}
            <span style={{ color: "#8a94a3", fontWeight: 400 }}>beta</span>
          </span>
        </div>

        {/* ═══ MENUBAR ═══ */}
        <Menubar className="h-7 ml-1 gap-0 border-0 bg-transparent p-0 shadow-none" style={{ background: "transparent" }}>
          {/* FILE */}
          <MenubarMenu>
            <MenubarTrigger
              className="text-[11px] font-medium tracking-wider uppercase px-2 py-1 h-7"
              style={{ color: "#8a94a3" }}
            >
              File
            </MenubarTrigger>
            <MenubarContent
              className="min-w-[180px]"
              style={{
                background: "#0b1016",
                border: "2px solid #000",
                borderRadius: 0,
                boxShadow: "4px 4px 0 #000",
                color: "#d7dde5",
              }}
            >
              <MenubarItem
                className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]"
                onClick={() => setBuilderOpen(true)}
              >
                <Sparkles size={12} style={{ color: "#ffd60a" }} />
                AI Builder
                <MenubarShortcut className="text-[9px]" style={{ color: "#5b6b81" }}>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem
                className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]"
                onClick={() => {
                  const store = useAgentStore.getState();
                  store.createAgent({
                    name: "New Agent",
                    goal: "Define a goal for this agent",
                    personality: "helpful assistant",
                    tools: ["search"],
                    maxSteps: 10,
                    autoRun: false,
                    outputFormat: "markdown",
                    role: "general",
                    orchestrationMode: "single",
                  } as any).then((a) => { if (a) store.selectAgent(a.id); });
                }}
              >
                <Bot size={12} style={{ color: "#8a94a3" }} />
                New Agent
              </MenubarItem>
              <MenubarSeparator style={{ background: "#1b2430" }} />
              <MenubarItem
                className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]"
                onClick={() => setActiveModule("workflow")}
              >
                <Workflow size={12} style={{ color: "#8a94a3" }} />
                New Workflow
              </MenubarItem>
              <MenubarItem
                className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]"
                onClick={() => setTeamBuilderOpen(true)}
              >
                <Users size={12} style={{ color: "#22c55e" }} />
                New Team
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* EDIT */}
          <MenubarMenu>
            <MenubarTrigger
              className="text-[11px] font-medium tracking-wider uppercase px-2 py-1 h-7"
              style={{ color: "#8a94a3" }}
            >
              Edit
            </MenubarTrigger>
            <MenubarContent
              className="min-w-[180px]"
              style={{
                background: "#0b1016",
                border: "2px solid #000",
                borderRadius: 0,
                boxShadow: "4px 4px 0 #000",
                color: "#d7dde5",
              }}
            >
              <MenubarItem
                className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]"
                onClick={() => { if (selectedAgentId) setInspectorOpen(true); }}
                disabled={!selectedAgentId}
              >
                <Settings size={12} style={{ color: "#8a94a3" }} />
                Configuration
                <MenubarShortcut className="text-[9px]" style={{ color: "#5b6b81" }}>⌘I</MenubarShortcut>
              </MenubarItem>
              <MenubarItem
                className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]"
                onClick={() => setActiveModule("router")}
              >
                <Route size={12} style={{ color: "#8a94a3" }} />
                Routing Policies
              </MenubarItem>
              <MenubarSeparator style={{ background: "#1b2430" }} />
              <MenubarItem
                className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#ef4444]"
                disabled={!selectedAgentId}
                onClick={() => {
                  if (selectedAgentId) {
                    deleteAgent(selectedAgentId);
                    selectAgent(null);
                  }
                }}
              >
                Delete Agent
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* VIEW */}
          <MenubarMenu>
            <MenubarTrigger
              className="text-[11px] font-medium tracking-wider uppercase px-2 py-1 h-7"
              style={{ color: "#8a94a3" }}
            >
              View
            </MenubarTrigger>
            <MenubarContent
              className="min-w-[200px]"
              style={{
                background: "#0b1016",
                border: "2px solid #000",
                borderRadius: 0,
                boxShadow: "4px 4px 0 #000",
                color: "#d7dde5",
              }}
            >
              <MenubarCheckboxItem
                checked={sidebarOpen}
                onCheckedChange={setSidebarOpen}
                className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]"
              >
                Explorer
                <MenubarShortcut className="text-[9px] ml-auto" style={{ color: "#5b6b81" }}>⌘B</MenubarShortcut>
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                checked={inspectorOpen}
                onCheckedChange={setInspectorOpen}
                className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]"
              >
                Inspector
                <MenubarShortcut className="text-[9px] ml-auto" style={{ color: "#5b6b81" }}>⌘I</MenubarShortcut>
              </MenubarCheckboxItem>
              <MenubarSeparator style={{ background: "#1b2430" }} />
              <MenubarSub>
                <MenubarSubTrigger className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]">
                  Modules
                </MenubarSubTrigger>
                <MenubarSubContent
                  className="min-w-[160px]"
                  style={{
                    background: "#0b1016",
                    border: "2px solid #000",
                    borderRadius: 0,
                    boxShadow: "4px 4px 0 #000",
                    color: "#d7dde5",
                  }}
                >
                  {NAV_ITEMS.map((item) => (
                    <MenubarItem
                      key={item.key}
                      className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]"
                      onClick={() => setActiveModule(item.key)}
                    >
                      {item.icon}
                      <span className={activeModule === item.key ? "font-semibold" : ""} style={{ color: activeModule === item.key ? "#ffd60a" : "#d7dde5" }}>
                        {item.label}
                      </span>
                      {activeModule === item.key && (
                        <span className="ml-auto text-[8px] tracking-wider" style={{ color: "#ffd60a" }}>●</span>
                      )}
                    </MenubarItem>
                  ))}
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator style={{ background: "#1b2430" }} />
              <MenubarItem
                className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]"
                onClick={() => router.push('/meridian')}
              >
                <Sparkles size={12} style={{ color: "#00d1ff" }} />
                Switch to Meridian Runtime
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* HELP */}
          <MenubarMenu>
            <MenubarTrigger
              className="text-[11px] font-medium tracking-wider uppercase px-2 py-1 h-7"
              style={{ color: "#8a94a3" }}
            >
              Help
            </MenubarTrigger>
            <MenubarContent
              className="min-w-[180px]"
              style={{
                background: "#0b1016",
                border: "2px solid #000",
                borderRadius: 0,
                boxShadow: "4px 4px 0 #000",
                color: "#d7dde5",
              }}
            >
              <MenubarItem className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]">
                <Info size={12} style={{ color: "#8a94a3" }} />
                About Agent Studio OS
              </MenubarItem>
              <MenubarItem className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]">
                <FileText size={12} style={{ color: "#8a94a3" }} />
                Documentation
              </MenubarItem>
              <MenubarSeparator style={{ background: "#1b2430" }} />
              <MenubarItem className="text-[11px] gap-2 focus:bg-[#141c25] focus:text-[#d7dde5]">
                <Keyboard size={12} style={{ color: "#8a94a3" }} />
                Keyboard Shortcuts
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        {/* Module nav tabs — compact */}
        <nav className="flex gap-0.5 ml-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveModule(item.key)}
              className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium tracking-wider transition-all uppercase"
              style={{
                color: activeModule === item.key ? "#ffd60a" : "#5b6b81",
                background: activeModule === item.key ? "#1a212b" : "transparent",
                border: activeModule === item.key ? "1px solid #2a3441" : "1px solid transparent",
              }}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Right side — status + toggles */}
        <div className="ml-auto flex items-center gap-2 px-2">
          <SystemIndicator />

          <div
            className="px-2 py-0.5 text-[9px] tracking-wider hidden md:block"
            style={{
              border: "1px solid #2a3441",
              background: "#1a212b",
              color: "#8a94a3",
            }}
          >
            {agents.length} AGENT{agents.length !== 1 ? "S" : ""}
          </div>

          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-7 h-7 flex items-center justify-center transition-colors"
            style={{ color: sidebarOpen ? "#d7dde5" : "#5b6b81" }}
            title={sidebarOpen ? "Close Explorer (⌘B)" : "Open Explorer (⌘B)"}
          >
            {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          </button>
          {/* Inspector toggle */}
          <button
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className="w-7 h-7 flex items-center justify-center transition-colors"
            style={{ color: inspectorOpen ? "#d7dde5" : "#5b6b81" }}
            title={inspectorOpen ? "Close Inspector (⌘I)" : "Open Inspector (⌘I)"}
          >
            {inspectorOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
          </button>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex min-h-0">
        {activeModule === "canvas" && (
          <>
            {/* Left Sidebar with collapse strip */}
            <AnimatePresence initial={false}>
              {sidebarOpen ? (
                <motion.div
                  key="sidebar"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden shrink-0"
                >
                  <AgentSidebar />
                </motion.div>
              ) : (
                <motion.div
                  key="sidebar-strip"
                  initial={{ width: 0 }}
                  animate={{ width: 32 }}
                  exit={{ width: 0 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  className="shrink-0 flex flex-col items-center pt-2"
                  style={{ background: "#0a0e14", borderRight: "2px solid #000" }}
                >
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="w-6 h-6 flex items-center justify-center transition-colors"
                    style={{ color: "#5b6b81" }}
                    title="Open Explorer (⌘B)"
                  >
                    <PanelLeftOpen size={12} />
                  </button>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {agents.slice(0, 8).map((agent) => (
                      <div
                        key={agent.id}
                        className="w-2 h-2"
                        style={{
                          background: selectedAgentId === agent.id ? "#ffd60a" : "#2a3441",
                          border: "1px solid #000",
                        }}
                        title={agent.name}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center Canvas / Run View */}
            <AgentCanvas />

            {/* Right Inspector with collapse strip */}
            <AnimatePresence initial={false}>
              {inspectorOpen ? (
                <motion.div
                  key="inspector"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden shrink-0"
                >
                  <AgentInspector />
                </motion.div>
              ) : (
                <motion.div
                  key="inspector-strip"
                  initial={{ width: 0 }}
                  animate={{ width: 32 }}
                  exit={{ width: 0 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  className="shrink-0 flex flex-col items-center pt-2"
                  style={{ background: "#0a0e14", borderLeft: "2px solid #000" }}
                >
                  <button
                    onClick={() => setInspectorOpen(true)}
                    className="w-6 h-6 flex items-center justify-center transition-colors"
                    style={{ color: "#5b6b81" }}
                    title="Open Inspector (⌘I)"
                  >
                    <PanelRightOpen size={12} />
                  </button>
                  {selectedAgentId && (
                    <div
                      className="mt-2 text-[8px] tracking-wider uppercase font-semibold"
                      style={{ color: "#ffd60a", writingMode: "vertical-rl", textOrientation: "mixed" }}
                    >
                      CFG
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {activeModule === "router" && <RoutingEngine />}

        {activeModule === "hermes" && (
          <HermesModule />
        )}

        {activeModule === "pipeline" && <PipelineStudio />}

        {activeModule === "workflow" && (
          <div className="flex-1 flex items-center justify-center" style={{ background: "#05070a" }}>
            <div className="text-center">
              <div
                className="w-20 h-20 flex items-center justify-center mx-auto mb-4"
                style={{
                  background: "#0f141b",
                  border: "2px solid #000",
                  boxShadow: "6px 6px 0 #000",
                }}
              >
                <Palette size={32} style={{ color: "#2a3441" }} />
              </div>
              <h3 className="text-[16px] font-semibold mb-2" style={{ color: "#d7dde5", letterSpacing: "0.02em" }}>
                WORKFLOW STUDIO
              </h3>
              <p className="text-[12px] mb-4" style={{ color: "#8a94a3", maxWidth: "320px", margin: "0 auto" }}>
                Visual workflow design tool. Create, edit, and test multi-agent workflows before deploying them to the live orchestration engine.
              </p>
              <div
                className="inline-block px-3 py-1.5 text-[10px] tracking-wider font-semibold"
                style={{
                  background: "#1a212b",
                  border: "2px solid #000",
                  boxShadow: "2px 2px 0 #000",
                  color: "#ffd60a",
                }}
              >
                COMING SOON
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Builder Wizard overlay */}
      <AgentBuilderWizard />
      {/* Approval Modal */}
      <ApprovalModal />
      {/* Team Builder — triggered from File > New Team */}
      {teamBuilderOpen && <TeamBuilderDialog onClose={() => setTeamBuilderOpen(false)} />}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Standalone TeamBuilder dialog for menubar use
   ────────────────────────────────────────────────────────── */

const ORCHESTRATION_MODES = [
  { value: "sequential", label: "Sequential", desc: "One after another" },
  { value: "group", label: "Group Chat", desc: "Agents discuss together" },
  { value: "hierarchical", label: "Hierarchical", desc: "Planner delegates" },
  { value: "parallel", label: "Parallel", desc: "Run simultaneously" },
] as const;

function TeamBuilderDialog({ onClose }: { onClose: () => void }) {
  const { agents, createTeam } = useAgentStore();
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");
  const [mode, setMode] = useState("sequential");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedAgentIds.length === 0) return;
    setIsCreating(true);
    try {
      await createTeam({ name: name.trim(), mode, agentIds: selectedAgentIds });
      setName(""); setMode("sequential"); setSelectedAgentIds([]);
      setOpen(false);
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) onClose(); }}>
      <DialogContent
        className="bg-[#0f141b] border-[#2a3441] text-[#d7dde5] max-w-lg"
        style={{ borderRadius: 0 }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#d7dde5]">
            <Users size={18} className="text-[#22c55e]" />
            Create Agent Team
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-[#5b6b81] uppercase tracking-wider font-medium">Team Name</Label>
            <Input
              value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Research Squad"
              className="h-8 text-[12px] bg-[#0b1118] border-[#2a3441] text-[#d7dde5] focus:border-[#ffd60a] focus:ring-[#ffd60a]/20"
              style={{ borderRadius: 0 }}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-[#5b6b81] uppercase tracking-wider font-medium">Orchestration Mode</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {ORCHESTRATION_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`p-2.5 text-left border transition-all ${
                    mode === m.value
                      ? "bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e]"
                      : "bg-[#0b1118] border-[#2a3441] text-[#8a94a3] hover:border-[#3a4553]"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  <div className="text-[11px] font-medium">{m.label}</div>
                  <div className="text-[9px] mt-0.5 opacity-70">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-[#5b6b81] uppercase tracking-wider font-medium">
              Select Agents ({selectedAgentIds.length} selected)
            </Label>
            {agents.length === 0 ? (
              <p className="text-[11px] text-[#475569] py-2">No agents available. Create agents first.</p>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {agents.map((agent) => (
                    <label
                      key={agent.id}
                      className={`flex items-center gap-2.5 p-2 cursor-pointer transition-all border ${
                        selectedAgentIds.includes(agent.id)
                          ? "bg-[#22c55e]/10 border-[#22c55e]/30"
                          : "bg-[#0b1118] border-[#2a3441] hover:border-[#3a4553]"
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      <Checkbox
                        checked={selectedAgentIds.includes(agent.id)}
                        onCheckedChange={() => toggleAgent(agent.id)}
                        className="border-[#3a4553] data-[state=checked]:bg-[#22c55e] data-[state=checked]:border-[#22c55e]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-[#d7dde5]">{agent.name}</div>
                        <div className="text-[9px] text-[#5b6b81] truncate">{agent.role} · {agent.tools?.join(", ")}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-8 text-[11px] border-2 border-black" style={{ background: "#1a212b", color: "#8a94a3", boxShadow: "2px 2px 0 #000" }}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || selectedAgentIds.length === 0 || isCreating}
            className="h-8 text-[11px] gap-1.5 border-2 border-black disabled:opacity-50"
            style={{ background: "#22c55e", color: "#000", boxShadow: "2px 2px 0 #000" }}
          >
            {isCreating ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
            Create Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
