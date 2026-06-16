"use client";

import { useAgentStore } from "@/store/agent-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ArrowRight, CheckCircle, Bot } from "lucide-react";
import { useState } from "react";

const examplePrompts = [
  "Analyze market trends and generate a report",
  "Write blog posts about AI and technology",
  "Find trending products and create ad copy",
  "Debug and optimize Python code",
  "Research competitors and suggest strategies",
  "Generate social media content calendar",
];

export function AgentBuilderWizard() {
  const { builderOpen, setBuilderOpen, buildAgent, isBuilding } = useAgentStore();
  const [input, setInput] = useState("");
  const [step, setStep] = useState<"input" | "building" | "result">("input");
  const [result, setResult] = useState<{
    config: Record<string, unknown>;
    agent: { id: string; name: string } | null;
  } | null>(null);

  const handleBuild = async () => {
    if (!input.trim()) return;
    setStep("building");
    try {
      const res = await fetch("/api/agent/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: input, save: true }),
      });
      const data = await res.json();
      setResult(data);
      setStep("result");
    } catch (error) {
      console.error("Build error:", error);
      setStep("input");
    }
  };

  const handleClose = () => {
    setBuilderOpen(false);
    setStep("input");
    setInput("");
    setResult(null);
    if (result?.agent) {
      useAgentStore.getState().fetchAgents();
      useAgentStore.getState().selectAgent(result.agent.id);
    }
  };

  return (
    <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
      <DialogContent
        style={{
          background: "#0f141b",
          border: "2px solid #000",
          borderRadius: 0,
          color: "#d7dde5",
          maxWidth: "480px",
          boxShadow: "6px 6px 0 #000",
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: "#d7dde5" }}>
            <Sparkles size={16} style={{ color: "#ffd60a" }} />
            <span className="text-[12px] tracking-wider uppercase font-semibold">AI Agent Builder</span>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
              <div>
                <p className="text-[11px] mb-2" style={{ color: "#8a94a3" }}>
                  Describe what you want your agent to do. AI will design the configuration.
                </p>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="I want an agent that..."
                  rows={4}
                  style={{
                    background: "#0b1118",
                    border: "2px solid #000",
                    boxShadow: "2px 2px 0 #000",
                    color: "#d7dde5",
                    borderRadius: 0,
                    resize: "none",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "11px",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleBuild();
                    }
                  }}
                />
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: "#5b6b81" }}>
                  Try an example
                </p>
                <div className="flex flex-wrap gap-1">
                  {examplePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="text-[9px] px-2 py-1 transition-all"
                      style={{
                        background: "#0c1219",
                        border: "1px solid #2a3441",
                        color: "#8a94a3",
                        borderRadius: 0,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ffd60a40"; e.currentTarget.style.color = "#d7dde5"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a3441"; e.currentTarget.style.color = "#8a94a3"; }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleBuild}
                disabled={!input.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 text-[10px] tracking-wider uppercase font-semibold transition-all"
                style={{
                  background: input.trim() ? "#ffd60a" : "#1a212b",
                  color: input.trim() ? "#000" : "#5b6b81",
                  border: "2px solid #000",
                  boxShadow: input.trim() ? "2px 2px 0 #000" : "none",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  borderRadius: 0,
                }}
              >
                <Sparkles size={12} />
                Build Agent
                <ArrowRight size={12} />
              </button>
            </motion.div>
          )}

          {step === "building" && (
            <motion.div key="building" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="py-8 flex flex-col items-center text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-14 h-14 flex items-center justify-center mb-3"
                style={{ background: "#ffd60a15", border: "2px solid #000", boxShadow: "4px 4px 0 #000" }}
              >
                <Bot size={24} style={{ color: "#ffd60a" }} />
              </motion.div>
              <p className="text-[12px] font-semibold tracking-wider uppercase" style={{ color: "#d7dde5" }}>
                Designing your agent...
              </p>
              <p className="text-[10px] mt-1" style={{ color: "#8a94a3" }}>
                AI is analyzing your requirements
              </p>
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} style={{ color: "#22c55e" }} />
                <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: "#22c55e" }}>
                  Agent Created
                </span>
              </div>

              <div style={{ background: "#0b1118", border: "2px solid #000", boxShadow: "2px 2px 0 #000", borderRadius: 0, padding: 12 }} className="space-y-2">
                <div>
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: "#5b6b81" }}>Name</span>
                  <p className="text-[12px] font-semibold" style={{ color: "#d7dde5" }}>
                    {(result.config as Record<string, string>).name}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: "#5b6b81" }}>Goal</span>
                  <p className="text-[11px]" style={{ color: "#8a94a3" }}>
                    {(result.config as Record<string, string>).goal}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: "#5b6b81" }}>Personality</span>
                  <p className="text-[11px]" style={{ color: "#8a94a3" }}>
                    {(result.config as Record<string, string>).personality}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: "#5b6b81" }}>Tools</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {((result.config as Record<string, string[]>).tools || []).map((tool: string) => (
                      <span key={tool} className="text-[9px] px-1.5 py-0" style={{ background: "#ffd60a15", border: "1px solid #ffd60a40", color: "#ffd60a", borderRadius: 0 }}>
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 py-1.5 text-[9px] tracking-wider uppercase"
                  style={{ background: "#1a212b", border: "2px solid #000", color: "#8a94a3", boxShadow: "2px 2px 0 #000", borderRadius: 0 }}
                  onClick={() => { setStep("input"); setResult(null); }}
                >
                  Try Again
                </button>
                <button
                  className="flex-1 py-1.5 text-[9px] tracking-wider uppercase font-semibold flex items-center justify-center gap-1"
                  style={{ background: "#ffd60a", border: "2px solid #000", color: "#000", boxShadow: "2px 2px 0 #000", borderRadius: 0 }}
                  onClick={handleClose}
                >
                  <CheckCircle size={10} /> Use Agent
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
