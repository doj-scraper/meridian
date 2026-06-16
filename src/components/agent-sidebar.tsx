'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Plus,
  Search,
  PenTool,
  Code2,
  Globe,
  FileBarChart,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ChevronLeft,
  Sparkles,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAgentStore, type Agent } from '@/store/agent-store'

const templates = [
  {
    name: 'Research Agent',
    description: 'Search & synthesize information',
    icon: Search,
    tools: ['search', 'browser'],
    color: '#3B82F6',
  },
  {
    name: 'Content Writer',
    description: 'Write articles & copy',
    icon: PenTool,
    tools: ['search', 'write'],
    color: '#22C55E',
  },
  {
    name: 'Code Assistant',
    description: 'Write & debug code',
    icon: Code2,
    tools: ['code', 'search'],
    color: '#F59E0B',
  },
  {
    name: 'Business Analyst',
    description: 'Analyze data & reports',
    icon: FileBarChart,
    tools: ['search', 'code', 'write'],
    color: '#EF4444',
  },
]

const toolIcons: Record<string, React.ReactNode> = {
  search: <Search className="h-3 w-3" />,
  write: <PenTool className="h-3 w-3" />,
  code: <Code2 className="h-3 w-3" />,
  browser: <Globe className="h-3 w-3" />,
}

const runStatusIcon: Record<string, React.ReactNode> = {
  running: <Loader2 className="h-3 w-3 text-purple-400 animate-spin" />,
  completed: <CheckCircle2 className="h-3 w-3 text-green-400" />,
  failed: <AlertCircle className="h-3 w-3 text-red-400" />,
  stopped: <Clock className="h-3 w-3 text-yellow-400" />,
  pending: <Clock className="h-3 w-3 text-gray-400" />,
}

export function AgentSidebar() {
  const {
    agents,
    agentsLoading,
    runs,
    selectedAgent,
    selectAgent,
    fetchAgents,
    fetchRuns,
    setBuilderOpen,
    addAgentToCanvas,
    sidebarOpen,
    toggleSidebar,
  } = useAgentStore()

  useEffect(() => {
    fetchAgents()
    fetchRuns()
  }, [fetchAgents, fetchRuns])

  const handleAgentClick = (agent: Agent) => {
    selectAgent(agent)
  }

  const handleTemplateClick = (template: (typeof templates)[0]) => {
    setBuilderOpen(true)
    useAgentStore.getState().setBuilderState({
      step: 0,
      userInput: `I need a ${template.name.toLowerCase()} that can ${template.description.toLowerCase()}`,
    })
  }

  const recentRuns = runs.slice(0, 8)

  return (
    <AnimatePresence mode="wait">
      {sidebarOpen ? (
        <motion.div
          key="sidebar-open"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="h-full bg-[#111827] border-r border-[#1F2937] flex flex-col overflow-hidden"
        >
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-semibold text-[#E5E7EB]">Agents</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937]"
                onClick={() => setBuilderOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937]"
                onClick={toggleSidebar}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-3 pb-4 space-y-4">
              {/* Build Agent CTA */}
              <button
                onClick={() => setBuilderOpen(true)}
                className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-[#7C3AED]/40 bg-[#7C3AED]/5 hover:bg-[#7C3AED]/10 hover:border-[#7C3AED]/60 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center group-hover:bg-[#7C3AED]/30 transition-colors">
                  <Sparkles className="h-4 w-4 text-[#7C3AED]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#E5E7EB]">Build Agent</p>
                  <p className="text-[10px] text-[#9CA3AF]">Describe what you need</p>
                </div>
              </button>

              {/* Agent List */}
              <div>
                <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2 px-1">
                  Your Agents
                </p>
                {agentsLoading ? (
                  <div className="space-y-2 px-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-14 rounded-lg bg-[#1F2937]/50 animate-pulse"
                      />
                    ))}
                  </div>
                ) : agents.length === 0 ? (
                  <div className="px-1 py-3 text-center">
                    <Bot className="h-6 w-6 text-[#374151] mx-auto mb-1" />
                    <p className="text-[11px] text-[#6B7280]">No agents yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {agents.map((agent) => (
                      <motion.button
                        key={agent.id}
                        whileHover={{ x: 2 }}
                        onClick={() => handleAgentClick(agent)}
                        className={`
                          w-full text-left p-2.5 rounded-lg transition-colors group
                          ${
                            selectedAgent?.id === agent.id
                              ? 'bg-[#7C3AED]/15 border border-[#7C3AED]/30'
                              : 'hover:bg-[#1F2937]/60 border border-transparent'
                          }
                        `}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#1F2937] flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="h-4 w-4 text-[#7C3AED]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-[#E5E7EB] truncate">
                              {agent.name}
                            </p>
                            <p className="text-[10px] text-[#9CA3AF] truncate mt-0.5">
                              {agent.goal}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {agent.tools.slice(0, 3).map((tool) => (
                                <span
                                  key={tool}
                                  className="inline-flex items-center text-[9px] text-[#6B7280]"
                                >
                                  {toolIcons[tool]}
                                </span>
                              ))}
                              {agent.runCount > 0 && (
                                <span className="text-[9px] text-[#6B7280] ml-auto">
                                  {agent.runCount} runs
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="bg-[#1F2937]" />

              {/* Quick Templates */}
              <div>
                <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2 px-1">
                  Quick Templates
                </p>
                <div className="space-y-1">
                  {templates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => handleTemplateClick(template)}
                      className="w-full text-left p-2 rounded-lg hover:bg-[#1F2937]/60 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${template.color}15` }}
                        >
                          <template.icon
                            className="h-3.5 w-3.5"
                            style={{ color: template.color }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-[#E5E7EB]">
                            {template.name}
                          </p>
                          <p className="text-[10px] text-[#6B7280] truncate">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-[#1F2937]" />

              {/* Recent Runs */}
              <div>
                <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2 px-1">
                  Recent Runs
                </p>
                {recentRuns.length === 0 ? (
                  <div className="px-1 py-3 text-center">
                    <Play className="h-5 w-5 text-[#374151] mx-auto mb-1" />
                    <p className="text-[11px] text-[#6B7280]">No runs yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentRuns.map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#1F2937]/40 transition-colors"
                      >
                        {runStatusIcon[run.status] || runStatusIcon.pending}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-[#E5E7EB] truncate">
                            {run.agentName || 'Agent'}
                          </p>
                          <p className="text-[10px] text-[#6B7280]">
                            {run.stepCount || 0} steps ·{' '}
                            {new Date(run.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`
                            text-[9px] px-1.5 py-0 border-0
                            ${run.status === 'running' ? 'bg-purple-500/15 text-purple-300' : ''}
                            ${run.status === 'completed' ? 'bg-green-500/15 text-green-300' : ''}
                            ${run.status === 'failed' ? 'bg-red-500/15 text-red-300' : ''}
                            ${run.status === 'stopped' ? 'bg-yellow-500/15 text-yellow-300' : ''}
                            ${run.status === 'pending' ? 'bg-gray-500/15 text-gray-400' : ''}
                          `}
                        >
                          {run.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      ) : (
        <motion.div
          key="sidebar-collapsed"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 44, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="h-full bg-[#111827] border-r border-[#1F2937] flex flex-col items-center py-3 gap-2"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937]"
            onClick={toggleSidebar}
          >
            <Bot className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#7C3AED] hover:text-[#E5E7EB] hover:bg-[#1F2937]"
            onClick={() => setBuilderOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
