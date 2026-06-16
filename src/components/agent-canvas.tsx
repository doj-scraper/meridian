'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AgentNode } from '@/components/agent-node'
import { useAgentStore } from '@/store/agent-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Workflow, Plus } from 'lucide-react'

const nodeTypes = { agent: AgentNode }

export function AgentCanvas() {
  const {
    canvasNodes,
    canvasEdges,
    onCanvasConnect,
    selectAgent,
    agents,
    setBuilderOpen,
  } = useAgentStore()

  const [nodes, setNodes, onNodesChange] = useNodesState(canvasNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(canvasEdges)

  // Sync store nodes/edges to local state
  useMemo(() => {
    setNodes(canvasNodes)
  }, [canvasNodes, setNodes])

  useMemo(() => {
    setEdges(canvasEdges)
  }, [canvasEdges, setEdges])

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        onCanvasConnect({
          source: connection.source,
          target: connection.target,
        })
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              animated: true,
              style: { stroke: '#7C3AED', strokeWidth: 2 },
            },
            eds
          )
        )
      }
    },
    [onCanvasConnect, setEdges]
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string; data: Record<string, unknown> }) => {
      const agentId = (node.data as { agentId?: string })?.agentId
      if (agentId) {
        const agent = agents.find((a) => a.id === agentId)
        if (agent) selectAgent(agent)
      }
    },
    [agents, selectAgent]
  )

  const isEmpty = canvasNodes.length === 0

  return (
    <div className="relative w-full h-full bg-[#0B0F17]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as OnNodesChange}
        onEdgesChange={onEdgesChange as OnEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick as never}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#7C3AED', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        className="!bg-[#0B0F17]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#1F2937"
        />
        <Controls
          className="!bg-[#111827] !border-[#1F2937] !rounded-lg [&>button]:!bg-[#111827] [&>button]:!border-[#1F2937] [&>button]:!text-[#9CA3AF] [&>button:hover]:!bg-[#1F2937]"
        />
        <MiniMap
          className="!bg-[#111827] !border-[#1F2937] !rounded-lg"
          maskColor="rgba(11, 15, 23, 0.8)"
          nodeColor="#7C3AED"
        />
      </ReactFlow>

      {/* Empty state overlay */}
      <AnimatePresence>
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center space-y-4 pointer-events-auto">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center justify-center">
                <Workflow className="h-8 w-8 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#E5E7EB]">
                  Build Your First Agent
                </h3>
                <p className="text-sm text-[#9CA3AF] mt-1 max-w-xs">
                  Create an AI agent to get started. Agents will appear as nodes on this canvas.
                </p>
              </div>
              <button
                onClick={() => setBuilderOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Agent
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
