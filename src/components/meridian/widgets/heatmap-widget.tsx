'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

const ROWS = ['Research', 'Analysis', 'Execution', 'Review', 'Deployment']
const COLS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getCellColor(value: number): string {
  if (value >= 1.0) return '#00ff88'
  if (value >= 0.75) return '#008070'
  if (value >= 0.5) return '#0a4858'
  if (value >= 0.25) return '#0a2838'
  return '#0a0f18'
}

function getCellGlow(value: number): string {
  if (value >= 0.75) return `0 0 3px ${getCellColor(value)}40`
  return 'none'
}

export function HeatmapWidget() {
  const heatmapData = useMeridianStore((s) => s.heatmapData)

  // Build a lookup map for fast cell access
  const cellMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const cell of heatmapData) {
      map.set(`${cell.row}:${cell.col}`, cell.value)
    }
    return map
  }, [heatmapData])

  // Compute summary stats
  const stats = useMemo(() => {
    const values = heatmapData.map((c) => c.value)
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    const highCount = values.filter((v) => v >= 0.75).length
    return { avg, max, highCount, total: values.length }
  }, [heatmapData])

  return (
    <WidgetContainer id="heatmap" title="HEATMAP" onHoverInfo="Activity density grid across workflow categories by day">
      <div className="flex flex-col gap-1 h-full overflow-hidden">
        {/* Column headers */}
        <div className="flex items-end gap-0 pl-[52px]">
          {COLS.map((col) => (
            <div
              key={col}
              className="flex-1 text-center"
              style={{ minWidth: 0 }}
            >
              <span className="text-[7px] tracking-[0.1em] font-bold" style={{ color: '#3a4553' }}>
                {col.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Grid rows */}
        <div className="flex flex-col gap-[2px] flex-1 min-h-0">
          {ROWS.map((row, rowIdx) => (
            <div key={row} className="flex items-center gap-0 flex-1 min-h-0">
              {/* Row label */}
              <div className="w-[50px] shrink-0 pr-1 text-right">
                <span
                  className="text-[7px] tracking-[0.08em] font-bold leading-none"
                  style={{ color: '#5a6578' }}
                >
                  {row.toUpperCase()}
                </span>
              </div>

              {/* Cells */}
              <div className="flex gap-[2px] flex-1 min-h-0">
                {COLS.map((col, colIdx) => {
                  const value = cellMap.get(`${row}:${col}`) ?? 0
                  const color = getCellColor(value)
                  const glow = getCellGlow(value)

                  return (
                    <motion.div
                      key={`${row}:${col}`}
                      className="flex-1 rounded-[2px] min-h-0"
                      style={{
                        background: color,
                        boxShadow: glow,
                        aspectRatio: '1',
                      }}
                      whileHover={{
                        scale: 1.3,
                        boxShadow: `0 0 6px ${color}80`,
                        zIndex: 10,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: rowIdx * 0.04 + colIdx * 0.02,
                        duration: 0.15,
                      }}
                      title={`${row} ${col}: ${(value * 100).toFixed(0)}%`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend + Stats */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1">
            {[
              { label: '0', color: '#0a0f18' },
              { label: '.25', color: '#0a2838' },
              { label: '.5', color: '#0a4858' },
              { label: '.75', color: '#008070' },
              { label: '1.0', color: '#00ff88' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-0.5">
                <div
                  className="w-[8px] h-[8px] rounded-[1px]"
                  style={{ background: item.color }}
                />
                <span className="text-[6px]" style={{ color: '#3a4553' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[7px]" style={{ color: '#3a4553' }}>
              AVG {(stats.avg * 100).toFixed(0)}%
            </span>
            <span className="text-[7px]" style={{ color: '#00ff88' }}>
              HI {stats.highCount}
            </span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
}
