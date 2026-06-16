'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import {
  Search,
  PenTool,
  Code2,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Circle,
} from 'lucide-react'
import type { AgentNodeData } from '@/store/agent-store'

const toolIcons: Record<string, React.ReactNode> = {
  search: <Search className="h-3 w-3" />,
  write: <PenTool className="h-3 w-3" />,
  code: <Code2 className="h-3 w-3" />,
  browser: <Globe className="h-3 w-3" />,
}

const toolLabels: Record<string, string> = {
  search: 'Search',
  write: 'Write',
  code: 'Code',
  browser: 'Browser',
  finish: 'Finish',
}

const statusConfig = {
  idle: {
    color: '#4B5563',
    bg: 'bg-[#1F2937]',
    border: 'border-[#374151]',
    glow: '',
    icon: <Circle className="h-3 w-3 text-gray-500" />,
    label: 'Idle',
  },
  running: {
    color: '#7C3AED',
    bg: 'bg-[#1E1033]',
    border: 'border-purple-500/50',
    glow: 'shadow-[0_0_15px_rgba(124,58,237,0.3)]',
    icon: <Loader2 className="h-3 w-3 text-purple-400 animate-spin" />,
    label: 'Running',
  },
  success: {
    color: '#22C55E',
    bg: 'bg-[#0D2818]',
    border: 'border-green-500/50',
    glow: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]',
    icon: <CheckCircle2 className="h-3 w-3 text-green-400" />,
    label: 'Success',
  },
  error: {
    color: '#EF4444',
    bg: 'bg-[#2D0F0F]',
    border: 'border-red-500/50',
    glow: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    icon: <AlertCircle className="h-3 w-3 text-red-400" />,
    label: 'Error',
  },
}

function AgentNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData
  const status = nodeData.status || 'idle'
  const config = statusConfig[status]

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#7C3AED] !w-2 !h-2 !border-0"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          ...(status === 'running'
            ? {
                boxShadow: [
                  '0 0 5px rgba(124,58,237,0.2)',
                  '0 0 20px rgba(124,58,237,0.4)',
                  '0 0 5px rgba(124,58,237,0.2)',
                ],
              }
            : {}),
        }}
        transition={{
          duration: 0.3,
          ...(status === 'running' ? { boxShadow: { repeat: Infinity, duration: 2 } } : {}),
        }}
        className={`
          min-w-[200px] max-w-[260px] rounded-lg border ${config.border} ${config.bg}
          ${config.glow} ${selected ? 'ring-2 ring-purple-500/60' : ''}
          transition-colors duration-300 overflow-hidden
        `}
      >
        {/* Status bar */}
        <div
          className="h-1 w-full"
          style={{ backgroundColor: config.color }}
        />

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Header: Name + Status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#E5E7EB] truncate leading-tight">
              {nodeData.name}
            </h3>
            <div
              className={`
                flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium
                shrink-0
                ${status === 'running' ? 'bg-purple-500/20 text-purple-300' : ''}
                ${status === 'success' ? 'bg-green-500/20 text-green-300' : ''}
                ${status === 'error' ? 'bg-red-500/20 text-red-300' : ''}
                ${status === 'idle' ? 'bg-gray-500/20 text-gray-400' : ''}
              `}
            >
              {config.icon}
              <span>{config.label}</span>
            </div>
          </div>

          {/* Goal/Role */}
          <p className="text-[11px] text-[#9CA3AF] line-clamp-2 leading-relaxed">
            {nodeData.goal}
          </p>

          {/* Tool badges */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {nodeData.tools?.map((tool) => (
              <div
                key={tool}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#0B0F17] border border-[#1F2937] text-[9px] text-[#9CA3AF]"
              >
                {toolIcons[tool]}
                <span className="ml-0.5">{toolLabels[tool] || tool}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#7C3AED] !w-2 !h-2 !border-0"
      />
    </>
  )
}

export const AgentNode = memo(AgentNodeComponent)
