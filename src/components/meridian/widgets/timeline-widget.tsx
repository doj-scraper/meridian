'use client'

import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

const LEVEL_COLORS: Record<string, string> = {
  info: '#5a6578',
  warn: '#ffa500',
  error: '#ff3344',
  event: '#00b4dc',
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function abbreviateSource(source: string): string {
  return source
    .split('-')
    .map((w) => w.slice(0, 3).toUpperCase())
    .join('-')
}

function truncateMessage(message: string, maxLen: number = 48): string {
  if (message.length <= maxLen) return message
  return message.slice(0, maxLen - 1) + '\u2026'
}

export function TimelineWidget() {
  const telemetryEntries = useMeridianStore((s) => s.telemetryEntries)
  const recentEntries = telemetryEntries.slice(-6)

  return (
    <WidgetContainer
      id="timeline"
      title="TIMELINE"
      onHoverInfo="Recent event timeline - system telemetry and agent activity log"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span
            className="text-[9px] tracking-[0.2em] font-bold"
            style={{ color: '#5a6578' }}
          >
            EVENTS
          </span>
          <span
            className="text-[9px] tracking-[0.1em]"
            style={{ color: '#3a4553' }}
          >
            LAST {recentEntries.length}
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-1"
          style={{ background: 'rgba(0,180,220,0.1)' }}
        />

        {/* Timeline entries */}
        <div className="flex-1 overflow-y-auto max-h-48 pr-0.5 scrollbar-thin">
          {recentEntries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              className="flex items-center gap-1.5 px-1 py-[3px] cursor-pointer group"
              whileHover={{ background: 'rgba(0,180,220,0.04)' }}
            >
              {/* Timeline spine */}
              <div className="flex flex-col items-center shrink-0">
                {/* Level dot */}
                <div
                  className="w-[5px] h-[5px] rounded-full shrink-0"
                  style={{
                    background: LEVEL_COLORS[entry.level] || '#5a6578',
                    boxShadow:
                      entry.level === 'error'
                        ? `0 0 4px ${LEVEL_COLORS[entry.level]}`
                        : entry.level === 'warn'
                          ? `0 0 3px ${LEVEL_COLORS[entry.level]}`
                          : 'none',
                  }}
                />
                {/* Connector line */}
                {i < recentEntries.length - 1 && (
                  <div
                    className="w-px flex-1 mt-0.5"
                    style={{
                      background: 'rgba(0,180,220,0.08)',
                      minHeight: '8px',
                    }}
                  />
                )}
              </div>

              {/* Timestamp */}
              <span
                className="text-[9px] font-mono tracking-[0.05em] shrink-0"
                style={{ color: '#2a3441' }}
              >
                {formatTime(entry.timestamp)}
              </span>

              {/* Source */}
              <span
                className="text-[9px] font-mono tracking-[0.05em] shrink-0"
                style={{ color: LEVEL_COLORS[entry.level] || '#5a6578' }}
              >
                [{abbreviateSource(entry.source)}]
              </span>

              {/* Message */}
              <span
                className="text-[9px] tracking-[0.02em] truncate"
                style={{ color: '#5a6578' }}
                title={entry.message}
              >
                {truncateMessage(entry.message)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  )
}
