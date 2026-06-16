'use client'

import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

const AAR_DATA = {
  objective: 'Market Analysis Q2',
  outcome: 'COMPLETED' as const,
  efficiency: 94,
  costBudget: 100,
  costActual: 71.35,
  tasksCompleted: 42,
  tasksFailed: 2,
  avgLatencyMs: 310,
}

export function AARWidget() {
  const {
    objective,
    outcome,
    efficiency,
    costBudget,
    costActual,
    tasksCompleted,
    tasksFailed,
    avgLatencyMs,
  } = AAR_DATA

  const costPercent = (costActual / costBudget) * 100
  const underBudget = costActual < costBudget
  const taskSuccessRate = (tasksCompleted / (tasksCompleted + tasksFailed)) * 100

  const efficiencyColor =
    efficiency > 90 ? '#00ff88' : efficiency > 70 ? '#ffa500' : '#ff3344'

  return (
    <WidgetContainer
      id="aar"
      title="AAR"
      onHoverInfo="After Action Report - execution summary and performance metrics"
    >
      <div className="flex flex-col h-full justify-between gap-[6px]">
        {/* Objective & Outcome */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-[1px] min-w-0 flex-1">
            <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
              OBJECTIVE
            </span>
            <span
              className="text-[10px] font-mono truncate"
              style={{ color: '#c8d0dc' }}
            >
              {objective}
            </span>
          </div>
          <motion.span
            className="text-[9px] font-mono font-bold tracking-[0.1em] px-1.5 py-[1px] rounded shrink-0"
            style={{
              color: '#00ff88',
              background: 'rgba(0,255,136,0.08)',
              border: '1px solid rgba(0,255,136,0.2)',
            }}
            whileHover={{ scale: 1.05 }}
          >
            {outcome}
          </motion.span>
        </div>

        {/* Efficiency bar */}
        <div className="flex flex-col gap-[3px]">
          <div className="flex items-baseline justify-between">
            <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
              EFFICIENCY
            </span>
            <span className="text-[10px] font-mono font-bold" style={{ color: efficiencyColor }}>
              {efficiency}%
            </span>
          </div>
          <div
            className="w-full h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(42,52,65,0.6)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: efficiencyColor }}
              initial={{ width: 0 }}
              animate={{ width: `${efficiency}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Cost vs Budget */}
        <div className="flex flex-col gap-[3px]">
          <div className="flex items-baseline justify-between">
            <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
              COST / BUDGET
            </span>
            <span className="text-[10px] font-mono" style={{ color: underBudget ? '#00ff88' : '#ff3344' }}>
              ${costActual.toFixed(2)} / ${costBudget.toFixed(2)}
            </span>
          </div>
          <div
            className="w-full h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(42,52,65,0.6)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: underBudget ? '#00ff88' : '#ff3344' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(costPercent, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
        </div>

        {/* Task stats row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-center gap-[1px] flex-1">
            <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
              TASKS
            </span>
            <span className="text-[10px] font-mono" style={{ color: '#c8d0dc' }}>
              {tasksCompleted}
              <span style={{ color: '#5a6578' }}>/</span>
              <span style={{ color: '#ff3344' }}>{tasksFailed}</span>
            </span>
          </div>

          <div
            className="w-[1px] h-5"
            style={{ background: 'rgba(0,180,220,0.1)' }}
          />

          <div className="flex flex-col items-center gap-[1px] flex-1">
            <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
              SUCCESS
            </span>
            <span className="text-[10px] font-mono" style={{ color: '#00ff88' }}>
              {taskSuccessRate.toFixed(1)}%
            </span>
          </div>

          <div
            className="w-[1px] h-5"
            style={{ background: 'rgba(0,180,220,0.1)' }}
          />

          <div className="flex flex-col items-center gap-[1px] flex-1">
            <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
              LATENCY
            </span>
            <span className="text-[10px] font-mono" style={{ color: '#c8d0dc' }}>
              {avgLatencyMs}ms
            </span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
}
