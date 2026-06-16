'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'

const STATUS_COLORS: Record<string, string> = {
  connected: '#00ff88',
  disconnected: '#5a6578',
  error: '#ff3344',
}

interface Provider {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'error'
  activeModel?: string
}

export function ProviderWidget() {
  const [providers, setProviders] = useState<Provider[]>([])

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch('/api/providers/status')
        const data = await res.json()
        setProviders(data.providers || [])
      } catch (err) {
        console.error('Failed to fetch providers:', err)
      }
    }

    fetchProviders()
  }, [])

  const connectedCount = providers.filter((p) => p.status === 'connected').length

  return (
    <WidgetContainer
      id="provider"
      title="INFERENCE"
      onHoverInfo="LLM inference provider status - connection health and active model assignments"
    >
      <div className="flex flex-col h-full">
        {/* Summary */}
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span
            className="text-[9px] tracking-[0.2em] font-bold"
            style={{ color: '#5a6578' }}
          >
            {providers.length} PROVIDERS
          </span>
          <span
            className="text-[9px] tracking-[0.1em]"
            style={{ color: connectedCount > 0 ? '#00ff88' : '#ff3344' }}
          >
            {connectedCount}/{providers.length} CONNECTED
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-1.5"
          style={{ background: 'rgba(0,180,220,0.1)' }}
        />

        {/* Provider list */}
        <div className="flex-1 overflow-y-auto max-h-48 space-y-0.5 pr-0.5 scrollbar-thin">
          {providers.map((provider, i) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="flex items-center gap-2 px-1 py-0.5 rounded-sm cursor-pointer"
              whileHover={{ background: 'rgba(0,180,220,0.04)' }}
            >
              {/* Status dot */}
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: STATUS_COLORS[provider.status],
                  boxShadow:
                    provider.status === 'connected'
                      ? `0 0 4px ${STATUS_COLORS[provider.status]}`
                      : provider.status === 'error'
                        ? `0 0 4px ${STATUS_COLORS[provider.status]}`
                        : 'none',
                }}
              />

              {/* Provider name */}
              <span
                className="text-[10px] font-mono tracking-[0.1em] shrink-0"
                style={{ color: '#c8d0dc' }}
              >
                {provider.name}
              </span>

              <div className="flex-1" />

              {/* Active model */}
              {provider.activeModel && (
                <span
                  className="text-[9px] tracking-[0.1em] shrink-0"
                  style={{ color: '#00b4dc' }}
                >
                  {provider.activeModel}
                </span>
              )}

              {/* Disconnected label */}
              {provider.status === 'disconnected' && (
                <span
                  className="text-[9px] tracking-[0.1em] shrink-0"
                  style={{ color: '#2a3441' }}
                >
                  OFFLINE
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  )
}
