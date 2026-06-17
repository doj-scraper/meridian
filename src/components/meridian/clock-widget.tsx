'use client'

import { useState, useEffect } from 'react'
import { WidgetContainer } from './widget-container'

export function ClockWidget() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const seconds = time.getSeconds() + time.getMilliseconds() / 1000
  const minutes = time.getMinutes() + seconds / 60
  const hours = (time.getHours() % 12) + minutes / 60

  const secondAngle = seconds * 6
  const minuteAngle = minutes * 6
  const hourAngle = hours * 30

  const cx = 50
  const cy = 50
  const r = 44

  return (
    <WidgetContainer id="clock" title="CLOCK" onHoverInfo="System time - all timestamps reference this clock">
      <div className="flex flex-col items-center justify-center h-full">
        <svg viewBox="0 0 100 100" className="w-full max-w-[120px]" style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247,0.1))' }}>
          {/* Outer ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(168, 85, 247,0.2)"
            strokeWidth="0.8"
          />

          {/* Inner ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r - 3}
            fill="none"
            stroke="rgba(168, 85, 247,0.08)"
            strokeWidth="0.3"
          />

          {/* Hour markers */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180)
            const isMain = i % 3 === 0
            const outerR = r - 1
            const innerR = isMain ? r - 6 : r - 4
            return (
              <line
                key={i}
                x1={cx + Math.cos(angle) * innerR}
                y1={cy + Math.sin(angle) * innerR}
                x2={cx + Math.cos(angle) * outerR}
                y2={cy + Math.sin(angle) * outerR}
                stroke={isMain ? 'rgba(168, 85, 247,0.5)' : 'rgba(168, 85, 247,0.2)'}
                strokeWidth={isMain ? '1.2' : '0.6'}
              />
            )
          })}

          {/* Minute ticks */}
          {Array.from({ length: 60 }).map((_, i) => {
            if (i % 5 === 0) return null
            const angle = (i * 6 - 90) * (Math.PI / 180)
            const outerR = r - 1
            const innerR = r - 2
            return (
              <line
                key={`m-${i}`}
                x1={cx + Math.cos(angle) * innerR}
                y1={cy + Math.sin(angle) * innerR}
                x2={cx + Math.cos(angle) * outerR}
                y2={cy + Math.sin(angle) * outerR}
                stroke="rgba(168, 85, 247,0.1)"
                strokeWidth="0.3"
              />
            )
          })}

          {/* Hour hand */}
          <line
            x1={cx}
            y1={cy}
            x2={cx + Math.cos((hourAngle - 90) * (Math.PI / 180)) * 22}
            y2={cy + Math.sin((hourAngle - 90) * (Math.PI / 180)) * 22}
            stroke="rgba(200,208,220,0.8)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Minute hand */}
          <line
            x1={cx}
            y1={cy}
            x2={cx + Math.cos((minuteAngle - 90) * (Math.PI / 180)) * 32}
            y2={cy + Math.sin((minuteAngle - 90) * (Math.PI / 180)) * 32}
            stroke="rgba(200,208,220,0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Second hand */}
          <line
            x1={cx - Math.cos((secondAngle - 90) * (Math.PI / 180)) * 8}
            y1={cy - Math.sin((secondAngle - 90) * (Math.PI / 180)) * 8}
            x2={cx + Math.cos((secondAngle - 90) * (Math.PI / 180)) * 36}
            y2={cy + Math.sin((secondAngle - 90) * (Math.PI / 180)) * 36}
            stroke="#a855f7"
            strokeWidth="0.6"
            strokeLinecap="round"
          />

          {/* Center dot */}
          <circle cx={cx} cy={cy} r="2" fill="rgba(168, 85, 247,0.8)" />
          <circle cx={cx} cy={cy} r="1" fill="rgba(8,13,20,0.9)" />
        </svg>

        {/* Digital readout */}
        <div className="mt-1 text-center">
          <span className="text-[10px] font-mono tracking-[0.15em]" style={{ color: '#5a6578' }}>
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[8px] font-mono tracking-[0.1em]" style={{ color: '#2a3441' }}>
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
          </span>
        </div>
      </div>
    </WidgetContainer>
  )
}
