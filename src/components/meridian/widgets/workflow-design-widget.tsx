'use client'

import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

const STATUS_COLORS: Record<string, string> = {
  complete: '#00ff88',
  active: '#00b4dc',
  pending: '#5a6578',
  blocked: '#ff3344',
  paused: '#ffa500',
  draft: '#5a6578',
  failed: '#ff3344',
}

function StatusDot({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#5a6578'
  return (
    <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0">
      <circle cx="3" cy="3" r="2.5" fill={color} />
    </svg>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#5a6578'
  return (
    <span
      className="text-[8px] tracking-[0.15em] font-bold px-1.5 py-0.5 rounded-sm"
      style={{
        color,
        background: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      {status.toUpperCase()}
    </span>
  )
}

export function WorkflowDesignWidget() {
  const { workflows, selectedWorkflowId } = useMeridianStore()
  const activeWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0]

  if (!activeWorkflow) {
    return (
      <WidgetContainer id="workflow-design" title="WORKFLOW" onHoverInfo="Active workflow phases and task hierarchy">
        <div className="flex items-center justify-center h-full">
          <span className="text-[9px] tracking-[0.15em]" style={{ color: '#5a6578' }}>
            NO WORKFLOW
          </span>
        </div>
      </WidgetContainer>
    )
  }

  const totalTasks = activeWorkflow.phases.reduce((sum, p) => sum + p.tasks.length, 0)
  const completedTasks = activeWorkflow.phases.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === 'complete').length,
    0
  )

  return (
    <WidgetContainer id="workflow-design" title="WORKFLOW" onHoverInfo="Active workflow phases and task hierarchy">
      <div className="flex flex-col gap-1.5 h-full overflow-hidden">
        {/* Workflow name + status */}
        <div className="flex items-center justify-between gap-1">
          <motion.span
            className="text-[10px] font-bold truncate"
            style={{ color: '#c8d0dc' }}
            whileHover={{ color: '#00b4dc' }}
          >
            {activeWorkflow.name}
          </motion.span>
          <StatusBadge status={activeWorkflow.status} />
        </div>

        {/* Hierarchy breadcrumb */}
        <div className="flex items-center gap-0.5" style={{ color: '#3a4553' }}>
          <span className="text-[8px] tracking-[0.1em]">OBJ</span>
          <svg width="6" height="6" viewBox="0 0 6 6"><path d="M1 3h4M4 1l2 2-2 2" stroke="currentColor" strokeWidth="0.8" fill="none" /></svg>
          <span className="text-[8px] tracking-[0.1em]">WF</span>
          <svg width="6" height="6" viewBox="0 0 6 6"><path d="M1 3h4M4 1l2 2-2 2" stroke="currentColor" strokeWidth="0.8" fill="none" /></svg>
          <span className="text-[8px] tracking-[0.1em]">TASKS</span>
          <svg width="6" height="6" viewBox="0 0 6 6"><path d="M1 3h4M4 1l2 2-2 2" stroke="currentColor" strokeWidth="0.8" fill="none" /></svg>
          <span className="text-[8px] tracking-[0.1em]">AGENTS</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,180,220,0.1)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: STATUS_COLORS[activeWorkflow.status] || '#5a6578' }}
            initial={{ width: 0 }}
            animate={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        {/* Task count summary */}
        <div className="flex items-center gap-2">
          <span className="text-[8px] tracking-[0.1em]" style={{ color: '#3a4553' }}>
            {completedTasks}/{totalTasks} TASKS
          </span>
          {activeWorkflow.roi !== undefined && (
            <span className="text-[8px] tracking-[0.1em]" style={{ color: '#00ff88' }}>
              ROI {activeWorkflow.roi}%
            </span>
          )}
          <span className="text-[8px] tracking-[0.1em] ml-auto" style={{ color: '#5a6578' }}>
            ${activeWorkflow.costIncurred.toFixed(2)}
          </span>
        </div>

        {/* Phases list */}
        <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0 max-h-48 pr-0.5" style={{ scrollbarWidth: 'none' }}>
          {activeWorkflow.phases.map((phase, idx) => {
            const completedInPhase = phase.tasks.filter((t) => t.status === 'complete').length
            const activeInPhase = phase.tasks.filter((t) => t.status === 'active').length

            return (
              <motion.div
                key={phase.id}
                className="flex flex-col gap-0.5 rounded px-1.5 py-1"
                style={{ background: 'rgba(0,180,220,0.03)', borderLeft: `2px solid ${STATUS_COLORS[phase.status] || '#5a6578'}` }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.2 }}
                whileHover={{ background: 'rgba(0,180,220,0.06)' }}
              >
                <div className="flex items-center gap-1.5">
                  <StatusDot status={phase.status} />
                  <span className="text-[9px] font-bold truncate" style={{ color: '#c8d0dc' }}>
                    {phase.name}
                  </span>
                  <span className="text-[8px] ml-auto shrink-0" style={{ color: '#5a6578' }}>
                    {phase.tasks.length}T
                  </span>
                </div>
                {/* Task indicators */}
                <div className="flex items-center gap-0.5 pl-3.5">
                  {phase.tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      className="w-1.5 h-1.5 rounded-sm"
                      style={{ background: STATUS_COLORS[task.status] || '#5a6578' }}
                      title={task.name}
                      whileHover={{ scale: 2.5 }}
                    />
                  ))}
                  {completedInPhase > 0 && (
                    <span className="text-[7px] ml-1" style={{ color: '#00ff88' }}>
                      {completedInPhase}OK
                    </span>
                  )}
                  {activeInPhase > 0 && (
                    <span className="text-[7px] ml-1" style={{ color: '#00b4dc' }}>
                      {activeInPhase}RUN
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Objective line */}
        <div className="truncate" style={{ color: '#3a4553' }}>
          <span className="text-[8px] tracking-[0.05em]">{activeWorkflow.objective}</span>
        </div>
      </div>
    </WidgetContainer>
  )
}
