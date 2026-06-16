"use client";

import { useAgentStore, type AgentEvent } from "@/store/agent-store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Wrench, BarChart3, CheckCircle, AlertCircle, Loader2,
  Square, Search, PenLine, Code, Globe, ArrowRight, Shield,
  RotateCcw, ShieldCheck, ShieldX, ShieldAlert,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { ReflectionPanel } from "./reflection-panel";
import { RunMetrics } from "./run-metrics";

const eventConfig: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
  thinking: { icon: <Brain size={14} />, color: "#8a94a3", label: "Thinking", bg: "#8a94a315" },
  plan: { icon: <Brain size={14} />, color: "#ffd60a", label: "Planning", bg: "#ffd60a15" },
  action: { icon: <Wrench size={14} />, color: "#00d1ff", label: "Executing", bg: "#00d1ff15" },
  result: { icon: <BarChart3 size={14} />, color: "#22c55e", label: "Result", bg: "#22c55e15" },
  error: { icon: <AlertCircle size={14} />, color: "#ef4444", label: "Error", bg: "#ef444415" },
  done: { icon: <CheckCircle size={14} />, color: "#22c55e", label: "Complete", bg: "#22c55e15" },
  status: { icon: <Loader2 size={14} className="animate-spin" />, color: "#8a94a3", label: "Status", bg: "#8a94a315" },
  reflection: { icon: <RotateCcw size={14} />, color: "#f59e0b", label: "Reflection", bg: "#f59e0b15" },
  policy: { icon: <Shield size={14} />, color: "#ffd60a", label: "Policy Check", bg: "#ffd60a15" },
  handoff: { icon: <ArrowRight size={14} />, color: "#00d1ff", label: "Handoff", bg: "#00d1ff15" },
  group_message: { icon: <Brain size={14} />, color: "#22c55e", label: "Group Message", bg: "#22c55e15" },
};

const toolIcons: Record<string, React.ReactNode> = {
  search: <Search size={11} />, write: <PenLine size={11} />, code: <Code size={11} />,
  browser: <Globe size={11} />, finish: <CheckCircle size={11} />,
};

export function AgentRunView() {
  const { events, currentRunId, isRunning, stopRun, agents, selectedAgentId } = useAgentStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  const maxSteps = selectedAgent?.maxSteps || 10;
  const currentStep = events.filter((e) => e.type === "result").length || 0;
  const progress = Math.min((currentStep / maxSteps) * 100, 100);
  const isDone = events.some((e) => e.type === "done");
  const hasReflections = events.some((e) => e.type === "reflection");

  return (
    <div className="h-full flex flex-col" style={{ background: "#05070a" }}>
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "#0f141b", borderBottom: "2px solid #000" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isRunning && !isDone ? (
              <Loader2 size={14} className="animate-spin" style={{ color: "#00d1ff" }} />
            ) : isDone ? (
              <CheckCircle size={14} style={{ color: "#22c55e" }} />
            ) : (
              <Brain size={14} style={{ color: "#8a94a3" }} />
            )}
            <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: "#d7dde5" }}>
              {isDone ? "Run Complete" : isRunning ? "Agent Running" : "Execution View"}
            </span>
          </div>
          {selectedAgent && (
            <span className="text-[9px] px-1.5 py-0 tracking-wider uppercase" style={{ background: "#0c1219", border: "1px solid #2a3441", color: "#8a94a3" }}>
              {selectedAgent.name}
            </span>
          )}
          {hasReflections && (
            <span className="text-[8px] px-1.5 py-0 tracking-wider uppercase" style={{ background: "#f59e0b15", border: "1px solid #f59e0b40", color: "#f59e0b" }}>
              Reflecting
            </span>
          )}
        </div>
        {isRunning && !isDone && (
          <button
            onClick={() => currentRunId && stopRun(currentRunId)}
            className="flex items-center gap-1 px-2 py-1 text-[9px] tracking-wider uppercase font-semibold"
            style={{ background: "#ef4444", color: "#fff", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }}
          >
            <Square size={8} /> Stop
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 py-1.5" style={{ background: "#0f141b" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] tracking-wider" style={{ color: "#8a94a3" }}>
            Step {currentStep} of {maxSteps}
          </span>
          <span className="text-[9px]" style={{ color: "#ffd60a" }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div style={{ height: 3, background: "#0c1219", border: "1px solid #2a3441" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#d97706,#ffd60a)", transition: "width 0.3s" }} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Brain size={32} style={{ color: "#2a3441", marginBottom: 12 }} />
              <p className="text-[11px]" style={{ color: "#8a94a3" }}>
                Waiting for agent to start...
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-w-2xl mx-auto">
              <AnimatePresence mode="popLayout">
                {events.map((event, i) => (
                  <EventCard key={i} event={event} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {hasReflections && <ReflectionPanel />}
        {isDone && <RunMetrics />}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: AgentEvent }) {
  const config = eventConfig[event.type] || eventConfig.status;
  const verificationStatus = event.data?.verificationStatus as string | undefined;
  const policyBlocked = event.data?.blocked as boolean | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        background: event.type === "done" ? "#22c55e08" : event.type === "error" ? "#ef444408" : "#0f141b",
        border: event.type === "done" ? "1px solid #22c55e30" : event.type === "error" ? "1px solid #ef444430" : "1px solid #2a3441",
        padding: 12,
        borderRadius: 0,
      }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: config.bg, color: config.color }}
        >
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[10px] font-semibold" style={{ color: config.color }}>
              {config.label}
            </span>
            {event.step !== undefined && (
              <span className="text-[8px]" style={{ color: "#475569" }}>Step {event.step + 1}</span>
            )}
            {!!event.data?.tool && (
              <div className="flex items-center gap-0.5 text-[8px]" style={{ color: "#8a94a3" }}>
                {toolIcons[event.data.tool as string]}
                <span className="capitalize">{String(event.data.tool)}</span>
              </div>
            )}
            {verificationStatus && (
              <span
                className="text-[7px] px-1 py-0 tracking-wider uppercase"
                style={{
                  background: verificationStatus === "verified" ? "#22c55e20" : verificationStatus === "failed" ? "#ef444420" : "#f59e0b20",
                  border: "1px solid " + (verificationStatus === "verified" ? "#22c55e40" : verificationStatus === "failed" ? "#ef444440" : "#f59e0b40"),
                  color: verificationStatus === "verified" ? "#22c55e" : verificationStatus === "failed" ? "#ef4444" : "#f59e0b",
                }}
              >
                {verificationStatus === "verified" && <ShieldCheck size={7} className="inline mr-0.5" />}
                {verificationStatus === "failed" && <ShieldX size={7} className="inline mr-0.5" />}
                {verificationStatus === "needs_review" && <ShieldAlert size={7} className="inline mr-0.5" />}
                {verificationStatus}
              </span>
            )}
            {event.type === "policy" && (
              <span
                className="text-[7px] px-1 py-0 tracking-wider uppercase"
                style={{
                  background: policyBlocked ? "#ef444420" : "#22c55e20",
                  border: "1px solid " + (policyBlocked ? "#ef444440" : "#22c55e40"),
                  color: policyBlocked ? "#ef4444" : "#22c55e",
                }}
              >
                {policyBlocked ? "blocked" : "allowed"}
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: "#8a94a3" }}>
            {event.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
