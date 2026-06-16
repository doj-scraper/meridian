"use client";

import { useEffect, useState } from "react";
import { useAgentStore, type AgentEvent } from "@/store/agent-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  Zap,
  Hash,
  AlertCircle,
  BarChart3,
  Wrench,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";

type RunMetricsData = {
  totalTokens: number;
  latencyMs: number;
  stepCount: number;
  toolUsage: Record<string, number>;
  errors: { step: number; message: string }[];
  reflectionCount: number;
  policyChecks: number;
  policyBlocked: number;
};

type TimelineEvent = {
  step: number;
  type: string;
  message: string;
  timestamp: string;
  tool?: string;
};

/**
 * Derive metrics from the event stream.
 */
function deriveMetricsFromEvents(events: AgentEvent[]): RunMetricsData {
  const metrics: RunMetricsData = {
    totalTokens: 0,
    latencyMs: 0,
    stepCount: 0,
    toolUsage: {},
    errors: [],
    reflectionCount: 0,
    policyChecks: 0,
    policyBlocked: 0,
  };

  for (const event of events) {
    if (event.type === "result") {
      metrics.stepCount++;
      if (event.data?.tokens) {
        metrics.totalTokens += Number(event.data.tokens);
      }
      if (event.data?.latencyMs) {
        metrics.latencyMs += Number(event.data.latencyMs);
      }
    }
    if (event.type === "action" && event.data?.tool) {
      const tool = event.data.tool as string;
      metrics.toolUsage[tool] = (metrics.toolUsage[tool] || 0) + 1;
    }
    if (event.type === "error") {
      metrics.errors.push({
        step: event.step ?? metrics.stepCount,
        message: event.message,
      });
    }
    if (event.type === "reflection") {
      metrics.reflectionCount++;
    }
    if (event.type === "policy") {
      metrics.policyChecks++;
      if (event.data?.blocked) {
        metrics.policyBlocked++;
      }
    }
  }

  return metrics;
}

function deriveTimeline(events: AgentEvent[]): TimelineEvent[] {
  return events
    .filter((e) => e.type !== "status")
    .map((event, i) => ({
      step: event.step ?? i,
      type: event.type,
      message: event.message,
      timestamp: new Date().toISOString(),
      tool: event.data?.tool as string | undefined,
    }));
}

const toolColors: Record<string, string> = {
  search: "#3B82F6",
  write: "#10B981",
  code: "#F59E0B",
  browser: "#8B5CF6",
  execute_code: "#EF4444",
  finish: "#22C55E",
};

function ToolUsageChart({ toolUsage }: { toolUsage: Record<string, number> }) {
  const entries = Object.entries(toolUsage).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  const maxCount = Math.max(...entries.map(([, count]) => count));

  return (
    <div className="space-y-1.5">
      {entries.map(([tool, count]) => {
        const color = toolColors[tool] || "#5b6b81";
        const width = (count / maxCount) * 100;
        return (
          <div key={tool} className="flex items-center gap-2">
            <span className="text-[9px] text-[#5b6b81] w-16 text-right truncate capitalize">
              {tool.replace("_", " ")}
            </span>
            <div className="flex-1 h-3 bg-[#0f141b] overflow-hidden" style={{ borderRadius: 0 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full"
                style={{ background: color + "80", borderRadius: 0 }}
              />
            </div>
            <span className="text-[9px] text-[#8a94a3] font-mono w-4">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function TimelineView({ timeline }: { timeline: TimelineEvent[] }) {
  const typeIcons: Record<string, React.ReactNode> = {
    thinking: <Activity size={8} className="text-[#8a94a3]" />,
    plan: <Zap size={8} className="text-[#ffd60a]" />,
    action: <Wrench size={8} className="text-[#3B82F6]" />,
    result: <CheckCircle size={8} className="text-[#22C55E]" />,
    error: <XCircle size={8} className="text-[#EF4444]" />,
    reflection: <Activity size={8} className="text-[#F59E0B]" />,
    policy: <AlertCircle size={8} className="text-[#F59E0B]" />,
    done: <CheckCircle size={8} className="text-[#22C55E]" />,
  };

  if (timeline.length === 0) return null;

  return (
    <div className="space-y-0">
      {timeline.slice(-15).map((event, i) => (
        <div key={i} className="flex items-start gap-2 relative">
          {/* Vertical line */}
          {i < timeline.slice(-15).length - 1 && (
            <div className="absolute left-[5px] top-3 bottom-0 w-[1px] bg-[#2a3441]" />
          )}
          {/* Dot */}
          <div
            className="w-[11px] h-[11px] bg-[#0b1118] border border-[#2a3441] flex items-center justify-center shrink-0 mt-0.5 z-10"
            style={{ borderRadius: 0 }}
          >
            {typeIcons[event.type] || <Activity size={6} className="text-[#5b6b81]" />}
          </div>
          {/* Content */}
          <div className="min-w-0 flex-1 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-[#5b6b81] font-mono">
                Step {event.step}
              </span>
              {event.tool && (
                <Badge
                  variant="secondary"
                  className="text-[7px] px-1 py-0 h-3 border-0"
                  style={{
                    borderRadius: 0,
                    background: (toolColors[event.tool] || "#5b6b81") + "20",
                    color: toolColors[event.tool] || "#5b6b81",
                  }}
                >
                  {event.tool}
                </Badge>
              )}
              <span className="text-[8px] text-[#475569] capitalize">
                {event.type}
              </span>
            </div>
            <p className="text-[10px] text-[#8a94a3] line-clamp-1 break-words">
              {event.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RunMetrics({ runId }: { runId?: string }) {
  const { events, currentRunId } = useAgentStore();
  const [serverMetrics, setServerMetrics] = useState<Record<string, unknown> | null>(null);

  const effectiveRunId = runId || currentRunId;
  const metrics = deriveMetricsFromEvents(events);
  const timeline = deriveTimeline(events);
  const isDone = events.some((e) => e.type === "done");

  // Fetch server-side metrics when run completes
  useEffect(() => {
    if (isDone && effectiveRunId) {
      fetch(`/api/metrics/run?runId=${effectiveRunId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setServerMetrics(data);
        })
        .catch(() => {});
    }
  }, [isDone, effectiveRunId]);

  // Merge server metrics
  const totalTokens = serverMetrics?.totalTokens
    ? Number(serverMetrics.totalTokens)
    : metrics.totalTokens;
  const latencyMs = serverMetrics?.totalLatencyMs
    ? Number(serverMetrics.totalLatencyMs)
    : metrics.latencyMs;
  const stepCount = serverMetrics?.stepCount
    ? Number(serverMetrics.stepCount)
    : metrics.stepCount;

  return (
    <div className="border-t border-[#2a3441] bg-[#0b1118]">
      {/* Header */}
      <div className="px-4 py-2 flex items-center gap-2">
        <BarChart3 size={14} className="text-[#ffd60a]" />
        <span className="text-[12px] font-semibold text-[#d7dde5]">
          Run Metrics
        </span>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-2">
        <Card className="bg-[#0f141b] border-[#2a3441] p-2 text-center" style={{ borderRadius: 0 }}>
          <Hash size={10} className="mx-auto text-[#ffd60a] mb-1" />
          <div className="text-[13px] font-bold text-[#d7dde5]">{stepCount}</div>
          <div className="text-[8px] text-[#5b6b81] uppercase">Steps</div>
        </Card>
        <Card className="bg-[#0f141b] border-[#2a3441] p-2 text-center" style={{ borderRadius: 0 }}>
          <Zap size={10} className="mx-auto text-[#3B82F6] mb-1" />
          <div className="text-[13px] font-bold text-[#d7dde5]">
            {totalTokens > 1000
              ? `${(totalTokens / 1000).toFixed(1)}k`
              : totalTokens}
          </div>
          <div className="text-[8px] text-[#5b6b81] uppercase">Tokens</div>
        </Card>
        <Card className="bg-[#0f141b] border-[#2a3441] p-2 text-center" style={{ borderRadius: 0 }}>
          <Clock size={10} className="mx-auto text-[#22C55E] mb-1" />
          <div className="text-[13px] font-bold text-[#d7dde5]">
            {latencyMs > 1000
              ? `${(latencyMs / 1000).toFixed(1)}s`
              : `${latencyMs}ms`}
          </div>
          <div className="text-[8px] text-[#5b6b81] uppercase">Latency</div>
        </Card>
        <Card className="bg-[#0f141b] border-[#2a3441] p-2 text-center" style={{ borderRadius: 0 }}>
          <AlertCircle size={10} className="mx-auto text-[#EF4444] mb-1" />
          <div className="text-[13px] font-bold text-[#d7dde5]">
            {metrics.errors.length}
          </div>
          <div className="text-[8px] text-[#5b6b81] uppercase">Errors</div>
        </Card>
      </div>

      {/* Additional badges */}
      {(metrics.reflectionCount > 0 || metrics.policyChecks > 0) && (
        <div className="flex items-center gap-1.5 px-4 pb-2">
          {metrics.reflectionCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[8px] px-1.5 py-0 h-4 bg-[#F59E0B]/15 text-[#F59E0B] border-0"
              style={{ borderRadius: 0 }}
            >
              {metrics.reflectionCount} reflections
            </Badge>
          )}
          {metrics.policyChecks > 0 && (
            <Badge
              variant="secondary"
              className="text-[8px] px-1.5 py-0 h-4 bg-[#ffd60a]/15 text-[#ffd60a] border-0"
              style={{ borderRadius: 0 }}
            >
              {metrics.policyChecks} policy checks
            </Badge>
          )}
          {metrics.policyBlocked > 0 && (
            <Badge
              variant="secondary"
              className="text-[8px] px-1.5 py-0 h-4 bg-[#EF4444]/15 text-[#EF4444] border-0"
              style={{ borderRadius: 0 }}
            >
              {metrics.policyBlocked} blocked
            </Badge>
          )}
        </div>
      )}

      {/* Tool Usage */}
      {Object.keys(metrics.toolUsage).length > 0 && (
        <div className="px-4 pb-2">
          <span className="text-[9px] text-[#5b6b81] uppercase tracking-wider font-medium">
            Tool Usage
          </span>
          <div className="mt-1">
            <ToolUsageChart toolUsage={metrics.toolUsage} />
          </div>
        </div>
      )}

      {/* Error Summary */}
      {metrics.errors.length > 0 && (
        <div className="px-4 pb-2">
          <span className="text-[9px] text-[#5b6b81] uppercase tracking-wider font-medium">
            Errors
          </span>
          <div className="mt-1 space-y-0.5">
            {metrics.errors.map((err, i) => (
              <div
                key={i}
                className="text-[10px] text-[#EF4444] bg-[#EF4444]/5 p-1.5"
                style={{ borderRadius: 0 }}
              >
                <span className="font-mono text-[9px] text-[#5b6b81]">
                  Step {err.step}:
                </span>{" "}
                {err.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="px-4 pb-3">
          <span className="text-[9px] text-[#5b6b81] uppercase tracking-wider font-medium">
            Timeline
          </span>
          <div className="mt-1">
            <TimelineView timeline={timeline} />
          </div>
        </div>
      )}
    </div>
  );
}
