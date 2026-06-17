# Agent Studio OS — V2.0 Upgrade Plan

> **Status:** Draft — Ready for Review & Implementation  
> **Date:** March 4, 2026  
> **Based on:** AGENTIC_OS_V2_PLAN.md, agenticNotebooklm.md, agentsNotebooklm.md, and V1 codebase analysis

---

## Executive Summary

Agent Studio OS V1 established a solid foundation: visual canvas, single-agent execution with Plan→Execute→Evaluate, SSE streaming, kill switch, and an AI Builder wizard. V2 transforms this from a **task-orchestration UI** into a full **Agent Runtime OS** — a platform where specialized agents collaborate through structured orchestration patterns, govern themselves with policies, persist knowledge across runs, and operate within verifiable safety boundaries.

The upgrade is organized into **4 phases** across **12 major workstreams**, informed by current research on multi-agent orchestration (AutoGen), the Evaluator-Optimizer reflection pattern, OS-level resource management (AgentCgroup), and production-grade security (SEAgent).

---

## Current V1 State (What We Have)

| Feature | Status |
|---------|--------|
| Agent CRUD (create, list, update) | ✅ Working |
| AI Agent Builder (NL → config) | ✅ Working |
| Quick Templates (4 presets) | ✅ Working |
| Visual Canvas (React Flow) | ✅ Working |
| Single-Agent Execution Loop | ✅ Working |
| SSE Live Streaming | ✅ Working |
| Kill Switch | ✅ Working |
| Inspector Panel | ✅ Working |
| Run History | ✅ Working |
| Step Persistence (SQLite) | ✅ Working |
| **Tool implementations** | ❌ All simulated |
| **Multi-agent orchestration** | ❌ Not built |
| **Reflection / self-critique** | ❌ Not built |
| **Role system** | ❌ Not built |
| **Persistent memory** | ❌ Not built |
| **Policy / approval gates** | ❌ Not built |
| **Observability / metrics** | ❌ Not built |
| **Parallel execution** | ❌ Not built |
| **Task graph decomposition** | ❌ Not built |
| **Artifact storage** | ❌ Not built |
| **Canvas persistence on reload** | ❌ Not built |
| **Agent deletion endpoint** | ❌ Not built |
| **User authentication** | ❌ Model exists, no routes |

---

## Phase 0: Foundation Fixes (Pre-V2 Prerequisites)

*These are V1 gaps that must be resolved before any V2 work begins.*

### 0.1 — Real Tool Implementations
**Problem:** All 5 tools (search, write, code, browser, finish) return simulated data.  
**Solution:** Wire each tool to actual capabilities via `z-ai-web-dev-sdk` and platform services.

| Tool | V2 Implementation |
|------|-------------------|
| `search` | Call `z-ai-web-dev-sdk` web-search skill |
| `write` | Persist output as an Artifact (new model) |
| `code` | Execute in sandboxed subprocess with timeout |
| `browser` | Call `z-ai-web-dev-sdk` web-reader skill |
| `finish` | Return final result + mark run complete |

**Files to modify:** `src/lib/agent/tools.ts`

### 0.2 — Canvas Persistence
**Problem:** `graphData` is saved but never loaded back on page refresh.  
**Solution:** In `agent-store.ts` `fetchAgents()`, parse each agent's `graphData` and restore canvas nodes/edges.

**Files to modify:** `src/store/agent-store.ts`

### 0.3 — Agent Deletion
**Problem:** No DELETE endpoint exists.  
**Solution:** Add `DELETE /api/agent/delete` route, cascade delete runs + steps.

**Files to add:** `src/app/api/agent/delete/route.ts`

### 0.4 — Legacy Component Cleanup
**Problem:** 5 stale component files exist at `src/components/` root (outside `agent/` subfolder).  
**Solution:** Remove `agent-canvas.tsx`, `agent-node.tsx`, `agent-sidebar.tsx`, `agent-inspector.tsx`, `agent-run-view.tsx` from `src/components/`.

### 0.5 — Model Configuration
**Problem:** Model is hardcoded in planner/evaluator.  
**Solution:** Add `model` field to `AgentConfig` type and Prisma schema. Allow per-agent model selection. Default to `gemini-2.5-pro` as specified in V2 plan.

**Files to modify:** `prisma/schema.prisma`, `src/lib/agent/types.ts`, `src/lib/agent/planner.ts`, `src/lib/agent/evaluator.ts`, `src/components/agent/agent-inspector.tsx`

---

## Phase 1: Multi-Agent Orchestration Engine (Core V2)

*This is the centerpiece of V2 — transforming from single-agent execution to multi-agent collaboration.*

### 1.1 — Orchestration Mode Engine

**Research basis:** AutoGen defines 3 core patterns — Sequential Pipeline, Group Chat, and Hierarchical Chat. Our V2 plan adds Parallel as a fourth mode.

**Implementation:**

```
OrchestrationMode = 'single' | 'sequential' | 'group' | 'hierarchical' | 'parallel'
```

| Mode | Description | Best For |
|------|-------------|----------|
| `single` | Current V1 behavior — one agent loops | Simple tasks, backward compat |
| `sequential` | Pipeline A→B→C with output handoff | Content workflows, ETL |
| `group` | Shared scratchpad, turn-taking manager | Deliberation, writer-editor-reviewer |
| `hierarchical` | Manager delegates to sub-agents | Complex projects with sub-tasking |
| `parallel` | Fan-out to N agents simultaneously | Speed-optimized research |

**Database changes:**
```prisma
model Agent {
  // ... existing fields
  orchestrationMode  String   @default("single")   // single|sequential|group|hierarchical|parallel
  maxConcurrency     Int      @default(3)           // for parallel mode
  teamId             String?                        // group agents by team
}
```

**New types** (`src/lib/agent/types.ts`):
```typescript
export interface TeamConfig {
  id: string
  name: string
  mode: OrchestrationMode
  agents: AgentConfig[]
  terminationCondition: TerminationCondition
  maxConcurrency?: number
}

export type TerminationCondition =
  | { type: 'max_steps'; value: number }
  | { type: 'text_mention'; text: string }
  | { type: 'approval'; requiredFrom: string[] }
  | { type: 'composite'; conditions: TerminationCondition[]; operator: 'and' | 'or' }
```

**New engine files:**
- `src/lib/agent/orchestrator.ts` — Master orchestrator that selects execution strategy
- `src/lib/agent/strategies/sequential.ts` — Pipeline execution
- `src/lib/agent/strategies/group.ts` — Shared-context turn-taking
- `src/lib/agent/strategies/hierarchical.ts` — Manager-worker delegation
- `src/lib/agent/strategies/parallel.ts` — Fan-out with concurrency control

**Key design principle (from AutoGen research):** Use **sequential** when steps are fixed and deterministic. Use **group chat** when agents need shared context and iterative collaboration. Replace LLM speaker selection with rules when the order is obvious.

### 1.2 — Sequential Pipeline Strategy

**How it works:** Each agent subscribes to its own "topic" (position in pipeline). Output of agent N becomes input of agent N+1. Termination occurs when the last agent emits `APPROVED` or `maxSteps` is reached.

**Implementation sketch:**
```typescript
// src/lib/agent/strategies/sequential.ts
export async function runSequentialPipeline(
  team: TeamConfig,
  input: string,
  eventEmitter: EventEmitter
): Promise<AgentEvent[]> {
  let currentInput = input;
  const allEvents: AgentEvent[] = [];

  for (const agent of team.agents) {
    const result = await runSingleAgent(agent, currentInput, eventEmitter);
    allEvents.push(...result.events);
    
    if (result.status === 'failed') break; // Stop pipeline on failure
    currentInput = result.output; // Handoff to next agent
  }

  return allEvents;
}
```

**UI impact:** "Execution Strategy" dropdown in sidebar/inspector. Pipeline agents shown connected left-to-right on canvas.

### 1.3 — Group Chat Strategy

**How it works:** All agents share a common message history. A Group Chat Manager (LLM-powered or rule-based) selects the next speaker. Termination on `APPROVE`, `TERMINATE`, or `maxMessages`.

**Implementation sketch:**
```typescript
// src/lib/agent/strategies/group.ts
export async function runGroupChat(
  team: TeamConfig,
  input: string,
  eventEmitter: EventEmitter
): Promise<AgentEvent[]> {
  const sharedHistory: ChatMessage[] = [{ role: 'user', content: input }];
  const allEvents: AgentEvent[] = [];
  let terminated = false;

  while (!terminated) {
    const nextSpeaker = await selectNextSpeaker(team, sharedHistory);
    const response = await runAgentTurn(nextSpeaker, sharedHistory, eventEmitter);
    sharedHistory.push({ role: 'assistant', content: response, source: nextSpeaker.name });
    
    terminated = checkTermination(sharedHistory, team.terminationCondition);
  }

  return allEvents;
}
```

**Speaker selection modes:**
- `llm` — Manager agent uses LLM to pick next speaker (flexible but slower)
- `round_robin` — Fixed rotation (simple, predictable)
- `rule_based` — E.g., "reviewer always speaks after writer" (efficient)

### 1.4 — Hierarchical Strategy

**How it works:** A manager/planner agent decomposes the goal, assigns sub-tasks to worker agents, collects results, and synthesizes the final output.

**Key insight from research:** Pairing a weaker, more delegative planner with a strong solver can outperform using a single top-tier model in both roles — the "combo effect."

### 1.5 — Parallel Strategy

**How it works:** Same input dispatched to N agents simultaneously. Results collected and merged. `maxConcurrency` limits simultaneous executions.

**Implementation:** Use `Promise.allSettled()` with a concurrency pool.

---

### 1.6 — Reflection Loop System (Evaluator-Optimizer Pattern)

**Research basis:** The Reflection pattern separates generation and critique into two roles — an Optimizer (Generator) and an Evaluator (Critic) — cycled iteratively. GPT-3.5 jumps from 48.1% to 95.1% on coding benchmarks when wrapped in an agentic refinement loop.

**Implementation:**

```typescript
// src/lib/agent/reflection.ts
export interface ReflectionConfig {
  enabled: boolean;
  maxIterations: number;     // Default: 3
  criticRole: string;        // Custom critic system prompt
  approvalCriteria: string;  // E.g., "APPROVED if no security vulnerabilities found"
  requireHumanApproval: boolean; // For high-stakes actions
}

export async function runReflectionLoop(
  generator: AgentConfig,
  critic: AgentConfig,
  input: string,
  config: ReflectionConfig,
  eventEmitter: EventEmitter
): Promise<ReflectionResult> {
  let iteration = 0;
  let currentOutput = '';
  let approved = false;

  while (iteration < config.maxIterations && !approved) {
    // Generator produces/revises output
    currentOutput = await runAgentTurn(generator, input, eventEmitter);
    
    // Critic evaluates
    const critique = await runCriticEvaluation(critic, currentOutput, config.approvalCriteria, eventEmitter);
    
    approved = critique.includes('APPROVED');
    if (!approved) {
      // Feed critique back to generator for revision
      input = `Previous output:\n${currentOutput}\n\nCritique:\n${critique}\n\nPlease revise.`;
    }
    
    iteration++;
    eventEmitter.emit('reflection_iteration', { iteration, approved, critique });
  }

  return { output: currentOutput, iterations: iteration, approved };
}
```

**Database changes:**
```prisma
model Agent {
  // ... existing fields
  reflectionEnabled   Boolean  @default(false)
  reflectionMaxIter   Int      @default(3)
  reflectionCriteria  String   @default("APPROVED if satisfactory")
}
```

**UI:** "Self-Improve Output" toggle in inspector. Live iteration log showing critique/fix cycle in run view.

---

### 1.7 — Agent Role System

**Research basis:** Specialization reduces context overload and makes multi-agent systems easier to debug than a single monolithic agent.

**Roles:**
```typescript
export type AgentRole = 'planner' | 'researcher' | 'executor' | 'critic' | 'reviewer' | 'custom';

export interface RolePermissions {
  read: boolean;     // Can read shared memory and artifacts
  write: boolean;    // Can create/modify artifacts
  execute: boolean;  // Can invoke tools
  approve: boolean;  // Can approve high-risk actions
  delegate: boolean; // Can assign tasks to other agents (manager only)
}
```

| Role | Read | Write | Execute | Approve | Delegate |
|------|------|-------|---------|---------|----------|
| `planner` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `researcher` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `executor` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `critic` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `reviewer` | ✅ | ❌ | ❌ | ✅ | ❌ |

**Database:**
```prisma
model Agent {
  // ... existing fields
  role          String   @default("executor")
  permissions   String   @default("read,write,execute")  // CSV
}
```

**UI:** Role badges with color coding on canvas nodes. Specialized config panels per role (e.g., critic gets "Approval Criteria" field, planner gets "Delegation Rules").

---

## Phase 2: Memory, Tools & Verification

### 2.1 — 3-Tier Memory Layer

**Research basis:** Agentic systems need memory at multiple levels — short-term working memory, long-term knowledge, and artifact storage. The shift from reactive assistants to autonomous workflows is built on external tools and memory rather than prompt-only reasoning.

**Architecture:**

| Tier | Scope | Storage | Lifecycle |
|------|-------|---------|-----------|
| **Session** | Current run | In-memory Map | Cleared when run ends |
| **Persistent** | Across runs | SQLite (new model) | Survives restarts |
| **Artifacts** | Files, code, outputs | SQLite + filesystem | Versioned, retrievable |

**Database changes:**
```prisma
model AgentMemory {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  key       String   // e.g., "user_preference", "project_context"
  value     String   // JSON string
  tier      String   @default("persistent") // session | persistent | artifact
  runId     String?  // Null for persistent, set for session
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([agentId, key, tier])
}

model Artifact {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  runId     String?
  name      String
  type      String   // code | text | json | markdown | file
  content   String   // The actual content
  metadata  String?  // JSON: size, language, version, etc.
  createdAt DateTime @default(now())
}
```

**New engine file:** `src/lib/agent/memory-v2.ts`
```typescript
export interface MemoryStore {
  // Session memory (in-memory, run-scoped)
  setSession(runId: string, key: string, value: any): void;
  getSession(runId: string, key: string): any;
  clearSession(runId: string): void;

  // Persistent memory (DB-backed, agent-scoped)
  setPersistent(agentId: string, key: string, value: any): Promise<void>;
  getPersistent(agentId: string, key: string): Promise<any>;
  listPersistent(agentId: string): Promise<MemoryEntry[]>;

  // Artifacts (DB-backed, versioned)
  saveArtifact(agentId: string, artifact: ArtifactInput): Promise<Artifact>;
  getArtifacts(agentId: string, type?: string): Promise<Artifact[]>;
  getArtifact(id: string): Promise<Artifact | null>;
}
```

**UI:** "Memory Inspector" panel — a tab in the inspector showing session state, persistent keys, and artifact list in real-time.

### 2.2 — Tool Verification Layer

**Research basis:** Process Reward Models validate intermediate steps. Our verification is simpler — deterministic validators for tool outputs.

**Implementation:**

```typescript
// src/lib/agent/tool-verification.ts
export interface ToolValidator {
  type: 'json_schema' | 'code_compiles' | 'url_reachable' | 'custom';
  config: Record<string, any>;
}

export interface VerificationResult {
  status: 'verified' | 'failed' | 'needs_review';
  message: string;
  details?: any;
}

export async function verifyToolOutput(
  tool: string,
  output: string,
  validator?: ToolValidator
): Promise<VerificationResult> {
  if (!validator) return { status: 'needs_review', message: 'No validator configured' };

  switch (validator.type) {
    case 'json_schema':
      // Parse output as JSON, validate against schema
    case 'code_compiles':
      // Try to compile/parse code output
    case 'url_reachable':
      // HTTP HEAD to verify URL
    case 'custom':
      // Run custom validation function
  }
}
```

**UI:** Visual indicators on tool results:
- ✅ `Verified` — Validator passed
- ❌ `Failed` — Validator failed  
- ⚠ `Needs Review` — No validator or ambiguous result

**Database:**
```prisma
model Step {
  // ... existing fields
  verificationStatus  String?  // verified | failed | needs_review
  verificationDetails  String?  // JSON
}
```

### 2.3 — Tool Registry

**Problem:** Tools are hardcoded. V2 needs an extensible registry.

```typescript
// src/lib/agent/tool-registry.ts
export interface ToolDefinition {
  id: string;           // e.g., "web_search", "write_file"
  name: string;         // Display name
  description: string;  // For LLM tool-use prompts
  category: 'search' | 'write' | 'code' | 'browser' | 'memory' | 'api' | 'custom';
  riskLevel: 'low' | 'medium' | 'high';
  parameters: JSONSchema;
  validator?: ToolValidator;
  executor: (params: any) => Promise<string>;
}
```

**API routes:**
- `GET /api/tools/list` — List available tools with metadata
- `POST /api/tools/execute` — Execute a specific tool (for testing)

---

## Phase 3: Governance, Safety & Observability

### 3.1 — Policy & Approval System

**Research basis:** Multi-agent systems introduce confused-deputy attacks and cross-agent privilege escalation. SEAgent uses Mandatory Access Control with Block/Deny, User Prompt/Ask, and Shadow Mode outcomes. AWS and Microsoft both mandate least-privilege access, sandboxed execution, and immutable audit logs.

**Architecture:**

```typescript
// src/lib/agent/policy.ts
export type RiskLevel = 'low' | 'medium' | 'high';

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  condition: {
    tool?: string[];        // Which tools this applies to
    role?: AgentRole[];     // Which roles
    riskLevel?: RiskLevel;  // Which risk levels
  };
  action: 'allow' | 'block' | 'ask_user' | 'shadow';
  reason: string;
}

export interface ApprovalRequest {
  id: string;
  runId: string;
  agentId: string;
  stepId: string;
  tool: string;
  input: string;
  riskLevel: RiskLevel;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  requestedAt: Date;
  respondedAt?: Date;
  respondedBy?: string;
  reason?: string;
}
```

**Default policies:**
| Action | Risk | Policy |
|--------|------|--------|
| `search` (read-only) | Low | `allow` |
| `write` (create artifact) | Medium | `ask_user` |
| `code` (execute code) | High | `ask_user` |
| `browser` (external request) | Medium | `allow` with logging |
| Any action by `reviewer` role | Low | `allow` (read-only role) |

**Database:**
```prisma
model PolicyRule {
  id          String   @id @default(cuid())
  name        String
  description String?
  condition   String   // JSON
  action      String   // allow | block | ask_user | shadow
  priority    Int      @default(0)  // Higher = evaluated first
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ApprovalRequest {
  id            String   @id @default(cuid())
  runId         String
  agentId       String
  stepId        String
  tool          String
  input         String
  riskLevel     String   // low | medium | high
  status        String   @default("pending") // pending | approved | denied | expired
  requestedAt   DateTime @default(now())
  respondedAt   DateTime?
  respondedBy   String?
  reason        String?
}
```

**API routes:**
- `GET /api/policy/list` — List all policies
- `POST /api/policy/create` — Create a policy rule
- `PATCH /api/policy/update` — Update a policy
- `DELETE /api/policy/delete` — Delete a policy
- `GET /api/approval/pending` — List pending approval requests
- `POST /api/approval/respond` — Approve or deny a request

**UI:** 
- "Approval Required" modal that pauses agent execution and shows the proposed action
- Policy Dashboard page/tab for managing rules
- Run view shows approval gate events

### 3.2 — Audit Trail (Immutable)

**Database:**
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  agentId   String
  runId     String?
  action    String   // tool_call | policy_check | approval | state_change
  details   String   // JSON
  outcome   String   // allowed | blocked | pending | approved | denied
  riskLevel String?
}
```

**Every tool call, policy check, and approval decision writes to this table.** No DELETE capability — append-only.

### 3.3 — Observability Timeline

**Research basis:** Agent systems are extremely hard to debug without per-agent traces of plans, tool calls, decisions, and latency. OpenTelemetry is the emerging standard.

**Implementation:**

```typescript
// src/lib/agent/observability.ts
export interface RunMetrics {
  runId: string;
  totalSteps: number;
  totalTokens: number;
  totalLatencyMs: number;
  toolCallCounts: Record<string, number>;
  toolSuccessRates: Record<string, number>;
  stepLatencies: { stepNum: number; tool: string; latencyMs: number }[];
  failurePoints: { stepNum: number; error: string }[];
  reflectionIterations: number;
  approvalGates: { stepNum: number; waitTimeMs: number }[];
}
```

**Database changes:**
```prisma
model AgentRun {
  // ... existing fields
  totalTokens   Int?
  totalLatencyMs Int?
  metrics       String?  // JSON: full RunMetrics
}

model Step {
  // ... existing fields
  latencyMs     Int?
  tokenCount    Int?
}
```

**UI:** CI/CD-style timeline visualization in the run view:
- Horizontal timeline with step markers
- Color-coded: green (success), yellow (warning), red (error), blue (thinking), purple (approval gate)
- Hover to see latency, token count, tool details
- Summary stats at the top: total time, total tokens, success rate

### 3.4 — System State Manager

**Global states:**
```
idle → running → waiting_approval → running → completed
                                              → failed
                                              → stopped
```

**Implementation:**
```typescript
// src/lib/agent/state-manager.ts
export type SystemState = 'idle' | 'running' | 'waiting_approval' | 'error' | 'completed';

export interface SystemStateEntry {
  state: SystemState;
  runId?: string;
  agentId?: string;
  reason?: string;
  timestamp: Date;
}
```

**UI:** The Agent Studio logo/header serves as the heartbeat indicator — its animation and color reflect the current system state:
- `idle`: Subtle breathing animation, muted color
- `running`: Active pulse, accent color
- `waiting_approval`: Slow blink, amber color
- `error`: Static red
- `completed`: Brief green flash, then return to idle

---

## Phase 4: Advanced Features & Scale

### 4.1 — Planner → Task Graph System

**Research basis:** The planner should generate a structured Task Graph (DAG) instead of a flat action list, enabling dependency-aware execution.

```typescript
export interface TaskNode {
  id: string;
  name: string;
  description: string;
  assignedRole: AgentRole;
  dependencies: string[];  // IDs of tasks that must complete first
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
}

export interface TaskGraph {
  nodes: TaskNode[];
  edges: { from: string; to: string }[];
}
```

**The planner's LLM call generates a TaskGraph, which the orchestrator then schedules and assigns to agents based on their roles and the dependency order.**

**UI:** Visual graph view of active task dependencies, rendered as a separate canvas mode.

### 4.2 — Parallel + Async Engine

**Implementation:**
```typescript
// src/lib/agent/concurrency.ts
export async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrency: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task().then(result => {
      results.push({ status: 'fulfilled', value: result });
    }, error => {
      results.push({ status: 'rejected', reason: error });
    });

    executing.push(p);

    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(e => e === p),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}
```

**Future triggers (not in V2, but infrastructure-ready):**
- Cron-based scheduled runs
- Webhook-triggered runs
- Event-driven activation (agent A finishes → agent B starts)

### 4.3 — Cron & Webhook Infrastructure

**Database:**
```prisma
model AgentTrigger {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  type      String   // cron | webhook | event
  config    String   // JSON: cron expression, webhook URL, event filter
  enabled   Boolean  @default(true)
  lastRun   DateTime?
  createdAt DateTime @default(now())
}
```

**API routes:**
- `POST /api/trigger/create` — Create a trigger
- `GET /api/trigger/list` — List triggers for an agent
- `DELETE /api/trigger/delete` — Remove a trigger

### 4.4 — Agent Templates V2 (Expanded)

Current: 4 static templates. V2 adds community templates and custom template saving.

```prisma
model AgentTemplate {
  id          String   @id @default(cuid())
  name        String
  description String
  category    String   // research | writing | code | business | custom
  config      String   // JSON: full AgentConfig
  isPublic    Boolean  @default(false)
  authorId    String?
  useCount    Int      @default(0)
  createdAt   DateTime @default(now())
}
```

**New templates:**
| Template | Role | Orchestration | Description |
|----------|------|---------------|-------------|
| Deep Research | researcher → writer | Sequential | Multi-source research with synthesis |
| Code Reviewer | executor → critic | Reflection | Write code, self-critique, iterate |
| Project Planner | planner (hierarchical) | Hierarchical | Break down project, delegate, collect |
| Market Analyst | researcher × 3 | Parallel | Parallel market research, merge results |
| Content Pipeline | researcher → writer → reviewer | Sequential | End-to-end content creation |

---

## Complete Database Schema Changes Summary

### New Models
| Model | Purpose |
|-------|---------|
| `AgentMemory` | 3-tier memory (session, persistent, artifact) |
| `Artifact` | Versioned output storage |
| `PolicyRule` | Governance rules |
| `ApprovalRequest` | Human-in-the-loop approvals |
| `AuditLog` | Immutable audit trail |
| `AgentTemplate` | Shareable agent templates |
| `AgentTrigger` | Cron/webhook triggers |
| `Team` | Agent groupings for orchestration |

### Modified Models
| Model | New Fields |
|-------|-----------|
| `Agent` | `orchestrationMode`, `role`, `permissions`, `reflectionEnabled`, `reflectionMaxIter`, `reflectionCriteria`, `model`, `maxConcurrency`, `teamId` |
| `AgentRun` | `totalTokens`, `totalLatencyMs`, `metrics` |
| `Step` | `latencyMs`, `tokenCount`, `verificationStatus`, `verificationDetails` |

---

## New API Routes Summary

| Route | Method | Phase | Purpose |
|-------|--------|-------|---------|
| `/api/agent/delete` | DELETE | P0 | Delete agent + cascade |
| `/api/agent/team/create` | POST | P1 | Create agent team |
| `/api/agent/team/list` | GET | P1 | List teams |
| `/api/agent/team/run` | POST | P1 | Run a team with orchestration |
| `/api/policy/list` | GET | P3 | List policy rules |
| `/api/policy/create` | POST | P3 | Create policy rule |
| `/api/policy/update` | PATCH | P3 | Update policy |
| `/api/policy/delete` | DELETE | P3 | Delete policy |
| `/api/approval/pending` | GET | P3 | List pending approvals |
| `/api/approval/respond` | POST | P3 | Approve/deny request |
| `/api/memory/list` | GET | P2 | List agent memory |
| `/api/memory/set` | POST | P2 | Set persistent memory |
| `/api/memory/delete` | DELETE | P2 | Delete memory entry |
| `/api/artifacts/list` | GET | P2 | List agent artifacts |
| `/api/artifacts/get` | GET | P2 | Get artifact by ID |
| `/api/tools/list` | GET | P2 | List available tools |
| `/api/tools/execute` | POST | P2 | Test-execute a tool |
| `/api/trigger/create` | POST | P4 | Create cron/webhook trigger |
| `/api/trigger/list` | GET | P4 | List triggers |
| `/api/trigger/delete` | DELETE | P4 | Delete trigger |
| `/api/templates/list` | GET | P4 | List templates |
| `/api/templates/create` | POST | P4 | Save custom template |

---

## New UI Components Summary

| Component | Phase | Description |
|-----------|-------|-------------|
| `OrchestrationSelector` | P1 | Dropdown for execution strategy |
| `TeamBuilder` | P1 | Drag agents into team, set orchestration mode |
| `ReflectionToggle` | P1 | Self-improve toggle + iteration count |
| `ReflectionLog` | P1 | Live critique/fix cycle display |
| `RoleBadge` | P1 | Color-coded role badge on canvas nodes |
| `RoleConfigPanel` | P1 | Specialized config per role |
| `MemoryInspector` | P2 | Tab showing session/persistent/artifact state |
| `VerificationBadge` | P2 | ✅❌⚠ indicators on tool results |
| `ApprovalModal` | P3 | Pause + show proposed action for user approval |
| `PolicyDashboard` | P3 | Create/edit/delete policy rules |
| `AuditTimeline` | P3 | CI/CD-style run timeline with metrics |
| `SystemStateIndicator` | P3 | Animated logo reflecting OS state |
| `TaskGraphCanvas` | P4 | DAG visualization of task dependencies |
| `TriggerManager` | P4 | Cron/webhook trigger config UI |
| `TemplateGallery` | P4 | Browse + use community templates |

---

## Implementation Priority Matrix

| Priority | Workstream | Phase | Effort | Impact |
|----------|-----------|-------|--------|--------|
| 🔴 P0 | Real tool implementations | P0 | M | H |
| 🔴 P0 | Canvas persistence | P0 | S | M |
| 🔴 P0 | Agent deletion | P0 | S | M |
| 🔴 P0 | Legacy cleanup | P0 | S | L |
| 🔴 P0 | Model configuration | P0 | S | M |
| 🟡 P1 | Orchestration mode engine | P1 | XL | H |
| 🟡 P1 | Sequential pipeline strategy | P1 | L | H |
| 🟡 P1 | Group chat strategy | P1 | L | H |
| 🟡 P1 | Hierarchical strategy | P1 | L | M |
| 🟡 P1 | Parallel strategy | P1 | M | H |
| 🟡 P1 | Reflection loop system | P1 | M | H |
| 🟡 P1 | Agent role system | P1 | M | M |
| 🟢 P2 | 3-tier memory layer | P2 | L | H |
| 🟢 P2 | Tool verification | P2 | M | M |
| 🟢 P2 | Tool registry | P2 | M | M |
| 🔵 P3 | Policy & approval system | P3 | XL | H |
| 🔵 P3 | Audit trail | P3 | M | H |
| 🔵 P3 | Observability timeline | P3 | L | H |
| 🔵 P3 | System state manager | P3 | M | M |
| ⚪ P4 | Task graph system | P4 | XL | M |
| ⚪ P4 | Cron & webhook triggers | P4 | L | M |
| ⚪ P4 | Agent templates V2 | P4 | M | L |

---

## Risk Analysis

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SSE breaks with multi-agent (event ordering) | Medium | High | Use structured event types with agentId + sequence numbers |
| SQLite can't handle concurrent writes from parallel agents | Medium | High | Use WAL mode; consider migration path to Postgres for scale |
| LLM costs spike with reflection loops + multi-agent | High | Medium | Add token budget per run; cap reflection iterations; cache planner decisions |
| Group chat context bloat degrades agent quality | Medium | Medium | Implement context windowing; summarize older messages |
| Kill switch doesn't cleanly stop parallel agents | Medium | High | Use AbortController per agent; propagate cancellation signals |

### Security Risks (from Research)

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Confused Deputy** | Untrusted agent manipulates trusted agent into privileged action | Policy engine checks inter-agent messages; role-based permission boundaries |
| **Cross-Agent Escalation** | Agents combine permissions to exceed individual authority | Least-privilege per role; audit all cross-agent communication |
| **Prompt Injection via Tool Output** | Malicious tool output hijacks agent reasoning | Sanitize tool outputs; separate instructions from data in prompts |
| **Reward Hacking** (reflection loops) | Generator learns to produce outputs that fool the critic, not genuinely better ones | Use deterministic validators where possible; cap iterations; require human approval for high-stakes |

---

## Migration Path from V1 to V2

### Step 1: Backward Compatibility
All V1 agents continue to work as `orchestrationMode: 'single'`. No data loss. No API breakage.

### Step 2: Database Migration
```bash
# Add new fields with defaults so existing records are unaffected
bun run db:push  # After updating schema.prisma
```

### Step 3: Incremental Rollout
- **Week 1:** Phase 0 (foundation fixes) — ship immediately
- **Week 2-3:** Phase 1 orchestration (start with sequential + reflection)
- **Week 4:** Phase 1 remaining (group, hierarchical, parallel)
- **Week 5:** Phase 2 (memory, verification, tool registry)
- **Week 6-7:** Phase 3 (governance, observability)
- **Week 8+:** Phase 4 (advanced features)

---

## Key Research-Informed Design Decisions

1. **Sequential over Group Chat as default** — Research shows sequential is cleaner for enterprise pipelines. Group chat adds value only when shared deliberation is needed (writer-editor cycles).

2. **Deterministic validators over LLM judges** — Inspired by RLVR (Reinforcement Learning with Verifiable Rewards), which outperforms Process Reward Models because deterministic checks (JSON parsing, code compilation) are immune to reward hacking.

3. **Soft limits over hard kills** — AgentCgroup research shows that OOM kills destroy non-recoverable LLM context. Our policy engine should throttle/pause rather than terminate when possible.

4. **Rule-based speaker selection over LLM** — AutoGen docs recommend replacing LLM speaker selection with simple rules when the order is obvious. This saves tokens and latency.

5. **Weaker planner + stronger solver** — The "combo effect" shows that a delegative planner paired with a capable solver outperforms a single dominant model trying to do everything.

6. **Immutable audit trail** — Both AWS and Microsoft security guidance mandate traceability as a core design requirement, not an optional add-on.

7. **Approval gates for high-risk actions** — SEAgent's three-outcome model (Block/Ask/Shadow) maps directly to our policy engine's allow/block/ask_user/shadow actions.

---

## What This Plan Does NOT Include (Future V3)

- **Vector search / RAG** — Persistent memory uses simple key-value in V2; semantic search requires pgvector or a dedicated vector store
- **User authentication & multi-tenancy** — User model exists but auth is deferred
- **Model fine-tuning** — No RLVR or custom model training within the platform
- **Agent marketplace** — Community sharing of agents beyond templates
- **Mobile app** — Responsive web only
- **Kubernetes deployment** — Single-server SQLite architecture for V2
- **Real-time collaboration** — Multi-user editing of the same agent/team

---

*This plan synthesizes insights from AutoGen multi-agent patterns, the Evaluator-Optimizer reflection pattern, SEAgent security frameworks, AgentCgroup resource management, and RLVR verification methodology into a concrete, phased implementation roadmap for Agent Studio OS V2.*
