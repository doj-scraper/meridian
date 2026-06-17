'use client'

import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'
import type { ChatMessage } from '@/store/meridian-store'

const ROLE_COLORS: Record<string, string> = {
  user: '#a855f7',
  assistant: '#c8d0dc',
  system: '#3a4553',
}

const ROLE_LABELS: Record<string, string> = {
  user: 'USR',
  assistant: 'AGT',
  system: 'SYS',
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '\u2026'
}

function RoleIndicator({ role }: { role: ChatMessage['role'] }) {
  const color = ROLE_COLORS[role]

  if (role === 'user') {
    // Right-pointing arrow
    return (
      <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
        <path d="M1 4h5M5 2l2 2-2 2" stroke={color} strokeWidth="1" fill="none" />
      </svg>
    )
  }

  if (role === 'assistant') {
    // Left-pointing arrow
    return (
      <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
        <path d="M7 4H2M3 2L1 4l2 2" stroke={color} strokeWidth="1" fill="none" />
      </svg>
    )
  }

  // System: dot
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
      <circle cx="4" cy="4" r="2" fill={color} opacity="0.5" />
    </svg>
  )
}

export function ChatWidget() {
  const chatMessages = useMeridianStore((s) => s.chatMessages)
  const setChatOpen = useMeridianStore((s) => s.setChatOpen)

  // Show last 5 messages
  const recentMessages = chatMessages.slice(-5)

  const userCount = chatMessages.filter((m) => m.role === 'user').length
  const agentCount = chatMessages.filter((m) => m.role === 'assistant').length

  return (
    <WidgetContainer id="chat" title="COMM" onHoverInfo="Communication feed - messages and agent responses">
      <div className="flex flex-col gap-1 h-full overflow-hidden">
        {/* Message count summary */}
        <div className="flex items-center gap-2 px-0.5">
          <span className="text-[8px] tracking-[0.15em] font-bold" style={{ color: '#5a6578' }}>
            {chatMessages.length} MSGS
          </span>
          <span className="text-[7px]" style={{ color: '#a855f7' }}>
            {userCount}USR
          </span>
          <span className="text-[7px]" style={{ color: '#c8d0dc' }}>
            {agentCount}AGT
          </span>
        </div>

        {/* Message feed */}
        <div className="flex flex-col gap-[3px] overflow-y-auto flex-1 min-h-0 max-h-44 pr-0.5" style={{ scrollbarWidth: 'none' }}>
          {recentMessages.map((msg, idx) => {
            const roleColor = ROLE_COLORS[msg.role]

            return (
              <motion.div
                key={msg.id}
                className="flex gap-1.5 px-1 py-[2px] rounded"
                style={{
                  background: msg.role === 'system' ? 'rgba(58,69,83,0.08)' : 'transparent',
                  borderLeft: `1.5px solid ${roleColor}40`,
                }}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.15 }}
                whileHover={{ background: 'rgba(168, 85, 247,0.04)' }}
              >
                <RoleIndicator role={msg.role} />
                <div className="flex flex-col gap-0 min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span
                      className="text-[7px] tracking-[0.12em] font-bold shrink-0"
                      style={{ color: roleColor }}
                    >
                      {ROLE_LABELS[msg.role]}
                    </span>
                    {msg.role === 'assistant' && msg.agentName && (
                      <span
                        className="text-[7px] tracking-[0.08em] truncate"
                        style={{ color: '#5a6578' }}
                      >
                        {msg.agentName}
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] leading-tight" style={{ color: roleColor }}>
                    {truncateText(msg.content, 50)}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Open button */}
        <motion.button
          className="w-full h-5 rounded flex items-center justify-center gap-1.5"
          style={{
            background: 'rgba(168, 85, 247,0.08)',
            border: '1px solid rgba(168, 85, 247,0.2)',
          }}
          onClick={(e) => {
            e.stopPropagation()
            setChatOpen(true)
          }}
          whileHover={{
            background: 'rgba(168, 85, 247,0.15)',
            borderColor: 'rgba(168, 85, 247,0.4)',
          }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-[8px] tracking-[0.2em] font-bold" style={{ color: '#a855f7' }}>
            OPEN
          </span>
          <svg width="8" height="8" viewBox="0 0 8 8">
            <path d="M2 6l4-4M6 2v4H2" stroke="#a855f7" strokeWidth="0.8" fill="none" />
          </svg>
        </motion.button>
      </div>
    </WidgetContainer>
  )
}
