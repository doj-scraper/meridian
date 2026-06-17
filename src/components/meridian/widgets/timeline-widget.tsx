'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'

const LEVEL_COLORS: Record<string, string> = {
  info: '#5a6578',
  warn: '#ffa500',
  error: '#ff3344',
  event: '#a855f7',
  run_start: '#00ff88',
  step_start: '#a855f7',
  llm_call: '#ffa500',
  tool_execution: '#a855f7',
  run_complete: '#00ff88',
}

interface TimelineEvent {
  id: string
  runId: string
  type: string
  timestamp: string
  durationMs?: number
  tokenCount?: number
  metadata?: string
  error?: string
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp)
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function truncateMessage(message: string, maxLen: number = 48): string {
  if (message.length <= maxLen) return message
  return message.slice(0, maxLen - 1) + '\u2026'
}

export function TimelineWidget() {
  const [events, setEvents] = useState<TimelineEvent[]>([])

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch('/api/timeline?limit=10')
        const data = await res.json()
        setEvents(data.events || [])
      } catch (err) {
        console.error('Failed to fetch timeline:', err)
      }
    }

    fetchTimeline()
    const interval = setInterval(fetchTimeline, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [])

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
            LAST {events.length}
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-1"
          style={{ background: 'rgba(168, 85, 247,0.1)' }}
        />

        {/* Timeline entries */}
        <div className="flex-1 overflow-y-auto max-h-48 pr-0.5 scrollbar-thin">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              className="flex items-center gap-1.5 px-1 py-[3px] cursor-pointer group"
              whileHover={{ background: 'rgba(168, 85, 247,0.04)' }}
            >
              {/* Timeline spine */}
              <div className="flex flex-col items-center shrink-0">
                {/* Level dot */}
                <div
                  className="w-[5px] h-[5px] rounded-full shrink-0"
                  style={{
                    background: LEVEL_COLORS[event.type] || '#5a6578',
                    boxShadow:
                      event.error
                        ? `0 0 4px #ff3344`
                        : event.type === 'run_start' || event.type === 'run_complete'
                          ? `0 0 3px ${LEVEL_COLORS[event.type]}`
                          : 'none',
                  }}
                />
                {/* Connector line */}
                {i < events.length - 1 && (
                  <div
                    className="w-px flex-1 mt-0.5"
                    style={{
                      background: 'rgba(168, 85, 247,0.08)',
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
                {formatTime(event.timestamp)}
              </span>

              {/* Type */}
              <span
                className="text-[9px] font-mono tracking-[0.05em] shrink-0 uppercase"
                style={{ color: LEVEL_COLORS[event.type] || '#5a6578' }}
              >
                [{event.type.replace('_', '-')}]
              </span>

              {/* Run ID (abbreviated) */}
              <span
                className="text-[9px] tracking-[0.02em] truncate"
                style={{ color: '#5a6578' }}
                title={event.runId}
              >
                {truncateMessage(event.runId, 24)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  )
}
