'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMeridianStore, type GlobeZone } from '@/store/meridian-store'

export function GlobeModule() {
  const { globeItems, selectedGlobeZone, selectedGlobeItem, setGlobeSelection, addTelemetryEntry } = useMeridianStore()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const preItems = globeItems.filter((g) => g.zone === 'pre-action')
  const postItems = globeItems.filter((g) => g.zone === 'post-action')

  const handleItemClick = useCallback(
    (itemId: string, zone: GlobeZone) => {
      setGlobeSelection(zone, itemId)
      const item = globeItems.find((g) => g.id === itemId)
      if (item) {
        addTelemetryEntry({
          timestamp: Date.now(),
          level: 'event',
          source: 'globe',
          message: `Selected: ${item.label} (${zone}). ${item.description}`,
        })
      }
    },
    [globeItems, setGlobeSelection, addTelemetryEntry]
  )

  const statusColors: Record<string, string> = {
    active: '#00ff88',
    idle: '#5a6578',
    warning: '#ffa500',
    error: '#ff3344',
  }

  return (
    <div
      className="meridian-pane h-full flex flex-col relative"
      style={{ background: 'rgba(6,9,14,0.65)' }}
    >
      {/* Globe title */}
      <div className="flex items-center h-7 px-3 shrink-0 border-b" style={{ background: 'rgba(168, 85, 247,0.04)', borderColor: 'rgba(168, 85, 247,0.12)' }}>
        <span className="text-[9px] tracking-[0.2em] font-bold" style={{ color: '#5a6578' }}>
          OPERATIONAL SPHERE
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1" style={{ background: '#00ff88' }} />
            <span className="text-[8px]" style={{ color: '#3a4553' }}>PRE</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1" style={{ background: '#ffa500' }} />
            <span className="text-[8px]" style={{ color: '#3a4553' }}>POST</span>
          </div>
        </div>
      </div>

      {/* Globe content */}
      <div className="flex-1 flex items-stretch overflow-hidden relative">
        {/* Pre-action zone (left) */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-3 relative">
          <div className="absolute top-2 left-3">
            <span className="text-[8px] tracking-[0.3em] font-bold" style={{ color: 'rgba(168, 85, 247,0.4)' }}>
              PRE-ACTION
            </span>
          </div>

          {preItems.map((item, idx) => (
            <motion.button
              key={item.id}
              className="w-full flex items-center gap-2 px-2 py-1.5 transition-colors text-left"
              style={{
                background: selectedGlobeItem === item.id
                  ? 'rgba(168, 85, 247,0.08)'
                  : hoveredItem === item.id
                    ? 'rgba(168, 85, 247,0.04)'
                    : 'transparent',
                borderLeft: selectedGlobeItem === item.id
                  ? '2px solid #a855f7'
                  : '2px solid transparent',
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleItemClick(item.id, 'pre-action')}
              whileHover={{ x: 2 }}
              transition={{ duration: 0.15 }}
            >
              <div
                className="w-2 h-2 shrink-0"
                style={{
                  background: statusColors[item.status],
                  boxShadow: item.status === 'active' ? `0 0 4px ${statusColors[item.status]}` : 'none',
                }}
              />
              <span
                className="text-[10px] tracking-[0.1em] font-medium"
                style={{ color: selectedGlobeItem === item.id ? '#c8d0dc' : '#5a6578' }}
              >
                {item.label}
              </span>
              <span className="text-[8px] ml-auto" style={{ color: '#2a3441' }}>
                {item.category}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Line of Engagement (center) */}
        <div className="relative flex flex-col items-center justify-center" style={{ width: '3px' }}>
          <motion.div
            className="engagement-line absolute inset-y-0"
            style={{
              width: '2px',
              background: 'linear-gradient(180deg, transparent 0%, rgba(255,165,0,0.5) 15%, rgba(255,165,0,0.9) 50%, rgba(255,165,0,0.5) 85%, transparent 100%)',
              boxShadow: '0 0 12px rgba(255,165,0,0.4), 0 0 4px rgba(255,165,0,0.6)',
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Engagement label */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-[-90deg] whitespace-nowrap">
            <span className="text-[7px] tracking-[0.4em] font-bold" style={{ color: 'rgba(255,165,0,0.5)' }}>
              LINE OF ENGAGEMENT
            </span>
          </div>
        </div>

        {/* Post-action zone (right) */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-3 relative">
          <div className="absolute top-2 right-3">
            <span className="text-[8px] tracking-[0.3em] font-bold" style={{ color: 'rgba(255,165,0,0.4)' }}>
              POST-ACTION
            </span>
          </div>

          {postItems.map((item, idx) => (
            <motion.button
              key={item.id}
              className="w-full flex items-center gap-2 px-2 py-1.5 transition-colors text-left"
              style={{
                background: selectedGlobeItem === item.id
                  ? 'rgba(255,165,0,0.08)'
                  : hoveredItem === item.id
                    ? 'rgba(255,165,0,0.04)'
                    : 'transparent',
                borderRight: selectedGlobeItem === item.id
                  ? '2px solid #ffa500'
                  : '2px solid transparent',
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleItemClick(item.id, 'post-action')}
              whileHover={{ x: -2 }}
              transition={{ duration: 0.15 }}
            >
              <span className="text-[8px]" style={{ color: '#2a3441' }}>
                {item.category}
              </span>
              <span
                className="text-[10px] tracking-[0.1em] font-medium"
                style={{ color: selectedGlobeItem === item.id ? '#c8d0dc' : '#5a6578' }}
              >
                {item.label}
              </span>
              <div
                className="w-2 h-2 shrink-0 ml-auto"
                style={{
                  background: statusColors[item.status],
                  boxShadow: item.status === 'active' ? `0 0 4px ${statusColors[item.status]}` : 'none',
                }}
              />
            </motion.button>
          ))}
        </div>

        {/* Hover detail overlay */}
        <AnimatePresence>
          {hoveredItem && (() => {
            const item = globeItems.find((g) => g.id === hoveredItem)
            if (!item) return null
            return (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 border"
                style={{
                  background: 'rgba(8,13,20,0.95)',
                  borderColor: 'rgba(168, 85, 247,0.2)',
                  maxWidth: '80%',
                }}
              >
                <span className="text-[9px]" style={{ color: '#8a94a3' }}>{item.description}</span>
              </motion.div>
            )
          })()}
        </AnimatePresence>
      </div>

      {/* Globe footer - active items summary */}
      <div className="flex items-center h-6 px-3 border-t shrink-0" style={{ borderColor: 'rgba(168, 85, 247,0.1)' }}>
        <span className="text-[8px] tracking-[0.1em]" style={{ color: '#2a3441' }}>
          PRE: {preItems.filter((i) => i.status === 'active').length}/{preItems.length} active
        </span>
        <div className="mx-3 h-2 w-px" style={{ background: 'rgba(168, 85, 247,0.1)' }} />
        <span className="text-[8px] tracking-[0.1em]" style={{ color: '#2a3441' }}>
          POST: {postItems.filter((i) => i.status === 'active').length}/{postItems.length} active
        </span>
        <div className="mx-3 h-2 w-px" style={{ background: 'rgba(168, 85, 247,0.1)' }} />
        <span className="text-[8px] tracking-[0.1em]" style={{ color: '#3a4553' }}>
          {selectedGlobeItem ? globeItems.find((g) => g.id === selectedGlobeItem)?.label : 'NO SELECTION'}
        </span>
      </div>
    </div>
  )
}
