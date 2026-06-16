"use client";

import { useAgentStore } from "@/store/agent-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search, PenLine, Code, Globe, Play, Square, Brain,
  Cpu, Settings2, Zap, ChevronDown, Trash2, Users,
  RotateCcw, Database, FileOutput, Shield, HardDrive,
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { MemoryInspector } from "./memory-inspector";

const toolConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  search: { icon: <Search size={11} />, label: "Search", color: "#00d1ff" },
  write: { icon: <PenLine size={11} />, label: "Write", color: "#22c55e" },
  code: { icon: <Code size={11} />, label: "Code", color: "#ffd60a" },
  browser: { icon: <Globe size={11} />, label: "Browser", color: "#8a94a3" },
};

const roleOptions = [
  { value: "general", label: "General", color: "#8a94a3" },
  { value: "planner", label: "Planner", color: "#00d1ff" },
  { value: "researcher", label: "Researcher", color: "#22c55e" },
  { value: "executor", label: "Executor", color: "#ffd60a" },
  { value: "critic", label: "Critic", color: "#f59e0b" },
  { value: "reviewer", label: "Reviewer", color: "#ef4444" },
] as const;

const modelOptions = [
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-sonnet-4", label: "Claude Sonnet 4" },
] as const;

const orchestrationModes = [
  { value: "single", label: "Single" },
  { value: "sequential", label: "Sequential" },
  { value: "group", label: "Group" },
  { value: "hierarchical", label: "Hierarchical" },
  { value: "parallel", label: "Parallel" },
] as const;

function Section({ title, icon, defaultOpen = true, children }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
        <div className="flex items-center gap-1.5">
          <span style={{ color: "#5b6b81" }}>{icon}</span>
          <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "#8a94a3" }}>
            {title}
          </span>
        </div>
        <ChevronDown
          size={10}
          style={{ color: "#3a4553", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2.5 pt-1 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function InspectorForm({ agentId }: { agentId: string }) {
  const { agents, isRunning, currentRunId, startRun, stopRun, updateAgentConfig, deleteAgent, selectAgent } = useAgentStore();
  const selectedAgent = agents.find((a) => a.id === agentId);

  const [name, setName] = useState(selectedAgent?.name || "");
  const [goal, setGoal] = useState(selectedAgent?.goal || "");
  const [personality, setPersonality] = useState(selectedAgent?.personality || "");
  const [tools, setTools] = useState<string[]>(selectedAgent?.tools || []);
  const [role, setRole] = useState(selectedAgent?.role || "general");
  const [model, setModel] = useState(selectedAgent?.model || "gemini-2.5-pro");
  const [orchestrationMode, setOrchestrationMode] = useState(selectedAgent?.orchestrationMode || "single");
  const [maxConcurrency, setMaxConcurrency] = useState(selectedAgent?.maxConcurrency ?? 3);
  const [reflectionEnabled, setReflectionEnabled] = useState(selectedAgent?.reflectionEnabled ?? false);
  const [reflectionMaxIter, setReflectionMaxIter] = useState(selectedAgent?.reflectionMaxIter ?? 3);
  const [reflectionCriteria, setReflectionCriteria] = useState(selectedAgent?.reflectionCriteria || "APPROVED");
  const [shortTermMemory, setShortTermMemory] = useState(selectedAgent?.shortTermMemory ?? true);
  const [longTermMemory, setLongTermMemory] = useState(selectedAgent?.longTermMemory ?? false);
  const [maxSteps, setMaxSteps] = useState(selectedAgent?.maxSteps ?? 10);
  const [autoRun, setAutoRun] = useState(selectedAgent?.autoRun ?? true);
  const [outputFormat, setOutputFormat] = useState(selectedAgent?.outputFormat || "markdown");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Record<string, unknown>>({});

  const scheduleSave = useCallback((updates: Record<string, unknown>) => {
    pendingRef.current = { ...pendingRef.current, ...updates };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateAgentConfig(agentId, pendingRef.current);
      pendingRef.current = {};
    }, 500);
  }, [agentId, updateAgentConfig]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        if (Object.keys(pendingRef.current).length > 0) updateAgentConfig(agentId, pendingRef.current);
      }
    };
  }, [agentId, updateAgentConfig]);

  const handleRun = async () => { await startRun(agentId); };
  const handleStop = async () => { if (currentRunId) await stopRun(currentRunId); };
  const toggleTool = (tool: string) => {
    const next = tools.includes(tool) ? tools.filter((t) => t !== tool) : [...tools, tool];
    setTools(next);
    scheduleSave({ tools: next });
  };
  const handleDelete = async () => { const success = await deleteAgent(agentId); if (success) selectAgent(null); };

  const roleColor = roleOptions.find((r) => r.value === role)?.color || "#8a94a3";

  const inputStyle = {
    background: "#0b1118",
    border: "2px solid #000",
    boxShadow: "2px 2px 0 #000",
    color: "#d7dde5",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "11px",
    borderRadius: 0,
  };

  return (
    <div className="w-[320px] flex flex-col h-full" style={{ background: "#0f141b", borderLeft: "2px solid #000" }}>
      {/* Header */}
      <div
        className="px-3 py-2.5 flex items-center justify-between"
        style={{ background: "#141b23", borderBottom: "2px solid #000" }}
      >
        <div className="flex items-center gap-2">
          <Cpu size={12} style={{ color: "#ffd60a" }} />
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#d7dde5" }}>
            Configuration
          </span>
          <span
            className="text-[8px] px-1 py-0 tracking-wider uppercase font-semibold"
            style={{ background: roleColor + "20", border: `1px solid ${roleColor}40`, color: roleColor }}
          >
            {role}
          </span>
        </div>
        <div className="flex gap-1">
          {isRunning ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1 px-2 py-1 text-[9px] tracking-wider uppercase font-semibold"
              style={{ background: "#ef4444", color: "#fff", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }}
            >
              <Square size={8} /> Stop
            </button>
          ) : (
            <button
              onClick={handleRun}
              className="flex items-center gap-1 px-2 py-1 text-[9px] tracking-wider uppercase font-semibold"
              style={{ background: "#ffd60a", color: "#000", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }}
            >
              <Play size={8} /> Run
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-1">
          {/* Basic */}
          <Section title="Basic" icon={<Cpu size={9} />} defaultOpen>
            <div className="space-y-1.5">
              <Label className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "#5b6b81" }}>Name</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); scheduleSave({ name: e.target.value }); }} style={inputStyle} className="h-7" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "#5b6b81" }}>Goal</Label>
              <Textarea value={goal} onChange={(e) => { setGoal(e.target.value); scheduleSave({ goal: e.target.value }); }} rows={3} style={{ ...inputStyle, resize: "none" }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "#5b6b81" }}>Personality</Label>
              <Input value={personality} onChange={(e) => { setPersonality(e.target.value); scheduleSave({ personality: e.target.value }); }} style={inputStyle} className="h-7" />
            </div>
          </Section>

          {/* Tools */}
          <Section title="Skills" icon={<Zap size={9} />} defaultOpen>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(toolConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => toggleTool(key)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-wider uppercase transition-all"
                  style={{
                    background: tools.includes(key) ? cfg.color + "15" : "#0c1219",
                    border: tools.includes(key) ? `1px solid ${cfg.color}60` : "1px solid #2a3441",
                    color: tools.includes(key) ? cfg.color : "#5b6b81",
                    boxShadow: tools.includes(key) ? "2px 2px 0 #000" : "none",
                  }}
                >
                  {cfg.icon}
                  <span>{cfg.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Orchestration */}
          <Section title="Orchestration" icon={<Users size={9} />} defaultOpen>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "#5b6b81" }}>Role</Label>
                <Select value={role} onValueChange={(v) => { setRole(v); scheduleSave({ role: v }); }}>
                  <SelectTrigger style={inputStyle} className="w-full h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "#0b1016", border: "2px solid #000", borderRadius: 0 }}>
                    {roleOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} style={{ color: "#d7dde5", fontSize: "11px" }}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 shrink-0" style={{ background: opt.color }} />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "#5b6b81" }}>Model</Label>
                <Select value={model} onValueChange={(v) => { setModel(v); scheduleSave({ model: v }); }}>
                  <SelectTrigger style={inputStyle} className="w-full h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "#0b1016", border: "2px solid #000", borderRadius: 0 }}>
                    {modelOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} style={{ color: "#d7dde5", fontSize: "11px" }}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "#5b6b81" }}>Mode</Label>
                <Select value={orchestrationMode} onValueChange={(v) => { setOrchestrationMode(v); scheduleSave({ orchestrationMode: v }); }}>
                  <SelectTrigger style={inputStyle} className="w-full h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "#0b1016", border: "2px solid #000", borderRadius: 0 }}>
                    {orchestrationModes.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} style={{ color: "#d7dde5", fontSize: "11px" }}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {orchestrationMode === "parallel" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: "#8a94a3" }}>Max Concurrency</span>
                    <span className="text-[10px] font-semibold" style={{ color: "#ffd60a" }}>{maxConcurrency}</span>
                  </div>
                  <Slider value={[maxConcurrency]} min={2} max={10} step={1}
                    onValueChange={([v]) => { setMaxConcurrency(v); scheduleSave({ maxConcurrency: v }); }}
                    className="[&_[role=slider]]:bg-[#ffd60a] [&_[role=slider]]:border-[#ffd60a]"
                  />
                </div>
              )}
            </div>
          </Section>

          {/* Reflection */}
          <Section title="Reflection" icon={<RotateCcw size={9} />} defaultOpen={reflectionEnabled}>
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: "#8a94a3" }}>Reflection</span>
              <Switch checked={reflectionEnabled} onCheckedChange={(v) => { setReflectionEnabled(v); scheduleSave({ reflectionEnabled: v }); }}
                className="data-[state=checked]:bg-[#ffd60a]" />
            </div>
            {reflectionEnabled && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: "#8a94a3" }}>Max Iterations</span>
                    <span className="text-[10px] font-semibold" style={{ color: "#ffd60a" }}>{reflectionMaxIter}</span>
                  </div>
                  <Slider value={[reflectionMaxIter]} min={1} max={10} step={1}
                    onValueChange={([v]) => { setReflectionMaxIter(v); scheduleSave({ reflectionMaxIter: v }); }}
                    className="[&_[role=slider]]:bg-[#ffd60a] [&_[role=slider]]:border-[#ffd60a]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "#5b6b81" }}>Criteria</Label>
                  <Input value={reflectionCriteria} onChange={(e) => { setReflectionCriteria(e.target.value); scheduleSave({ reflectionCriteria: e.target.value }); }}
                    style={inputStyle} className="h-7" />
                </div>
              </>
            )}
          </Section>

          {/* Memory & Output */}
          <Section title="Memory & Output" icon={<Database size={9} />} defaultOpen={false}>
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: "#8a94a3" }}>Short-term memory</span>
              <Switch checked={shortTermMemory} onCheckedChange={(v) => { setShortTermMemory(v); scheduleSave({ shortTermMemory: v }); }}
                className="data-[state=checked]:bg-[#ffd60a]" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: "#8a94a3" }}>Long-term memory</span>
              <Switch checked={longTermMemory} onCheckedChange={(v) => { setLongTermMemory(v); scheduleSave({ longTermMemory: v }); }}
                className="data-[state=checked]:bg-[#ffd60a]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "#8a94a3" }}>Max steps</span>
                <span className="text-[10px] font-semibold" style={{ color: "#ffd60a" }}>{maxSteps}</span>
              </div>
              <Slider value={[maxSteps]} min={1} max={20} step={1}
                onValueChange={([v]) => { setMaxSteps(v); scheduleSave({ maxSteps: v }); }}
                className="[&_[role=slider]]:bg-[#ffd60a] [&_[role=slider]]:border-[#ffd60a]" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: "#8a94a3" }}>Auto-run mode</span>
              <Switch checked={autoRun} onCheckedChange={(v) => { setAutoRun(v); scheduleSave({ autoRun: v }); }}
                className="data-[state=checked]:bg-[#ffd60a]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] uppercase tracking-widest font-semibold flex items-center gap-1" style={{ color: "#5b6b81" }}>
                <FileOutput size={8} /> Output Format
              </Label>
              <div className="flex gap-1">
                {(["text", "json", "markdown"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => { setOutputFormat(fmt); scheduleSave({ outputFormat: fmt }); }}
                    className="flex-1 py-1 text-[9px] uppercase tracking-wider transition-all"
                    style={{
                      background: outputFormat === fmt ? "#ffd60a" : "#0c1219",
                      border: outputFormat === fmt ? "2px solid #000" : "1px solid #2a3441",
                      color: outputFormat === fmt ? "#000" : "#5b6b81",
                      boxShadow: outputFormat === fmt ? "2px 2px 0 #000" : "none",
                      fontWeight: outputFormat === fmt ? 600 : 400,
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Memory Inspector */}
          <Section title="Memory" icon={<HardDrive size={9} />} defaultOpen={false}>
            <MemoryInspector agentId={agentId} />
          </Section>

          {/* Danger Zone */}
          <Section title="Danger Zone" icon={<Shield size={9} />} defaultOpen={false}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="w-full py-1.5 text-[10px] tracking-wider uppercase font-semibold"
                  style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
                >
                  <Trash2 size={10} className="inline mr-1" />
                  Delete Agent
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent style={{ background: "#0b1016", border: "2px solid #000", borderRadius: 0 }}>
                <AlertDialogHeader>
                  <AlertDialogTitle style={{ color: "#d7dde5" }}>Delete Agent</AlertDialogTitle>
                  <AlertDialogDescription style={{ color: "#8a94a3" }}>
                    Are you sure you want to delete <span style={{ color: "#d7dde5", fontWeight: 600 }}>{name}</span>?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel style={{ background: "#1a212b", border: "2px solid #000", color: "#8a94a3", borderRadius: 0 }}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}
                    style={{ background: "#ef4444", color: "#fff", border: "2px solid #000", borderRadius: 0 }}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Section>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex gap-1.5 px-3 py-2" style={{ background: "#141b23", borderTop: "2px solid #000" }}>
        <button
          className="flex-1 py-1.5 text-[9px] tracking-wider uppercase"
          style={{ background: "#1a212b", border: "2px solid #000", color: "#d7dde5", boxShadow: "2px 2px 0 #000" }}
        >
          Test
        </button>
        <button
          onClick={() => { /* save is debounced automatically */ }}
          className="flex-1 py-1.5 text-[9px] tracking-wider uppercase font-semibold"
          style={{ background: "#ffd60a", border: "2px solid #000", color: "#000", boxShadow: "2px 2px 0 #000" }}
        >
          Save Agent
        </button>
      </div>
    </div>
  );
}

export function AgentInspector() {
  const { selectedAgentId } = useAgentStore();

  if (!selectedAgentId) {
    return (
      <div
        className="w-[320px] flex flex-col items-center justify-center p-6 text-center"
        style={{ background: "#0f141b", borderLeft: "2px solid #000" }}
      >
        <div
          className="w-12 h-12 flex items-center justify-center mb-3"
          style={{ background: "#1a212b", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }}
        >
          <Settings2 size={18} style={{ color: "#3a4553" }} />
        </div>
        <p className="text-[11px] font-semibold" style={{ color: "#8a94a3" }}>
          Select an agent
        </p>
        <p className="text-[9px] mt-1" style={{ color: "#5b6b81" }}>
          Click a node or select from explorer to configure
        </p>
      </div>
    );
  }

  return <InspectorForm key={selectedAgentId} agentId={selectedAgentId} />;
}
