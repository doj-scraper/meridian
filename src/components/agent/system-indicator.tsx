"use client";

import { useEffect, useMemo } from "react";
import { useAgentStore } from "@/store/agent-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

type SystemState = "idle" | "running" | "waiting_approval" | "error";

const stateConfig: Record<SystemState, { color: string; label: string; pulse: boolean }> = {
  idle: { color: "#2a3441", label: "Idle", pulse: false },
  running: { color: "#00d1ff", label: "Running", pulse: true },
  waiting_approval: { color: "#ffd60a", label: "Approval", pulse: false },
  error: { color: "#ef4444", label: "Error", pulse: false },
};

export function SystemIndicator() {
  const { isRunning, pendingApprovals, error, systemMetrics, fetchSystemMetrics, fetchPendingApprovals } = useAgentStore();

  useEffect(() => {
    fetchSystemMetrics();
    fetchPendingApprovals();
    const interval = setInterval(() => { fetchSystemMetrics(); fetchPendingApprovals(); }, 10000);
    return () => clearInterval(interval);
  }, [fetchSystemMetrics, fetchPendingApprovals]);

  const systemState: SystemState = useMemo(() => {
    if (error) return "error";
    if (pendingApprovals.length > 0) return "waiting_approval";
    if (isRunning) return "running";
    return "idle";
  }, [isRunning, pendingApprovals, error]);

  const config = stateConfig[systemState];
  const activeRunCount = systemMetrics?.activeRuns ?? 0;
  const pendingCount = pendingApprovals.length;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-default">
            <div className="flex items-center gap-1.5">
              <motion.div
                className="w-2.5 h-2.5"
                style={{ background: config.color, border: "1px solid #000" }}
                animate={
                  config.pulse
                    ? { boxShadow: [`0 0 0px ${config.color}00`, `0 0 8px ${config.color}60`, `0 0 0px ${config.color}00`] }
                    : {}
                }
                transition={config.pulse ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
              />
              <span className="text-[9px] tracking-wider uppercase font-semibold" style={{ color: config.color }}>
                {config.label}
              </span>
            </div>

            {activeRunCount > 0 && (
              <span className="text-[8px] px-1 py-0 tracking-wider uppercase" style={{ background: "#00d1ff15", border: "1px solid #00d1ff40", color: "#00d1ff" }}>
                {activeRunCount} run{activeRunCount !== 1 ? "s" : ""}
              </span>
            )}

            {pendingCount > 0 && (
              <span className="text-[8px] px-1 py-0 tracking-wider uppercase" style={{ background: "#ffd60a15", border: "1px solid #ffd60a40", color: "#ffd60a" }}>
                {pendingCount} pending
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          style={{ background: "#0b1016", border: "2px solid #000", borderRadius: 0, color: "#d7dde5", fontSize: 11, padding: 8, boxShadow: "4px 4px 0 #000" }}
        >
          <div className="space-y-1">
            <div className="font-semibold tracking-wider uppercase text-[10px]" style={{ color: config.color }}>
              System: {config.label}
            </div>
            {systemMetrics && (
              <>
                <div style={{ color: "#8a94a3" }}>Total runs: {systemMetrics.totalRuns}</div>
                <div style={{ color: "#8a94a3" }}>Active: {systemMetrics.activeRuns}</div>
                <div style={{ color: "#8a94a3" }}>Agents: {systemMetrics.totalAgents}</div>
                {systemMetrics.errorRate > 0 && (
                  <div style={{ color: "#ef4444" }}>Error rate: {systemMetrics.errorRate.toFixed(1)}%</div>
                )}
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
