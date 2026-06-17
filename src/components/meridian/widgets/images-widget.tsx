'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

// Placeholder gradient palettes for image tiles
const IMAGE_GRADIENTS = [
  'linear-gradient(135deg, #0a2838 0%, #0a4858 100%)',
  'linear-gradient(135deg, #0a3828 0%, #006048 100%)',
  'linear-gradient(135deg, #1a2030 0%, #0a3858 100%)',
  'linear-gradient(135deg, #0a2028 0%, #0a3838 100%)',
]

export function ImagesWidget() {
  const files = useMeridianStore((s) => s.files)

  const images = useMemo(() => files.filter((f) => f.type === 'image'), [files])

  if (images.length === 0) {
    return (
      <WidgetContainer id="images" title="MEDIA" onHoverInfo="Media gallery - image files from project">
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" style={{ color: '#2a3441' }}>
            <rect x="2" y="2" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
            <line x1="6" y1="2" x2="6" y2="18" stroke="currentColor" strokeWidth="0.5" />
            <line x1="14" y1="2" x2="14" y2="18" stroke="currentColor" strokeWidth="0.5" />
            <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="0.5" />
          </svg>
          <span className="text-[9px] tracking-[0.2em] font-bold" style={{ color: '#3a4553' }}>
            NO MEDIA
          </span>
        </div>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer id="images" title="MEDIA" onHoverInfo="Media gallery - image files from project">
      <div className="flex flex-col gap-1 h-full overflow-hidden">
        {/* Item count */}
        <div className="flex items-center gap-2 px-0.5">
          <span className="text-[8px] tracking-[0.15em] font-bold" style={{ color: '#5a6578' }}>
            {images.length} ITEMS
          </span>
          <span className="text-[7px]" style={{ color: '#a855f7' }}>
            IMAGE
          </span>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-1 flex-1 min-h-0">
          {images.slice(0, 4).map((image, idx) => (
            <motion.div
              key={image.id}
              className="relative rounded overflow-hidden flex flex-col items-center justify-center"
              style={{
                background: IMAGE_GRADIENTS[idx % IMAGE_GRADIENTS.length],
                border: '1px solid rgba(168, 85, 247,0.12)',
                minHeight: 0,
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.06, duration: 0.2 }}
              whileHover={{
                borderColor: 'rgba(168, 85, 247,0.4)',
                boxShadow: '0 0 6px rgba(168, 85, 247,0.1)',
              }}
            >
              {/* Placeholder icon */}
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ color: '#a855f7', opacity: 0.4 }}>
                <rect x="1" y="1" width="14" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="0.8" />
                <circle cx="5.5" cy="5.5" r="1.5" fill="currentColor" opacity="0.6" />
                <path d="M2 11l3-3 2 2 3-4 4 5H2z" fill="currentColor" opacity="0.3" />
              </svg>

              {/* File info overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5" style={{ background: 'rgba(8,13,20,0.8)' }}>
                <span className="text-[7px] truncate block leading-tight" style={{ color: '#c8d0dc' }}>
                  {image.name}
                </span>
                <span className="text-[6px] leading-tight" style={{ color: '#5a6578' }}>
                  {image.size}
                </span>
              </div>
            </motion.div>
          ))}

          {/* Fill empty grid cells if fewer than 4 images */}
          {Array.from({ length: Math.max(0, 4 - images.length) }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="rounded flex items-center justify-center"
              style={{
                background: 'rgba(168, 85, 247,0.02)',
                border: '1px dashed rgba(168, 85, 247,0.08)',
                minHeight: 0,
              }}
            >
              <span className="text-[7px]" style={{ color: '#2a3441' }}>
                EMPTY
              </span>
            </div>
          ))}
        </div>

        {/* Extra count indicator */}
        {images.length > 4 && (
          <div className="px-0.5">
            <span className="text-[7px]" style={{ color: '#5a6578' }}>
              +{images.length - 4} MORE
            </span>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
}
