'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMeridianStore, type ViewMode } from '@/store/meridian-store'

interface WidgetContainerProps {
  id: string
  title: string
  children: React.ReactNode
  className?: string
  onHoverInfo?: string
}

export function WidgetContainer({ id, title, children, className = '', onHoverInfo }: WidgetContainerProps) {
  const { widgets, setWidgetViewMode, setWidgetHovered, setActiveWidget, addTelemetryEntry } = useMeridianStore()
  const widget = widgets[id]
  const viewMode = widget?.viewMode || 'container'
  const isHovered = widget?.isHovered || false
  const isActive = useMeridianStore((s) => s.activeWidgetId === id)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback(() => {
    setWidgetHovered(id, true)
    if (onHoverInfo) {
      addTelemetryEntry({
        timestamp: Date.now(),
        level: 'info',
        source: 'ui',
        message: `${title}: ${onHoverInfo}`,
      })
    }
  }, [id, title, onHoverInfo, setWidgetHovered, addTelemetryEntry])

  const handleMouseLeave = useCallback(() => {
    setWidgetHovered(id, false)
  }, [id, setWidgetHovered])

  const handleClick = useCallback(() => {
    setActiveWidget(id)
  }, [id, setActiveWidget])

  const cycleViewMode = useCallback(() => {
    const modes: ViewMode[] = ['container', 'expanded', 'floating', 'fullscreen']
    const currentIdx = modes.indexOf(viewMode)
    const nextMode = modes[(currentIdx + 1) % modes.length]
    setWidgetViewMode(id, nextMode)
  }, [id, viewMode, setWidgetViewMode])

  const handleExpand = useCallback(() => setWidgetViewMode(id, 'expanded'), [id, setWidgetViewMode])
  const handleFloat = useCallback(() => setWidgetViewMode(id, 'floating'), [id, setWidgetViewMode])
  const handleFullscreen = useCallback(() => setWidgetViewMode(id, 'fullscreen'), [id, setWidgetViewMode])
  const handleMinimize = useCallback(() => setWidgetViewMode(id, 'container'), [id, setWidgetViewMode])

  // Dragging for floating mode
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (viewMode !== 'floating') return
    setIsDragging(true)
    dragStart.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }

    const handleDragMove = (e: MouseEvent) => {
      setDragOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      })
    }
    const handleDragEnd = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
    }
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
  }, [viewMode, dragOffset])

  // Render based on view mode
  if (viewMode === 'fullscreen') {
    return (
      <AnimatePresence>
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(3,5,8,0.98)', border: '1px solid rgba(0,180,220,0.4)' }}
          onClick={handleClick}
        >
          {/* Title bar */}
          <div
            className="flex items-center justify-between h-8 px-3 border-b"
            style={{ background: 'rgba(0,180,220,0.06)', borderColor: 'rgba(0,180,220,0.15)' }}
          >
            <span className="text-[10px] tracking-[0.2em] font-bold" style={{ color: '#5a6578' }}>
              {title}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={handleMinimize} className="text-[#5a6578] hover:text-[#00b4dc] transition-colors text-xs px-1">
                MINIMIZE
              </button>
              <button onClick={handleFloat} className="text-[#5a6578] hover:text-[#00b4dc] transition-colors text-xs px-1">
                FLOAT
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4" style={{ height: 'calc(100vh - 32px)' }}>
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  if (viewMode === 'floating') {
    return (
      <AnimatePresence>
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed z-40"
          style={{
            left: dragOffset.x || 100,
            top: dragOffset.y || 100,
            width: 420,
            height: 340,
            background: 'rgba(8,13,20,0.96)',
            border: isActive ? '1px solid rgba(0,180,220,0.6)' : '1px solid rgba(0,180,220,0.3)',
            boxShadow: isActive ? '0 0 12px rgba(0,180,220,0.15)' : '0 0 6px rgba(0,0,0,0.5)',
          }}
          onClick={handleClick}
        >
          {/* Draggable title bar */}
          <div
            className="flex items-center justify-between h-7 px-3 cursor-move border-b"
            style={{ background: 'rgba(0,180,220,0.06)', borderColor: 'rgba(0,180,220,0.15)' }}
            onMouseDown={handleDragStart}
          >
            <span className="text-[10px] tracking-[0.2em] font-bold" style={{ color: '#5a6578' }}>
              {title}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={handleMinimize} className="text-[#5a6578] hover:text-[#00b4dc] transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect y="9" width="12" height="2" fill="currentColor"/></svg>
              </button>
              <button onClick={handleFullscreen} className="text-[#5a6578] hover:text-[#00b4dc] transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
              </button>
              <button onClick={handleMinimize} className="text-[#5a6578] hover:text-[#ff3344] transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5"/></svg>
              </button>
            </div>
          </div>
          <div className="overflow-auto p-3" style={{ height: 'calc(100% - 28px)' }}>
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  if (viewMode === 'expanded') {
    return (
      <AnimatePresence>
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30"
          style={{
            background: 'rgba(8,13,20,0.96)',
            border: '1px solid rgba(0,180,220,0.35)',
          }}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center justify-between h-8 px-3 border-b" style={{ borderColor: 'rgba(0,180,220,0.15)' }}>
            <span className="text-[10px] tracking-[0.2em] font-bold" style={{ color: '#5a6578' }}>{title}</span>
            <div className="flex items-center gap-2">
              <button onClick={handleMinimize} className="text-[#5a6578] hover:text-[#00b4dc] transition-colors text-xs">
                MINIMIZE
              </button>
            </div>
          </div>
          <div className="overflow-auto p-4" style={{ height: 'calc(100% - 32px)' }}>
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Default: container mode (small widget in grid)
  return (
    <motion.div
      ref={containerRef}
      className={`meridian-pane ${isActive ? 'meridian-pane-active' : ''} flex flex-col ${className}`}
      style={{
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: isHovered ? '0 0 6px rgba(0,180,220,0.1)' : 'none',
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ borderColor: 'rgba(0,180,220,0.4)' }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between h-6 px-2 shrink-0" style={{ background: 'rgba(0,180,220,0.04)' }}>
        <span className="text-[9px] tracking-[0.2em] font-bold" style={{ color: '#5a6578' }}>
          {title}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleExpand() }}
            className="text-[#3a4553] hover:text-[#00b4dc] transition-colors"
            title="Expand"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1"/></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleFloat() }}
            className="text-[#3a4553] hover:text-[#00b4dc] transition-colors"
            title="Float"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="2" y="0" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none"/><rect x="0" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="rgba(8,13,20,0.9)"/></svg>
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden p-2">
        {children}
      </div>
    </motion.div>
  )
}
