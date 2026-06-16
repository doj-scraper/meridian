// ═══════════════════════════════════════════════════════════════════════
// PIPELINE DATA — Mock workflow definition & local simulation
// Decoupled from emergent.sh, Fastify, MongoDB, and all backend services.
// This provides the shell with static data and a local event simulator.
// ═══════════════════════════════════════════════════════════════════════

export type PipelinePhase = {
  id: string;
  name: string;
  order: number;
};

export type PipelineNode = {
  id: string;
  name: string;
  phase: string;
  role: "entry" | "process" | "exit" | "gate" | "recovery" | "decision";
  type: "action" | "decision" | "terminal";
  icon: string;
  handler: string;
  intent?: string;
  failure_probability?: number;
  compensation?: string;
  policy?: Record<string, unknown>;
  retry_policy?: Record<string, unknown>;
  circuit_breaker?: Record<string, unknown>;
};

export type PipelineEdge = {
  from: string;
  to: string;
  severity: "clean" | "warning" | "critical";
  action_id?: string;
  label?: string;
  narrative?: string;
  condition?: string;
  probability?: number;
};

export type WorkflowDefinition = {
  id: string;
  slug: string;
  name: string;
  version: number;
  description: string;
  entry_node_id: string;
  phases: PipelinePhase[];
  nodes: PipelineNode[];
  edges: PipelineEdge[];
};

export type NodeState = "idle" | "active" | "success" | "warning" | "failure" | "decision-active";

export type SimEvent = {
  type: string;
  payload: Record<string, unknown>;
  severity?: "clean" | "warning" | "critical";
  description: string;
};

// ── Canonical DevOps Pipeline (from the original workflow JSON) ──────────
export const DEVOPS_PIPELINE: WorkflowDefinition = {
  id: "wf_devops_v1",
  slug: "devops_pipeline",
  name: "DevOps Release Pipeline",
  version: 1,
  description: "Canonical DevOps pipeline — Design → Code → Build → QA → Release",
  entry_node_id: "n1",
  phases: [
    { id: "design", name: "Design", order: 1 },
    { id: "code", name: "Code", order: 2 },
    { id: "build", name: "Build", order: 3 },
    { id: "qa", name: "QA", order: 4 },
    { id: "release", name: "Release", order: 5 },
  ],
  nodes: [
    { id: "n1", name: "Branching", phase: "design", role: "entry", type: "action", icon: "branch", handler: "simulate" },
    { id: "n2", name: "Commit", phase: "design", role: "process", type: "action", icon: "commit", handler: "simulate" },
    { id: "n3", name: "Pull Request", phase: "design", role: "process", type: "action", icon: "pr", handler: "simulate" },
    { id: "n25", name: "Design Gate", phase: "design", role: "gate", type: "decision", icon: "traffic", handler: "decision", intent: "Quality Control" },

    { id: "n4", name: "Lint", phase: "code", role: "entry", type: "action", icon: "lint", handler: "simulate" },
    { id: "n5", name: "Static Analysis", phase: "code", role: "process", type: "action", icon: "static", handler: "simulate" },
    { id: "n6", name: "Unit Tests", phase: "code", role: "exit", type: "action", icon: "unit", handler: "simulate" },
    { id: "n7", name: "Test Failure", phase: "code", role: "recovery", type: "decision", icon: "fail", handler: "decision", intent: "Risk Acceptance" },
    { id: "n18", name: "Feature Flag", phase: "code", role: "recovery", type: "action", icon: "flag", handler: "simulate" },

    { id: "n9", name: "Build System", phase: "build", role: "entry", type: "action", icon: "build", handler: "simulate" },
    { id: "n10", name: "Compile", phase: "build", role: "process", type: "action", icon: "compile", handler: "simulate" },
    { id: "n12", name: "Cache", phase: "build", role: "process", type: "action", icon: "cache", handler: "simulate" },
    { id: "n11", name: "Package", phase: "build", role: "process", type: "action", icon: "artifact", handler: "simulate" },
    { id: "n13", name: "Container", phase: "build", role: "exit", type: "action", icon: "container", handler: "simulate" },

    { id: "n15", name: "Test Env", phase: "qa", role: "entry", type: "action", icon: "env", handler: "simulate" },
    { id: "n8", name: "Security Scan", phase: "qa", role: "process", type: "action", icon: "security", handler: "simulate" },
    { id: "n16", name: "Rollout Sim", phase: "qa", role: "process", type: "action", icon: "rollout", handler: "simulate" },
    { id: "n20", name: "Logs", phase: "qa", role: "exit", type: "action", icon: "logs", handler: "simulate" },

    { id: "n14", name: "Deploy", phase: "release", role: "entry", type: "action", icon: "deploy", handler: "simulate" },
    { id: "n22", name: "Broken Pipe", phase: "release", role: "recovery", type: "decision", icon: "broken", handler: "decision", intent: "Incident Response" },
    { id: "n17", name: "Rollback", phase: "release", role: "recovery", type: "action", icon: "rollback", handler: "simulate" },
    { id: "n21", name: "Alert", phase: "release", role: "recovery", type: "decision", icon: "alert", handler: "decision", intent: "Incident Response" },
    { id: "n23", name: "Success", phase: "release", role: "exit", type: "terminal", icon: "success", handler: "terminal" },
    { id: "n24", name: "Data Pipeline", phase: "release", role: "process", type: "action", icon: "data", handler: "simulate" },
    { id: "n19", name: "Monitor", phase: "release", role: "process", type: "action", icon: "monitor", handler: "simulate" },
  ],
  edges: [
    { from: "n1", to: "n2", severity: "clean" },
    { from: "n2", to: "n3", severity: "clean" },
    { from: "n3", to: "n25", severity: "clean" },
    { from: "n25", to: "n4", action_id: "approve", label: "Approve", severity: "clean", narrative: "Design Approved" },
    { from: "n25", to: "n1", action_id: "reject", label: "Reject", severity: "warning", narrative: "Design Rejected (Loop)" },

    { from: "n4", to: "n5", severity: "clean" },
    { from: "n5", to: "n6", severity: "clean" },
    { from: "n6", to: "n9", condition: "success", probability: 0.8, severity: "clean", narrative: "Tests Passed" },
    { from: "n6", to: "n7", condition: "failure", probability: 0.2, severity: "critical", narrative: "Tests Failed" },

    { from: "n7", to: "n4", action_id: "retry", label: "Retry Lint", severity: "clean", narrative: "Retrying Code" },
    { from: "n7", to: "n18", action_id: "waive", label: "Flag Waiver", severity: "warning", narrative: "Waived via Flag" },
    { from: "n18", to: "n9", severity: "warning" },

    { from: "n9", to: "n10", severity: "clean" },
    { from: "n10", to: "n12", severity: "clean" },
    { from: "n12", to: "n11", severity: "clean" },
    { from: "n11", to: "n13", severity: "clean" },
    { from: "n13", to: "n15", severity: "clean", narrative: "Build Successful" },

    { from: "n15", to: "n8", severity: "clean" },
    { from: "n8", to: "n16", severity: "clean" },
    { from: "n16", to: "n20", severity: "clean" },
    { from: "n20", to: "n14", severity: "clean", narrative: "QA Verified" },

    { from: "n14", to: "n23", condition: "success", probability: 0.8, severity: "clean", narrative: "Deploy Success" },
    { from: "n14", to: "n22", condition: "failure", probability: 0.2, severity: "critical", narrative: "Deploy Failed" },

    { from: "n22", to: "n17", action_id: "rollback", label: "Rollback", severity: "critical", narrative: "Rolled Back" },
    { from: "n22", to: "n21", action_id: "escalate", label: "Escalate", severity: "critical", narrative: "Escalated" },
    { from: "n17", to: "n21", severity: "critical", narrative: "System Unstable" },
    { from: "n21", to: "n14", action_id: "hotfix", label: "Hotfix", severity: "warning", narrative: "Hotfix Deployed" },
    { from: "n21", to: "n1", action_id: "abort", label: "Abort", severity: "critical", narrative: "Release Aborted" },

    { from: "n23", to: "n24", severity: "clean" },
    { from: "n24", to: "n19", severity: "clean" },
  ],
};

// ── Simulation: Walk through the pipeline steps locally ──────────────────
// Generates a sequence of events that the PipelineStudio can consume,
// without any backend. This replaces the orchestratorClient WebSocket.

const SEVERITY_RANK = { clean: 0, warning: 1, critical: 2 } as const;

function bumpSeverity(current: "clean" | "warning" | "critical", incoming: "clean" | "warning" | "critical"): "clean" | "warning" | "critical" {
  return (SEVERITY_RANK[incoming] > SEVERITY_RANK[current]) ? incoming : current;
}

export type SimulationCallbacks = {
  onPhaseEntered: (phase: string) => void;
  onPhaseCompleted: (phase: string, memory: "clean" | "warning" | "critical") => void;
  onNodeStarted: (nodeId: string) => void;
  onNodeCompleted: (nodeId: string) => void;
  onNodeRetry: (nodeId: string) => void;
  onNodeFailed: (nodeId: string) => void;
  onEdgeTraversed: (from: string, to: string, severity: "clean" | "warning" | "critical", narrative?: string) => void;
  onDecisionRequired: (nodeId: string, intent: string, options: { action_id: string; label: string; severity: "clean" | "warning" | "critical" }[], policyHint?: { source: string; confidence: number; reasoning: string }) => void;
  onWorkflowCompleted: () => void;
  onWorkflowFailed: () => void;
  onCompensationTriggered: (description: string) => void;
  onCircuitOpened: (description: string) => void;
};

export class PipelineSimulator {
  private workflow: WorkflowDefinition;
  private callbacks: SimulationCallbacks;
  private phaseMemory: Record<string, "clean" | "warning" | "critical"> = {};
  private stepIndex = 0;
  private timeoutIds: ReturnType<typeof setTimeout>[] = [];
  private completed = false;

  constructor(workflow: WorkflowDefinition, callbacks: SimulationCallbacks) {
    this.workflow = workflow;
    this.callbacks = callbacks;
  }

  start(chaosMode: boolean, policyOverride: string) {
    this.completed = false;
    this.stepIndex = 0;
    this.phaseMemory = {};
    void chaosMode; void policyOverride; // shell: reserved for future use

    // Build a deterministic path through the pipeline
    const path = this.buildHappyPath();

    // Fire execution_started
    this.schedule(0, () => {
      // walk through path
    });

    let delay = 200;
    for (let i = 0; i < path.length; i++) {
      const step = path[i];
      const currentDelay = delay;
      this.schedule(currentDelay, () => this.executeStep(step));
      delay += 400 + Math.random() * 600;
    }

    // Final step — workflow completed
    this.schedule(delay + 300, () => {
      if (!this.completed) {
        this.callbacks.onWorkflowCompleted();
        this.completed = true;
      }
    });
  }

  stop() {
    this.completed = true;
    this.timeoutIds.forEach(clearTimeout);
    this.timeoutIds = [];
  }

  private schedule(delay: number, fn: () => void) {
    this.timeoutIds.push(setTimeout(fn, delay));
  }

  private buildHappyPath(): SimStep[] {
    // Follow the main "happy path" through the pipeline
    const steps: SimStep[] = [];
    const phases = this.workflow.phases;
    let currentPhaseId = "";

    for (const phase of phases) {
      if (currentPhaseId !== phase.id) {
        steps.push({ type: "phase_enter", phaseId: phase.id });
        currentPhaseId = phase.id;
      }

      const phaseNodes = this.workflow.nodes.filter((n) => n.phase === phase.id);
      for (const node of phaseNodes) {
        // Skip recovery/decision nodes on happy path (unless they're the gate)
        if (node.role === "recovery" && node.type === "decision") continue;
        if (node.role === "recovery" && node.type === "action") continue;

        steps.push({ type: "node_start", nodeId: node.id });

        if (node.type === "decision" && node.role === "gate") {
          steps.push({ type: "decision_required", nodeId: node.id, intent: node.intent || "Approval Required" });
          // Auto-approve on happy path
          steps.push({ type: "auto_approve", nodeId: node.id });
        } else {
          steps.push({ type: "node_complete", nodeId: node.id });
        }
      }

      steps.push({ type: "phase_complete", phaseId: phase.id });
    }

    return steps;
  }

  private executeStep(step: SimStep) {
    if (this.completed) return;

    switch (step.type) {
      case "phase_enter":
        this.callbacks.onPhaseEntered(step.phaseId!);
        if (!this.phaseMemory[step.phaseId!]) this.phaseMemory[step.phaseId!] = "clean";
        break;

      case "phase_complete": {
        const mem = this.phaseMemory[step.phaseId!] || "clean";
        this.callbacks.onPhaseCompleted(step.phaseId!, mem);
        break;
      }

      case "node_start":
        this.callbacks.onNodeStarted(step.nodeId!);
        break;

      case "node_complete": {
        this.callbacks.onNodeCompleted(step.nodeId!);
        // Find edge from this node
        const edge = this.workflow.edges.find((e) => e.from === step.nodeId);
        if (edge) {
          this.callbacks.onEdgeTraversed(edge.from, edge.to, edge.severity, edge.narrative);
          const srcNode = this.workflow.nodes.find((n) => n.id === edge.from);
          if (srcNode) {
            this.phaseMemory[srcNode.phase] = bumpSeverity(
              this.phaseMemory[srcNode.phase] || "clean",
              edge.severity
            );
          }
        }
        break;
      }

      case "decision_required": {
        // Get options from edges that have action_id
        const options = this.workflow.edges
          .filter((e) => e.from === step.nodeId && e.action_id)
          .map((e) => ({
            action_id: e.action_id!,
            label: e.label || e.action_id!,
            severity: e.severity,
          }));
        this.callbacks.onDecisionRequired(
          step.nodeId!,
          step.intent || "Intervention Required",
          options,
          { source: "probabilistic", confidence: 0.82, reasoning: "Auto-suggesting approve on happy path" }
        );
        break;
      }

      case "auto_approve": {
        // Auto-approve the decision after a short delay
        const approveEdge = this.workflow.edges.find(
          (e) => e.from === step.nodeId && e.action_id === "approve"
        );
        if (approveEdge) {
          this.callbacks.onEdgeTraversed(approveEdge.from, approveEdge.to, approveEdge.severity, approveEdge.narrative);
          this.callbacks.onNodeCompleted(step.nodeId!);
          const srcNode = this.workflow.nodes.find((n) => n.id === approveEdge.from);
          if (srcNode) {
            this.phaseMemory[srcNode.phase] = bumpSeverity(
              this.phaseMemory[srcNode.phase] || "clean",
              approveEdge.severity
            );
          }
        }
        break;
      }
    }
  }
}

type SimStep = {
  type: "phase_enter" | "phase_complete" | "node_start" | "node_complete" | "decision_required" | "auto_approve";
  phaseId?: string;
  nodeId?: string;
  intent?: string;
};
