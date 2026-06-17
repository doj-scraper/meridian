'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useAgentStore } from '@/store/agent-store'

interface MemorySegment {
  label: string
  entries: number
  sizeMb: number
  color: string
}

export function MemoryWidget() {
  const { agents } = useAgentStore()
  const [segments, setSegments] = useState<MemorySegment[]>([
    { label: 'SHORT-TERM', entries: 0, sizeMb: 0, color: '#a855f7' },
    { label: 'LONG-TERM', entries: 0, sizeMb: 0, color: '#ffa500' },
    { label: 'ARTIFACTS', entries: 0, sizeMb: 0, color: '#00ff88' },
  ])

  useEffect(() => {
    if (agents.length === 0) return

    const fetchMemory = async () => {
      try {
        const agentId = agents[0]?.id
        if (!agentId) return

        const [sessionRes, persistentRes, artifactRes] = await Promise.all([
          fetch(`/api/memory/list?agentId=${agentId}&tier=session`),
          fetch(`/api/memory/list?agentId=${agentId}&tier=persistent`),
          fetch(`/api/memory/list?agentId=${agentId}&tier=artifact`),
        ])

        const [sessionData, persistentData, artifactData] = await Promise.all([
          sessionRes.json(),
          persistentRes.json(),
          artifactRes.json(),
        ])

        const estimateSize = (entries: any[]) => {
          const totalBytes = entries.reduce((sum, e) => {
            const str = JSON.stringify(e.value || e.content || '')
            return sum + str.length
          }, 0)
          return parseFloat((totalBytes / 1024 / 1024).toFixed(2))
        }

        setSegments([
          {
            label: 'SHORT-TERM',
            entries: sessionData.entries?.length || 0,
            sizeMb: estimateSize(sessionData.entries || []),
            color: '#a855f7',
          },
          {
            label: 'LONG-TERM',
            entries: persistentData.entries?.length || 0,
            sizeMb: estimateSize(persistentData.entries || []),
            color: '#ffa500',
          },
          {
            label: 'ARTIFACTS',
            entries: artifactData.entries?.length || 0,
            sizeMb: estimateSize(artifactData.entries || []),
            color: '#00ff88',
          },
        ])
      } catch (err) {
        console.error('Failed to fetch memory:', err)
      }
    }

    fetchMemory()
  }, [agents])

  const TOTAL_ENTRIES = segments.reduce((sum, s) => sum + s.entries, 0)
  const TOTAL_SIZE = segments.reduce((sum, s) => sum + s.sizeMb, 0).toFixed(2)
  const MAX_SIZE = Math.max(...segments.map((s) => s.sizeMb), 1)

  return (
    <WidgetContainer
      id="memory"
      title="MEMORY"
      onHoverInfo="Memory utilization - short-term context, long-term storage, and artifact volumes"
    >
      <div className="flex flex-col h-full">
        {/* Summary */}
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span
            className="text-[9px] tracking-[0.2em] font-bold"
            style={{ color: '#5a6578' }}
          >
            {TOTAL_ENTRIES.toLocaleString()} ENTRIES
          </span>
          <span
            className="text-[9px] tracking-[0.1em]"
            style={{ color: '#a855f7' }}
          >
            {TOTAL_SIZE}MB
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-1.5"
          style={{ background: 'rgba(168, 85, 247,0.1)' }}
        />

        {/* Memory segments */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
          {segments.map((segment, i) => {
            const barPercent = (segment.sizeMb / MAX_SIZE) * 100
            return (
              <motion.div
                key={segment.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="px-1 py-0.5 rounded-sm cursor-pointer"
                whileHover={{ background: 'rgba(168, 85, 247,0.04)' }}
              >
                {/* Label row */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {/* Color indicator */}
                    <div
                      className="w-1.5 h-1.5 rounded-sm shrink-0"
                      style={{
                        background: segment.color,
                        boxShadow: `0 0 3px ${segment.color}40`,
                      }}
                    />
                    <span
                      className="text-[9px] tracking-[0.2em] font-bold"
                      style={{ color: '#5a6578' }}
                    >
                      {segment.label}
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-mono tracking-[0.05em]"
                    style={{ color: '#c8d0dc' }}
                  >
                    {segment.entries.toLocaleString()} / {segment.sizeMb}MB
                  </span>
                </div>

                {/* Bar visualization */}
                <div
                  className="h-1.5 w-full rounded-full overflow-hidden"
                  style={{ background: 'rgba(168, 85, 247,0.06)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: segment.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${barPercent}%` }}
                    transition={{ delay: i * 0.08 + 0.2, duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom summary bar */}
        <div className="mt-1.5 pt-1" style={{ borderTop: '1px solid rgba(168, 85, 247,0.1)' }}>
          <div className="flex items-center gap-1.5 px-1">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-0.5">
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ background: seg.color }}
                />
                <span
                  className="text-[8px] tracking-[0.1em]"
                  style={{ color: '#3a4553' }}
                >
                  {seg.sizeMb}MB
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
}
