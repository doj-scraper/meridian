"use client";

import { useEffect, useState } from "react";
import { useAgentStore, type PolicyRuleInfo } from "@/store/agent-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Shield,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const actionColors: Record<string, string> = {
  allow: "#22C55E",
  block: "#EF4444",
  ask_user: "#F59E0B",
  shadow: "#5b6b81",
};

const riskLevelOptions = ["low", "medium", "high", "critical"] as const;
const toolOptions = ["search", "write", "code", "browser", "execute_code"] as const;
const roleOptions = ["general", "planner", "researcher", "executor", "critic", "reviewer"] as const;

export function PolicyDashboard() {
  const { policies, fetchPolicies, createPolicy, updatePolicy, deletePolicy } =
    useAgentStore();
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // New policy form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAction, setNewAction] = useState("allow");
  const [newPriority, setNewPriority] = useState(5);
  const [conditionTools, setConditionTools] = useState<string[]>([]);
  const [conditionRoles, setConditionRoles] = useState<string[]>([]);
  const [conditionRiskLevels, setConditionRiskLevels] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const resetForm = () => {
    setNewName("");
    setNewDescription("");
    setNewAction("allow");
    setNewPriority(5);
    setConditionTools([]);
    setConditionRoles([]);
    setConditionRiskLevels([]);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const condition: Record<string, unknown> = {};
      if (conditionTools.length > 0) condition.tools = conditionTools;
      if (conditionRoles.length > 0) condition.roles = conditionRoles;
      if (conditionRiskLevels.length > 0) condition.riskLevels = conditionRiskLevels;

      await createPolicy({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        condition,
        action: newAction,
        priority: newPriority,
        enabled: true,
      });
      resetForm();
      setAddOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (policy: PolicyRuleInfo) => {
    await updatePolicy(policy.id, { enabled: !policy.enabled });
  };

  const handleDelete = async (id: string) => {
    await deletePolicy(id);
  };

  const toggleConditionItem = (
    arr: string[],
    setArr: (v: string[]) => void,
    item: string
  ) => {
    setArr(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f141b]">
      {/* Header */}
      <div className="p-3 border-b border-[#2a3441] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-[#ffd60a]" />
          <span className="text-xs font-semibold text-[#d7dde5]">Policies</span>
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0 h-4 bg-[#2a3441] text-[#5b6b81] border-0"
            style={{ borderRadius: 0 }}
          >
            {policies.length}
          </Badge>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-[#8a94a3] hover:text-[#d7dde5] hover:bg-[#2a3441]"
            >
              <Plus size={14} />
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-[#0f141b] border-[#2a3441] text-[#d7dde5] max-w-md"
            style={{ borderRadius: 0 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#d7dde5]">
                <Shield size={16} className="text-[#ffd60a]" />
                Add Policy Rule
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-[#5b6b81] uppercase tracking-wider font-medium">
                  Name
                </Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Block Critical Actions"
                  className="h-8 text-[12px] bg-[#0b1118] border-[#2a3441] text-[#d7dde5] focus:border-[#ffd60a]"
                  style={{ borderRadius: 0 }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-[#5b6b81] uppercase tracking-wider font-medium">
                  Description
                </Label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description"
                  className="h-8 text-[12px] bg-[#0b1118] border-[#2a3441] text-[#d7dde5] focus:border-[#ffd60a]"
                  style={{ borderRadius: 0 }}
                />
              </div>

              {/* Condition Builder */}
              <div className="space-y-2">
                <Label className="text-[10px] text-[#5b6b81] uppercase tracking-wider font-medium">
                  Conditions (match any)
                </Label>
                {/* Tools */}
                <div>
                  <span className="text-[9px] text-[#475569] uppercase tracking-wider">
                    Tools
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {toolOptions.map((tool) => (
                      <button
                        key={tool}
                        onClick={() =>
                          toggleConditionItem(conditionTools, setConditionTools, tool)
                        }
                        className={`text-[9px] px-1.5 py-0.5 border transition-all ${
                          conditionTools.includes(tool)
                            ? "bg-[#ffd60a]/15 border-[#ffd60a]/40 text-[#ffd60a]"
                            : "bg-[#0b1118] border-[#2a3441] text-[#5b6b81] hover:border-[#3a4553]"
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Roles */}
                <div>
                  <span className="text-[9px] text-[#475569] uppercase tracking-wider">
                    Roles
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {roleOptions.map((role) => (
                      <button
                        key={role}
                        onClick={() =>
                          toggleConditionItem(conditionRoles, setConditionRoles, role)
                        }
                        className={`text-[9px] px-1.5 py-0.5 border transition-all ${
                          conditionRoles.includes(role)
                            ? "bg-[#ffd60a]/15 border-[#ffd60a]/40 text-[#ffd60a]"
                            : "bg-[#0b1118] border-[#2a3441] text-[#5b6b81] hover:border-[#3a4553]"
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Risk Levels */}
                <div>
                  <span className="text-[9px] text-[#475569] uppercase tracking-wider">
                    Risk Levels
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {riskLevelOptions.map((rl) => (
                      <button
                        key={rl}
                        onClick={() =>
                          toggleConditionItem(
                            conditionRiskLevels,
                            setConditionRiskLevels,
                            rl
                          )
                        }
                        className={`text-[9px] px-1.5 py-0.5 border transition-all ${
                          conditionRiskLevels.includes(rl)
                            ? "bg-[#ffd60a]/15 border-[#ffd60a]/40 text-[#ffd60a]"
                            : "bg-[#0b1118] border-[#2a3441] text-[#5b6b81] hover:border-[#3a4553]"
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        {rl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-[#5b6b81] uppercase tracking-wider font-medium">
                  Action
                </Label>
                <Select value={newAction} onValueChange={setNewAction}>
                  <SelectTrigger className="w-full h-8 text-[12px] bg-[#0b1118] border-[#2a3441] text-[#d7dde5]" style={{ borderRadius: 0 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b1016] border-[#2a3441]" style={{ borderRadius: 0 }}>
                    <SelectItem value="allow" className="text-[12px] text-[#d7dde5]">
                      Allow
                    </SelectItem>
                    <SelectItem value="block" className="text-[12px] text-[#d7dde5]">
                      Block
                    </SelectItem>
                    <SelectItem value="ask_user" className="text-[12px] text-[#d7dde5]">
                      Ask User
                    </SelectItem>
                    <SelectItem value="shadow" className="text-[12px] text-[#d7dde5]">
                      Shadow (log only)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#8a94a3]">Priority</span>
                  <span className="text-[11px] text-[#ffd60a] font-mono">{newPriority}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={newPriority}
                  onChange={(e) => setNewPriority(Number(e.target.value))}
                  className="w-full accent-[#ffd60a]"
                />
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
                disabled={!newName.trim() || isCreating}
                className="h-8 text-[11px] gap-1.5 border-2 border-black disabled:opacity-50"
                style={{ background: "#ffd60a", color: "#000", boxShadow: "2px 2px 0 #000" }}
              >
                {isCreating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Shield size={12} />
                )}
                Add Policy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Policy List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {policies.length === 0 ? (
            <div className="text-center py-6 px-3">
              <Shield size={20} className="mx-auto text-[#3a4553] mb-2" />
              <p className="text-[11px] text-[#5b6b81]">No policies configured</p>
              <p className="text-[10px] text-[#475569] mt-0.5">
                Click + to add a policy rule
              </p>
            </div>
          ) : (
            policies.map((policy) => {
              const actionColor = actionColors[policy.action] || "#5b6b81";
              return (
                <Card
                  key={policy.id}
                  className={`bg-[#0b1118] border-[#2a3441] p-2.5 ${
                    !policy.enabled ? "opacity-50" : ""
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-[#d7dde5] truncate">
                          {policy.name}
                        </span>
                        {policy.action === "allow" && (
                          <CheckCircle size={10} className="text-[#22C55E] shrink-0" />
                        )}
                        {policy.action === "block" && (
                          <XCircle size={10} className="text-[#EF4444] shrink-0" />
                        )}
                        {policy.action === "ask_user" && (
                          <AlertTriangle size={10} className="text-[#F59E0B] shrink-0" />
                        )}
                      </div>
                      {policy.description && (
                        <p className="text-[9px] text-[#5b6b81] mt-0.5 line-clamp-1">
                          {policy.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-[8px] px-1 py-0 h-3.5 border-0"
                          style={{
                            borderRadius: 0,
                            background: actionColor + "20",
                            color: actionColor,
                          }}
                        >
                          {policy.action}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[8px] px-1 py-0 h-3.5 bg-[#2a3441] text-[#5b6b81] border-0"
                          style={{ borderRadius: 0 }}
                        >
                          P{policy.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Switch
                        checked={policy.enabled}
                        onCheckedChange={() => handleToggle(policy)}
                        className="data-[state=checked]:bg-[#ffd60a] scale-75"
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-1 hover:bg-[#EF4444]/20 transition-colors" style={{ borderRadius: 0 }}>
                            <Trash2 size={10} className="text-[#EF4444]" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#0b1016] border-[#2a3441]" style={{ borderRadius: 0 }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-[#d7dde5] text-sm">
                              Delete Policy
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-[#8a94a3]">
                              Delete &quot;{policy.name}&quot;? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-[#0f141b] border-[#2a3441] text-[#8a94a3]">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(policy.id)}
                              className="bg-[#EF4444] text-white hover:bg-[#DC2626] border-none"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
