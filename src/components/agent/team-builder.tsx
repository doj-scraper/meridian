"use client";

import { useState } from "react";
import { useAgentStore } from "@/store/agent-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Loader2 } from "lucide-react";

const orchestrationModes = [
  { value: "sequential", label: "Sequential", desc: "Agents run one after another" },
  { value: "group", label: "Group Chat", desc: "Agents discuss as a group" },
  { value: "hierarchical", label: "Hierarchical", desc: "Planner delegates to workers" },
  { value: "parallel", label: "Parallel", desc: "Agents run simultaneously" },
] as const;

const terminationTypes = [
  { value: "max_steps", label: "Max Steps" },
  { value: "text_mention", label: "Text Mention" },
  { value: "max_messages", label: "Max Messages" },
] as const;

export function TeamBuilder() {
  const { agents, createTeam } = useAgentStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mode, setMode] = useState("sequential");
  const [maxConcurrency, setMaxConcurrency] = useState(3);
  const [terminationType, setTerminationType] = useState("max_steps");
  const [terminationValue, setTerminationValue] = useState("10");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedAgentIds.length === 0) return;
    setIsCreating(true);
    try {
      await createTeam({
        name: name.trim(),
        mode,
        agentIds: selectedAgentIds,
      });
      // Reset form
      setName("");
      setMode("sequential");
      setMaxConcurrency(3);
      setTerminationType("max_steps");
      setTerminationValue("10");
      setSelectedAgentIds([]);
      setOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-7 text-[11px] gap-1 border-2 border-black w-full"
          style={{ background: "#ffd60a", color: "#000", boxShadow: "2px 2px 0 #000" }}
        >
          <Plus size={12} />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent
        className="bg-[#0f141b] border-[#2a3441] text-[#d7dde5] max-w-lg"
        style={{ borderRadius: 0 }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#d7dde5]">
            <Users size={18} className="text-[#ffd60a]" />
            Create Agent Team
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Team Name */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-[#5b6b81] uppercase tracking-wider font-medium">
              Team Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Research Squad"
              className="h-8 text-[12px] bg-[#0b1118] border-[#2a3441] text-[#d7dde5] focus:border-[#ffd60a] focus:ring-[#ffd60a]/20"
              style={{ borderRadius: 0 }}
            />
          </div>

          {/* Orchestration Mode */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-[#5b6b81] uppercase tracking-wider font-medium">
              Orchestration Mode
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {orchestrationModes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`p-2.5 text-left border transition-all ${
                    mode === m.value
                      ? "bg-[#ffd60a]/15 border-[#ffd60a]/40 text-[#ffd60a]"
                      : "bg-[#0b1118] border-[#2a3441] text-[#8a94a3] hover:border-[#3a4553]"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  <div className="text-[11px] font-medium">{m.label}</div>
                  <div className="text-[9px] mt-0.5 opacity-70">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Max Concurrency (for parallel mode) */}
          {mode === "parallel" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8a94a3]">Max Concurrency</span>
                <span className="text-[11px] text-[#ffd60a] font-mono">{maxConcurrency}</span>
              </div>
              <Slider
                value={[maxConcurrency]}
                min={2}
                max={10}
                step={1}
                onValueChange={([v]) => setMaxConcurrency(v)}
                className="[&_[role=slider]]:bg-[#ffd60a] [&_[role=slider]]:border-[#ffd60a]"
              />
            </div>
          )}

          {/* Termination Condition */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-[#5b6b81] uppercase tracking-wider font-medium">
              Termination Condition
            </Label>
            <div className="flex gap-2">
              <Select value={terminationType} onValueChange={setTerminationType}>
                <SelectTrigger className="w-[140px] h-8 text-[12px] bg-[#0b1118] border-[#2a3441] text-[#d7dde5]" style={{ borderRadius: 0 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0b1016] border-[#2a3441]" style={{ borderRadius: 0 }}>
                  {terminationTypes.map((t) => (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                      className="text-[12px] text-[#d7dde5] focus:bg-[#2a3441]"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={terminationValue}
                onChange={(e) => setTerminationValue(e.target.value)}
                placeholder="Value"
                className="h-8 text-[12px] bg-[#0b1118] border-[#2a3441] text-[#d7dde5] focus:border-[#ffd60a] focus:ring-[#ffd60a]/20"
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>

          {/* Agent Selection */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-[#5b6b81] uppercase tracking-wider font-medium">
              Select Agents ({selectedAgentIds.length} selected)
            </Label>
            {agents.length === 0 ? (
              <p className="text-[11px] text-[#475569] py-2">
                No agents available. Create agents first.
              </p>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {agents.map((agent) => (
                    <label
                      key={agent.id}
                      className={`flex items-center gap-2.5 p-2 cursor-pointer transition-all border ${
                        selectedAgentIds.includes(agent.id)
                          ? "bg-[#ffd60a]/10 border-[#ffd60a]/30"
                          : "bg-[#0b1118] border-[#2a3441] hover:border-[#3a4553]"
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      <Checkbox
                        checked={selectedAgentIds.includes(agent.id)}
                        onCheckedChange={() => toggleAgent(agent.id)}
                        className="border-[#3a4553] data-[state=checked]:bg-[#ffd60a] data-[state=checked]:border-[#ffd60a]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-[#d7dde5]">
                          {agent.name}
                        </div>
                        <div className="text-[9px] text-[#5b6b81] truncate">
                          {agent.role} · {agent.tools.join(", ")}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[8px] px-1 py-0 h-4 border-0"
                        style={{
                          borderRadius: 0,
                          background:
                            agent.role === "planner"
                              ? "#ffd60a20"
                              : agent.role === "researcher"
                                ? "#22C55E20"
                                : agent.role === "executor"
                                  ? "#3B82F620"
                                  : agent.role === "critic"
                                    ? "#F59E0B20"
                                    : "#8B5CF620",
                          color:
                            agent.role === "planner"
                              ? "#ffd60a"
                              : agent.role === "researcher"
                                ? "#22C55E"
                                : agent.role === "executor"
                                  ? "#3B82F6"
                                  : agent.role === "critic"
                                    ? "#F59E0B"
                                    : "#8B5CF6",
                        }}
                      >
                        {agent.role}
                      </Badge>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="h-8 text-[11px] border-2 border-black"
              style={{ background: "#1a212b", color: "#8a94a3", boxShadow: "2px 2px 0 #000" }}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || selectedAgentIds.length === 0 || isCreating}
            className="h-8 text-[11px] gap-1.5 border-2 border-black disabled:opacity-50"
            style={{ background: "#ffd60a", color: "#000", boxShadow: "2px 2px 0 #000" }}
          >
            {isCreating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Users size={12} />
            )}
            Create Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
