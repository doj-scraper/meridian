"use client";

import { useState } from "react";
import { useAgentStore, type AgentInfo } from "@/store/agent-store";
import {
  Bot,
  Search,
  PenLine,
  Code,
  BarChart3,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  GitBranch,
  Shield,
  Users,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const templates = [
  { name: "Research Agent", icon: Search, goal: "Research and analyze information on a given topic", tools: ["search", "write"], color: "#00d1ff", role: "researcher" },
  { name: "Content Writer", icon: PenLine, goal: "Generate high-quality written content and articles", tools: ["search", "write"], color: "#22c55e", role: "executor" },
  { name: "Code Assistant", icon: Code, goal: "Generate, review, and debug code", tools: ["code", "search"], color: "#ffd60a", role: "executor" },
  { name: "Business Analyst", icon: BarChart3, goal: "Analyze business data and generate insights", tools: ["search", "write", "code"], color: "#f59e0b", role: "researcher" },
];

const v2Templates = [
  { name: "Deep Research", icon: GitBranch, goal: "Conduct multi-source deep research with synthesis", tools: ["search", "write", "browser"], color: "#00d1ff", role: "planner", mode: "sequential" as const },
  { name: "Code Reviewer", icon: Shield, goal: "Write code, self-critique, and iterate until approved", tools: ["code", "write"], color: "#ffd60a", role: "critic", mode: "sequential" as const, reflection: true },
  { name: "Parallel Research", icon: Users, goal: "Research multiple topics simultaneously for speed", tools: ["search", "browser"], color: "#22c55e", role: "researcher", mode: "parallel" as const },
];

const ROLE_COLORS: Record<string, string> = {
  general: "#8a94a3",
  planner: "#00d1ff",
  researcher: "#22c55e",
  executor: "#ffd60a",
  critic: "#f59e0b",
  reviewer: "#ef4444",
};

const statusIcons: Record<string, React.ReactNode> = {
  running: <Loader2 size={10} className="animate-spin" style={{ color: "#00d1ff" }} />,
  completed: <CheckCircle size={10} style={{ color: "#22c55e" }} />,
  failed: <AlertCircle size={10} style={{ color: "#ef4444" }} />,
  stopped: <AlertCircle size={10} style={{ color: "#ffd60a" }} />,
  pending: <Clock size={10} style={{ color: "#8a94a3" }} />,
};

function FolderSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-1.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest transition-colors"
        style={{ color: "#d7dde5" }}
      >
        <ChevronDown
          size={10}
          style={{ color: "#8a94a3", transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}
        />
        {title}
      </button>
      {open && (
        <div className="ml-3 pl-2.5" style={{ borderLeft: "1px dashed #2a3441" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function AgentSidebar() {
  const {
    agents,
    selectedAgentId,
    selectAgent,
    runs,
    createAgent,
    fetchAgents,
    deleteAgent,
    teams,
    runTeam,
  } = useAgentStore();

  const handleTemplateClick = async (template: typeof templates[0]) => {
    const agent = await createAgent({
      name: template.name, goal: template.goal, personality: "helpful and thorough assistant",
      tools: template.tools, maxSteps: 10, autoRun: true, outputFormat: "markdown",
      role: template.role, orchestrationMode: "single",
    } as Partial<AgentInfo>);
    if (agent) { selectAgent(agent.id); await fetchAgents(); }
  };

  const handleV2TemplateClick = async (template: typeof v2Templates[0]) => {
    const agent = await createAgent({
      name: template.name, goal: template.goal, personality: "helpful and thorough assistant",
      tools: template.tools, maxSteps: 15, autoRun: true, outputFormat: "markdown",
      role: template.role, orchestrationMode: template.mode,
      reflectionEnabled: template.reflection || false, reflectionMaxIter: 3,
    } as Partial<AgentInfo>);
    if (agent) { selectAgent(agent.id); await fetchAgents(); }
  };

  const handleDeleteAgent = async (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    await deleteAgent(agentId);
  };

  return (
    <div
      className="w-[260px] flex flex-col h-full shrink-0"
      style={{ background: "#0f141b", borderRight: "2px solid #000" }}
    >
      {/* Header — minimal, no create button (moved to menubar) */}
      <div
        className="px-3 py-2 flex items-center"
        style={{ background: "#141b23", borderBottom: "2px solid #000" }}
      >
        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#8a94a3" }}>
          Explorer
        </span>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1 px-2 py-2">
        {/* Agents Folder */}
        <FolderSection title="Agents" defaultOpen>
          {agents.length === 0 ? (
            <div className="text-center py-4 px-2">
              <Bot size={20} className="mx-auto mb-1.5" style={{ color: "#2a3441" }} />
              <p className="text-[10px]" style={{ color: "#8a94a3" }}>
                No agents yet. Use File → New Agent or pick a template.
              </p>
            </div>
          ) : (
            agents.map((agent) => {
              const roleColor = ROLE_COLORS[agent.role || "general"] || ROLE_COLORS.general;
              const isActive = selectedAgentId === agent.id;
              return (
                <div
                  key={agent.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectAgent(agent.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectAgent(agent.id); } }}
                  className="group w-full text-left flex items-center gap-2 px-2 py-1.5 text-[11px] transition-all mb-0.5 cursor-pointer"
                  style={{
                    color: isActive ? "#ffd60a" : "#8a94a3",
                    background: isActive ? "#0d131b" : "transparent",
                    border: isActive ? "1px solid #3a4553" : "1px solid transparent",
                  }}
                >
                  <div
                    className="w-2 h-2 shrink-0"
                    style={{ background: roleColor, border: "1px solid #000" }}
                  />
                  <span className="truncate flex-1">{agent.name}</span>
                  {agent.orchestrationMode && agent.orchestrationMode !== "single" && (
                    <span
                      className="text-[8px] px-1 py-0 tracking-wider uppercase"
                      style={{ background: "#0c1219", border: "1px solid #2a3441", color: "#00d1ff" }}
                    >
                      {agent.orchestrationMode}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDeleteAgent(e, agent.id)}
                    className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 transition-opacity"
                    style={{ color: "#ef4444" }}
                  >
                    <Trash2 size={9} />
                  </button>
                </div>
              );
            })
          )}
        </FolderSection>

        {/* Skills Folder */}
        <FolderSection title="Skills" defaultOpen={false}>
          {["web.search", "code.exec", "memory.retrieve", "write.file"].map((skill) => (
            <div
              key={skill}
              className="flex items-center gap-2 px-2 py-1.5 text-[11px]"
              style={{ color: "#8a94a3" }}
            >
              <div className="w-2 h-2 shrink-0" style={{ background: "#2a3441", border: "1px solid #000" }} />
              {skill}
            </div>
          ))}
        </FolderSection>

        {/* Workflows Folder */}
        <FolderSection title="Workflows" defaultOpen={false}>
          {teams.length === 0 ? (
            <p className="text-[10px] px-2" style={{ color: "#5b6b81" }}>
              No workflows yet. Use File → New Team.
            </p>
          ) : (
            teams.map((team) => (
              <button
                key={team.id}
                onClick={() => runTeam(team.id)}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-[11px] transition-all mb-0.5"
                style={{ color: "#8a94a3" }}
              >
                <div className="w-2 h-2 shrink-0" style={{ background: "#00d1ff", border: "1px solid #000" }} />
                <span className="truncate flex-1">{team.name}</span>
                <span
                  className="text-[8px] px-1 py-0 tracking-wider uppercase"
                  style={{ background: "#0c1219", border: "1px solid #2a3441", color: "#00d1ff" }}
                >
                  {team.mode}
                </span>
              </button>
            ))
          )}
        </FolderSection>

        {/* Quick Templates — collapsed by default since it's secondary */}
        <FolderSection title="Templates" defaultOpen={false}>
          <div className="space-y-0.5">
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => handleTemplateClick(template)}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-[11px] transition-colors"
                style={{ color: "#8a94a3" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#101720"; e.currentTarget.style.color = "#d7dde5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8a94a3"; }}
              >
                <template.icon size={11} style={{ color: template.color }} />
                <span>{template.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-2 pt-2" style={{ borderTop: "1px dashed #1b2430" }}>
            <div className="text-[9px] font-semibold tracking-widest uppercase mb-1.5 px-1 flex items-center gap-1" style={{ color: "#00d1ff" }}>
              <Sparkles size={8} />
              Multi-Agent
            </div>
            <div className="space-y-0.5">
              {v2Templates.map((template) => (
                <button
                  key={template.name}
                  onClick={() => handleV2TemplateClick(template)}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-[11px] transition-colors"
                  style={{ color: "#8a94a3", border: "1px solid transparent" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#101720";
                    e.currentTarget.style.color = "#d7dde5";
                    e.currentTarget.style.borderColor = "#2a3441";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#8a94a3";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <template.icon size={11} style={{ color: template.color }} />
                  <span className="flex-1">{template.name}</span>
                  <span className="text-[8px] tracking-wider uppercase" style={{ color: "#5b6b81" }}>
                    {template.mode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </FolderSection>

        {/* Recent Runs */}
        <FolderSection title="Recent Runs" defaultOpen={false}>
          {runs.length === 0 ? (
            <p className="text-[9px] px-2" style={{ color: "#5b6b81" }}>
              No runs yet.
            </p>
          ) : (
            runs.slice(0, 5).map((run) => (
              <div
                key={run.id}
                className="flex items-center gap-2 px-2 py-1 text-[10px]"
                style={{ color: "#8a94a3" }}
              >
                {statusIcons[run.status] || statusIcons.pending}
                <span className="truncate flex-1">{run.agentName || "Quick Run"}</span>
                <span style={{ color: "#5b6b81" }}>
                  {run.stepCount || 0}s
                </span>
              </div>
            ))
          )}
        </FolderSection>
      </ScrollArea>
    </div>
  );
}
