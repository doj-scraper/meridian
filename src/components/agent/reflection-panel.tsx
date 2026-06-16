"use client";

import { useAgentStore, type AgentEvent } from "@/store/agent-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { useState, useMemo } from "react";

type ReflectionIteration = {
  iteration: number;
  output?: string;
  critique?: string;
  status: "approved" | "rejected" | "in_progress";
};

/**
 * Parse reflection events from the event stream into iteration objects.
 */
function parseReflections(events: AgentEvent[]): {
  iterations: ReflectionIteration[];
  maxIterations: number;
} {
  const reflections = events.filter((e) => e.type === "reflection");
  if (reflections.length === 0) return { iterations: [], maxIterations: 0 };

  const iterations: ReflectionIteration[] = [];
  let maxIterations = 3;

  for (const event of reflections) {
    const data = event.data || {};
    const iteration = (data.iteration as number) ?? iterations.length + 1;
    const status = (data.status as string) ?? "in_progress";
    const output = (data.output as string) ?? event.message;

    // Extract critique from data if present
    const critique = (data.critique as string) ?? undefined;

    // Update max iterations from data
    if (data.maxIterations && typeof data.maxIterations === "number") {
      maxIterations = data.maxIterations;
    }

    // Check if this iteration already exists
    const existing = iterations.find((it) => it.iteration === iteration);
    if (existing) {
      // Update existing iteration with new data
      if (status === "approved" || status === "rejected") {
        existing.status = status;
      }
      if (critique) existing.critique = critique;
      if (output && !existing.output) existing.output = output;
    } else {
      iterations.push({
        iteration,
        output,
        critique,
        status: status === "approved" || status === "rejected" ? status : "in_progress",
      });
    }
  }

  return { iterations, maxIterations };
}

function IterationCard({ it, isLatest }: { it: ReflectionIteration; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(isLatest);

  const statusIcon = {
    approved: <CheckCircle size={14} className="text-[#22C55E]" />,
    rejected: <XCircle size={14} className="text-[#EF4444]" />,
    in_progress: <Loader2 size={14} className="animate-spin text-[#ffd60a]" />,
  };

  const statusColor = {
    approved: "#22C55E",
    rejected: "#EF4444",
    in_progress: "#ffd60a",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="bg-[#0f141b] border-[#2a3441] overflow-hidden"
        style={{ borderRadius: 0 }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-3 cursor-pointer hover:bg-[#0f141b] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusIcon[it.status]}
              <span className="text-[11px] font-medium text-[#d7dde5]">
                Iteration {it.iteration}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className="text-[8px] px-1.5 py-0 h-4 border-0"
                style={{
                  borderRadius: 0,
                  background: statusColor[it.status] + "20",
                  color: statusColor[it.status],
                }}
              >
                {it.status === "in_progress" ? "in progress" : it.status}
              </Badge>
              <ChevronDown
                size={12}
                className="text-[#475569] transition-transform"
                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2">
                {it.output && (
                  <div>
                    <span className="text-[9px] text-[#5b6b81] uppercase tracking-wider font-medium">
                      Output
                    </span>
                    <p className="text-[11px] text-[#8a94a3] mt-0.5 whitespace-pre-wrap break-words line-clamp-4">
                      {it.output}
                    </p>
                  </div>
                )}
                {it.critique && (
                  <div>
                    <span className="text-[9px] text-[#5b6b81] uppercase tracking-wider font-medium">
                      Critique
                    </span>
                    <p className="text-[11px] text-[#F59E0B] mt-0.5 whitespace-pre-wrap break-words line-clamp-3">
                      {it.critique}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export function ReflectionPanel() {
  const { events } = useAgentStore();
  const { iterations, maxIterations } = useMemo(
    () => parseReflections(events),
    [events]
  );

  if (iterations.length === 0) return null;

  const completedCount = iterations.filter(
    (it) => it.status === "approved" || it.status === "rejected"
  ).length;
  const approvedCount = iterations.filter((it) => it.status === "approved").length;

  return (
    <div className="border-t border-[#2a3441] bg-[#0b1118]">
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw size={14} className="text-[#ffd60a]" />
          <span className="text-[12px] font-semibold text-[#d7dde5]">
            Reflection
          </span>
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0 h-4 bg-[#ffd60a]/15 text-[#ffd60a] border-0"
            style={{ borderRadius: 0 }}
          >
            {completedCount}/{maxIterations} iterations
          </Badge>
        </div>
        {approvedCount > 0 && (
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0 h-4 bg-[#22C55E]/15 text-[#22C55E] border-0"
            style={{ borderRadius: 0 }}
          >
            Approved ✓
          </Badge>
        )}
      </div>

      {/* Progress dots */}
      <div className="px-4 pb-2 flex items-center gap-1.5">
        {Array.from({ length: maxIterations }, (_, i) => {
          const it = iterations.find((iter) => iter.iteration === i + 1);
          const dotColor = it
            ? it.status === "approved"
              ? "#22C55E"
              : it.status === "rejected"
                ? "#EF4444"
                : "#ffd60a"
            : "#2a3441";
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 transition-colors"
                style={{
                  background: dotColor,
                  borderRadius: 0,
                  boxShadow:
                    it?.status === "in_progress"
                      ? `0 0 6px ${dotColor}60`
                      : undefined,
                }}
              />
              {i < maxIterations - 1 && (
                <div
                  className="w-6 h-[1px]"
                  style={{
                    background:
                      it?.status === "approved" || it?.status === "rejected"
                        ? "#3a4553"
                        : "#2a3441",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Iteration cards */}
      <ScrollArea className="max-h-48 px-4 pb-3">
        <div className="space-y-1.5">
          {iterations.map((it, i) => (
            <IterationCard
              key={it.iteration}
              it={it}
              isLatest={i === iterations.length - 1}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
