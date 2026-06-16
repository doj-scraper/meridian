'use client'

import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

interface Agent {
  name: string
  role: string
  status: 'active' | 'idle' | 'error'
  model: string
}

const SEED_AGENTS: Agent[] = [
  { name: 'ATLAS', role: 'researcher', status: 'active', model: 'gpt-4o' },
  { name: 'SCRIBE', role: 'writer', status: 'active', model: 'claude-3.5' },
  { name: 'FORGE', role: 'coder', status: 'active', model: 'gpt-4o' },
  { name: 'PRISM', role: 'analyst', status: 'active', model: 'claude-3.5' },
  { name: 'GAUGE', role: 'evaluator', status: 'active', model: 'gpt-4o' },
  { name: 'EDGE', role: 'challenger', status: 'active', model: 'o1' },
  { name: 'WEAVE', role: 'synthesizer', status: 'idle', model: 'claude-3.5' },
  { name: 'BEACON', role: 'monitor', status: 'error', model: 'gpt-4o' },
]

const STATUS_COLORS: Record<Agent['status'], string> = {
  active: '#00ff88',
  idle: '#5a6578',
  error: '#ff3344',
}

export function AgentsWidget() {
  const activeCount = SEED_AGENTS.filter((a) => a.status === 'active').length

  return (
    <WidgetContainer
      id="agents"
      title="AGENTS"
      onHoverInfo="Active agent roster - status and role assignments for the current session"
    >
      <div className="flex flex-col h-full">
        {/* Summary */}
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span
            className="text-[9px] tracking-[0.2em] font-bold"
            style={{ color: '#5a6578' }}
          >
            {SEED_AGENTS.length} AGENTS
          </span>
          <span
            className="text-[9px] tracking-[0.1em]"
            style={{ color: '#00ff88' }}
          >
            {activeCount} ACTIVE
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-1.5"
          style={{ background: 'rgba(0,180,220,0.1)' }}
        />

        {/* Agent list */}
        <div className="flex-1 overflow-y-auto max-h-48 space-y-0.5 pr-0.5 scrollbar-thin">
          {SEED_AGENTS.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="flex items-center gap-2 px-1 py-0.5 rounded-sm group cursor-pointer"
              style={{ background: 'transparent' }}
              whileHover={{ background: 'rgba(0,180,220,0.04)' }}
            >
              {/* Status dot */}
              <div className="relative flex items-center justify-center shrink-0">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: STATUS_COLORS[agent.status],
                    boxShadow:
                      agent.status === 'active'
                        ? `0 0 4px ${STATUS_COLORS[agent.status]}`
                        : agent.status === 'error'
                          ? `0 0 4px ${STATUS_COLORS[agent.status]}`
                          : 'none',
                  }}
                />
              </div>

              {/* Agent name */}
              <span
                className="text-[10px] font-mono tracking-[0.1em] shrink-0"
                style={{ color: '#c8d0dc' }}
              >
                {agent.name}
              </span>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Role label */}
              <span
                className="text-[9px] tracking-[0.15em] uppercase"
                style={{ color: '#3a4553' }}
              >
                {agent.role}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  )
}
