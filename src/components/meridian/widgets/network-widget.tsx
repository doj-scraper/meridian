'use client'

import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

const STATUS_COLORS: Record<string, string> = {
  online: '#00ff88',
  offline: '#ff3344',
  relay: '#ffa500',
}

export function NetworkWidget() {
  const networkPeers = useMeridianStore((s) => s.networkPeers)
  const onlineCount = networkPeers.filter((p) => p.status === 'online').length

  return (
    <WidgetContainer
      id="network"
      title="NETWORK"
      onHoverInfo="Tailscale mesh network peer status - connectivity and latency across nodes"
    >
      <div className="flex flex-col h-full">
        {/* Summary row */}
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[8px] tracking-[0.2em] font-bold"
              style={{ color: '#3a4553' }}
            >
              TAILSCALE
            </span>
            <span
              className="text-[9px] tracking-[0.2em] font-bold"
              style={{ color: '#5a6578' }}
            >
              {networkPeers.length} PEERS
            </span>
          </div>
          <span
            className="text-[9px] tracking-[0.1em]"
            style={{ color: onlineCount > 0 ? '#00ff88' : '#ff3344' }}
          >
            {onlineCount}/{networkPeers.length} ONLINE
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-1.5"
          style={{ background: 'rgba(0,180,220,0.1)' }}
        />

        {/* Peer list */}
        <div className="flex-1 overflow-y-auto max-h-48 space-y-0.5 pr-0.5 scrollbar-thin">
          {networkPeers.map((peer, i) => (
            <motion.div
              key={peer.id}
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
                  background: STATUS_COLORS[peer.status],
                  boxShadow:
                    peer.status === 'online'
                      ? `0 0 4px ${STATUS_COLORS[peer.status]}`
                      : peer.status === 'offline'
                        ? `0 0 4px ${STATUS_COLORS[peer.status]}`
                        : peer.status === 'relay'
                          ? `0 0 3px ${STATUS_COLORS[peer.status]}`
                          : 'none',
                }}
              />

              {/* Peer name */}
              <span
                className="text-[10px] font-mono tracking-[0.1em] shrink-0"
                style={{ color: '#c8d0dc' }}
              >
                {peer.name}
              </span>

              <div className="flex-1" />

              {/* IP address */}
              <span
                className="text-[9px] font-mono tracking-[0.05em] shrink-0"
                style={{ color: '#3a4553' }}
              >
                {peer.ip}
              </span>

              {/* Latency */}
              {peer.status !== 'offline' && (
                <span
                  className="text-[9px] font-mono tracking-[0.05em] shrink-0"
                  style={{ color: '#5a6578' }}
                >
                  {peer.latencyMs}ms
                </span>
              )}

              {/* Offline label */}
              {peer.status === 'offline' && (
                <span
                  className="text-[9px] tracking-[0.1em] shrink-0"
                  style={{ color: '#ff3344' }}
                >
                  DOWN
                </span>
              )}

              {/* Relay label */}
              {peer.status === 'relay' && (
                <span
                  className="text-[9px] tracking-[0.1em] shrink-0"
                  style={{ color: '#ffa500' }}
                >
                  RELAY
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  )
}
