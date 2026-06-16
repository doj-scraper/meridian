'use client'

import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

interface MemorySegment {
  label: string
  entries: number
  sizeMb: number
  color: string
}

const MEMORY_SEGMENTS: MemorySegment[] = [
  { label: 'SHORT-TERM', entries: 847, sizeMb: 12.4, color: '#00b4dc' },
  { label: 'LONG-TERM', entries: 234, sizeMb: 3.8, color: '#ffa500' },
  { label: 'ARTIFACTS', entries: 42, sizeMb: 8.2, color: '#00ff88' },
]

const TOTAL_ENTRIES = MEMORY_SEGMENTS.reduce((sum, s) => sum + s.entries, 0)
const TOTAL_SIZE = MEMORY_SEGMENTS.reduce((sum, s) => sum + s.sizeMb, 0)
const MAX_SIZE = Math.max(...MEMORY_SEGMENTS.map((s) => s.sizeMb))

export function MemoryWidget() {
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
            style={{ color: '#00b4dc' }}
          >
            {TOTAL_SIZE}MB
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-1.5"
          style={{ background: 'rgba(0,180,220,0.1)' }}
        />

        {/* Memory segments */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
          {MEMORY_SEGMENTS.map((segment, i) => {
            const barPercent = (segment.sizeMb / MAX_SIZE) * 100
            return (
              <motion.div
                key={segment.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="px-1 py-0.5 rounded-sm cursor-pointer"
                whileHover={{ background: 'rgba(0,180,220,0.04)' }}
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
                  style={{ background: 'rgba(0,180,220,0.06)' }}
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
        <div className="mt-1.5 pt-1" style={{ borderTop: '1px solid rgba(0,180,220,0.1)' }}>
          <div className="flex items-center gap-1.5 px-1">
            {MEMORY_SEGMENTS.map((seg) => (
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
