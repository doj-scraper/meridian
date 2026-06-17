'use client'

import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'
import type { FileItem } from '@/store/meridian-store'

const TYPE_COLORS: Record<string, string> = {
  folder: '#ffa500',
  file: '#5a6578',
  image: '#a855f7',
}

function FileIcon({ type }: { type: FileItem['type'] }) {
  const color = TYPE_COLORS[type]

  if (type === 'folder') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
        <circle cx="5" cy="5" r="3.5" fill="none" stroke={color} strokeWidth="1" />
        <circle cx="5" cy="5" r="1.5" fill={color} opacity="0.3" />
      </svg>
    )
  }

  if (type === 'image') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
        <polygon points="5,1 9,8 1,8" fill="none" stroke={color} strokeWidth="0.8" />
        <polygon points="5,2.5 7.5,7 2.5,7" fill={color} opacity="0.2" />
      </svg>
    )
  }

  // Default: file (square)
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
      <rect x="2" y="2" width="6" height="6" rx="0.5" fill="none" stroke={color} strokeWidth="0.8" />
      <rect x="3" y="3" width="4" height="4" rx="0.3" fill={color} opacity="0.15" />
    </svg>
  )
}

export function FileExplorerWidget() {
  const files = useMeridianStore((s) => s.files)

  // Sort: folders first, then by name
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1
    return a.name.localeCompare(b.name)
  })

  const folderCount = files.filter((f) => f.type === 'folder').length
  const imageCount = files.filter((f) => f.type === 'image').length

  return (
    <WidgetContainer id="file-explorer" title="FILES" onHoverInfo="Project file browser with type indicators">
      <div className="flex flex-col gap-1 h-full overflow-hidden">
        {/* File count summary */}
        <div className="flex items-center gap-2 px-0.5">
          <span className="text-[8px] tracking-[0.15em] font-bold" style={{ color: '#5a6578' }}>
            {files.length} ITEMS
          </span>
          {folderCount > 0 && (
            <span className="text-[7px]" style={{ color: '#ffa500' }}>
              {folderCount}DIR
            </span>
          )}
          {imageCount > 0 && (
            <span className="text-[7px]" style={{ color: '#a855f7' }}>
              {imageCount}IMG
            </span>
          )}
        </div>

        {/* File list */}
        <div className="flex flex-col gap-[1px] overflow-y-auto flex-1 min-h-0 max-h-52 pr-0.5" style={{ scrollbarWidth: 'none' }}>
          {sortedFiles.map((file, idx) => (
            <motion.div
              key={file.id}
              className="flex items-center gap-1.5 px-1 py-[3px] rounded cursor-pointer"
              style={{ background: 'transparent' }}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.15 }}
              whileHover={{
                background: 'rgba(168, 85, 247,0.06)',
              }}
            >
              <FileIcon type={file.type} />
              <span
                className="text-[9px] truncate flex-1 min-w-0"
                style={{ color: TYPE_COLORS[file.type] || '#c8d0dc' }}
              >
                {file.name}
              </span>
              <span
                className="text-[7px] shrink-0 tabular-nums"
                style={{ color: '#2a3441' }}
              >
                {file.size}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Path hint */}
        <div className="truncate px-0.5">
          <span className="text-[7px] tracking-[0.05em]" style={{ color: '#2a3441' }}>
            ROOT / PROJECT
          </span>
        </div>
      </div>
    </WidgetContainer>
  )
}
