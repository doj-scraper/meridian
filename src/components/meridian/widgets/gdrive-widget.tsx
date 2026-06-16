'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

interface GDriveState {
  connected: boolean
  lastSync: string
  documents: number
  shared: number
}

export function GDriveWidget() {
  const [gdrive, setGdrive] = useState<GDriveState>({
    connected: false,
    lastSync: 'Never',
    documents: 0,
    shared: 0,
  })

  const handleConnect = () => {
    setGdrive({
      connected: true,
      lastSync: 'Just now',
      documents: 24,
      shared: 7,
    })
  }

  return (
    <WidgetContainer
      id="gdrive"
      title="DRIVE"
      onHoverInfo="Google Drive integration - document sync and file sharing status"
    >
      <div className="flex flex-col h-full justify-between gap-2">
        {/* Status indicator */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
            STATUS
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-[5px] h-[5px] rounded-full"
              style={{
                background: gdrive.connected ? '#00ff88' : '#ffa500',
                boxShadow: gdrive.connected
                  ? '0 0 6px rgba(0,255,136,0.4)'
                  : '0 0 6px rgba(255,165,0,0.3)',
              }}
            />
            <span
              className="text-[9px] font-mono font-bold tracking-[0.1em]"
              style={{
                color: gdrive.connected ? '#00ff88' : '#ffa500',
              }}
            >
              {gdrive.connected ? 'CONNECTED' : 'NOT CONNECTED'}
            </span>
          </div>
        </div>

        {/* Integration details or connect prompt */}
        {gdrive.connected ? (
          <div className="flex flex-col gap-[6px]">
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
                DOCUMENTS
              </span>
              <span className="text-[10px] font-mono" style={{ color: '#c8d0dc' }}>
                {gdrive.documents}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
                SHARED
              </span>
              <span className="text-[10px] font-mono" style={{ color: '#c8d0dc' }}>
                {gdrive.shared}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
                LAST SYNC
              </span>
              <span className="text-[10px] font-mono" style={{ color: '#00b4dc' }}>
                {gdrive.lastSync}
              </span>
            </div>

            {/* Sync activity indicator */}
            <div
              className="flex items-center gap-1.5 mt-1 px-1.5 py-[3px] rounded"
              style={{ background: 'rgba(0,180,220,0.04)', border: '1px solid rgba(0,180,220,0.08)' }}
            >
              <motion.div
                className="w-[4px] h-[4px] rounded-full"
                style={{ background: '#00ff88' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-[8px] font-mono" style={{ color: '#5a6578' }}>
                SYNC ACTIVE
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 flex-1">
            {/* Drive icon - simple SVG */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              style={{ opacity: 0.4 }}
            >
              <path
                d="M7.5 3L1 15l3.5 6h13l3.5-6L14.5 3H7.5z"
                stroke="#5a6578"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M4.5 15l3-6h9l3 6"
                stroke="#5a6578"
                strokeWidth="0.8"
                fill="none"
              />
            </svg>

            <span className="text-[8px] font-mono text-center leading-[1.4]" style={{ color: '#3a4553' }}>
              Connect Google Drive to enable document sync and agent file access
            </span>

            <motion.button
              className="px-3 py-1 text-[9px] font-mono font-bold tracking-[0.15em] rounded border"
              style={{
                color: '#ffa500',
                borderColor: 'rgba(255,165,0,0.3)',
                background: 'rgba(255,165,0,0.06)',
              }}
              onClick={handleConnect}
              whileHover={{
                borderColor: 'rgba(255,165,0,0.6)',
                background: 'rgba(255,165,0,0.12)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              CONNECT
            </motion.button>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
}
