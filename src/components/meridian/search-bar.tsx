'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMeridianStore } from '@/store/meridian-store'

export function SearchBar() {
  const { searchQuery, setSearchQuery, chatOpen, setChatOpen, chatMessages, addChatMessage } = useMeridianStore()
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputValue.trim()) return

      addChatMessage({
        role: 'user',
        content: inputValue.trim(),
        timestamp: Date.now(),
      })

      // Simulate assistant response
      setTimeout(() => {
        addChatMessage({
          role: 'assistant',
          content: `Acknowledged. Processing query: "${inputValue.trim()}". The kernel spine is currently processing 3.2 events per second across 6 active agents. Recommend reviewing the Meta Agent evaluation panel for workflow alignment status.`,
          timestamp: Date.now(),
          agentName: 'SYNTHESIZER',
        })
      }, 800)

      setInputValue('')
    },
    [inputValue, addChatMessage]
  )

  return (
    <div
      className="flex items-center h-9 shrink-0 border-b px-3 gap-2"
      style={{
        background: 'rgba(6,9,14,0.95)',
        borderColor: 'rgba(0,180,220,0.12)',
      }}
    >
      {/* Search/Chat icon */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
        <circle cx="5.5" cy="5.5" r="4" stroke="#3a4553" strokeWidth="1.2" />
        <path d="M9 9L13 13" stroke="#3a4553" strokeWidth="1.2" />
      </svg>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-1">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search, ask, or interact with agents..."
          className="w-full bg-transparent text-[11px] tracking-[0.05em] outline-none placeholder:text-[#2a3441]"
          style={{ color: '#8a94a3' }}
          onFocus={() => setChatOpen(true)}
        />
      </form>

      {/* Quick status pills */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-0.5" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}>
          <div className="w-1 h-1" style={{ background: '#00ff88' }} />
          <span className="text-[9px] tracking-[0.1em]" style={{ color: '#00ff88' }}>6 ACTIVE</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5" style={{ background: 'rgba(0,180,220,0.06)', border: '1px solid rgba(0,180,220,0.15)' }}>
          <span className="text-[9px] tracking-[0.1em]" style={{ color: '#00b4dc' }}>14 AGENTS</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5" style={{ background: 'rgba(255,165,0,0.06)', border: '1px solid rgba(255,165,0,0.15)' }}>
          <span className="text-[9px] tracking-[0.1em]" style={{ color: '#ffa500' }}>3 WORKFLOWS</span>
        </div>
      </div>

      {/* Chat toggle */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="text-[9px] tracking-[0.1em] px-2 py-0.5 transition-colors"
        style={{
          color: chatOpen ? '#00b4dc' : '#3a4553',
          border: chatOpen ? '1px solid rgba(0,180,220,0.3)' : '1px solid rgba(0,180,220,0.1)',
          background: chatOpen ? 'rgba(0,180,220,0.06)' : 'transparent',
        }}
      >
        COMM
      </button>
    </div>
  )
}
