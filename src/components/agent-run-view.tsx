'use client'

import { useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Square,
  Brain,
  Cog,
  FileText,
  AlertCircle,
  CheckCircle2,
  Search,
  PenTool,
  Code2,
  Globe,
  Flag,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAgentStore } from '@/store/agent-store'
import type { AgentEvent } from '@/lib/agent/types'
import ReactMarkdown from 'react-markdown'
import { useState } from 'react'

const eventIcons: Record<string, React.ReactNode> = {
  thinking: <Brain className="h-4 w-4 text-purple-400" />,
  plan: <Cog className="h-4 w-4 text-blue-400" />,
  action: <Cog className="h-4 w-4 text-yellow-400" />,
  result: <FileText className="h-4 w-4 text-green-400" />,
  error: <AlertCircle className="h-4 w-4 text-red-400" />,
  status: <CheckCircle2 className="h-4 w-4 text-[#9CA3AF]" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-400" />,
}

const toolIcons: Record<string, React.ReactNode> = {
  search: <Search className="h-3.5 w-3.5" />,
  write: <PenTool className="h-3.5 w-3.5" />,
  code: <Code2 className="h-3.5 w-3.5" />,
  browser: <Globe className="h-3.5 w-3.5" />,
  finish: <Flag className="h-3.5 w-3.5" />,
}

function StepEvent({
  event,
  index,
}: {
  event: AgentEvent
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const isResult = event.type === 'result'
  const isError = event.type === 'error'
  const isPlan = event.type === 'plan'
  const isAction = event.type === 'action'
  const isThinking = event.type === 'thinking'
  const isDone = event.type === 'done'

  const hasDetails =
    event.data && (isPlan || isAction || isResult)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div
        className={`
          flex items-start gap-3 p-3 rounded-lg border transition-colors
          ${isError ? 'bg-red-500/5 border-red-500/20' : ''}
          ${isDone ? 'bg-green-500/5 border-green-500/20' : ''}
          ${isThinking ? 'bg-purple-500/5 border-purple-500/20' : ''}
          ${isPlan ? 'bg-blue-500/5 border-blue-500/20' : ''}
          ${isAction ? 'bg-yellow-500/5 border-yellow-500/20' : ''}
          ${isResult ? 'bg-green-500/5 border-green-500/20' : ''}
          ${!isError && !isDone && !isThinking && !isPlan && !isAction && !isResult ? 'bg-[#0B0F17] border-[#1F2937]' : ''}
        `}
      >
        {/* Step number / icon */}
        <div className="shrink-0 mt-0.5">
          {eventIcons[event.type] || eventIcons.status}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            {event.step !== undefined && (
              <Badge
                variant="outline"
                className="bg-[#111827] border-[#1F2937] text-[9px] text-[#9CA3AF] px-1.5"
              >
                Step {event.step + 1}
              </Badge>
            )}
            {event.data?.tool && (
              <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
                {toolIcons[event.data.tool as string]}
                <span className="capitalize">{event.data.tool as string}</span>
              </div>
            )}
            {hasDetails && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="ml-auto text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Message */}
          <p className="text-xs text-[#E5E7EB] mt-1 leading-relaxed">
            {event.message}
          </p>

          {/* Expandable details */}
          <AnimatePresence>
            {expanded && hasDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-2.5 rounded-md bg-[#0B0F17] border border-[#1F2937]">
                  {event.data?.input && (
                    <div className="mb-1.5">
                      <span className="text-[10px] text-[#6B7280] uppercase">
                        Input
                      </span>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                        {event.data.input as string}
                      </p>
                    </div>
                  )}
                  {event.data?.result && (
                    <div>
                      <span className="text-[10px] text-[#6B7280] uppercase">
                        Result
                      </span>
                      <div className="text-[11px] text-[#9CA3AF] mt-0.5 max-h-[200px] overflow-y-auto prose prose-invert prose-xs">
                        <ReactMarkdown>
                          {(event.data.result as string).slice(0, 2000)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export function AgentRunView() {
  const { events, currentRunId, runViewOpen, setRunViewOpen, stopRun, selectedAgent } =
    useAgentStore()

  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  const isRunning = events.length > 0 && !events.some((e) => e.type === 'done')

  // Calculate progress
  const maxSteps = selectedAgent?.maxSteps || 10
  const currentStep = useMemo(() => {
    const stepEvents = events.filter((e) => e.step !== undefined)
    if (stepEvents.length === 0) return 0
    return Math.max(...stepEvents.map((e) => (e.step || 0) + 1))
  }, [events])

  const progressPercent = Math.min((currentStep / maxSteps) * 100, 100)

  // Final result
  const doneEvent = events.find((e) => e.type === 'done')
  const lastResultEvent = [...events]
    .reverse()
    .find((e) => e.type === 'result')

  const finalResult = doneEvent?.message || lastResultEvent?.message || ''

  return (
    <AnimatePresence>
      {runViewOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-[#0B0F17]/95 backdrop-blur-sm flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1F2937] shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937]"
                onClick={() => setRunViewOpen(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h3 className="text-sm font-semibold text-[#E5E7EB]">
                  Agent Execution
                </h3>
                <p className="text-[11px] text-[#9CA3AF]">
                  {isRunning ? 'Running...' : doneEvent ? 'Completed' : 'Waiting...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isRunning && currentRunId && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => stopRun(currentRunId)}
                  className="text-xs"
                >
                  <Square className="h-3.5 w-3.5 mr-1.5" />
                  Stop
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937]"
                onClick={() => setRunViewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 py-3 border-b border-[#1F2937] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#9CA3AF]">
                Step {currentStep} of {maxSteps}
              </span>
              <span className="text-[11px] text-[#9CA3AF]">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-1.5 bg-[#1F2937] [&>div]:bg-[#7C3AED]"
            />
          </div>

          {/* Events Timeline */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-4 space-y-2 max-w-3xl mx-auto">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-[#7C3AED] animate-spin mb-3" />
                  <p className="text-sm text-[#9CA3AF]">
                    Waiting for agent to start...
                  </p>
                </div>
              ) : (
                events.map((event, index) => (
                  <StepEvent key={index} event={event} index={index} />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Final Result */}
          {doneEvent && finalResult && (
            <div className="border-t border-[#1F2937] p-4 shrink-0 bg-[#0F172A]">
              <div className="max-w-3xl mx-auto">
                <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                  Final Result
                </h4>
                <div className="p-3 rounded-lg bg-[#111827] border border-[#1F2937] text-sm text-[#E5E7EB] max-h-[200px] overflow-y-auto prose prose-invert prose-sm">
                  <ReactMarkdown>{finalResult}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
