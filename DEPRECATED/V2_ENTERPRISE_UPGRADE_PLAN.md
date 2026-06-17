# Agent Studio OS — V2.0 Enterprise Upgrade Plan

> **From Prototype → Production-Grade Agent Runtime OS**  
> **Date:** March 4, 2026  
> **Sources:** AGENTIC_OS_V2_PLAN.md, CODEREVIEW.md, agenticNotebooklm.md, agentsNotebooklm.md, V1 Code Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [V1 Prototype → Enterprise Gap Analysis](#2-v1-prototype--enterprise-gap-analysis)
3. [Architecture Redesign](#3-architecture-redesign)
4. [Phase 0: Critical Production Fixes](#4-phase-0-critical-production-fixes)
5. [Phase 1: Multi-Agent Orchestration Engine](#5-phase-1-multi-agent-orchestration-engine)
6. [Phase 2: Memory, Tools & Verification](#6-phase-2-memory-tools--verification)
7. [Phase 3: Governance, Safety & Observability](#7-phase-3-governance-safety--observability)
8. [Phase 4: Advanced Execution & Scale](#8-phase-4-advanced-execution--scale)
9. [Database Schema Evolution](#9-database-schema-evolution)
10. [API Surface](#10-api-surface)
11. [Frontend Component Architecture](#11-frontend-component-architecture)
12. [Security Architecture](#12-security-architecture)
13. [Deployment & Infrastructure](#13-deployment--infrastructure)
14. [Implementation Roadmap](#14-implementation-roadmap)
15. [Risk Register](#15-risk-register)
16. [Success Metrics](#16-success-metrics)

---

## 1. Executive Summary

Agent Studio OS V1 is a **functional prototype** — it demonstrates the concept of a visual AI agent builder with canvas-based editing, SSE streaming, and an AI Builder wizard. However, it has **critical production gaps** that prevent enterprise deployment:

- **3 critical memory leaks** that will crash any long-running server
- **All tools are simulated** — the agent loop is LLM → mock → LLM
- **Zero authentication** — no user ownership, no access control
- **Fragile LLM output parsing** — non-greedy regex on nested JSON
- **No concurrency control** — unlimited simultaneous agent runs
- **SQLite with no indexes** — will degrade under multi-user load
- **No canvas persistence** — user layouts lost on refresh
- **No policy/approval system** — agents can execute any action unchecked

V2 transforms this into an **enterprise-grade Agent Runtime OS** through 4 phases:

| Phase | Focus | Timeline | Enterprise Value |
|-------|-------|----------|------------------|
| **P0** | Critical fixes + real tools | Week 1 | System won't crash or leak memory |
| **P1** | Multi-agent orchestration | Weeks 2-4 | Core differentiator — collaborative agents |
| **P2** | Memory, verification, tools | Weeks 5-6 | Reliability — agents produce verified outputs |
| **P3** | Governance, observability | Weeks 7-9 | Trust — auditable, controllable, observable |
| **P4** | Advanced features & scale | Weeks 10-12 | Growth — parallel execution, task graphs, triggers |

**The transformation:** From a single-agent task-orchestration UI → Multi-agent autonomous runtime OS with enterprise-grade safety, observability, and reliability.

---

## 2. V1 Prototype → Enterprise Gap Analysis

### 2.1 Critical Code Issues (Must Fix Before Any V2 Work)

These are **production blockers** discovered during code review. Every one of them will cause failures in a real deployment.

| ID | Issue | File | Severity | Impact |
|----|-------|------|----------|--------|
| **C01** | **Memory leak: `eventListeners` Map never cleaned** | `agent.ts` | 🔴 Critical | Server OOM after hours of use |
| **C02** | **Memory leak: `activeRuns` entry persists on throw** | `agent.ts` | 🔴 Critical | Runs get permanently stuck in "running" |
| **C03** | **Memory leak: `runMemories` never cleared** | `memory.ts` | 🔴 Critical | Every run's full history stays in RAM forever |
| **C04** | **Singleton race in `getZAI()`** | `planner.ts`, `evaluator.ts` | 🔴 Critical | Multiple ZAI instances created, resource leak |
| **C05** | **Fragile JSON parsing: non-greedy regex** | `planner.ts:55` | 🔴 Critical | Nested JSON from LLM silently truncated |
| **C06** | **All tools return simulated data** | `tools.ts` | 🔴 Critical | No real functionality |
| **C07** | **No concurrency limit on agent runs** | `agent.ts` | 🔴 Critical | LLM API cost spike, server overload |
| **C08** | **DB errors silently swallowed** | `agent.ts` (6 locations) | 🟡 High | Step data silently lost |
| **C09** | **No `res.ok` checks in store** | `agent-store.ts` (7 locations) | 🟡 High | Error responses treated as data |
| **C10** | **Canvas nodes fully regenerated on agent count change** | `agent-canvas.tsx` | 🟡 High | User layouts destroyed on add/remove |
| **C11** | **`evaluator.ts` matches "untrue" as true** | `evaluator.ts:62` | 🟡 High | Premature run termination |
| **C12** | **`buildAgent` returns unvalidated JSON** | `planner.ts:130` | 🟡 High | Runtime errors if LLM omits fields |
| **C13** | **Wrong `role: "assistant"` instead of `"system"`** | `planner.ts:46`, `evaluator.ts` | 🟡 Medium | Reduced instruction-following |
| **C14** | **No input sanitization on LLM output** | `agent.ts`, `tools.ts` | 🟡 Medium | Prompt injection, XSS in stored data |
| **C15** | **SSE has no auto-reconnect** | `agent-studio.tsx` | 🟡 Medium | Stream drops silently |
| **C16** | **No runtime validation at API boundaries** | All API routes | 🟡 Medium | Malformed data accepted |

### 2.2 Architecture Gaps (Prototype vs Enterprise)

| Dimension | V1 (Prototype) | V2 (Enterprise) | Gap |
|-----------|----------------|-----------------|-----|
| **Execution** | Single agent, sequential only | Multi-agent: sequential, group, hierarchical, parallel | 🔴 Fundamental |
| **Quality** | Single-pass, no self-review | Reflection loops with generator→critic iteration | 🔴 Fundamental |
| **Composition** | All agents identical | Role-based: planner, researcher, executor, critic, reviewer | 🔴 Fundamental |
| **Memory** | In-memory only, resets on restart | 3-tier: session, persistent DB, versioned artifacts | 🔴 Data loss |
| **Tools** | All simulated, no verification | Real implementations with deterministic validators | 🔴 Non-functional |
| **Safety** | Kill switch only | Policy engine, approval gates, audit trail | 🔴 Uncontrolled |
| **Observability** | Basic SSE events | Timeline, metrics, token tracking, failure analysis | 🟡 Blind spots |
| **Auth** | None | User ownership, RBAC, scoped access | 🔴 No access control |
| **Database** | SQLite, no indexes, no enums | Indexed, enum-constrained, migration-ready | 🟡 Performance |
| **Error Handling** | Try/catch → console.error | Structured errors, retry, graceful degradation | 🟡 Fragile |
| **Deployment** | Single process, no scaling | Containerized, horizontal scaling ready | 🟡 Single point of failure |

### 2.3 What the Research Documents Tell Us

The four uploaded documents provide critical design guidance:

**From agenticNotebooklm.md (AutoGen Research):**
- Sequential workflow = publish-subscribe topics, each agent subscribes to its own topic
- Group chat = shared scratchpad + Group Chat Manager with `RequestToSpeak`
- Speaker selection: prefer rule-based over LLM-based when order is obvious (saves tokens/latency)
- Termination conditions: `TextMentionTermination("APPROVE")` + `MaxMessageTermination` combined with `|` operator
- Round-robin for fixed order, SelectorGroupChat for dynamic delegation

**From agentsNotebooklm.md (Agent Architecture Research):**
- **The "combo" effect:** Weaker delegative planner + strong solver > single dominant model
- **Security risks unique to multi-agent:** Confused Deputy attacks, cross-agent privilege escalation, collusion
- **SEAgent's MAC model:** Decision Engine checks every tool call against Policy DB → Block/Deny, User Prompt/Ask, or Shadow Mode
- **AgentCgroup:** AI agents have 15.4× peak-to-average memory ratio, burst-silence pattern, 56-74% latency from OS execution
- **Soft limits > hard kills:** OOM kills destroy non-recoverable LLM context; throttling preserves state
- **Understand-Modify-Verify lifecycle:** Early phase = lightweight reads, mid-late = heavy bash calls

**From AGENTIC_OS_V2_PLAN.md (V2 Roadmap):**
- 10 feature areas: orchestration, reflection, roles, memory, verification, policy, observability, parallel, task graphs, system state
- Model upgrade to `gemini-2.5-pro`
- Infrastructure for cron/webhook triggers

**From CODEREVIEW.md (Dev-Ready Feature Spec):**
- Complete database schemas for all 10 features
- Type definitions with implementation examples
- Testing requirements per feature
- Resource estimates: 220 hours / ~2 months with 2 developers
- Risk assessment and mitigation strategies

---

## 3. Architecture Redesign

### 3.1 V1 Architecture (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  AgentStudio → Sidebar | Canvas | Inspector | RunView       │
│  (React Flow, Zustand store, SSE EventSource)               │
└───────────────────────────┬─────────────────────────────────┘
                            │ fetch / SSE
┌───────────────────────────▼─────────────────────────────────┐
│                        API LAYER                             │
│  /api/agent/{create,list,build,run,runs,stream,stop,update} │
│  (Next.js Route Handlers, no auth, no validation)           │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      ENGINE LAYER                            │
│  agent.ts (orchestrator) → planner.ts → tools.ts            │
│                          → evaluator.ts → memory.ts          │
│  (In-process, single-agent, event bus, no concurrency)      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                       DATA LAYER                             │
│  Prisma + SQLite (Agent, AgentRun, Step)                    │
│  (No indexes, no enums, no user association)                │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 V2 Architecture (Enterprise)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                                 │
│                                                                           │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Sidebar   │  │ Team Canvas  │  │ Inspector    │  │ Run Dashboard   │  │
│  │ +Templates│  │ (React Flow) │  │ +Roles       │  │ +Timeline       │  │
│  │ +AI Build │  │ +Task Graphs │  │ +Memory      │  │ +Metrics        │  │
│  └──────────┘  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Approval     │  │ Policy       │  │ Memory       │  │ System      │  │
│  │ Modal        │  │ Dashboard    │  │ Inspector    │  │ Indicator   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                                           │
│  Zustand Store (agent-store, policy-store, memory-store, system-store)   │
│  SSE EventSource with auto-reconnect + event deduplication               │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │ fetch / SSE (with auth headers)
┌──────────────────────────────────────▼───────────────────────────────────┐
│                          API LAYER                                        │
│                                                                           │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐ │
│  │ Agent APIs       │  │ Orchestration APIs│  │ Governance APIs        │ │
│  │ /agent/*         │  │ /team/*           │  │ /policy/*              │ │
│  │ /tools/*         │  │ /orchestration/*  │  │ /approval/*            │ │
│  │ /memory/*        │  │ /task-graph/*     │  │ /audit/*               │ │
│  │ /artifacts/*     │  │ /trigger/*        │  │ /metrics/*             │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────────────┘ │
│                                                                           │
│  Middleware: Auth | Rate Limit | Validation (zod) | Request Logging      │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼───────────────────────────────────┐
│                        ENGINE LAYER                                       │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    Orchestrator (orchestrator.ts)                   │  │
│  │  Routes to execution strategy based on TeamConfig.mode             │  │
│  └──────────┬──────────┬──────────┬──────────┬───────────────────────┘  │
│             │          │          │          │                            │
│  ┌──────────▼──┐ ┌─────▼────┐ ┌──▼─────────┐ ┌▼───────────┐           │
│  │ Sequential  │ │ Group    │ │Hierarchical│ │ Parallel   │           │
│  │ Pipeline    │ │ Chat     │ │ Manager    │ │ Fan-out    │           │
│  └──────┬──────┘ └────┬─────┘ └─────┬──────┘ └─────┬──────┘           │
│         │             │             │               │                    │
│  ┌──────▼─────────────▼─────────────▼───────────────▼──────────────┐   │
│  │                    Agent Executor (agent.ts)                     │   │
│  │  Plan → Verify Policy → Execute → Validate → Evaluate → Memory  │   │
│  └──────┬──────────────┬──────────────┬──────────────┬────────────┘   │
│         │              │              │              │                  │
│  ┌──────▼───┐  ┌───────▼───┐  ┌──────▼─────┐  ┌───▼──────────┐      │
│  │ Planner  │  │ Tool      │  │ Reflection │  │ Evaluator    │      │
│  │ +Roles   │  │ Registry  │  │ Engine     │  │ +Criteria    │      │
│  │ +Graphs  │  │ +Verify   │  │ +Critic    │  │ +Budgets     │      │
│  └──────────┘  └───────────┘  └────────────┘  └──────────────┘      │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Policy       │  │ Metrics      │  │ System State │               │
│  │ Engine       │  │ Collector    │  │ Manager      │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼───────────────────────────────────┐
│                         DATA LAYER                                        │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Prisma + SQLite (with WAL mode, indexes, enums)                  │  │
│  │  Agent | AgentRun | Step | Team | Task | TaskGraph                │  │
│  │  AgentMemory | Artifact | Policy | Approval | AuditLog            │  │
│  │  AgentTemplate | AgentTrigger | RunMetrics | TimelineEvent        │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Migration path: SQLite → PostgreSQL when scale requires it              │
└───────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Orchestration pattern** | Strategy pattern with mode routing | Clean separation, testable strategies, easy to add modes |
| **Memory architecture** | 3-tier with DB persistence | Survives restarts, queryable, multi-instance safe |
| **Policy enforcement** | Pre-execution hook in agent loop | Catches actions before they happen, not after |
| **LLM output parsing** | Zod schema validation | Replaces fragile regex, validates at runtime, typed output |
| **Event system** | Typed SSE with sequence numbers | Solves ordering, deduplication, and multi-agent event correlation |
| **Concurrency control** | Semaphore + run queue | Prevents resource exhaustion, configurable limits |
| **Canvas state** | Server-authoritative (graphData) | Survives refresh, shareable, restorable |

---

## 4. Phase 0: Critical Production Fixes

*These must be completed before ANY V2 feature work. They are production blockers.*

### 4.1 — Memory Leak Triage

**C01: EventListeners cleanup**
```typescript
// agent.ts — Add cleanup after run completes
export function cleanupRun(runId: string) {
  activeRuns.delete(runId);
  eventListeners.delete(runId);     // ← ADD THIS
  clearMemory(runId);               // ← ADD THIS
}
```

**C02: activeRuns cleanup on throw**
```typescript
// agent.ts — Wrap runAgent in try/finally
export async function runAgent(runId: string, config: AgentConfig) {
  activeRuns.add(runId);
  try {
    // ... existing run logic
  } catch (error) {
    // ... error handling
  } finally {
    cleanupRun(runId);  // ← ALWAYS cleanup
  }
}
```

**C03: Run memory cleanup**
```typescript
// memory.ts — Called from cleanupRun
export function clearMemory(runId: string): void {
  runMemories.delete(runId);
}
```

### 4.2 — Singleton Fix

**C04: Extract shared ZAI client**
```typescript
// NEW FILE: src/lib/agent/zai-client.ts
let zaiInstance: ZAI | null = null;
let zaiPromise: Promise<ZAI> | null = null;

export async function getZAI(): Promise<ZAI> {
  if (zaiInstance) return zaiInstance;
  if (zaiPromise) return zaiPromise;
  
  zaiPromise = ZAI.create().then(instance => {
    zaiInstance = instance;
    return instance;
  });
  
  return zaiPromise;
}
```

Import from this shared module in `planner.ts` and `evaluator.ts` instead of duplicating.

### 4.3 — LLM Output Parsing Fix

**C05: Replace regex with structured extraction**
```typescript
// planner.ts — Replace fragile regex with zod validation
import { z } from 'zod';

const ActionSchema = z.object({
  tool: z.enum(['search', 'write', 'code', 'browser', 'finish']),
  input: z.string()
});

function extractAction(content: string): AgentAction {
  // Try multiple extraction strategies
  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(content);
    return ActionSchema.parse(parsed);
  } catch {}
  
  // 2. Extract from markdown code block
  const codeBlockMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      return ActionSchema.parse(parsed);
    } catch {}
  }
  
  // 3. Find last JSON object (greedy, handles nested)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return ActionSchema.parse(parsed);
    } catch {}
  }
  
  // 4. Fallback with retry prompt
  return { tool: 'finish', input: `Could not parse action from LLM response. Original: ${content.substring(0, 200)}` };
}
```

### 4.4 — Real Tool Implementations

**C06: Wire tools to actual services**

```typescript
// tools.ts — Real implementations
import { webSearch } from '@/lib/skills/web-search';
import { webRead } from '@/lib/skills/web-reader';
import { generateText } from '@/lib/skills/llm';

export async function executeTool(action: AgentAction): Promise<string> {
  switch (action.tool) {
    case 'search':
      return await webSearch(action.input);
    case 'write':
      // Save to artifact store (will be implemented in P2)
      return `Document saved: "${action.input.substring(0, 100)}..."`;
    case 'code':
      // Execute in sandboxed subprocess with timeout
      return await executeCodeSandbox(action.input);
    case 'browser':
      return await webRead(action.input);
    case 'finish':
      return action.input;
  }
}

async function executeCodeSandbox(code: string): Promise<string> {
  // Execute with timeout and output capture
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    const proc = exec(
      `timeout 10s node -e "${code.replace(/"/g, '\\"')}"`,
      { maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) resolve(`Execution error: ${error.message}`);
        else resolve(stdout || stderr || 'No output');
      }
    );
  });
}
```

### 4.5 — Concurrency Control

**C07: Add run queue with limits**

```typescript
// agent.ts — Add concurrency limiting
const MAX_CONCURRENT_RUNS = 5;
const activeRunCount = { value: 0 };
const runQueue: Array<{ runId: string; config: AgentConfig; resolve: Function; reject: Function }> = [];

export async function runAgent(runId: string, config: AgentConfig): Promise<void> {
  if (activeRunCount.value >= MAX_CONCURRENT_RUNS) {
    return new Promise((resolve, reject) => {
      runQueue.push({ runId, config, resolve, reject });
    });
  }
  
  activeRunCount.value++;
  try {
    await executeRun(runId, config);
  } finally {
    activeRunCount.value--;
    processQueue();
  }
}

function processQueue() {
  while (activeRunCount.value < MAX_CONCURRENT_RUNS && runQueue.length > 0) {
    const { runId, config, resolve, reject } = runQueue.shift()!;
    activeRunCount.value++;
    executeRun(runId, config)
      .then(resolve)
      .catch(reject)
      .finally(() => { activeRunCount.value--; processQueue(); });
  }
}
```

### 4.6 — Evaluator Fix

**C11: Strict boolean matching**
```typescript
// evaluator.ts — Replace fragile includes("true")
const isComplete = /^(true|yes|1)$/i.test(content.trim());
```

### 4.7 — Database Indexes

**Add indexes to Prisma schema:**
```prisma
model AgentRun {
  // ... existing fields
  @@index([agentId])
  @@index([status])
  @@index([createdAt])
}

model Step {
  // ... existing fields
  @@index([runId])
  @@index([stepNum])
}
```

### 4.8 — Store Error Handling

**C09: Add response status checks**
```typescript
// agent-store.ts — Pattern for all fetch calls
async fetchAgents() {
  try {
    const res = await fetch('/api/agent/list');
    if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
    const data = await res.json();
    set({ agents: data });
  } catch (error) {
    set({ error: (error as Error).message });
    toast.error('Failed to fetch agents');
  }
}
```

**Add error state to store:**
```typescript
interface AgentState {
  // ... existing
  error: string | null;
  clearError: () => void;
}
```

### 4.9 — API Validation Layer

**C16: Add zod validation middleware**

```typescript
// NEW FILE: src/lib/api/validate.ts
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (req: NextRequest): Promise<T | NextResponse> => {
    try {
      const body = await req.json();
      return schema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }
  };
}
```

### 4.10 — Canvas Persistence

**C10: Load graphData on fetch**
```typescript
// agent-store.ts — Restore canvas from DB on agent fetch
fetchAgents: async () => {
  const res = await fetch('/api/agent/list');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const agents = await res.json();
  
  // Restore canvas from each agent's graphData
  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];
  
  for (const agent of agents) {
    if (agent.graphData) {
      try {
        const graph = JSON.parse(agent.graphData);
        nodes.push(...graph.nodes);
        edges.push(...graph.edges);
      } catch {}
    }
  }
  
  set({ agents, canvasNodes: nodes.length ? nodes : generateDefaultNodes(agents), 
        canvasEdges: edges.length ? edges : generateDefaultEdges(agents) });
}
```

### 4.11 — SSE Auto-Reconnect

**C15: Add reconnection logic**
```typescript
// agent-studio.tsx — SSE with auto-reconnect
useEffect(() => {
  if (!currentRunId) return;
  
  let reconnectAttempts = 0;
  const MAX_RECONNECT = 5;
  
  const connect = () => {
    const es = new EventSource(`/api/agent/stream?runId=${encodeURIComponent(currentRunId)}`);
    
    es.onopen = () => { reconnectAttempts = 0; };
    
    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      // ... handle event
    };
    
    es.onerror = () => {
      es.close();
      if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        setTimeout(connect, Math.min(1000 * 2 ** reconnectAttempts, 30000));
      }
    };
    
    return es;
  };
  
  const es = connect();
  return () => es.close();
}, [currentRunId]);
```

### Phase 0 Summary

| Fix | Effort | Impact |
|-----|--------|--------|
| Memory leak triage | 2h | System stays alive under load |
| Singleton fix | 1h | No duplicate ZAI instances |
| LLM parsing fix | 3h | No silent JSON truncation |
| Real tool implementations | 4h | Agents actually work |
| Concurrency control | 2h | No API cost spikes |
| Evaluator fix | 0.5h | No premature termination |
| Database indexes | 1h | Queries scale with data |
| Store error handling | 2h | Users see error feedback |
| API validation | 3h | No malformed data accepted |
| Canvas persistence | 2h | Layouts survive refresh |
| SSE auto-reconnect | 1h | Streams recover from drops |
| **Total** | **~22h** | **Production-stable V1** |

---

## 5. Phase 1: Multi-Agent Orchestration Engine

### 5.1 — Orchestration Mode Engine

**Research basis (agenticNotebooklm.md):** AutoGen defines 3 core patterns — Sequential Pipeline, Group Chat, Hierarchical Chat. We add Parallel as a 4th.

```typescript
// NEW FILE: src/lib/agent/orchestrator.ts
import { EventEmitter } from 'events';

export type OrchestrationMode = 'single' | 'sequential' | 'group' | 'hierarchical' | 'parallel';

export interface TeamConfig {
  id: string;
  name: string;
  mode: OrchestrationMode;
  agents: AgentConfig[];
  termination: TerminationCondition;
  maxConcurrency?: number;
  sharedContext?: boolean;
}

export type TerminationCondition =
  | { type: 'max_steps'; value: number }
  | { type: 'text_mention'; text: string }
  | { type: 'max_messages'; value: number }
  | { type: 'composite'; conditions: TerminationCondition[]; operator: 'and' | 'or' };

export class AgentOrchestrator extends EventEmitter {
  private activeOrchestrations = new Map<string, AbortController>();

  async run(team: TeamConfig, input: string): Promise<string> {
    const controller = new AbortController();
    this.activeOrchestrations.set(team.id, controller);

    try {
      switch (team.mode) {
        case 'single':     return await this.runSingle(team, input, controller.signal);
        case 'sequential': return await this.runSequential(team, input, controller.signal);
        case 'group':      return await this.runGroup(team, input, controller.signal);
        case 'hierarchical': return await this.runHierarchical(team, input, controller.signal);
        case 'parallel':   return await this.runParallel(team, input, controller.signal);
      }
    } finally {
      this.activeOrchestrations.delete(team.id);
    }
  }

  stop(teamId: string): void {
    this.activeOrchestrations.get(teamId)?.abort();
  }

  private async runSingle(team: TeamConfig, input: string, signal: AbortSignal): Promise<string> {
    // Backward-compatible: run first agent only
    return executeAgent(team.agents[0], input, { signal, emitter: this });
  }

  private async runSequential(team: TeamConfig, input: string, signal: AbortSignal): Promise<string> {
    // Pipeline: A → B → C, output handoff between stages
    let currentInput = input;
    for (const agent of team.agents) {
      if (signal.aborted) throw new Error('Orchestration aborted');
      const result = await executeAgent(agent, currentInput, { signal, emitter: this });
      this.emit('handoff', { from: agent.name, to: team.agents[team.agents.indexOf(agent) + 1]?.name, data: result.substring(0, 200) });
      currentInput = result;
    }
    return currentInput;
  }

  private async runGroup(team: TeamConfig, input: string, signal: AbortSignal): Promise<string> {
    // Shared scratchpad with turn-taking manager
    const history: GroupChatMessage[] = [{ role: 'user', content: input, source: 'user' }];
    let messageCount = 0;

    while (!this.checkTermination(history, team.termination, messageCount)) {
      if (signal.aborted) throw new Error('Orchestration aborted');
      
      const nextSpeaker = await this.selectNextSpeaker(team, history);
      const response = await executeAgentTurn(nextSpeaker, history, { signal, emitter: this });
      
      history.push({ role: 'assistant', content: response, source: nextSpeaker.name });
      messageCount++;
      
      this.emit('group_message', { speaker: nextSpeaker.name, message: response.substring(0, 200) });
    }

    return history[history.length - 1]?.content ?? '';
  }

  private async runHierarchical(team: TeamConfig, input: string, signal: AbortSignal): Promise<string> {
    // Manager delegates to workers, collects results
    const manager = team.agents.find(a => a.role === 'planner') ?? team.agents[0];
    const workers = team.agents.filter(a => a.role !== 'planner');

    // Manager decomposes goal
    const plan = await executeAgent(manager, `Decompose this goal into sub-tasks: ${input}`, { signal, emitter: this });
    
    // Workers execute sub-tasks
    const workerResults: Record<string, string> = {};
    for (const worker of workers) {
      if (signal.aborted) throw new Error('Orchestration aborted');
      const task = await this.assignTask(manager, worker, plan, workerResults);
      const result = await executeAgent(worker, task, { signal, emitter: this });
      workerResults[worker.name] = result;
    }

    // Manager synthesizes
    return await executeAgent(manager, `Synthesize final answer from worker results:\n${JSON.stringify(workerResults)}`, { signal, emitter: this });
  }

  private async runParallel(team: TeamConfig, input: string, signal: AbortSignal): Promise<string> {
    // Fan-out with concurrency limit
    const maxConcurrency = team.maxConcurrency ?? 3;
    const results: Record<string, string> = {};
    const semaphore = new Semaphore(maxConcurrency);

    await Promise.allSettled(
      team.agents.map(async (agent) => {
        await semaphore.acquire();
        try {
          if (signal.aborted) return;
          const result = await executeAgent(agent, input, { signal, emitter: this });
          results[agent.name] = result;
        } finally {
          semaphore.release();
        }
      })
    );

    // Merge results
    return Object.entries(results).map(([name, result]) => `## ${name}\n${result}`).join('\n\n');
  }

  // ... helper methods
}

// Simple semaphore for concurrency control
class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;
  constructor(private max: number) {}
  
  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++;
      return;
    }
    return new Promise<void>(resolve => this.queue.push(resolve));
  }
  
  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) { this.running++; next(); }
  }
}
```

### 5.2 — Reflection Loop System

**Research basis:** The Evaluator-Optimizer pattern from agenticNotebooklm.md. GPT-3.5 jumps from 48.1% → 95.1% on coding benchmarks with agentic refinement. Key practices: cap iterations, use explicit approval criteria, optionally insert human as evaluator.

```typescript
// NEW FILE: src/lib/agent/reflection.ts
import { getZAI } from './zai-client';

export interface ReflectionConfig {
  enabled: boolean;
  maxIterations: number;      // Default: 3
  criticPrompt: string;        // Custom critic system prompt
  approvalKeyword: string;     // Default: "APPROVED"
  requireHumanApproval: boolean; // For high-stakes outputs
}

export interface ReflectionIteration {
  iteration: number;
  output: string;
  critique: string;
  approved: boolean;
  timestamp: Date;
}

export async function runReflectionLoop(
  initialOutput: string,
  goal: string,
  config: ReflectionConfig,
  emitter: EventEmitter
): Promise<{ output: string; iterations: ReflectionIteration[]; approved: boolean }> {
  const iterations: ReflectionIteration[] = [];
  let currentOutput = initialOutput;
  let approved = false;
  let iteration = 0;

  while (iteration < config.maxIterations && !approved) {
    // Critic evaluates
    emitter.emit('reflection', { type: 'critique_start', iteration });
    const critique = await critiqueOutput(currentOutput, goal, config);
    emitter.emit('reflection', { type: 'critique_done', iteration, critique: critique.substring(0, 200) });

    approved = critique.toUpperCase().includes(config.approvalKeyword);
    
    iterations.push({
      iteration,
      output: currentOutput,
      critique,
      approved,
      timestamp: new Date()
    });

    if (!approved && iteration < config.maxIterations - 1) {
      // Generator revises
      emitter.emit('reflection', { type: 'revision_start', iteration });
      currentOutput = await reviseOutput(currentOutput, critique, goal, config);
      emitter.emit('reflection', { type: 'revision_done', iteration });
    }

    iteration++;
  }

  return { output: currentOutput, iterations, approved };
}

async function critiqueOutput(output: string, goal: string, config: ReflectionConfig): Promise<string> {
  const zai = await getZAI();
  const response = await zai.chat({
    messages: [
      { role: 'system', content: config.criticPrompt || `You are a quality critic. Evaluate the output against the goal. If satisfactory, respond with "${config.approvalKeyword}". Otherwise, provide specific, actionable feedback for improvement.` },
      { role: 'user', content: `Goal: ${goal}\n\nOutput to evaluate:\n${output}` }
    ]
  });
  return response.choices[0]?.message?.content ?? '';
}

async function reviseOutput(output: string, critique: string, goal: string, config: ReflectionConfig): Promise<string> {
  const zai = await getZAI();
  const response = await zai.chat({
    messages: [
      { role: 'system', content: 'You are an expert generator. Revise the output based on the critique provided. Address every point of feedback.' },
      { role: 'user', content: `Goal: ${goal}\n\nCurrent output:\n${output}\n\nCritique:\n${critique}\n\nPlease provide a revised output that addresses all feedback.` }
    ]
  });
  return response.choices[0]?.message?.content ?? output;
}
```

### 5.3 — Agent Role System

**Research basis:** Specialization reduces context overload and makes multi-agent systems easier to debug (agentsNotebooklm.md). The "combo effect" — weaker delegative planner + strong solver > single dominant model.

```typescript
// NEW FILE: src/lib/agent/roles.ts
export type AgentRole = 'general' | 'planner' | 'researcher' | 'executor' | 'critic' | 'reviewer';

export interface RoleDefinition {
  name: string;
  color: string;           // Hex color for canvas badge
  icon: string;            // Lucide icon name
  defaultTools: AgentTool[];
  promptModifier: string;  // Appended to agent's personality
  permissions: RolePermissions;
  defaultPersonality: string;
}

export interface RolePermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
  approve: boolean;
  delegate: boolean;
}

export const ROLE_DEFINITIONS: Record<AgentRole, RoleDefinition> = {
  general: {
    name: 'General',
    color: '#8B5CF6',  // violet
    icon: 'Bot',
    defaultTools: ['search', 'write', 'code', 'browser'],
    promptModifier: '',
    permissions: { read: true, write: true, execute: true, approve: false, delegate: false },
    defaultPersonality: 'helpful and thorough'
  },
  planner: {
    name: 'Planner',
    color: '#7C3AED',  // purple
    icon: 'GitBranch',
    defaultTools: ['search', 'write'],
    promptModifier: 'Focus on creating detailed execution plans and delegating tasks to specialized agents.',
    permissions: { read: true, write: true, execute: false, approve: true, delegate: true },
    defaultPersonality: 'strategic and organized'
  },
  researcher: {
    name: 'Researcher',
    color: '#22C55E',  // green
    icon: 'Search',
    defaultTools: ['search', 'browser'],
    promptModifier: 'Gather comprehensive, factual information. Do not make up details.',
    permissions: { read: true, write: true, execute: true, approve: false, delegate: false },
    defaultPersonality: 'thorough and analytical'
  },
  executor: {
    name: 'Executor',
    color: '#3B82F6',  // blue
    icon: 'Play',
    defaultTools: ['code', 'write'],
    promptModifier: 'Execute tasks with high accuracy and precision.',
    permissions: { read: true, write: true, execute: true, approve: false, delegate: false },
    defaultPersonality: 'efficient and precise'
  },
  critic: {
    name: 'Critic',
    color: '#F59E0B',  // amber
    icon: 'Shield',
    defaultTools: ['write'],
    promptModifier: 'Provide detailed, constructive critique. Be objective and thorough.',
    permissions: { read: true, write: true, execute: false, approve: true, delegate: false },
    defaultPersonality: 'objective and constructive'
  },
  reviewer: {
    name: 'Reviewer',
    color: '#EF4444',  // red
    icon: 'CheckCircle',
    defaultTools: ['search', 'write'],
    promptModifier: 'Review work for completeness, accuracy, and quality.',
    permissions: { read: true, write: false, execute: false, approve: true, delegate: false },
    defaultPersonality: 'meticulous and quality-focused'
  }
};
```

### 5.4 — Database Changes for Phase 1

```prisma
// Added to existing Agent model
model Agent {
  // ... existing fields
  role                String   @default("general")   // general|planner|researcher|executor|critic|reviewer
  permissions         String   @default("read,write,execute")
  orchestrationMode   String   @default("single")    // single|sequential|group|hierarchical|parallel
  maxConcurrency      Int      @default(3)
  reflectionEnabled   Boolean  @default(false)
  reflectionMaxIter   Int      @default(3)
  reflectionCriteria  String   @default("APPROVED")
  model               String   @default("gemini-2.5-pro")
  teamId              String?
}

// New model for agent teams
model Team {
  id              String   @id @default(cuid())
  name            String
  mode            String   @default("sequential")  // sequential|group|hierarchical|parallel
  maxConcurrency  Int      @default(3)
  terminationType String   @default("max_steps")
  terminationValue Int     @default(20)
  sharedContext   Boolean  @default(false)
  agents          Agent[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// New model for reflection iterations
model ReflectionIteration {
  id          String   @id @default(cuid())
  runId       String
  iteration   Int
  output      String
  critique    String
  approved    Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@index([runId])
}
```

### 5.5 — New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/team/create` | POST | Create an agent team |
| `/api/team/list` | GET | List teams |
| `/api/team/get` | GET | Get team with agents |
| `/api/team/run` | POST | Start team orchestration |
| `/api/team/stop` | POST | Stop team orchestration |
| `/api/team/update` | PATCH | Update team config |

### 5.6 — UI Changes

| Component | Change |
|-----------|--------|
| `agent-sidebar.tsx` | Add "Execution Strategy" dropdown, "Create Team" button |
| `agent-inspector.tsx` | Add Role selector, Reflection toggle, Team membership |
| `agent-canvas.tsx` | Support team node groups, orchestration flow arrows |
| `agent-node.tsx` | Role-based color badges (green researcher, amber critic, etc.) |
| NEW: `team-builder.tsx` | Drag agents into team, set orchestration mode |
| NEW: `reflection-panel.tsx` | Live iteration log showing critique/fix cycle |
| NEW: `role-badge.tsx` | Color-coded role badge component |

---

## 6. Phase 2: Memory, Tools & Verification

### 6.1 — 3-Tier Memory Layer

**Research basis (agentsNotebooklm.md):** Agentic systems need memory at multiple levels. The shift from reactive assistants to autonomous workflows is built on external tools and memory, not prompt-only reasoning. AgentCgroup research shows context cannot be checkpointed or migrated — making persistent DB-backed memory critical.

```typescript
// NEW FILE: src/lib/agent/memory-v2.ts
import { db } from '@/lib/db';

export type MemoryTier = 'session' | 'persistent' | 'artifact';

export interface MemoryEntry {
  id: string;
  agentId: string;
  tier: MemoryTier;
  key: string;
  value: any;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class MemoryManager {
  // Session tier: in-memory, run-scoped, auto-cleared
  private sessionStore = new Map<string, Map<string, any>>();

  async get(agentId: string, key: string, tier: MemoryTier, runId?: string): Promise<any> {
    switch (tier) {
      case 'session': {
        const runMap = runId ? this.sessionStore.get(runId) : this.sessionStore.get(agentId);
        return runMap?.get(key);
      }
      case 'persistent': {
        const record = await db.agentMemory.findFirst({
          where: { agentId, key, tier: 'persistent' }
        });
        return record ? JSON.parse(record.value) : null;
      }
      case 'artifact': {
        const artifact = await db.artifact.findFirst({
          where: { agentId, name: key }
        });
        return artifact?.content ?? null;
      }
    }
  }

  async set(agentId: string, key: string, value: any, tier: MemoryTier, runId?: string): Promise<void> {
    switch (tier) {
      case 'session': {
        const mapKey = runId ?? agentId;
        if (!this.sessionStore.has(mapKey)) this.sessionStore.set(mapKey, new Map());
        this.sessionStore.get(mapKey)!.set(key, value);
        break;
      }
      case 'persistent': {
        await db.agentMemory.upsert({
          where: { agentId_key_tier: { agentId, key, tier: 'persistent' } },
          create: { agentId, key, tier: 'persistent', value: JSON.stringify(value) },
          update: { value: JSON.stringify(value) }
        });
        break;
      }
      case 'artifact': {
        await db.artifact.upsert({
          where: { agentId_name: { agentId, name: key } },
          create: { agentId, name: key, content: typeof value === 'string' ? value : JSON.stringify(value), type: inferType(value) },
          update: { content: typeof value === 'string' ? value : JSON.stringify(value) }
        });
        break;
      }
    }
  }

  clearSession(runId: string): void {
    this.sessionStore.delete(runId);
  }

  async listPersistent(agentId: string): Promise<MemoryEntry[]> {
    return db.agentMemory.findMany({ where: { agentId, tier: 'persistent' } });
  }

  async listArtifacts(agentId: string): Promise<any[]> {
    return db.artifact.findMany({ where: { agentId } });
  }
}
```

### 6.2 — Tool Registry & Verification

**Research basis:** RLVR (Reinforcement Learning with Verifiable Rewards) outperforms Process Reward Models because deterministic checks (JSON parsing, code compilation) are immune to reward hacking. We use this principle for tool verification — deterministic validators over LLM judges.

```typescript
// NEW FILE: src/lib/agent/tool-registry.ts
import { z } from 'zod';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'search' | 'write' | 'code' | 'browser' | 'memory' | 'api' | 'custom';
  riskLevel: 'low' | 'medium' | 'high';
  parameters: z.ZodSchema;
  validator?: ToolValidator;
  executor: (params: any) => Promise<string>;
}

export interface ToolValidator {
  type: 'json_schema' | 'code_compiles' | 'url_reachable' | 'regex_match' | 'custom';
  config: Record<string, any>;
}

export interface VerificationResult {
  status: 'verified' | 'failed' | 'needs_review';
  message: string;
  details?: any;
}

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  get(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  list(category?: string): ToolDefinition[] {
    const all = Array.from(this.tools.values());
    return category ? all.filter(t => t.category === category) : all;
  }

  async executeWithVerification(
    toolId: string,
    params: any,
    maxRetries: number = 1
  ): Promise<{ result: string; verification: VerificationResult }> {
    const tool = this.tools.get(toolId);
    if (!tool) throw new Error(`Unknown tool: ${toolId}`);

    // Validate params
    const validated = tool.parameters.parse(params);

    let result: string;
    let attempts = 0;

    do {
      result = await tool.executor(validated);
      
      if (!tool.validator) {
        return { result, verification: { status: 'needs_review', message: 'No validator configured' } };
      }

      const verification = await this.verify(result, tool.validator);
      if (verification.status === 'verified') {
        return { result, verification };
      }

      attempts++;
    } while (attempts < maxRetries);

    return { result, verification: { status: 'failed', message: `Failed after ${maxRetries} attempts` } };
  }

  private async verify(output: string, validator: ToolValidator): Promise<VerificationResult> {
    switch (validator.type) {
      case 'json_schema':
        try {
          JSON.parse(output);
          return { status: 'verified', message: 'Valid JSON' };
        } catch (e) {
          return { status: 'failed', message: `Invalid JSON: ${(e as Error).message}` };
        }
      
      case 'code_compiles':
        // Check if code can be parsed without syntax errors
        try {
          new Function(output);
          return { status: 'verified', message: 'Code compiles' };
        } catch (e) {
          return { status: 'failed', message: `Syntax error: ${(e as Error).message}` };
        }

      case 'url_reachable':
        try {
          const res = await fetch(output, { method: 'HEAD' });
          return res.ok
            ? { status: 'verified', message: `URL reachable (${res.status})` }
            : { status: 'failed', message: `URL returned ${res.status}` };
        } catch (e) {
          return { status: 'failed', message: `URL unreachable: ${(e as Error).message}` };
        };

      case 'regex_match':
        const regex = new RegExp(validator.config.pattern);
        return regex.test(output)
          ? { status: 'verified', message: 'Matches pattern' }
          : { status: 'failed', message: 'Does not match pattern' };

      default:
        return { status: 'needs_review', message: 'Unknown validator type' };
    }
  }
}

// Singleton registry
export const toolRegistry = new ToolRegistry();

// Register built-in tools
toolRegistry.register({
  id: 'web_search',
  name: 'Web Search',
  description: 'Search the web for information',
  category: 'search',
  riskLevel: 'low',
  parameters: z.object({ query: z.string() }),
  executor: async ({ query }) => { /* call z-ai-web-dev-sdk web-search */ return ''; }
});

toolRegistry.register({
  id: 'write_file',
  name: 'Write File',
  description: 'Write content to a file artifact',
  category: 'write',
  riskLevel: 'medium',
  parameters: z.object({ filename: z.string(), content: z.string() }),
  executor: async ({ filename, content }) => { /* save to artifact store */ return `Saved ${filename}`; }
});

toolRegistry.register({
  id: 'execute_code',
  name: 'Execute Code',
  description: 'Execute code in a sandboxed environment',
  category: 'code',
  riskLevel: 'high',
  parameters: z.object({ code: z.string(), language: z.enum(['javascript', 'python']).optional() }),
  validator: { type: 'code_compiles', config: {} },
  executor: async ({ code }) => { /* sandboxed execution */ return ''; }
});

toolRegistry.register({
  id: 'browse_url',
  name: 'Browse URL',
  description: 'Read content from a web page',
  category: 'browser',
  riskLevel: 'medium',
  parameters: z.object({ url: z.string().url() }),
  executor: async ({ url }) => { /* call z-ai-web-dev-sdk web-reader */ return ''; }
});
```

### 6.3 — Database Changes for Phase 2

```prisma
model AgentMemory {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  tier      String   @default("persistent")  // session | persistent | artifact
  key       String
  value     String   // JSON
  expiresAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([agentId, key, tier])
  @@index([agentId, tier])
}

model Artifact {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  runId     String?
  name      String
  type      String   @default("text")  // code | text | json | markdown | file
  content   String
  metadata  String?  // JSON
  createdAt DateTime @default(now())

  @@unique([agentId, name])
  @@index([agentId, type])
}

model Step {
  // ... existing fields
  verificationStatus  String?  // verified | failed | needs_review
  verificationDetails String?  // JSON
  latencyMs           Int?
  tokenCount          Int?
}
```

---

## 7. Phase 3: Governance, Safety & Observability

### 7.1 — Policy & Approval System

**Research basis (agentsNotebooklm.md):** SEAgent's Mandatory Access Control checks every tool call against a Policy Database with 3 outcomes: Block/Deny, User Prompt/Ask, Shadow Mode. AWS and Microsoft mandate least-privilege access, sandboxed execution, and immutable audit logs. Multi-agent systems face confused-deputy attacks and cross-agent privilege escalation.

```typescript
// NEW FILE: src/lib/agent/policy.ts
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type PolicyAction = 'allow' | 'block' | 'ask_user' | 'shadow';

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  condition: PolicyCondition;
  action: PolicyAction;
  priority: number;  // Higher = evaluated first
  enabled: boolean;
}

export interface PolicyCondition {
  tools?: string[];        // Which tools this applies to
  roles?: AgentRole[];     // Which roles
  riskLevels?: RiskLevel[]; // Which risk levels
  agents?: string[];       // Specific agent IDs
}

export interface PolicyCheckResult {
  allowed: boolean;
  action: PolicyAction;
  matchedPolicies: PolicyRule[];
  requiresApproval: boolean;
}

export class PolicyEngine {
  private policies: PolicyRule[] = [];

  constructor() {
    this.loadDefaultPolicies();
  }

  async check(
    tool: string,
    role: AgentRole,
    riskLevel: RiskLevel,
    agentId: string
  ): Promise<PolicyCheckResult> {
    const matched: PolicyRule[] = [];
    let finalAction: PolicyAction = 'allow';  // Default allow

    // Sort by priority (highest first)
    const sorted = [...this.policies]
      .filter(p => p.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const policy of sorted) {
      if (this.matchesCondition(policy.condition, tool, role, riskLevel, agentId)) {
        matched.push(policy);
        // Most specific (highest priority) wins
        if (finalAction === 'allow' || policy.priority >= (matched[0]?.priority ?? 0)) {
          finalAction = policy.action;
        }
      }
    }

    return {
      allowed: finalAction === 'allow',
      action: finalAction,
      matchedPolicies: matched,
      requiresApproval: finalAction === 'ask_user'
    };
  }

  private matchesCondition(
    condition: PolicyCondition,
    tool: string,
    role: AgentRole,
    riskLevel: RiskLevel,
    agentId: string
  ): boolean {
    if (condition.tools && !condition.tools.includes(tool)) return false;
    if (condition.roles && !condition.roles.includes(role)) return false;
    if (condition.riskLevels && !condition.riskLevels.includes(riskLevel)) return false;
    if (condition.agents && !condition.agents.includes(agentId)) return false;
    return true;
  }

  private loadDefaultPolicies(): void {
    this.policies = [
      { id: 'p1', name: 'Allow read-only tools', description: 'Search and browse are safe', condition: { tools: ['web_search', 'browse_url'] }, action: 'allow', priority: 10, enabled: true },
      { id: 'p2', name: 'Require approval for code execution', description: 'Code execution is high risk', condition: { tools: ['execute_code'] }, action: 'ask_user', priority: 20, enabled: true },
      { id: 'p3', name: 'Require approval for write operations', description: 'Writing files is medium risk', condition: { tools: ['write_file'], riskLevels: ['medium', 'high'] }, action: 'ask_user', priority: 15, enabled: true },
      { id: 'p4', name: 'Block execution by reviewers', description: 'Reviewers should not execute code', condition: { roles: ['reviewer'], tools: ['execute_code'] }, action: 'block', priority: 30, enabled: true },
      { id: 'p5', name: 'Allow all for general role', description: 'General agents can do anything (with approval for high risk)', condition: { roles: ['general'] }, action: 'allow', priority: 5, enabled: true },
    ];
  }
}
```

### 7.2 — Approval Flow

```typescript
// Integrated into agent execution loop
async function executeWithPolicy(
  agent: AgentConfig,
  tool: string,
  input: string,
  policyEngine: PolicyEngine,
  emitter: EventEmitter
): Promise<{ result: string; approved: boolean }> {
  const riskLevel = toolRegistry.get(tool)?.riskLevel ?? 'medium';
  const policyResult = await policyEngine.check(tool, agent.role ?? 'general', riskLevel, agent.id);

  // Audit log (always written)
  await db.auditLog.create({
    data: {
      agentId: agent.id,
      action: 'tool_call',
      details: JSON.stringify({ tool, input: input.substring(0, 500), riskLevel }),
      outcome: policyResult.action,
      riskLevel
    }
  });

  if (policyResult.action === 'block') {
    emitter.emit('policy', { type: 'blocked', tool, reason: 'Policy blocks this action' });
    return { result: `Action blocked by policy: ${tool}`, approved: false };
  }

  if (policyResult.action === 'ask_user') {
    // Create approval request and pause
    const approval = await db.approvalRequest.create({
      data: {
        agentId: agent.id,
        tool,
        input: input.substring(0, 1000),
        riskLevel,
        status: 'pending'
      }
    });

    emitter.emit('policy', { type: 'approval_required', approvalId: approval.id, tool, riskLevel });

    // Wait for approval (polling or WebSocket)
    const decision = await waitForApproval(approval.id, emitter);
    
    if (decision === 'denied') {
      return { result: `Action denied by user: ${tool}`, approved: false };
    }
  }

  if (policyResult.action === 'shadow') {
    // Execute but only log, don't apply effects
    emitter.emit('policy', { type: 'shadow_mode', tool });
  }

  // Execute the tool
  const result = await toolRegistry.executeWithVerification(tool, input);
  return { result: result.result, approved: true };
}
```

### 7.3 — Observability Timeline

```typescript
// NEW FILE: src/lib/agent/metrics.ts
export interface TimelineEvent {
  id: string;
  runId: string;
  type: TimelineEventType;
  timestamp: Date;
  durationMs?: number;
  tokenCount?: number;
  metadata: Record<string, any>;
  error?: string;
}

export type TimelineEventType =
  | 'run_start' | 'run_complete' | 'run_error'
  | 'step_start' | 'step_complete'
  | 'llm_call' | 'tool_execution'
  | 'validation' | 'policy_check'
  | 'approval_request' | 'approval_response'
  | 'reflection_iteration' | 'reflection_complete'
  | 'handoff' | 'group_message';

export class MetricsCollector {
  async record(event: Omit<TimelineEvent, 'id' | 'timestamp'>): Promise<void> {
    await db.timelineEvent.create({
      data: {
        runId: event.runId,
        type: event.type,
        durationMs: event.durationMs,
        tokenCount: event.tokenCount,
        metadata: JSON.stringify(event.metadata),
        error: event.error
      }
    });
  }

  async getRunMetrics(runId: string): Promise<RunMetrics> {
    const events = await db.timelineEvent.findMany({
      where: { runId },
      orderBy: { timestamp: 'asc' }
    });

    return {
      totalSteps: events.filter(e => e.type === 'step_complete').length,
      totalDurationMs: events.reduce((sum, e) => sum + (e.durationMs ?? 0), 0),
      totalTokens: events.reduce((sum, e) => sum + (e.tokenCount ?? 0), 0),
      toolSuccessRate: this.calculateToolSuccessRate(events),
      failurePoints: events.filter(e => e.error).map(e => ({ type: e.type, error: e.error! })),
      approvalWaitTimeMs: this.calculateApprovalWaitTime(events)
    };
  }
}
```

### 7.4 — Audit Trail (Immutable)

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  timestamp  DateTime @default(now())
  agentId    String
  runId      String?
  action     String   // tool_call | policy_check | approval | state_change | auth
  details    String   // JSON
  outcome    String   // allowed | blocked | pending | approved | denied
  riskLevel  String?
  
  @@index([agentId])
  @@index([runId])
  @@index([timestamp])
  // NO delete endpoint — append-only
}

model ApprovalRequest {
  id            String   @id @default(cuid())
  agentId       String
  runId         String?
  tool          String
  input         String
  riskLevel     String   // low | medium | high | critical
  status        String   @default("pending") // pending | approved | denied | expired
  requestedAt   DateTime @default(now())
  respondedAt   DateTime?
  respondedBy   String?
  reason        String?
  
  @@index([status])
  @@index([agentId])
}

model TimelineEvent {
  id          String   @id @default(cuid())
  runId       String
  type        String
  timestamp   DateTime @default(now())
  durationMs  Int?
  tokenCount  Int?
  metadata    String   // JSON
  error       String?
  
  @@index([runId])
  @@index([type])
  @@index([timestamp])
}
```

### 7.5 — System State Manager

```typescript
// NEW FILE: src/lib/agent/system-state.ts
export type SystemState = 'idle' | 'planning' | 'running' | 'waiting_approval' | 'error' | 'completed' | 'maintenance';

export interface SystemStatus {
  state: SystemState;
  activeRuns: number;
  pendingApprovals: number;
  systemLoad: number;       // 0-1
  totalTokensUsed: number;
  lastActivity: Date;
  agentsOnline: number;
}

export class SystemStateManager {
  private state: SystemState = 'idle';
  private listeners: Set<(old: SystemState, new_: SystemState) => void> = new Set();

  async transition(newState: SystemState, reason?: string): Promise<void> {
    const old = this.state;
    this.state = newState;
    this.listeners.forEach(fn => fn(old, newState));
    
    // Emit SSE event for UI
    // Persist to DB for recovery after restart
  }

  getStatus(): SystemStatus {
    return {
      state: this.state,
      activeRuns: 0, // from activeOrchestrations.size
      pendingApprovals: 0, // from DB count
      systemLoad: 0, // from process.memoryUsage()
      totalTokensUsed: 0, // from metrics
      lastActivity: new Date(),
      agentsOnline: 0
    };
  }

  onStateChange(listener: (old: SystemState, new_: SystemState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
```

---

## 8. Phase 4: Advanced Execution & Scale

### 8.1 — Task Graph System

**Research basis:** The planner generates a structured DAG instead of a flat list. Tasks have dependencies and are assigned to agents based on roles.

```prisma
model TaskGraph {
  id         String   @id @default(cuid())
  runId      String
  status     String   @default("planning")  // planning | executing | completed | failed
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  tasks      Task[]
  
  @@index([runId])
}

model Task {
  id              String   @id @default(cuid())
  graphId         String
  graph           TaskGraph @relation(fields: [graphId], references: [id], onDelete: Cascade)
  parentTaskId    String?
  title           String
  description     String
  assignedAgentId String?
  status          String   @default("pending")  // pending | in_progress | completed | failed | blocked
  dependencies    String   @default("[]")  // JSON array of task IDs
  result          String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([graphId])
  @@index([status])
}
```

### 8.2 — Cron & Webhook Triggers

```prisma
model AgentTrigger {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  type      String   // cron | webhook | event
  config    String   // JSON: cron expression, webhook secret, event filter
  enabled   Boolean  @default(true)
  lastRunAt DateTime?
  createdAt DateTime @default(now())
  
  @@index([agentId])
  @@index([type])
}
```

### 8.3 — Agent Templates V2

```prisma
model AgentTemplate {
  id          String   @id @default(cuid())
  name        String
  description String
  category    String   @default("custom")  // research | writing | code | business | custom
  config      String   // JSON: full AgentConfig + TeamConfig
  isPublic    Boolean  @default(false)
  useCount    Int      @default(0)
  createdAt   DateTime @default(now())
  
  @@index([category])
  @@index([isPublic])
}
```

**New multi-agent templates:**

| Template | Orchestration | Agents | Use Case |
|----------|---------------|--------|----------|
| Deep Research | Sequential | researcher → writer | Multi-source research + synthesis |
| Code Reviewer | Reflection | executor → critic | Write code, self-critique, iterate |
| Project Planner | Hierarchical | planner → 2x executor | Complex project decomposition |
| Market Analyst | Parallel | 3x researcher | Parallel market research |
| Content Pipeline | Sequential | researcher → writer → reviewer | End-to-end content creation |

---

## 9. Database Schema Evolution

### Complete Schema (All Phases)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./../db/custom.db"
}

// ============ CORE MODELS (V1 + V2) ============

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  agents    Agent[]
}

model Agent {
  id                  String   @id @default(cuid())
  userId              String?  // For future auth
  name                String
  goal                String
  personality         String   @default("helpful and thorough")
  tools               String   @default("search,write,code,browser")
  shortTermMemory     Boolean  @default(true)
  longTermMemory      Boolean  @default(false)
  maxSteps            Int      @default(10)
  autoRun             Boolean  @default(false)
  outputFormat        String   @default("markdown")
  graphData           String?  // JSON
  
  // V2 Phase 1 additions
  role                String   @default("general")
  permissions         String   @default("read,write,execute")
  orchestrationMode   String   @default("single")
  maxConcurrency      Int      @default(3)
  reflectionEnabled   Boolean  @default(false)
  reflectionMaxIter   Int      @default(3)
  reflectionCriteria  String   @default("APPROVED")
  model               String   @default("gemini-2.5-pro")
  teamId              String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  runs        AgentRun[]
  memories    AgentMemory[]
  artifacts   Artifact[]
  triggers    AgentTrigger[]
  team        Team?       @relation(fields: [teamId], references: [id])

  @@index([teamId])
  @@index([role])
}

model AgentRun {
  id              String   @id @default(cuid())
  agentId         String
  agent           Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  status          String   @default("pending")
  result          String?
  
  // V2 Phase 3 additions
  totalTokens     Int?
  totalLatencyMs  Int?
  metrics         String?  // JSON

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  steps           Step[]
  timelineEvents  TimelineEvent[]
  reflections     ReflectionIteration[]

  @@index([agentId])
  @@index([status])
  @@index([createdAt])
}

model Step {
  id                  String   @id @default(cuid())
  runId               String
  run                 AgentRun @relation(fields: [runId], references: [id], onDelete: Cascade)
  stepNum             Int
  tool                String
  input               String
  result              String
  
  // V2 additions
  verificationStatus  String?  // verified | failed | needs_review
  verificationDetails String?  // JSON
  latencyMs           Int?
  tokenCount          Int?

  createdAt           DateTime @default(now())

  @@index([runId])
  @@index([stepNum])
}

// ============ TEAM MODELS (Phase 1) ============

model Team {
  id              String   @id @default(cuid())
  name            String
  mode            String   @default("sequential")
  maxConcurrency  Int      @default(3)
  terminationType String   @default("max_steps")
  terminationValue Int     @default(20)
  sharedContext   Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  agents          Agent[]
}

// ============ MEMORY MODELS (Phase 2) ============

model AgentMemory {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  tier      String   @default("persistent")
  key       String
  value     String
  expiresAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([agentId, key, tier])
  @@index([agentId, tier])
}

model Artifact {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  runId     String?
  name      String
  type      String   @default("text")
  content   String
  metadata  String?
  createdAt DateTime @default(now())

  @@unique([agentId, name])
  @@index([agentId, type])
}

// ============ GOVERNANCE MODELS (Phase 3) ============

model PolicyRule {
  id          String   @id @default(cuid())
  name        String
  description String?
  condition   String   // JSON
  action      String   // allow | block | ask_user | shadow
  priority    Int      @default(0)
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ApprovalRequest {
  id            String   @id @default(cuid())
  agentId       String
  runId         String?
  tool          String
  input         String
  riskLevel     String   @default("medium")
  status        String   @default("pending")
  requestedAt   DateTime @default(now())
  respondedAt   DateTime?
  respondedBy   String?
  reason        String?

  @@index([status])
  @@index([agentId])
}

model AuditLog {
  id         String   @id @default(cuid())
  timestamp  DateTime @default(now())
  agentId    String
  runId      String?
  action     String
  details    String   // JSON
  outcome    String
  riskLevel  String?

  @@index([agentId])
  @@index([runId])
  @@index([timestamp])
}

model TimelineEvent {
  id          String   @id @default(cuid())
  runId       String
  type        String
  timestamp   DateTime @default(now())
  durationMs  Int?
  tokenCount  Int?
  metadata    String   // JSON
  error       String?

  @@index([runId])
  @@index([type])
  @@index([timestamp])
}

model ReflectionIteration {
  id          String   @id @default(cuid())
  runId       String
  iteration   Int
  output      String
  critique    String
  approved    Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([runId])
}

// ============ ADVANCED MODELS (Phase 4) ============

model TaskGraph {
  id         String   @id @default(cuid())
  runId      String
  status     String   @default("planning")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tasks      Task[]

  @@index([runId])
}

model Task {
  id               String    @id @default(cuid())
  graphId          String
  graph            TaskGraph @relation(fields: [graphId], references: [id], onDelete: Cascade)
  parentTaskId     String?
  title            String
  description      String
  assignedAgentId  String?
  status           String    @default("pending")
  dependencies     String    @default("[]")
  result           String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([graphId])
  @@index([status])
}

model AgentTrigger {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  type      String   // cron | webhook | event
  config    String   // JSON
  enabled   Boolean  @default(true)
  lastRunAt DateTime?
  createdAt DateTime @default(now())

  @@index([agentId])
  @@index([type])
}

model AgentTemplate {
  id          String   @id @default(cuid())
  name        String
  description String
  category    String   @default("custom")
  config      String   // JSON
  isPublic    Boolean  @default(false)
  useCount    Int      @default(0)
  createdAt   DateTime @default(now())

  @@index([category])
  @@index([isPublic])
}
```

---

## 10. API Surface

### Complete V2 API Map

```
/api
├── /agent
│   ├── /list          GET     List all agents with run counts
│   ├── /create        POST    Create agent with config
│   ├── /delete        DELETE  Delete agent + cascade
│   ├── /build         POST    AI builds agent from natural language
│   ├── /update        PATCH   Update agent config or graphData
│   ├── /run           POST    Start single agent run
│   ├── /runs          GET     Get run history
│   ├── /stream        GET     SSE stream for live events
│   └── /stop          POST    Kill switch for running agent
│
├── /team              [Phase 1]
│   ├── /create        POST    Create agent team
│   ├── /list          GET     List teams
│   ├── /get           GET     Get team with agents
│   ├── /run           POST    Start team orchestration
│   ├── /stop          POST    Stop team orchestration
│   └── /update        PATCH   Update team config
│
├── /memory            [Phase 2]
│   ├── /list          GET     List agent memory entries
│   ├── /get           GET     Get specific memory entry
│   ├── /set           POST    Set persistent memory
│   └── /delete        DELETE  Delete memory entry
│
├── /artifacts         [Phase 2]
│   ├── /list          GET     List agent artifacts
│   ├── /get           GET     Get artifact by ID
│   └── /delete        DELETE  Delete artifact
│
├── /tools             [Phase 2]
│   ├── /list          GET     List available tools
│   └── /execute       POST    Test-execute a tool
│
├── /policy            [Phase 3]
│   ├── /list          GET     List all policy rules
│   ├── /create        POST    Create policy rule
│   ├── /update        PATCH   Update policy
│   └── /delete        DELETE  Delete policy
│
├── /approval          [Phase 3]
│   ├── /pending       GET     List pending approvals
│   ├── /respond       POST    Approve or deny request
│   └── /history       GET     Get approval history
│
├── /audit             [Phase 3]
│   ├── /list          GET     Query audit log
│   └── /export        GET     Export audit log as JSON
│
├── /metrics           [Phase 3]
│   ├── /run           GET     Get run metrics
│   ├── /agent         GET     Get agent aggregate metrics
│   └── /system        GET     Get system status
│
├── /task-graph        [Phase 4]
│   ├── /create        POST    Create task graph from goal
│   ├── /get           GET     Get task graph with tasks
│   └── /update-task   PATCH   Update task status
│
├── /trigger           [Phase 4]
│   ├── /create        POST    Create cron/webhook trigger
│   ├── /list          GET     List triggers
│   └── /delete        DELETE  Delete trigger
│
└── /templates         [Phase 4]
    ├── /list          GET     List templates
    ├── /create        POST    Save custom template
    └── /use           POST    Create agent from template
```

**Total: ~35 API endpoints** (up from 8 in V1)

---

## 11. Frontend Component Architecture

### V2 Component Tree

```
<AgentStudio>
├── <SystemStateIndicator />           [P3] Animated header heartbeat
├── <AgentSidebar>
│   ├── <AgentList />                  [V1] With role badges
│   ├── <TeamList />                   [P1] List of agent teams
│   ├── <TemplateGallery />            [P4] Browse + use templates
│   ├── <QuickTemplates />             [V1] 4 preset templates → 9
│   ├── <AIBuilderWizard />            [V1] With team mode option
│   └── <RunHistory />                 [V1] With metrics summary
│
├── <AgentCanvas>                      [V1] Enhanced
│   ├── <TeamNodeGroup />              [P1] Grouped team nodes
│   ├── <AgentNode>                    [V1] With role badge overlay
│   │   └── <RoleBadge />             [P1] Color-coded role indicator
│   ├── <OrchestrationEdge />          [P1] Animated flow arrows
│   ├── <CanvasToolbar />
│   │   ├── <OrchestrationSelector /> [P1] Execution strategy dropdown
│   │   └── <ConcurrencySlider />     [P1] Max concurrency control
│   └── <CanvasMinimap />             [V1]
│
├── <AgentRunView>                     [V1] Enhanced
│   ├── <RunProgressBar />            [V1]
│   ├── <EventStream />               [V1] With verification badges
│   ├── <ReflectionPanel />           [P1] Live critique/fix cycle
│   ├── <ApprovalGate />              [P3] Pause for user approval
│   └── <ObservabilityTimeline />     [P3] CI/CD-style run timeline
│
├── <AgentInspector>                   [V1] Enhanced
│   ├── <BasicConfig />               [V1] Name, goal, personality
│   ├── <RoleSelector />              [P1] Role dropdown with badges
│   ├── <ToolConfig />                [V1] With verification settings
│   ├── <MemoryInspector />           [P2] Session/persistent/artifact tabs
│   ├── <ReflectionConfig />          [P1] Self-improve toggle + settings
│   ├── <OrchestrationConfig />       [P1] Team mode + termination
│   └── <PolicyConfig />              [P3] Risk level, approval rules
│
├── <TeamBuilder>                      [P1] Drag agents into team
│   ├── <AgentPicker />               [P1] Select agents for team
│   ├── <ModeSelector />              [P1] Sequential/Group/Hierarchical/Parallel
│   └── <TerminationConfig />         [P1] When to stop
│
├── <PolicyDashboard>                  [P3] Manage policy rules
│   ├── <PolicyRuleList />            [P3] List + edit policies
│   └── <PolicyRuleEditor />          [P3] Create/edit conditions
│
├── <ApprovalModal>                    [P3] Human-in-the-loop
│   ├── <ActionPreview />             [P3] Show proposed action
│   └── <ApprovalActions />           [P3] Approve/Deny + reason
│
├── <TaskGraphView>                    [P4] DAG visualization
│   ├── <TaskNode />                  [P4] Task with status
│   └── <DependencyEdge />            [P4] Dependency arrows
│
└── <MetricsDashboard>                 [P3] Performance analytics
    ├── <TokenUsageChart />           [P3] Token consumption over time
    ├── <LatencyChart />              [P3] Step latency breakdown
    └── <SuccessRateChart />          [P3] Tool success rates
```

### New Zustand Stores

```
agent-store.ts    — V1 store (enhanced with error state, canvas persistence)
team-store.ts     — [P1] Teams, orchestration state
memory-store.ts   — [P2] Memory entries, artifacts
policy-store.ts   — [P3] Policy rules, approval queue
metrics-store.ts  — [P3] Run metrics, system status
system-store.ts   — [P3] Global system state
```

---

## 12. Security Architecture

### 12.1 Threat Model (From Research)

| Threat | Source | Mitigation |
|--------|--------|------------|
| **Confused Deputy** | Untrusted agent manipulates trusted agent | Policy engine checks inter-agent messages; role-based permission boundaries |
| **Cross-Agent Escalation** | Agents combine permissions | Least-privilege per role; audit all cross-agent communication |
| **Prompt Injection via Tool Output** | Malicious web content hijacks agent | Sanitize tool outputs; separate instructions from data in prompts |
| **Reward Hacking** (reflection) | Generator learns to fool critic | Use deterministic validators; cap reflection iterations; human approval for high-stakes |
| **Resource Exhaustion** | Unlimited concurrent runs | Semaphore + run queue with MAX_CONCURRENT_RUNS |
| **Data Exfiltration** | Agent sends data to external URL | Policy blocks for browser tool on untrusted domains; audit all external calls |

### 12.2 Security Measures by Phase

| Phase | Measure | Implementation |
|-------|---------|----------------|
| P0 | Input sanitization | Strip HTML/scripts from LLM output before storing |
| P0 | Concurrency limits | Semaphore on agent runs (MAX_CONCURRENT=5) |
| P1 | Role-based permissions | RolePermissions checked before tool execution |
| P2 | Tool risk levels | Each tool tagged as low/medium/high/critical |
| P2 | Deterministic validators | JSON schema, code compilation checks |
| P3 | Policy engine | Pre-execution policy check on every tool call |
| P3 | Approval gates | Human-in-the-loop for high-risk actions |
| P3 | Immutable audit trail | Append-only AuditLog model |
| P3 | Approval timeout | Auto-expire pending approvals after configurable time |

---

## 13. Deployment & Infrastructure

### 13.1 Current (V1)

```
Single Next.js process → SQLite file → No auth → No scaling
```

### 13.2 V2 Target

```
┌─────────────────────────────────────────────────────┐
│                    Caddy Gateway                      │
│                  (port 81 → 3000)                     │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│              Next.js App (port 3000)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ API Routes   │  │ SSE Stream   │  │ Static UI  │ │
│  │ + Validation │  │ + Reconnect  │  │ + Canvas   │ │
│  └──────┬──────┘  └──────┬───────┘  └────────────┘ │
│         │                │                           │
│  ┌──────▼────────────────▼───────────────────────┐  │
│  │            Agent Engine                        │  │
│  │  Orchestrator | Strategies | Policy | Metrics  │  │
│  └──────────────────────┬────────────────────────┘  │
│                         │                            │
│  ┌──────────────────────▼────────────────────────┐  │
│  │         Prisma + SQLite (WAL mode)            │  │
│  │  12 models | Indexed | Enum-constrained       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 13.3 SQLite → PostgreSQL Migration Path

When scale demands it (multi-user SaaS), the schema is designed for easy migration:

- All enums stored as strings (compatible with both SQLite and Postgres)
- No SQLite-specific features used
- Prisma supports both providers — change `datasource` and run `db:push`
- WAL mode for SQLite handles read concurrency until migration is needed

---

## 14. Implementation Roadmap

### Week 1: Phase 0 — Critical Production Fixes
| Day | Tasks |
|-----|-------|
| Mon | C01-C03: Memory leak triage (eventListeners, activeRuns, runMemories) |
| Tue | C04-C05: Singleton fix, LLM parsing fix with zod |
| Wed | C06: Real tool implementations (web-search, web-reader) |
| Thu | C07-C08: Concurrency control, DB error handling |
| Fri | C09-C16: Store errors, evaluator fix, indexes, canvas persistence, SSE reconnect |

### Week 2-3: Phase 1 — Multi-Agent Orchestration
| Week | Tasks |
|------|-------|
| W2 Mon-Tue | OrchestrationMode types, Team model, orchestrator.ts |
| W2 Wed-Thu | Sequential + Group chat strategies |
| W2 Fri | Hierarchical strategy |
| W3 Mon | Parallel strategy with semaphore |
| W3 Tue-Wed | Reflection loop system |
| W3 Thu | Agent role system + ROLE_DEFINITIONS |
| W3 Fri | Team API routes + Team builder UI |

### Week 4: Phase 1 UI + Integration
| Day | Tasks |
|-----|-------|
| Mon | OrchestrationSelector, RoleBadge, RoleSelector components |
| Tue | Team builder dialog, reflection panel |
| Mon-Wed | Canvas enhancements: team nodes, orchestration edges |
| Thu | SSE events for multi-agent (typed, sequenced) |
| Fri | Integration testing + Phase 1 polish |

### Week 5-6: Phase 2 — Memory, Tools & Verification
| Week | Tasks |
|------|-------|
| W5 Mon-Tue | MemoryManager (3-tier), AgentMemory + Artifact models |
| W5 Wed | Memory API routes + Memory Inspector UI |
| W5 Thu-Fri | Tool registry, verification layer, built-in validators |
| W6 Mon | Tool API routes + Tool config UI |
| W6 Tue | Verification badges on Step results |
| W6 Wed-Fri | Integration: wire tool registry into agent execution, testing |

### Week 7-9: Phase 3 — Governance & Observability
| Week | Tasks |
|------|-------|
| W7 Mon-Wed | Policy engine, PolicyRule model, default policies |
| W7 Thu-Fri | Approval flow with DB persistence, ApprovalModal UI |
| W8 Mon | Audit trail (immutable), AuditLog model |
| W8 Tue-Wed | MetricsCollector, TimelineEvent model, observability timeline UI |
| W8 Thu-Fri | SystemStateManager, SystemStateIndicator, system dashboard |
| W9 Mon-Wed | PolicyDashboard UI, MetricsDashboard charts |
| W9 Thu-Fri | Integration testing: policy → approval → audit → metrics flow |

### Week 10-12: Phase 4 — Advanced Features
| Week | Tasks |
|------|-------|
| W10 Mon-Wed | TaskGraph model, task decomposition, DAG execution |
| W10 Thu-Fri | TaskGraphView UI, dependency visualization |
| W11 Mon-Tue | AgentTrigger model, cron infrastructure |
| W11 Wed | Webhook trigger infrastructure |
| W11 Thu-Fri | AgentTemplate model, template gallery UI, 5 new templates |
| W12 | Full integration testing, performance optimization, documentation |

---

## 15. Risk Register

### Technical Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | SSE breaks with multi-agent (event ordering/correlation) | Medium | High | Typed events with `agentId + sequenceNumber`; client-side deduplication |
| R2 | SQLite concurrent writes under parallel execution | Medium | High | WAL mode; serialize writes through single writer; migration path to Postgres |
| R3 | LLM cost spike with reflection + multi-agent | High | Medium | Token budget per run; cap reflection iterations; cache planner decisions |
| R4 | Group chat context bloat degrades quality | Medium | Medium | Context windowing; summarize older messages; max_messages termination |
| R5 | Kill switch doesn't cleanly stop parallel agents | Medium | High | AbortController per orchestration; propagate signal to all child agents |
| R6 | Policy engine latency adds overhead to every tool call | Low | Medium | Cache policy evaluations; pre-compute for common patterns |
| R7 | Zod validation rejects valid LLM output | Medium | Medium | Fallback extraction strategies; retry with "respond in valid JSON" prompt |
| R8 | Memory leak in long-running orchestrations | Medium | Critical | Periodic cleanup; memory monitoring; circuit breaker on memory usage |

### Security Risks

| # | Risk | Mitigation |
|---|------|------------|
| S1 | Confused deputy attack in hierarchical mode | Policy checks on inter-agent messages; role boundaries |
| S2 | Cross-agent privilege escalation | Least-privilege per role; audit all cross-agent communication |
| S3 | Prompt injection via web content | Sanitize tool outputs; separate instructions from data |
| S4 | Reward hacking in reflection loops | Deterministic validators; human approval for high-stakes |
| S5 | Arbitrary code execution via code tool | Sandboxed subprocess; timeout; network isolation |

---

## 16. Success Metrics

### Technical Metrics

| Metric | V1 Baseline | V2 Target |
|--------|-------------|-----------|
| Uptime (no memory leaks) | Hours | 30+ days |
| Concurrent runs supported | 1 | 5+ |
| Max agents per orchestration | 1 | 10+ |
| Run recovery after error | None | Full state preserved |
| Tool output verification | None | 100% with validators |
| Policy coverage | None | All tool calls checked |
| Audit completeness | None | Every action logged |

### Performance Metrics

| Metric | V2 Target |
|--------|-----------|
| Policy check latency | <10ms |
| SSE event delivery | <100ms |
| Canvas render (50 nodes) | <200ms |
| Memory lookup (persistent) | <50ms |
| Reflection iteration | <5s per cycle |

### User Experience Metrics

| Metric | V2 Target |
|--------|-----------|
| Task completion rate | >90% |
| Time to first agent run | <2 minutes |
| Approval response time | <30 seconds |
| Error recovery rate | >95% |

---

## Appendix: Key Research-Informed Design Decisions

1. **Sequential as default orchestration** — AutoGen research shows sequential is cleaner for enterprise pipelines. Group chat adds value only when shared deliberation is needed.

2. **Deterministic validators over LLM judges** — RLVR research: verifiable rewards (JSON parsing, code compilation) are immune to reward hacking. Subjective LLM judges are exploitable.

3. **Soft limits over hard kills** — AgentCgroup: OOM kills destroy non-recoverable LLM context. Our policy engine throttles/pauses rather than terminates.

4. **Rule-based speaker selection over LLM** — AutoGen docs: replace LLM speaker selection with simple rules when order is obvious. Saves tokens and latency.

5. **Weaker planner + stronger solver** — The "combo effect": delegative planner + capable solver > single dominant model doing everything.

6. **Immutable audit trail** — AWS and Microsoft security guidance mandate traceability as a core requirement, not optional.

7. **3-tier memory** — AgentCgroup: LLM context cannot be checkpointed or migrated. DB-backed persistent memory is critical for recovery.

8. **Pre-execution policy hooks** — SEAgent's MAC model: check every action before execution, not after. Block/Deny, Ask, or Shadow.

9. **Zod for LLM output parsing** — Fragile regex parsing (V1 bug C05) is replaced with schema validation that handles edge cases, nested JSON, and provides typed output.

10. **Feature flags for gradual rollout** — All V2 features are opt-in via configuration. V1 agents continue as `orchestrationMode: 'single'`. No breaking changes.

---

*This plan transforms Agent Studio OS from a prototype with critical memory leaks and simulated tools into an enterprise-grade Agent Runtime OS with multi-agent orchestration, reflection loops, governance, observability, and production reliability.*
