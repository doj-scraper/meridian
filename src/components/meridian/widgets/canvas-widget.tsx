'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

interface CanvasResource {
  name: string
  type: 'file' | 'image'
}

const INITIAL_RESOURCES: CanvasResource[] = [
  { name: 'project-spec.md', type: 'file' },
  { name: 'architecture.png', type: 'image' },
  { name: 'market-data.csv', type: 'file' },
]

function ResourceIcon({ type }: { type: 'file' | 'image' }) {
  if (type === 'image') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <rect x="0.5" y="1" width="9" height="7" stroke="#a855f7" strokeWidth="0.8" fill="none" />
        <circle cx="3" cy="3.5" r="1" fill="#a855f7" opacity="0.5" />
        <path d="M1 7L3.5 4.5L5.5 6L7 4L9 7" stroke="#a855f7" strokeWidth="0.6" fill="none" />
      </svg>
    )
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 0.5H6L8.5 3V9.5H2V0.5z" stroke="#5a6578" strokeWidth="0.8" fill="none" />
      <path d="M6 0.5V3H8.5" stroke="#5a6578" strokeWidth="0.6" fill="none" />
    </svg>
  )
}

export function CanvasWidget() {
  const [resources, setResources] = useState<CanvasResource[]>(INITIAL_RESOURCES)

  const handleAddResource = () => {
    const newResource: CanvasResource = {
      name: `resource-${resources.length + 1}.txt`,
      type: 'file',
    }
    setResources((prev) => [...prev, newResource])
  }

  const handleRemoveResource = (index: number) => {
    setResources((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <WidgetContainer
      id="canvas"
      title="CANVAS"
      onHoverInfo="Workflow canvas - reference materials and resources for agent tasks"
    >
      <div className="flex flex-col h-full justify-between gap-2">
        {/* Resource count */}
        <div className="flex items-baseline justify-between">
          <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
            RESOURCES
          </span>
          <span className="text-[10px] font-mono font-bold" style={{ color: '#a855f7' }}>
            {resources.length}
          </span>
        </div>

        {/* Resource list */}
        <div className="flex flex-col gap-[3px] flex-1 overflow-y-auto max-h-20 pr-1 scrollbar-thin">
          <AnimatePresence initial={false}>
            {resources.map((res, i) => (
              <motion.div
                key={`${res.name}-${i}`}
                className="flex items-center gap-1.5 px-1.5 py-[3px] rounded group"
                style={{ background: 'rgba(168, 85, 247,0.03)', border: '1px solid rgba(168, 85, 247,0.06)' }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ borderColor: 'rgba(168, 85, 247,0.2)' }}
              >
                <ResourceIcon type={res.type} />
                <span
                  className="text-[9px] font-mono truncate flex-1"
                  style={{ color: '#c8d0dc' }}
                >
                  {res.name}
                </span>
                <motion.button
                  className="text-[7px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#ff3344' }}
                  onClick={() => handleRemoveResource(i)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  X
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add resource button */}
        <motion.button
          className="w-full py-1 text-[9px] font-mono font-bold tracking-[0.15em] rounded border flex items-center justify-center gap-1"
          style={{
            color: '#a855f7',
            borderColor: 'rgba(168, 85, 247,0.2)',
            background: 'rgba(168, 85, 247,0.04)',
          }}
          onClick={handleAddResource}
          whileHover={{
            borderColor: 'rgba(168, 85, 247,0.5)',
            background: 'rgba(168, 85, 247,0.1)',
          }}
          whileTap={{ scale: 0.97 }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M4 0V8M0 4H8" stroke="#a855f7" strokeWidth="1" />
          </svg>
          ADD RESOURCE
        </motion.button>
      </div>
    </WidgetContainer>
  )
}
