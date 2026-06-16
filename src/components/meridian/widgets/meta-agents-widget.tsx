'use client'

import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'
import type { MetaAgent } from '@/store/meridian-store'

const ROLE_COLORS: Record<string, string> = {
  evaluator: '#00b4dc',
  challenger: '#ff6b35',
  synthesizer: '#00ff88',
}

const STATUS_COLORS: Record<string, string> = {
  active: '#00ff88',
  idle: '#5a6578',
  debating: '#ffa500',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'ACTIVE',
  idle: 'IDLE',
  debating: 'DEBATE',
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '\u2026'
}

function AlignmentBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(0,180,220,0.08)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}60, ${color})`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}

function RoleIcon({ role }: { role: MetaAgent['role'] }) {
  const color = ROLE_COLORS[role]

  if (role === 'evaluator') {
    // Diamond shape
    return (
      <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
        <polygon points="4,0.5 7.5,4 4,7.5 0.5,4" fill="none" stroke={color} strokeWidth="0.8" />
      </svg>
    )
  }

  if (role === 'challenger') {
    // Triangle
    return (
      <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
        <polygon points="4,0.5 7.5,7.5 0.5,7.5" fill="none" stroke={color} strokeWidth="0.8" />
      </svg>
    )
  }

  // Synthesizer: hexagon-ish circle
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
      <circle cx="4" cy="4" r="3" fill="none" stroke={color} strokeWidth="0.8" />
      <circle cx="4" cy="4" r="1" fill={color} opacity="0.4" />
    </svg>
  )
}

export function MetaAgentsWidget() {
  const metaAgents = useMeridianStore((s) => s.metaAgents)

  const avgAlignment =
    metaAgents.length > 0
      ? Math.round(metaAgents.reduce((sum, a) => sum + a.alignment, 0) / metaAgents.length)
      : 0

  const activeCount = metaAgents.filter((a) => a.status === 'active').length
  const debatingCount = metaAgents.filter((a) => a.status === 'debating').length

  return (
    <WidgetContainer id="meta-agents" title="META AGENTS" onHoverInfo="Human-in-the-loop: meta agent evaluation and alignment">
      <div className="flex flex-col gap-1.5 h-full overflow-hidden">
        {/* Summary bar */}
        <div className="flex items-center gap-2 px-0.5">
          <span className="text-[8px] tracking-[0.15em] font-bold" style={{ color: '#5a6578' }}>
            CONSENSUS
          </span>
          <span className="text-[9px] font-bold tabular-nums" style={{ color: avgAlignment >= 80 ? '#00ff88' : avgAlignment >= 50 ? '#ffa500' : '#ff3344' }}>
            {avgAlignment}%
          </span>
          {activeCount > 0 && (
            <span className="text-[7px]" style={{ color: '#00ff88' }}>
              {activeCount}ACT
            </span>
          )}
          {debatingCount > 0 && (
            <span className="text-[7px]" style={{ color: '#ffa500' }}>
              {debatingCount}DEB
            </span>
          )}
        </div>

        {/* Agent cards */}
        <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 max-h-52 pr-0.5" style={{ scrollbarWidth: 'none' }}>
          {metaAgents.map((agent, idx) => {
            const roleColor = ROLE_COLORS[agent.role]
            const statusColor = STATUS_COLORS[agent.status]

            return (
              <motion.div
                key={agent.id}
                className="flex flex-col gap-1 px-1.5 py-1 rounded"
                style={{
                  background: 'rgba(0,180,220,0.03)',
                  borderLeft: `2px solid ${roleColor}`,
                }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.2 }}
                whileHover={{ background: 'rgba(0,180,220,0.06)' }}
              >
                {/* Agent header */}
                <div className="flex items-center gap-1.5">
                  <RoleIcon role={agent.role} />
                  <span className="text-[9px] font-bold truncate" style={{ color: '#c8d0dc' }}>
                    {agent.name}
                  </span>
                  <span
                    className="text-[7px] tracking-[0.12em] font-bold ml-auto shrink-0 px-1 py-[1px] rounded-sm"
                    style={{
                      color: statusColor,
                      background: `${statusColor}12`,
                      border: `1px solid ${statusColor}25`,
                    }}
                  >
                    {STATUS_LABELS[agent.status] || agent.status.toUpperCase()}
                  </span>
                </div>

                {/* Role label */}
                <span className="text-[7px] tracking-[0.1em] uppercase pl-4" style={{ color: roleColor }}>
                  {agent.role}
                </span>

                {/* Alignment bar + value */}
                <div className="flex items-center gap-1.5 pl-4">
                  <div className="flex-1">
                    <AlignmentBar value={agent.alignment} color={roleColor} />
                  </div>
                  <span className="text-[8px] font-bold tabular-nums shrink-0 w-6 text-right" style={{ color: roleColor }}>
                    {agent.alignment}%
                  </span>
                </div>

                {/* Last opinion */}
                <div className="pl-4 truncate">
                  <span className="text-[8px] leading-tight" style={{ color: '#5a6578' }}>
                    {truncateText(agent.lastOpinion, 60)}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* HITL indicator */}
        <div className="flex items-center gap-1 px-0.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ffa500' }} />
          <span className="text-[7px] tracking-[0.12em] font-bold" style={{ color: '#ffa500' }}>
            HUMAN REVIEW AVAILABLE
          </span>
        </div>
      </div>
    </WidgetContainer>
  )
}
