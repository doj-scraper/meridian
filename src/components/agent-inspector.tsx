'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  PenTool,
  Code2,
  Globe,
  Play,
  Square,
  Brain,
  Database,
  RotateCcw,
  FileText,
  Save,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAgentStore, type Agent } from '@/store/agent-store'

const toolOptions = [
  { id: 'search', label: 'Search', icon: Search, color: '#3B82F6' },
  { id: 'write', label: 'Write', icon: PenTool, color: '#22C55E' },
  { id: 'code', label: 'Code', icon: Code2, color: '#F59E0B' },
  { id: 'browser', label: 'Browser', icon: Globe, color: '#EF4444' },
]

function InspectorContent({ agent }: { agent: Agent }) {
  const { selectAgent, toggleInspector, updateAgent, startRun, stopRun, currentRunId } = useAgentStore()

  // Initialize local editing state from agent
  const [name, setName] = useState(agent.name)
  const [goal, setGoal] = useState(agent.goal)
  const [personality, setPersonality] = useState(agent.personality)
  const [enabledTools, setEnabledTools] = useState<string[]>(agent.tools)
  const [shortTermMemory, setShortTermMemory] = useState(agent.shortTermMemory)
  const [longTermMemory, setLongTermMemory] = useState(agent.longTermMemory)
  const [maxSteps, setMaxSteps] = useState(agent.maxSteps)
  const [autoRun, setAutoRun] = useState(agent.autoRun)
  const [outputFormat, setOutputFormat] = useState(agent.outputFormat)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await updateAgent(agent.id, {
      name,
      goal,
      personality,
      tools: enabledTools,
      shortTermMemory,
      longTermMemory,
      maxSteps,
      autoRun,
      outputFormat,
    })
    setSaving(false)
  }

  const handleRun = async () => {
    setRunning(true)
    await startRun(agent.id)
    setRunning(false)
  }

  const handleStop = async () => {
    if (!currentRunId) return
    await stopRun(currentRunId)
    setRunning(false)
  }

  const toggleTool = (toolId: string) => {
    setEnabledTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((t) => t !== toolId)
        : [...prev, toolId]
    )
  }

  return (
    <>
      {/* Header */}
      <div className="p-4 flex items-center justify-between shrink-0 border-b border-[#1F2937]">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-[#7C3AED]" />
          <h2 className="text-sm font-semibold text-[#E5E7EB]">Configure</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937]"
          onClick={() => {
            selectAgent(null)
            toggleInspector()
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
              Agent Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#0B0F17] border-[#1F2937] text-[#E5E7EB] text-sm focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
              placeholder="Agent name..."
            />
          </div>

          {/* Goal */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
              Goal
            </Label>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="bg-[#0B0F17] border-[#1F2937] text-[#E5E7EB] text-sm min-h-[80px] resize-none focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
              placeholder="What should this agent accomplish?"
            />
          </div>

          {/* Personality */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
              Personality
            </Label>
            <Textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="bg-[#0B0F17] border-[#1F2937] text-[#E5E7EB] text-sm min-h-[60px] resize-none focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
              placeholder="Agent personality..."
            />
          </div>

          <Separator className="bg-[#1F2937]" />

          {/* Tools */}
          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
              Tools
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {toolOptions.map((tool) => {
                const enabled = enabledTools.includes(tool.id)
                return (
                  <button
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`
                      flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left
                      ${
                        enabled
                          ? 'bg-[#7C3AED]/10 border-[#7C3AED]/30'
                          : 'bg-[#0B0F17] border-[#1F2937] hover:border-[#374151]'
                      }
                    `}
                  >
                    <tool.icon
                      className={`h-4 w-4 ${
                        enabled ? 'text-[#7C3AED]' : 'text-[#6B7280]'
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        enabled ? 'text-[#E5E7EB]' : 'text-[#6B7280]'
                      }`}
                    >
                      {tool.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator className="bg-[#1F2937]" />

          {/* Memory */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#7C3AED]" />
              <Label className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                Memory
              </Label>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-[#6B7280]" />
                  <span className="text-xs text-[#E5E7EB]">Short-term</span>
                </div>
                <Switch
                  checked={shortTermMemory}
                  onCheckedChange={setShortTermMemory}
                  className="data-[state=checked]:bg-[#7C3AED]"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-[#6B7280]" />
                  <span className="text-xs text-[#E5E7EB]">Long-term</span>
                </div>
                <Switch
                  checked={longTermMemory}
                  onCheckedChange={setLongTermMemory}
                  className="data-[state=checked]:bg-[#7C3AED]"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#1F2937]" />

          {/* Loop Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-[#7C3AED]" />
              <Label className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                Loop Settings
              </Label>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#E5E7EB]">Max Steps</span>
                  <Badge
                    variant="outline"
                    className="bg-[#0B0F17] border-[#1F2937] text-[#9CA3AF] text-[10px]"
                  >
                    {maxSteps}
                  </Badge>
                </div>
                <Slider
                  value={[maxSteps]}
                  onValueChange={([v]) => setMaxSteps(v)}
                  min={1}
                  max={50}
                  step={1}
                  className="[&_[role=slider]]:bg-[#7C3AED] [&_[role=slider]]:border-[#7C3AED]"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#E5E7EB]">Auto-run</span>
                <Switch
                  checked={autoRun}
                  onCheckedChange={setAutoRun}
                  className="data-[state=checked]:bg-[#7C3AED]"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#1F2937]" />

          {/* Output Format */}
          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
              Output Format
            </Label>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger className="bg-[#0B0F17] border-[#1F2937] text-[#E5E7EB] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1F2937]">
                <SelectItem value="text" className="text-[#E5E7EB] text-xs focus:bg-[#1F2937] focus:text-[#E5E7EB]">
                  Plain Text
                </SelectItem>
                <SelectItem value="json" className="text-[#E5E7EB] text-xs focus:bg-[#1F2937] focus:text-[#E5E7EB]">
                  JSON
                </SelectItem>
                <SelectItem value="markdown" className="text-[#E5E7EB] text-xs focus:bg-[#1F2937] focus:text-[#E5E7EB]">
                  Markdown
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-[#1F2937]" />

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <Button
              onClick={handleRun}
              disabled={running || enabledTools.length === 0}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Agent
            </Button>
            {running && currentRunId && (
              <Button
                onClick={handleStop}
                variant="destructive"
                className="w-full text-sm"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Run
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="outline"
              className="w-full border-[#1F2937] text-[#E5E7EB] hover:bg-[#1F2937] text-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </>
  )
}

export function AgentInspector() {
  const { selectedAgent, inspectorOpen, toggleInspector } = useAgentStore()

  return (
    <AnimatePresence mode="wait">
      {inspectorOpen && selectedAgent ? (
        <motion.div
          key={`inspector-open-${selectedAgent.id}`}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 300, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="h-full bg-[#111827] border-l border-[#1F2937] flex flex-col overflow-hidden"
        >
          <InspectorContent key={selectedAgent.id} agent={selectedAgent} />
        </motion.div>
      ) : !inspectorOpen && selectedAgent ? (
        <motion.div
          key="inspector-collapsed"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 44, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="h-full bg-[#111827] border-l border-[#1F2937] flex flex-col items-center py-3 gap-2"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#7C3AED] hover:text-[#E5E7EB] hover:bg-[#1F2937]"
            onClick={toggleInspector}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
