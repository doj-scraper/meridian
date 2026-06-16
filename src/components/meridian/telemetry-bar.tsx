'use client'

import { useEffect, useRef } from 'react'
import { useMeridianStore } from '@/store/meridian-store'

export function TelemetryBar() {
  const { telemetryEntries, telemetryPaused, setTelemetryPaused, addTelemetryEntry } = useMeridianStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !telemetryPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [telemetryEntries, telemetryPaused])

  // Periodically add simulated telemetry
  useEffect(() => {
    const messages = [
      { level: 'info' as const, source: 'kernel', message: 'Kernel spine heartbeat. All reducers nominal.' },
      { level: 'event' as const, source: 'frontier', message: 'Frontier recomputed. 2 events pending execution.' },
      { level: 'info' as const, source: 'provider-openai', message: 'GPT-4o batch inference: 2,103 tokens. Latency: 380ms.' },
      { level: 'event' as const, source: 'reducer', message: 'State transition: AGENT_PROPOSAL accepted. Causal link created.' },
      { level: 'info' as const, source: 'meta-evaluator', message: 'Workflow alignment check: 94% focus maintained.' },
      { level: 'warn' as const, source: 'network', message: 'Peer gcp-west-c2: connection timeout. Retry in 30s.' },
      { level: 'info' as const, source: 'memory', message: 'Long-term memory compaction: 847 entries processed. 23 consolidated.' },
      { level: 'event' as const, source: 'agent-3', message: 'Agent researcher-01 completed task "Trend identification". Emitting RESULT event.' },
    ]

    const interval = setInterval(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)]
      addTelemetryEntry({
        timestamp: Date.now(),
        ...msg,
      })
    }, 5000 + Math.random() * 4000)

    return () => clearInterval(interval)
  }, [addTelemetryEntry])

  const levelColors: Record<string, string> = {
    info: '#5a6578',
    warn: '#ffa500',
    error: '#ff3344',
    event: '#00b4dc',
  }

  return (
    <div
      className="flex items-stretch h-7 shrink-0 border-t"
      style={{
        background: 'rgba(4,6,10,0.95)',
        borderColor: 'rgba(0,180,220,0.1)',
      }}
    >
      {/* Label */}
      <div className="flex items-center px-2 border-r shrink-0" style={{ borderColor: 'rgba(0,180,220,0.1)' }}>
        <div
          className="w-1.5 h-1.5 mr-1.5"
          style={{
            background: telemetryPaused ? '#ffa500' : '#00ff88',
            boxShadow: telemetryPaused ? '0 0 3px #ffa500' : '0 0 3px #00ff88',
          }}
        />
        <span className="text-[8px] tracking-[0.2em] font-bold" style={{ color: '#3a4553' }}>
          TELEMETRY
        </span>
      </div>

      {/* Scrolling entries */}
      <div ref={scrollRef} className="flex-1 overflow-hidden flex items-center">
        <div className="flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap px-2">
          {telemetryEntries.slice(-8).map((entry) => (
            <span key={entry.id} className="inline-flex items-center gap-1.5 mr-4">
              <span className="text-[9px] font-mono" style={{ color: '#2a3441' }}>
                {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </span>
              <span className="text-[9px] font-mono" style={{ color: levelColors[entry.level] || '#5a6578' }}>
                [{entry.source.toUpperCase()}]
              </span>
              <span className="text-[9px] font-mono" style={{ color: '#5a6578' }}>
                {entry.message}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Pause control */}
      <button
        onClick={() => setTelemetryPaused(!telemetryPaused)}
        className="flex items-center px-2 border-l shrink-0 transition-colors"
        style={{ borderColor: 'rgba(0,180,220,0.1)' }}
      >
        <span className="text-[8px] tracking-[0.1em]" style={{ color: telemetryPaused ? '#ffa500' : '#3a4553' }}>
          {telemetryPaused ? 'PAUSED' : 'LIVE'}
        </span>
      </button>

      {/* About Section - Blue Tree Logo */}
      <div className="flex items-center px-2 border-l shrink-0" style={{ borderColor: 'rgba(57, 255, 20, 0.1)' }} title="Blue Tree Organization">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="16" height="16" role="img" aria-label="Blue Tree">
          <rect x="56" y="64" width="8" height="28" rx="2" fill="#7a5a3b"/>
          <circle cx="60" cy="40" r="24" fill="#60a5fa" opacity="0.95"/>
          <circle cx="42" cy="52" r="18" fill="#7dd3fc" opacity="0.95"/>
          <circle cx="78" cy="52" r="18" fill="#38bdf8" opacity="0.95"/>
          <circle cx="60" cy="28" r="3.4" fill="white" opacity="0.9"/>
          <circle cx="48" cy="54" r="2.6" fill="white" opacity="0.85"/>
          <circle cx="72" cy="54" r="2.6" fill="white" opacity="0.85"/>
        </svg>
      </div>
    </div>
  )
}
