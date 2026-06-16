'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMeridianStore } from '@/store/meridian-store'

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function ChatPanel() {
  const chatMessages = useMeridianStore((s) => s.chatMessages)
  const addChatMessage = useMeridianStore((s) => s.addChatMessage)
  const chatOpen = useMeridianStore((s) => s.chatOpen)
  const setChatOpen = useMeridianStore((s) => s.setChatOpen)

  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Focus input when panel opens
  useEffect(() => {
    if (chatOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [chatOpen])

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    addChatMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    })
    setInputValue('')

    // Simulate assistant response
    setTimeout(() => {
      addChatMessage({
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: 'Acknowledged. Processing your request through the Meridian kernel spine.',
        timestamp: Date.now(),
        agentName: 'SYNTHESIZER',
      })
    }, 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.div
          className="fixed z-50 flex flex-col"
          style={{
            right: 16,
            bottom: 48,
            width: 340,
            height: 420,
            background: 'rgba(8,13,20,0.97)',
            border: '1px solid rgba(0,180,220,0.25)',
            boxShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 8px rgba(0,180,220,0.08)',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between h-7 px-3 shrink-0"
            style={{ background: 'rgba(0,180,220,0.06)', borderBottom: '1px solid rgba(0,180,220,0.15)' }}
          >
            <span className="text-[9px] font-mono font-bold tracking-[0.2em]" style={{ color: '#5a6578' }}>
              COMMUNICATIONS
            </span>
            <motion.button
              className="text-[9px] font-mono tracking-[0.1em] px-1.5 py-0.5 rounded"
              style={{ color: '#5a6578' }}
              onClick={() => setChatOpen(false)}
              whileHover={{ color: '#ff3344' }}
              whileTap={{ scale: 0.95 }}
            >
              CLOSE
            </motion.button>
          </div>

          {/* Messages area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 flex flex-col gap-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,180,220,0.15) transparent' }}
          >
            {chatMessages.map((msg) => (
              <motion.div
                key={msg.id}
                className="flex flex-col gap-[2px]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Role label */}
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[8px] font-mono font-bold tracking-[0.15em]"
                    style={{
                      color:
                        msg.role === 'user'
                          ? '#00b4dc'
                          : msg.role === 'assistant'
                            ? '#c8d0dc'
                            : '#3a4553',
                    }}
                  >
                    {msg.role.toUpperCase()}
                  </span>
                  {msg.role === 'assistant' && msg.agentName && (
                    <span
                      className="text-[7px] font-mono tracking-[0.1em] px-1 rounded"
                      style={{
                        color: '#00b4dc',
                        background: 'rgba(0,180,220,0.08)',
                        border: '1px solid rgba(0,180,220,0.12)',
                      }}
                    >
                      {msg.agentName}
                    </span>
                  )}
                  <span className="text-[7px] font-mono ml-auto" style={{ color: '#2a3441' }}>
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>

                {/* Message content */}
                <div
                  className="text-[10px] font-mono leading-[1.5] px-2 py-1.5 rounded"
                  style={
                    msg.role === 'user'
                      ? {
                          color: '#c8d0dc',
                          background: 'rgba(0,180,220,0.08)',
                          borderLeft: '2px solid rgba(0,180,220,0.4)',
                        }
                      : msg.role === 'assistant'
                        ? {
                            color: '#c8d0dc',
                            background: 'rgba(42,52,65,0.15)',
                            borderLeft: '2px solid rgba(90,101,120,0.3)',
                          }
                        : {
                            color: '#5a6578',
                            background: 'transparent',
                            fontStyle: 'italic',
                          }
                  }
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input area */}
          <div
            className="flex items-center gap-2 px-3 py-2 shrink-0"
            style={{ borderTop: '1px solid rgba(0,180,220,0.1)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter message..."
              className="flex-1 text-[10px] font-mono bg-transparent outline-none placeholder:opacity-30"
              style={{
                color: '#c8d0dc',
                caretColor: '#00b4dc',
              }}
            />
            <motion.button
              className="px-2 py-1 text-[8px] font-mono font-bold tracking-[0.15em] rounded border shrink-0"
              style={{
                color: inputValue.trim() ? '#00b4dc' : '#2a3441',
                borderColor: inputValue.trim()
                  ? 'rgba(0,180,220,0.3)'
                  : 'rgba(42,52,65,0.3)',
                background: inputValue.trim()
                  ? 'rgba(0,180,220,0.06)'
                  : 'transparent',
              }}
              onClick={handleSend}
              whileHover={
                inputValue.trim()
                  ? { borderColor: 'rgba(0,180,220,0.6)', background: 'rgba(0,180,220,0.12)' }
                  : {}
              }
              whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
              disabled={!inputValue.trim()}
            >
              SEND
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
