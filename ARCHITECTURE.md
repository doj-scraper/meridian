# Architecture Reference

> Complete architectural documentation for Agent Studio OS — every file, every layer, every connection.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Data Flow Diagrams](#2-data-flow-diagrams)
3. [Component Architecture](#3-component-architecture)
4. [Agent Engine](#4-agent-engine)
5. [API Layer — Complete Reference](#5-api-layer--complete-reference)
6. [Database Schema](#6-database-schema)
7. [State Management](#7-state-management)
8. [UI Component Tree](#8-ui-component-tree)
9. [File Reference — Every File in the Repo](#9-file-reference--every-file-in-the-repo)
10. [Design System](#10-design-system)
11. [Infrastructure](#11-infrastructure)

---

## 1. System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    Agent Studio Shell                           │  │
│  │  ┌──────────┐  ┌──────────────────────┐  ┌─────────────────┐  │  │
│  │  │ Explorer  │  │   Module Viewport    │  │   Inspector     │  │  │
│  │  │ Sidebar   │  │ ┌────┐┌──────┐┌───┐ │  │   (Config)      │  │  │
│  │  │ (260px)   │  │ │Agent││Router ││Pipe│ │  │   (320px)      │  │  │
│  │  │           │  │ │Flow ││Engine ││line│ │  │                │  │  │
│  │  │ Agents    │  │ └────┘└──────┘└───┘ │  │  Basic          │  │  │
│  │  │ Skills    │  │                      │  │  Skills         │  │  │
│  │  │ Workflows │  │                      │  │  Orchestration  │  │  │
│  │  │ Templates │  │                      │  │  Reflection     │  │  │
│  │  │ Runs      │  │                      │  │  Memory         │  │  │
│  │  └──────────┘  └──────────────────────┘  └─────────────────┘  │  │
│  │                                                                │  │
│  │  Topbar: [Logo] [File|Edit|View|Help] [Tabs] [Status] [Toggles]│  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Zustand Store ←──────── SSE Stream ────────────────────────┐       │
│  (agent-store.ts)                                            │       │
└──────────────────────────────────────────────────────────────┼───────┘
                                                               │
┌──────────────────────────────────────────────────────────────┼───────┐
│                    NEXT.JS SERVER (Port 3000)                 │       │
│                                                              │       │
│  ┌─────────────────────┐  ┌─────────────────────┐           │       │
│  │   App Router Pages   │  │    API Routes (30+) │           │       │
│  │   / → AgentStudio   │  │                     │           │       │
│  │                     │  │  /api/agent/*       │───────────┘       │
│  │                     │  │  /api/team/*        │                   │
│  │                     │  │  /api/template/*    │                   │
│  │                     │  │  /api/policy/*      │                   │
│  │                     │  │  /api/approval/*    │                   │
│  │                     │  │  /api/memory/*      │                   │
│  │                     │  │  /api/artifacts/*   │                   │
│  │                     │  │  /api/metrics/*     │                   │
│  │                     │  │  /api/timeline      │                   │
│  │                     │  │  /api/audit/*       │                   │
│  │                     │  │  /api/tools/*       │                   │
│  │                     │  │  /api/trigger/*     │                   │
│  │                     │  │  /api/task-graph/*  │                   │
│  └─────────────────────┘  └─────────┬───────────┘                   │
│                                     │                               │
│  ┌──────────────────────────────────┼─────────────────────────────┐ │
│  │                     Agent Engine  │                             │ │
│  │                                  ▼                             │ │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────────┐ │ │
│  │  │ Planner  │ │ Executor │ │ Evaluator │ │ Orchestrator    │ │ │
│  │  │          │ │          │ │           │ │                 │ │ │
│  │  │ plan()   │ │ runStep()│ │ evaluate()│ │ 5 modes:        │ │ │
│  │  │ build()  │ │ tools[]  │ │ LLM judge │ │ single/seq/     │ │ │
│  │  │          │ │ verify() │ │           │ │ group/hier/par  │ │ │
│  │  └──────────┘ └──────────┘ └───────────┘ └─────────────────┘ │ │
│  │                                                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐  │ │
│  │  │ Policy   │ │Reflection│ │ Metrics   │ │ System State  │  │ │
│  │  │ Engine   │ │ Loop     │ │ Collector │ │ Manager       │  │ │
│  │  └──────────┘ └──────────┘ └───────────┘ └───────────────┘  │ │
│  │                                                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐  │ │
│  │  │ Memory   │ │Memory V2 │ │ Tool      │ │ ZAI Client    │  │ │
│  │  │ (V1)     │ │(3-tier)  │ │ Registry  │ │ (SDK wrapper) │  │ │
│  │  └──────────┘ └──────────┘ └───────────┘ └───────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                     │                             │
│  ┌──────────────────────────────────┼───────────────────────────┐ │
│  │                     Prisma ORM   ▼                           │ │
│  │                                                              │ │
│  │  SQLite: 16 models                                           │ │
│  │  Agent · AgentRun · Step · Team · AgentMemory · Artifact    │ │
│  │  PolicyRule · ApprovalRequest · AuditLog · TimelineEvent    │ │
│  │  ReflectionIteration · AgentTemplate · AgentTrigger          │ │
│  │  TaskNode · TaskEdge · TaskGraph                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘

                          │
                          ▼

┌──────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                                │
│                                                                      │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────┐  │
│  │   ZAI LLM API     │  │   ZAI Web Search  │  │ ZAI Page Reader │  │
│  │   (z-ai-web-dev-  │  │   (z-ai-web-dev-  │  │ (z-ai-web-dev-  │  │
│  │    sdk)            │  │    sdk)            │  │  sdk)           │  │
│  └───────────────────┘  └───────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Layer Boundaries

```
┌─────────────────────────────────┐
│         Presentation Layer       │    React components, Framer Motion,
│    (src/components/)            │    shadcn/ui, React Flow, Zustand
├─────────────────────────────────┤
│         API Layer               │    Next.js API routes, SSE streaming,
│    (src/app/api/)               │    request validation, HTTP semantics
├─────────────────────────────────┤
│         Business Logic Layer    │    Agent engine, orchestrator, policy,
│    (src/lib/agent/)             │    reflection, memory, metrics, roles
├─────────────────────────────────┤
│         Data Access Layer       │    Prisma ORM, SQLite, schema migrations
│    (src/lib/db.ts, prisma/)     │
├─────────────────────────────────┤
│         External Services       │    ZAI SDK (LLM, Search, Page Reader)
│    (src/lib/agent/zai-client)   │
└─────────────────────────────────┘
```

---

## 2. Data Flow Diagrams

### Agent Execution Flow

```
User Clicks "Run"
       │
       ▼
┌──────────────┐     POST /api/agent/run     ┌──────────────────┐
│  Zustand     │ ──────────────────────────── │  API Route       │
│  startRun()  │                              │  run/route.ts    │
└──────────────┘                              └────────┬─────────┘
                                                       │
                                              Create AgentRun in DB
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │  Orchestrator    │
                                              │  .run()          │
                                              │                  │
                                              │  Mode dispatch:  │
                                              │  single/seq/     │
                                              │  group/hier/par  │
                                              └────────┬─────────┘
                                                       │
                                         ┌─────────────┼──────────────┐
                                         │             │              │
                                         ▼             ▼              ▼
                                   ┌──────────┐  ┌──────────┐  ┌──────────┐
                                   │ Agent 1  │  │ Agent 2  │  │ Agent N  │
                                   │ Run Loop │  │ Run Loop │  │ Run Loop │
                                   └────┬─────┘  └────┬─────┘  └────┬─────┘
                                        │             │              │
                              ┌─────────┴──┐   ┌─────┴──┐    ┌─────┴──┐
                              │  Per Step: │   │        │    │        │
                              │            │   │        │    │        │
                              │ 1. Plan    │   │  ...   │    │  ...   │
                              │    (LLM)   │   │        │    │        │
                              │ 2. Execute │   │        │    │        │
                              │    (Tool)  │   │        │    │        │
                              │ 3. Verify  │   │        │    │        │
                              │ 4. Record  │   │        │    │        │
                              │ 5. Emit    │   │        │    │        │
                              │    Event   │   │        │    │        │
                              └────────────┘   │        │    │        │
                                        │             │              │
                                        ▼             ▼              ▼
                              ┌──────────────────────────────────────────┐
                              │           SSE Event Stream               │
                              │   GET /api/agent/stream?runId=xxx       │
                              │                                          │
                              │   Events: status, plan, action, result, │
                              │   thinking, error, done, reflection,    │
                              │   policy, handoff, group_message        │
                              └──────────────────┬───────────────────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │  Zustand Store   │
                                        │  addEvent()      │
                                        │  setIsRunning()  │
                                        │  AgentRunView    │
                                        │  (real-time UI)  │
                                        └──────────────────┘
```

### Policy Check Flow

```
Agent Wants to Execute Tool
       │
       ▼
┌──────────────┐
│  Policy      │──── Check conditions against tool, role, risk level
│  Engine      │
│  .check()    │
└──────┬───────┘
       │
       ├── ALLOW ──────────────► Execute tool normally
       │
       ├── BLOCK ──────────────► Return error, emit "policy" event
       │
       ├── ASK_USER ──────────► Create ApprovalRequest in DB
       │                          │
       │                          ▼
       │                     ┌──────────────┐
       │                     │  Approval    │──── UI: ApprovalModal
       │                     │  Request     │     (pending in sidebar)
       │                     └──────┬───────┘
       │                            │
       │                     User Responds
       │                            │
       │                     ┌──────┴───────┐
       │                     │              │
       │                  Approved        Denied
       │                     │              │
       │                     ▼              ▼
       │               Execute tool    Return error
       │
       └── SHADOW ───────────► Execute tool + log audit (no block)
```

### Memory Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MemoryManager                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Session     │  │  Persistent  │  │   Artifact   │  │
│  │   (In-Memory) │  │  (Database)  │  │  (Database)  │  │
│  │               │  │              │  │              │  │
│  │  • Run-scoped │  │  • Cross-run │  │  • Named     │  │
│  │  • 24h expiry │  │  • Upsert    │  │  • Versioned │  │
│  │  • Fast       │  │  • Durable   │  │  • Content   │  │
│  │  • Ephemeral  │  │  • Key-value │  │  • Metadata  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  API: get() · set() · delete() · list()                 │
│       clearSession() · listArtifacts() · saveArtifact() │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### Module Routing

```
AgentStudio (Shell)
    │
    ├── activeModule === "canvas"
    │   ├── AgentSidebar (Explorer)
    │   ├── AgentCanvas (React Flow)
    │   │   └── AgentNode (Custom Node)
    │   └── AgentInspector (Config Form)
    │
    ├── activeModule === "router"
    │   └── RoutingEngine (ε-Greedy + Q-Table)
    │
    ├── activeModule === "pipeline"
    │   └── PipelineStudio (DevOps Pipeline)
    │
    └── activeModule === "workflow"
        └── Coming Soon Placeholder

Overlays (always mounted):
    ├── AgentBuilderWizard (Dialog)
    ├── ApprovalModal (AlertDialog)
    └── TeamBuilderDialog (Dialog)
```

### UI Component Hierarchy

```
AgentStudio
├── <header> (Topbar)
│   ├── Logo ("A" + "Agent Studio OS beta")
│   ├── <Menubar>
│   │   ├── File → AI Builder / New Agent / New Workflow / New Team
│   │   ├── Edit → Configuration / Routing Policies / Delete Agent
│   │   ├── View → Explorer ☑ / Inspector ☑ / Modules ▸
│   │   └── Help → About / Documentation / Keyboard Shortcuts
│   ├── <nav> (Module Tabs: Agents | Router | Pipeline | Studio)
│   ├── <SystemIndicator> (Status Dot + Label)
│   ├── Agent Count Badge
│   ├── Sidebar Toggle Button
│   └── Inspector Toggle Button
│
├── <main> (Content Area)
│   ├── Sidebar Strip (when collapsed, 32px)
│   │   └── Panel Open Button + Agent Dots
│   ├── Sidebar Panel (when open, 260px)
│   │   └── AgentSidebar
│   │       ├── FolderSection "Agents"
│   │       ├── FolderSection "Skills"
│   │       ├── FolderSection "Workflows"
│   │       ├── FolderSection "Templates" (collapsed)
│   │       └── FolderSection "Recent Runs" (collapsed)
│   ├── Center Content (flex-1)
│   │   ├── AgentCanvas (React Flow)
│   │   │   ├── AgentNode × N
│   │   │   ├── Edges (animated)
│   │   │   ├── Toolbar (Zoom, Layout)
│   │   │   └── AgentRunView (when running)
│   │   │       ├── Progress Bar
│   │   │       ├── Event Cards (animated)
│   │   │       └── ReflectionPanel
│   │   ├── RoutingEngine (when router module)
│   │   └── PipelineStudio (when pipeline module)
│   │       └── Pipeline Stages + SVG Connectors
│   ├── Inspector Strip (when collapsed, 32px)
│   │   └── Panel Open Button + "CFG" Label
│   └── Inspector Panel (when open, 320px)
│       └── AgentInspector
│           ├── Header (Role Badge + Run/Stop)
│           ├── Section "Basic" (Name, Goal, Personality)
│           ├── Section "Skills" (Tool Toggles)
│           ├── Section "Orchestration" (Role, Model, Mode)
│           ├── Section "Reflection" (Enable, Iterations, Criteria)
│           ├── Section "Memory & Output" (Memory Toggles, Max Steps, Format)
│           ├── Section "Memory" (MemoryInspector)
│           ├── Section "Danger Zone" (Delete Agent)
│           └── Footer (Test + Save)
│
├── AgentBuilderWizard (Dialog Overlay)
│   ├── Step 1: User Input
│   ├── Step 2: Building (Spinner)
│   └── Step 3: Result (Config Preview)
│
├── ApprovalModal (AlertDialog Overlay)
│   └── Approval Request + Approve/Deny Buttons
│
└── TeamBuilderDialog (Dialog Overlay)
    ├── Team Name Input
    ├── Orchestration Mode Grid
    ├── Agent Selection Checkboxes
    └── Create/Cancel Buttons
```

---

## 4. Agent Engine

### Module Dependency Graph

```
                    ┌────────────┐
                    │  zai-client│ ← Singleton ZAI SDK wrapper
                    │  (z-ai-    │
                    │  web-dev-  │
                    │  sdk)      │
                    └─────┬──────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Planner  │ │ Evaluator│ │ Tools    │
        │          │ │          │ │          │
        │ plan()   │ │evaluate()│ │execute() │
        │ build()  │ │          │ │verify()  │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │             │             │
             │      ┌──────┴──────┐      │
             │      │             │      │
             ▼      ▼             ▼      ▼
        ┌──────────────────────────────────┐
        │           agent.ts               │
        │                                  │
        │  runAgent()  ← Main loop         │
        │  runStep()   ← Single step       │
        │  emitEvent() ← Event system      │
        │  stopRun()   ← Cancellation      │
        └──────────────┬───────────────────┘
                       │
              ┌────────┼────────┐
              │        │        │
              ▼        ▼        ▼
        ┌──────────┐ ┌──────┐ ┌───────────┐
        │ Memory   │ │Roles │ │ Policy    │
        │ Manager  │ │      │ │ Engine    │
        │ (V1/V2)  │ │      │ │           │
        └──────────┘ └──────┘ └─────┬─────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ Orchestrator  │
                                │              │
                                │ 5 modes:     │
                                │ single       │
                                │ sequential   │
                                │ group        │
                                │ hierarchical │
                                │ parallel     │
                                └──────┬───────┘
                                       │
                              ┌────────┼────────┐
                              │        │        │
                              ▼        ▼        ▼
                         Reflection   Metrics  System
                         Loop        Collector State
                                                    Manager
```

### Engine Modules Reference

| Module | File | Singleton | Purpose |
|--------|------|-----------|---------|
| ZAI Client | `zai-client.ts` | Yes (`getZAI()`) | Lazy-initialized SDK wrapper with dedup lock |
| Types | `types.ts` | N/A | Central type definitions + Zod schemas |
| Planner | `planner.ts` | No | LLM-based action planning + agent building |
| Tools | `tools.ts` | No | 5 built-in tools + verification + metadata |
| Tool Registry | `tool-registry.ts` | Yes (`ToolRegistry`) | Advanced tool registration with zod validation |
| Agent Loop | `agent.ts` | No | Core execution loop + event system + concurrency |
| Evaluator | `evaluator.ts` | No | Goal completion evaluation (rule + LLM) |
| Orchestrator | `orchestrator.ts` | Yes (`getOrchestrator()`) | Multi-agent orchestration (5 modes) |
| Memory V1 | `memory.ts` | No | In-memory run-scoped store, 1h auto-cleanup |
| Memory V2 | `memory-v2.ts` | Yes (`memoryManager`) | 3-tier memory (session/persistent/artifact) |
| Roles | `roles.ts` | No | 6 roles with permissions + prompt modifiers |
| Policy Engine | `policy.ts` | Yes (`policyEngine`) | Condition matching + approval workflow + audit |
| Reflection | `reflection.ts` | No | Critic-generator iterative loop |
| Metrics | `metrics.ts` | Yes (`metricsCollector`) | Run + system metrics collection |
| System State | `system-state.ts` | Yes (`systemStateManager`) | System-wide state with pub/sub |

### Tool System

```
┌─────────────────────────────────────────────────────────┐
│                     Tool Registry                        │
│                                                          │
│  Built-in Tools:                                         │
│  ┌────────────┐ ┌────────────┐ ┌─────────────────────┐ │
│  │ web_search │ │ write_file │ │ execute_code         │ │
│  │            │ │            │ │                      │ │
│  │ ZAI Search │ │ Save to    │ │ Code execution with  │ │
│  │ API        │ │ memory     │ │ verification         │ │
│  └────────────┘ └────────────┘ └─────────────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌─────────────────────┐ │
│  │ browse_url │ │save_memory │ │ read_memory          │ │
│  │            │ │            │ │                      │ │
│  │ ZAI Page   │ │ Persistent │ │ Retrieve from        │ │
│  │ Reader     │ │ memory     │ │ memory tiers         │ │
│  └────────────┘ └────────────┘ └─────────────────────┘ │
│                                                          │
│  Verification Methods:                                   │
│  • json_schema   — Validate against JSON schema          │
│  • code_compiles — Check code compiles                   │
│  • url_reachable — HTTP HEAD check                       │
│  • regex_match   — Pattern matching                      │
│  • custom        — User-defined validator function        │
│                                                          │
│  Risk Levels: low · medium · high · critical             │
└─────────────────────────────────────────────────────────┘
```

### Orchestration Modes

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   SINGLE     │     │  SEQUENTIAL  │     │  PARALLEL    │
│              │     │              │     │              │
│  ┌───┐      │     │  ┌───┐ ┌───┐ │     │  ┌───┐      │
│  │ A │      │     │  │ A │→│ B │ │     │  │ A │ ┐    │
│  └───┘      │     │  └───┘ └───┘ │     │  └───┘ │    │
│             │     │              │     │  ┌───┐ │    │
│  One agent  │     │  Handoff     │     │  │ B │ ├─►  │
│  runs alone │     │  chain       │     │  └───┘ │    │
│             │     │              │     │  ┌───┐ │    │
│             │     │              │     │  │ C │ ┘    │
│             │     │              │     │  └───┘      │
│             │     │              │     │  Fan-out    │
│             │     │              │     │  Semaphore  │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────────────────────┐
│    GROUP     │     │       HIERARCHICAL            │
│              │     │                                │
│  ┌───┐ ┌───┐│     │         ┌───┐                  │
│  │ A │ │ B ││     │         │ M │ Manager           │
│  └─┬─┘ └─┬─┘│     │         └─┬─┘                  │
│    │     │  │     │       ┌───┼───┐                  │
│  ┌─▼─────▼─┐│     │     ┌─▼─┐┌─▼─┐┌▼──┐            │
│  │ Scratch ││     │     │ W1││ W2││W3 │ Workers     │
│  │  Pad    ││     │     └───┘└───┘└───┘            │
│  └─────────┘│     │       └───┼───┘                  │
│             │     │         ┌─▼─┐                    │
│  LLM picks  │     │         │Syn│ Synthesizer        │
│  speaker    │     │         └───┘                    │
└──────────────┘     └──────────────────────────────┘
```

---

## 5. API Layer — Complete Reference

### Agent Endpoints

| Method | Path | Handler File | Description |
|--------|------|-------------|-------------|
| `POST` | `/api/agent/create` | `api/agent/create/route.ts` | Create new agent with V1+V2 fields |
| `GET` | `/api/agent/list` | `api/agent/list/route.ts` | List all agents with run counts |
| `PATCH` | `/api/agent/update` | `api/agent/update/route.ts` | Update agent config or graphData |
| `DELETE` | `/api/agent/delete?id=` | `api/agent/delete/route.ts` | Delete agent (cascades runs+steps) |
| `POST` | `/api/agent/build` | `api/agent/build/route.ts` | Build agent from natural language via AI |
| `POST` | `/api/agent/run` | `api/agent/run/route.ts` | Start agent run (single or orchestrated) |
| `GET` | `/api/agent/runs` | `api/agent/runs/route.ts` | List runs (all, by agent, or specific run) |
| `POST` | `/api/agent/stop` | `api/agent/stop/route.ts` | Stop a running agent |
| `GET` | `/api/agent/stream` | `api/agent/stream/route.ts` | SSE stream for real-time events |

### Team Endpoints

| Method | Path | Handler File | Description |
|--------|------|-------------|-------------|
| `POST` | `/api/team/create` | `api/team/create/route.ts` | Create team with agents |
| `GET` | `/api/team/list` | `api/team/list/route.ts` | List teams with agents |
| `GET` | `/api/team/get?id=` | `api/team/get/route.ts` | Get team by ID |
| `PATCH` | `/api/team/update` | `api/team/update/route.ts` | Update team config |
| `POST` | `/api/team/run` | `api/team/run/route.ts` | Start team orchestration |
| `POST` | `/api/team/stop` | `api/team/stop/route.ts` | Stop team orchestration |

### Template Endpoints

| Method | Path | Handler File | Description |
|--------|------|-------------|-------------|
| `POST` | `/api/template/create` | `api/template/create/route.ts` | Create agent template |
| `GET` | `/api/template/list` | `api/template/list/route.ts` | List templates with filters |
| `GET` | `/api/template/get?id=` | `api/template/get/route.ts` | Get template by ID |
| `DELETE` | `/api/template/delete?id=` | `api/template/delete/route.ts` | Delete template |
| `POST` | `/api/template/instantiate` | `api/template/instantiate/route.ts` | Create agent from template |

### Policy Endpoints

| Method | Path | Handler File | Description |
|--------|------|-------------|-------------|
| `GET` | `/api/policy/list` | `api/policy/list/route.ts` | List policy rules |
| `POST` | `/api/policy/create` | `api/policy/create/route.ts` | Create policy rule |
| `PATCH` | `/api/policy/update` | `api/policy/update/route.ts` | Update policy rule |
| `DELETE` | `/api/policy/delete?id=` | `api/policy/delete/route.ts` | Delete policy rule |

### Approval Endpoints

| Method | Path | Handler File | Description |
|--------|------|-------------|-------------|
| `GET` | `/api/approval/list` | `api/approval/list/route.ts` | List pending approvals |
| `POST` | `/api/approval/respond` | `api/approval/respond/route.ts` | Approve or deny request |

### Memory Endpoints

| Method | Path | Handler File | Description |
|--------|------|-------------|-------------|
| `GET` | `/api/memory/get` | `api/memory/get/route.ts` | Retrieve memory value |
| `POST` | `/api/memory/set` | `api/memory/set/route.ts` | Write memory value |
| `GET` | `/api/memory/list` | `api/memory/list/route.ts` | List memory entries |

### Artifact Endpoints

| Method | Path | Handler File | Description |
|--------|------|-------------|-------------|
| `GET` | `/api/artifacts/list` | `api/artifacts/list/route.ts` | List agent artifacts |
| `GET` | `/api/artifacts/get` | `api/artifacts/get/route.ts` | Get specific artifact |

### Metrics Endpoints

| Method | Path | Handler File | Description |
|--------|------|-------------|-------------|
| `GET` | `/api/metrics/run` | `api/metrics/run/route.ts` | Run-level metrics |
| `GET` | `/api/metrics/system` | `api/metrics/system/route.ts` | System-wide metrics |

### Other Endpoints

| Method | Path | Handler File | Description |
|--------|------|-------------|-------------|
| `GET` | `/api/timeline` | `api/timeline/route.ts` | Timeline events for a run |
| `GET` | `/api/audit/list` | `api/audit/list/route.ts` | Audit log with filters |
| `GET` | `/api/tools/list` | `api/tools/list/route.ts` | List registered tools |
| `POST` | `/api/trigger/create` | `api/trigger/create/route.ts` | Create trigger |
| `GET` | `/api/trigger/list` | `api/trigger/list/route.ts` | List triggers |
| `PATCH` | `/api/trigger/update` | `api/trigger/update/route.ts` | Update trigger |
| `DELETE` | `/api/trigger/delete` | `api/trigger/delete/route.ts` | Delete trigger |
| `POST` | `/api/trigger/execute` | `api/trigger/execute/route.ts` | Execute trigger manually |
| `POST` | `/api/task-graph/create` | `api/task-graph/create/route.ts` | Create task graph |
| `GET` | `/api/task-graph/list` | `api/task-graph/list/route.ts` | List task graphs |
| `GET` | `/api/task-graph/get` | `api/task-graph/get/route.ts` | Get task graph |
| `PATCH` | `/api/task-graph/update` | `api/task-graph/update/route.ts` | Update task graph |
| `DELETE` | `/api/task-graph/delete` | `api/task-graph/delete/route.ts` | Delete task graph |

---

## 6. Database Schema

### Entity Relationship Diagram

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  Agent   │───────│  AgentRun    │───────│   Step   │
│          │ 1   ∞ │              │ 1   ∞ │          │
│ id       │       │ id           │       │ id       │
│ name     │       │ agentId (FK) │       │ runId(FK)│
│ goal     │       │ status       │       │ stepNum  │
│ role     │       │ totalTokens  │       │ tool     │
│ model    │       │ totalLatency │       │ input    │
│ orchestr.│       │ metrics(JSON)│       │ result   │
│ tools    │       └──────┬───────┘       │ verify   │
│ graphData│              │               │ latency  │
└────┬─────┘              │               └──────────┘
     │                    │
     │ 1                  │ 1
     │                    │
     ∞                    ∞
┌──────────┐       ┌──────────────┐
│   Team   │       │TimelineEvent │
│          │       │              │
│ id       │       │ id           │
│ name     │       │ runId (FK)   │
│ mode     │       │ type         │
│ terminat.│       │ durationMs   │
│ sharedCtx│       │ tokenCount   │
└──────────┘       └──────────────┘


┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ AgentMemory  │  │   Artifact   │  │ PolicyRule   │
│              │  │              │  │              │
│ id           │  │ id           │  │ id           │
│ agentId      │  │ agentId      │  │ name         │
│ tier         │  │ runId        │  │ condition(J) │
│ key          │  │ name         │  │ action       │
│ value (JSON) │  │ type         │  │ priority     │
│ expiresAt    │  │ content      │  │ enabled      │
│              │  │ metadata(J)  │  │              │
│ UNIQUE:      │  │ UNIQUE:      │  └──────────────┘
│ agentId+key  │  │ agentId+name │
│ +tier        │  │              │
└──────────────┘  └──────────────┘


┌───────────────────┐  ┌──────────────────┐  ┌──────────────┐
│ ApprovalRequest   │  │    AuditLog      │  │ Reflection   │
│                   │  │                  │  │ Iteration    │
│ id                │  │ id               │  │              │
│ agentId           │  │ agentId          │  │ id           │
│ runId             │  │ runId            │  │ runId (FK)   │
│ tool              │  │ action           │  │ iteration    │
│ input             │  │ details (JSON)   │  │ output       │
│ riskLevel         │  │ outcome          │  │ critique     │
│ status            │  │ riskLevel        │  │ approved     │
│ respondedAt       │  │                  │  │              │
│ respondedBy       │  │ IMMUTABLE        │  └──────────────┘
│ reason            │  └──────────────────┘
└───────────────────┘


┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│AgentTemplate │  │ AgentTrigger │  │  TaskGraph   │
│              │  │              │  │              │
│ id           │  │ id           │  │ id           │
│ name         │  │ agentId (FK) │  │ name         │
│ category     │  │ type         │  │ description  │
│ config (JSON)│  │ config (JSON)│  │              │
│ isPublic     │  │ enabled      │  │ ┌──────────┐ │
│ usageCount   │  │ lastRunAt    │  │ │TaskNode[]│ │
│              │  │ nextRunAt    │  │ │TaskEdge[]│ │
│              │  │ runCount     │  │ └──────────┘ │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Model Details

| Model | PK | Unique Constraints | Indexes | JSON Fields |
|-------|----|--------------------|---------|-------------|
| Agent | id (cuid) | — | — | graphData, tools (csv) |
| AgentRun | id (cuid) | — | agentId | metrics |
| Step | id (cuid) | — | runId | verificationDetails |
| Team | id (cuid) | — | — | — |
| AgentMemory | id (cuid) | agentId+key+tier | — | value |
| Artifact | id (cuid) | agentId+name | — | metadata |
| PolicyRule | id (cuid) | — | — | condition |
| ApprovalRequest | id (cuid) | — | — | — |
| AuditLog | id (cuid) | — | — | details |
| TimelineEvent | id (cuid) | — | — | metadata |
| ReflectionIteration | id (cuid) | — | — | — |
| AgentTemplate | id (cuid) | — | — | config |
| AgentTrigger | id (cuid) | — | — | config |
| TaskNode | id (cuid) | — | graphId | config |
| TaskEdge | id (cuid) | — | graphId | condition |
| TaskGraph | id (cuid) | — | — | — |

---

## 7. State Management

### Zustand Store Structure

```
useAgentStore
├── Data State
│   ├── agents: AgentInfo[]           # All agents
│   ├── selectedAgentId: string|null  # Currently selected agent
│   ├── runs: RunInfo[]               # Recent runs
│   ├── currentRunId: string|null     # Active run
│   ├── events: AgentEvent[]          # Current run events
│   ├── error: string|null            # Global error
│   ├── teams: TeamInfo[]             # Agent teams
│   ├── policies: PolicyRuleInfo[]    # Policy rules
│   ├── pendingApprovals: ApprovalInfo[]  # Pending approvals
│   └── systemMetrics: SystemMetricsInfo|null  # System stats
│
├── Canvas State
│   ├── canvasNodes: Node[]           # React Flow nodes
│   └── canvasEdges: Edge[]           # React Flow edges
│
├── UI State
│   ├── viewMode: ViewMode            # canvas | builder | history
│   ├── activeModule: AppModule       # canvas | router | pipeline | workflow
│   ├── inspectorOpen: boolean        # Right panel visibility
│   ├── sidebarOpen: boolean          # Left panel visibility
│   ├── builderOpen: boolean          # Builder wizard visibility
│   ├── isBuilding: boolean           # Building agent in progress
│   └── isRunning: boolean            # Agent execution in progress
│
├── Sync Actions (15+ setters)
│   ├── setAgents, addAgent, updateAgent, removeAgent
│   ├── selectAgent (also sets inspectorOpen)
│   ├── setRuns, addRun, setCurrentRunId
│   ├── addEvent, clearEvents
│   ├── setCanvasNodes, setCanvasEdges
│   ├── setViewMode, setActiveModule
│   ├── setInspectorOpen, setSidebarOpen, setBuilderOpen
│   ├── setIsBuilding, setIsRunning, clearError
│
└── Async Actions (15+ API calls)
    ├── fetchAgents()                # GET /api/agent/list
    ├── fetchRuns(agentId?)          # GET /api/agent/runs
    ├── buildAgent(userInput)        # POST /api/agent/build
    ├── createAgent(data)            # POST /api/agent/create
    ├── deleteAgent(id)              # DELETE /api/agent/delete
    ├── startRun(agentId, goal?)     # POST /api/agent/run
    ├── stopRun(runId)               # POST /api/agent/stop
    ├── updateAgentConfig(id, data)  # PATCH /api/agent/update
    ├── fetchTeams()                 # GET /api/team/list
    ├── createTeam(data)             # POST /api/team/create
    ├── fetchPolicies()              # GET /api/policy/list
    ├── createPolicy(data)           # POST /api/policy/create
    ├── updatePolicy(id, data)       # PATCH /api/policy/update
    ├── deletePolicy(id)             # DELETE /api/policy/delete
    ├── fetchPendingApprovals()      # GET /api/approval/list
    ├── respondApproval(id, bool)    # POST /api/approval/respond
    ├── fetchSystemMetrics()         # GET /api/metrics/system
    └── runTeam(teamId, goal?)       # POST /api/team/run
```

### SSE Event Flow

```
Server (agent.ts)                Client (agent-studio.tsx)
    │                                    │
    │  emitEvent({ type: "plan" })       │
    │  ─────────────────────────────►    │  addEvent(data)
    │                                    │  → AgentRunView renders
    │  emitEvent({ type: "action" })     │
    │  ─────────────────────────────►    │  addEvent(data)
    │                                    │
    │  emitEvent({ type: "result" })     │
    │  ─────────────────────────────►    │  addEvent(data)
    │                                    │
    │  emitEvent({ type: "done" })       │
    │  ─────────────────────────────►    │  setIsRunning(false)
    │                                    │  fetchRuns()
    │                                    │  ES.close()
```

---

## 8. UI Component Tree

### Custom Components (`src/components/agent/`)

| Component | File | Client | Purpose |
|-----------|------|--------|---------|
| `AgentStudio` | `agent-studio.tsx` | Yes | **Root shell** — topbar, menubar, module routing, SSE streaming, keyboard shortcuts |
| `AgentCanvas` | `agent-canvas.tsx` | Yes | React Flow canvas with agent nodes, edges, toolbar, empty state |
| `AgentNode` | `agent-node.tsx` | Yes | Custom React Flow node — brutalist card, role color bar, status glow |
| `AgentSidebar` | `agent-sidebar.tsx` | Yes | Explorer tree — Agents, Skills, Workflows, Templates, Runs |
| `AgentInspector` | `agent-inspector.tsx` | Yes | Right panel config form — collapsible sections, debounced save |
| `AgentRunView` | `agent-run-view.tsx` | Yes | Real-time event stream — progress bar, animated event cards |
| `AgentBuilderWizard` | `agent-builder-wizard.tsx` | Yes | 3-step AI builder dialog |
| `TeamBuilder` | `team-builder.tsx` | Yes | Team creation dialog (also used from sidebar) |
| `PolicyDashboard` | `policy-dashboard.tsx` | Yes | Policy rule CRUD management |
| `RoutingEngine` | `routing-engine.tsx` | Yes | ε-Greedy routing visualization |
| `PipelineStudio` | `pipeline-studio.tsx` | Yes | DevOps pipeline visualization |
| `SystemIndicator` | `system-indicator.tsx` | Yes | Real-time status indicator (idle/running/approval/error) |
| `ApprovalModal` | `approval-modal.tsx` | Yes | Human-in-the-loop approval dialog |
| `MemoryInspector` | `memory-inspector.tsx` | Yes | Memory tier browser |
| `RunMetrics` | `run-metrics.tsx` | Yes | Post-run metrics display |
| `ReflectionPanel` | `reflection-panel.tsx` | Yes | Reflection iteration display |
| `RoleBadge` | `role-badge.tsx` | Yes | Role color badge component |

### Pipeline Components (`src/components/pipeline/`)

| Component | File | Purpose |
|-----------|------|---------|
| `PipelineStudio` | `pipeline-studio.tsx` | Pipeline visualization with SVG connectors and flow animations |
| — | `pipeline-data.ts` | Pipeline data structures and sample DevOps pipeline |
| — | `pipeline-icons.tsx` | Custom SVG icons for pipeline stages |

### shadcn/ui Components (`src/components/ui/`) — 50 files

All components use the "new-york" style variant with `borderRadius: 0` (neo-brutalist override):

`accordion` · `alert` · `alert-dialog` · `aspect-ratio` · `avatar` · `badge` · `breadcrumb` · `button` · `calendar` · `card` · `carousel` · `chart` · `checkbox` · `collapsible` · `command` · `context-menu` · `dialog` · `drawer` · `dropdown-menu` · `form` · `hover-card` · `input` · `input-otp` · `label` · `menubar` · `navigation-menu` · `pagination` · `popover` · `progress` · `radio-group` · `resizable` · `scroll-area` · `select` · `separator` · `sheet` · `sidebar` · `skeleton` · `slider` · `sonner` · `switch` · `table` · `tabs` · `textarea` · `toast` · `toaster` · `toggle` · `toggle-group` · `tooltip`

---

## 9. File Reference — Every File in the Repo

### Root Configuration

| File | Purpose |
|------|---------|
| `package.json` | Project manifest — 37 production deps, 7 dev deps, bun scripts |
| `next.config.ts` | Next.js config — standalone output, ignore build errors, strict mode off |
| `tailwind.config.ts` | Tailwind CSS — dark mode class, HSL variable system, animate plugin |
| `tsconfig.json` | TypeScript — ES2017 target, strict (no implicit any off), path aliases |
| `postcss.config.mjs` | PostCSS — @tailwindcss/postcss plugin |
| `eslint.config.mjs` | ESLint — next core-web-vitals + typescript, permissive rules |
| `components.json` | shadcn/ui — new-york style, lucide icons, CSS variables |
| `Caddyfile` | Caddy reverse proxy — port 81→3000, XTransformPort routing |
| `bun.lock` | Bun dependency lock file |

### `prisma/`

| File | Purpose |
|------|---------|
| `schema.prisma` | Database schema — 16 models, SQLite provider, prisma-client-js generator |

### `db/`

| File | Purpose |
|------|---------|
| `custom.db` | SQLite database file (binary) |

### `src/app/` — Pages & Layout

| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout — html.dark, IBM Plex Mono, Toaster |
| `page.tsx` | Home page — renders `<AgentStudio />` |
| `globals.css` | Global CSS — theme variables, React Flow overrides, pipeline animations |
| `api/route.ts` | Health check — `GET /api` → `{ message: "Hello, world!" }` |

### `src/app/api/agent/`

| File | Purpose |
|------|---------|
| `create/route.ts` | `POST` — Create agent with all V1+V2 fields |
| `list/route.ts` | `GET` — List all agents with run counts |
| `update/route.ts` | `PATCH` — Update agent config or graphData |
| `delete/route.ts` | `DELETE` — Delete agent + cascade runs/steps |
| `build/route.ts` | `POST` — Build agent from natural language via AI planner |
| `run/route.ts` | `POST` — Start single or orchestrated agent run |
| `runs/route.ts` | `GET` — List runs (all, by agent, or specific) |
| `stop/route.ts` | `POST` — Stop running agent |
| `stream/route.ts` | `GET` — SSE stream for real-time run events |

### `src/app/api/team/`

| File | Purpose |
|------|---------|
| `create/route.ts` | `POST` — Create team with agent IDs |
| `list/route.ts` | `GET` — List teams with agents |
| `get/route.ts` | `GET` — Get team by ID |
| `update/route.ts` | `PATCH` — Update team config |
| `run/route.ts` | `POST` — Start team orchestration |
| `stop/route.ts` | `POST` — Stop team orchestration |

### `src/app/api/template/`

| File | Purpose |
|------|---------|
| `create/route.ts` | `POST` — Create agent template |
| `list/route.ts` | `GET` — List templates with filters |
| `get/route.ts` | `GET` — Get template by ID |
| `delete/route.ts` | `DELETE` — Delete template |
| `instantiate/route.ts` | `POST` — Create agent from template |

### `src/app/api/policy/`

| File | Purpose |
|------|---------|
| `list/route.ts` | `GET` — List policy rules |
| `create/route.ts` | `POST` — Create policy rule |
| `update/route.ts` | `PATCH` — Update policy rule |
| `delete/route.ts` | `DELETE` — Delete policy rule |

### `src/app/api/approval/`

| File | Purpose |
|------|---------|
| `list/route.ts` | `GET` — List pending approval requests |
| `respond/route.ts` | `POST` — Approve or deny approval request |

### `src/app/api/memory/`

| File | Purpose |
|------|---------|
| `get/route.ts` | `GET` — Retrieve memory value by agentId, key, tier |
| `set/route.ts` | `POST` — Write memory value |
| `list/route.ts` | `GET` — List memory entries for agent/tier |

### `src/app/api/artifacts/`

| File | Purpose |
|------|---------|
| `list/route.ts` | `GET` — List artifacts for agent |
| `get/route.ts` | `GET` — Get specific artifact by agentId + name |

### `src/app/api/metrics/`

| File | Purpose |
|------|---------|
| `run/route.ts` | `GET` — Run-level metrics |
| `system/route.ts` | `GET` — System-wide metrics |

### `src/app/api/` — Other

| File | Purpose |
|------|---------|
| `timeline/route.ts` | `GET` — Timeline events for a run |
| `audit/list/route.ts` | `GET` — Audit log with filters |
| `tools/list/route.ts` | `GET` — List registered tools |

### `src/app/api/trigger/`

| File | Purpose |
|------|---------|
| `create/route.ts` | `POST` — Create trigger (cron/webhook/event) |
| `list/route.ts` | `GET` — List triggers with filters |
| `update/route.ts` | `PATCH` — Update trigger config/enabled |
| `delete/route.ts` | `DELETE` — Delete trigger |
| `execute/route.ts` | `POST` — Manually execute trigger |

### `src/app/api/task-graph/`

| File | Purpose |
|------|---------|
| `create/route.ts` | `POST` — Create task graph with nodes/edges |
| `list/route.ts` | `GET` — List all task graphs |
| `get/route.ts` | `GET` — Get task graph by ID |
| `update/route.ts` | `PATCH` — Update graph (replaces nodes/edges) |
| `delete/route.ts` | `DELETE` — Delete task graph (cascades) |

### `src/lib/agent/` — Agent Engine

| File | Purpose |
|------|---------|
| `types.ts` | Central type definitions + Zod schemas for the entire agent system |
| `zai-client.ts` | Singleton ZAI SDK wrapper with lazy init and dedup lock |
| `agent.ts` | Core agent execution loop, event system, concurrency control (max 5) |
| `planner.ts` | LLM-based action planning + agent building from natural language |
| `tools.ts` | 5 built-in tools (search, write, code, browser, finish) + verification |
| `tool-registry.ts` | Advanced tool registry with zod validation, 6 tools, 5 verification types |
| `evaluator.ts` | Goal completion evaluation (rule-based + LLM judge) |
| `orchestrator.ts` | Multi-agent orchestration engine (5 modes) |
| `memory.ts` | V1 in-memory run-scoped store, 1h auto-cleanup |
| `memory-v2.ts` | V2 3-tier memory manager (session/persistent/artifact) |
| `roles.ts` | 6 agent roles with permissions, prompt modifiers, default tools |
| `policy.ts` | Policy engine — condition matching, approval workflow, audit logging |
| `reflection.ts` | Critic-generator reflection loop with configurable iterations |
| `metrics.ts` | Run + system metrics collection (tokens, latency, tool usage) |
| `system-state.ts` | System-wide state manager with pub/sub |

### `src/lib/` — Shared

| File | Purpose |
|------|---------|
| `utils.ts` | Tailwind class name merger — `cn()` combining clsx + tailwind-merge |
| `db.ts` | Prisma client singleton — dev hot-reload safe with globalThis caching |

### `src/store/`

| File | Purpose |
|------|---------|
| `agent-store.ts` | Zustand global store — 20+ state fields, 15+ setters, 15+ async actions |

### `src/hooks/`

| File | Purpose |
|------|---------|
| `use-mobile.ts` | Responsive breakpoint hook — `useIsMobile()` for <768px |
| `use-toast.ts` | Toast notification system — in-memory state with add/update/dismiss |

### `src/components/agent/` — Custom UI

| File | Purpose |
|------|---------|
| `agent-studio.tsx` | Root shell — topbar, menubar, module routing, SSE, shortcuts |
| `agent-canvas.tsx` | React Flow canvas — nodes, edges, toolbar, empty state |
| `agent-node.tsx` | Custom React Flow node — brutalist card, role color, status glow |
| `agent-sidebar.tsx` | Explorer sidebar — collapsible tree with agents/skills/workflows/templates/runs |
| `agent-inspector.tsx` | Config panel — collapsible sections, debounced auto-save |
| `agent-run-view.tsx` | Execution view — real-time event stream with progress bar |
| `agent-builder-wizard.tsx` | AI builder — 3-step wizard (input → building → result) |
| `team-builder.tsx` | Team builder dialog — name, mode, agent selection |
| `policy-dashboard.tsx` | Policy management — CRUD with condition builder |
| `routing-engine.tsx` | Routing engine — ε-Greedy, Q-Table, telemetry |
| `system-indicator.tsx` | System status — real-time indicator with tooltip metrics |
| `approval-modal.tsx` | Approval dialog — human-in-the-loop for risky actions |
| `memory-inspector.tsx` | Memory browser — 3-tier memory inspection |
| `run-metrics.tsx` | Post-run metrics — tokens, latency, tool usage |
| `reflection-panel.tsx` | Reflection display — critic-generator iterations |
| `role-badge.tsx` | Role badge — color-coded role indicator |

### `src/components/pipeline/`

| File | Purpose |
|------|---------|
| `pipeline-studio.tsx` | Pipeline module — SVG connectors, animated flow, stage status |
| `pipeline-data.ts` | Pipeline data models + sample DevOps pipeline data |
| `pipeline-icons.tsx` | Custom SVG icons for pipeline stages |

### `src/components/ui/` — shadcn/ui (50 files)

Standard shadcn/ui primitives. See Section 8 for the full list.

### `public/`

| File | Purpose |
|------|---------|
| `robots.txt` | SEO robots file |
| `logo.svg` | App logo SVG |
| `agent-studio-hero.png` | Hero image for the app |

### `examples/`

| File | Purpose |
|------|---------|
| `websocket/frontend.tsx` | WebSocket frontend example code |
| `websocket/server.ts` | WebSocket server example code |

---

## 10. Design System

### Color Tokens

```
┌─────────────────────────────────────────────────────────┐
│                    Color Palette                         │
│                                                          │
│  Backgrounds:                                            │
│  ● #05070a  — Deepest (app background)                  │
│  ● #0a0e14  — Panel strip (collapsed sidebar/inspector) │
│  ● #0b1016  — Dropdown background                       │
│  ● #0b1118  — Input background                          │
│  ● #0c1219  — Tag/badge background                      │
│  ● #0d131b  — Active agent row                          │
│  ● #0f141b  — Panel background (sidebar, inspector)     │
│  ● #101720  — Hover state                               │
│  ● #141b23  — Header/footer background                  │
│  ● #141c25  — Focus/hover background                    │
│  ● #1a212b  — Elevated surface, badges                  │
│                                                          │
│  Borders:                                                │
│  ● #000000  — Primary border (2px solid)                │
│  ● #1b2430  — Subtle separator                          │
│  ● #2a3441  — Standard border                            │
│  ● #3a4553  — Active/highlight border                    │
│                                                          │
│  Text:                                                   │
│  ● #d7dde5  — Primary text                              │
│  ● #8a94a3  — Secondary/muted text                      │
│  ● #5b6b81  — Tertiary/hint text                        │
│  ● #475569  — Disabled text                              │
│                                                          │
│  Accents:                                                │
│  ● #ffd60a  — Primary accent (yellow) — actions, active │
│  ● #00d1ff  — Secondary accent (cyan) — info, running   │
│  ● #22c55e  — Success (green) — completed, teams        │
│  ● #f59e0b  — Warning (amber) — critic, pending        │
│  ● #ef4444  — Error (red) — failed, delete, danger     │
└─────────────────────────────────────────────────────────┘
```

### Shadow System

```
Shadow 2  → box-shadow: 2px 2px 0 #000    (buttons, cards)
Shadow 4  → box-shadow: 4px 4px 0 #000    (dropdowns, dialogs)
Shadow 6  → box-shadow: 6px 6px 0 #000    (hero elements, placeholders)
```

### Typography

- **Font**: IBM Plex Mono (monospace)
- **Sizes**: 8px (micro labels), 9px (hints), 10px (tags), 11px (body), 13px (headings)
- **Transform**: `uppercase` + `tracking-wider/widest` on labels and section headers

---

## 11. Infrastructure

### Reverse Proxy (Caddy)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client   │────►│  Caddy   │────►│  Next.js │
│  (Browser)│     │  :81     │     │  :3000   │
└──────────┘     └──────────┘     └──────────┘

Caddyfile Rules:
  - Port 81 → localhost:3000
  - X-Forwarded headers
  - ?XTransformPort=XXXX → localhost:XXXX
    (for mini-services on custom ports)
```

### SSE Reconnection Strategy

```
Connection Lost
       │
       ▼
Attempt 1: Wait 1s → Reconnect
Attempt 2: Wait 2s → Reconnect
Attempt 3: Wait 4s → Reconnect
Attempt 4: Wait 8s → Reconnect
Attempt 5: Wait 16s → Reconnect
       │
       ▼
Max Attempts (5) Reached
       │
       ▼
Set error state: "Connection lost after 5 attempts"
```

### Concurrency Control

```
┌─────────────────────────────────┐
│    Agent Run Queue              │
│                                 │
│    Max concurrent runs: 5       │
│                                 │
│    ┌─────┐ ┌─────┐ ┌─────┐    │
│    │Run 1│ │Run 2│ │Run 3│    │  ← Active
│    └─────┘ └─────┘ └─────┘    │
│    ┌─────┐ ┌─────┐             │
│    │Run 4│ │Run 5│             │  ← Active
│    └─────┘ └─────┘             │
│    ┌─────┐                     │
│    │Run 6│                     │  ← Queued
│    └─────┘                     │
└─────────────────────────────────┘
```

---

*This document covers every file in the Agent Studio OS repository. Last updated: 2025-01-18.*

---

## 12. Hermes Causal DAG Architecture

> The Hermes Causal DAG Architecture replaces implicit mutation with explicit causal event topology. This is a kernel inversion — not a feature expansion.

### 12.1 Kernel Inversion

```
BEFORE (V1): action → mutate state → emit logs
AFTER  (Hermes): action → emit event → reducer applies state
```

**The Kernel Non-Duality Principle**: Event Log = Truth, Reducer = Canonical Interpretation. No dual-state systems.

### 12.2 Package Dependency Law

Strict unidirectional dependency flow:

```
test-harness → causal-core-lock → kernel-spine → frontier → hqa → ui-topology
```

**FORBIDDEN**: Any reverse dependency. No lateral imports between siblings.

### 12.3 Package Overview

| Package | Phase | Purpose | Key Exports |
|---------|-------|---------|-------------|
| `@hermes/test-harness` | 0.5 | Formal verification layer | `Brand<T,Tag>`, `VerifiedCausalGraph`, validators, generators, properties |
| `@hermes/event-dsl` | 1.0 | Event DSL with compile-time enforcement | `HermesEvent`, constructors, JCS canonicalization, SHA-256 hashing |
| `@hermes/causal-core-lock` | 1.1 | CCL type-system firewall | `buildCausalGraph()`, topological sort, depth computation |
| `@hermes/kernel-spine` | 1.5 | Single deterministic transition loop | `HermesKernel`, `EventStore`, reducer, proposer, checkpoint |
| `@hermes/frontier` | 2.0 | Causal Frontier Solver | `computeFrontier()`, `advanceFrontier()`, prioritization |
| `@hermes/ui-topology` | 2.5 | Strict projection subsystem | `projectToReactFlow()`, `projectToEventStream()`, `projectFrontierState()` |
| `@hermes/hqa` | 3.0 | Hermes Query Algebra | SELECT, TRACE, CUT, FOLD, DIFF, SIMULATE operators |

### 12.4 Canonical HermesEvent

```typescript
interface HermesEvent {
  readonly eventId: BrandedEventId;
  readonly eventType: "MODEL" | "DECISION" | "EXECUTION" | "SYSTEM" | "TELEMETRY";
  readonly parentEventIds: readonly BrandedEventId[];  // Non-empty for non-genesis
  readonly causalDepth: number;       // Derived: max(parentDepths) + 1
  readonly topologicalRank: number;   // Assigned by CCL
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
  readonly contentHash: BrandedContentHash;  // SHA-256 of JCS-canonicalized event
  readonly runId: BrandedRunId;
  readonly agentId?: BrandedAgentId;
  readonly branch?: string;
  readonly signature?: string;
}
```

**KEY**: No `eventSequence` field. Linear chronological sequence is permanently eradicated. Ordering is emergent from causal relationships.

### 12.5 Event DSL Constructors

The ONLY way to create HermesEvents:

- `createGenesisEvent(runId, payload)` — depth 0, no parents
- `createModelEvent(parentIds, runId, agentId, payload, parentDepths)`
- `createDecisionEvent(parentIds, runId, agentId, payload, parentDepths)`
- `createExecutionEvent(parentIds, runId, agentId, payload, parentDepths)`
- `createSystemEvent(parentIds, runId, payload, parentDepths)`
- `createTelemetryEvent(parentIds, runId, payload, parentDepths)`

### 12.6 Causal Frontier Solver

`computeFrontier()` is the ONLY legal answer to "what happens next?"

```
Formal definition:
  n ∈ frontier ⟺ (∀ p ∈ Parents(n): p ∈ Visited) ∧ (n ∉ Visited) ∧ (n.branch ∈ activeBranches)
```

This is NOT a queue. It is a constraint satisfaction surface over a DAG. You recompute the frontier at every step.

Tie-breaking: `SHA-256(canonical(event))` — deterministic, never affects frontier membership.

### 12.7 Hermes Query Algebra (HQA)

Closed operator system partitioned into three layers:

| Layer | Operators | Purpose |
|-------|-----------|---------|
| Structural | SELECT, TRACE, CUT | Navigate and filter causal graph |
| Semantic | FOLD, DIFF | Aggregate and compare over event streams |
| Counterfactual | SIMULATE | Speculative branch exploration |

**Guarantee**: No HQA operator can modify the event log or kernel state.

### 12.8 File Structure

```
src/lib/hermes/
├── index.ts                          # Barrel export
├── test-harness/
│   ├── brands.ts                     # Brand<T,Tag>, VerifiedCausalGraph, seal functions
│   ├── validators.ts                 # validateCausalGraph, validateEvent, checkAcyclicity
│   ├── generators.ts                 # linearChain, diamondDAG, wideFan, randomDAG, branchedDAG
│   ├── properties.ts                 # 10 graph/frontier invariants, regression testing
│   └── index.ts
├── event-dsl/
│   ├── types.ts                      # HermesEvent, 5 event tiers, payload types
│   ├── canonicalize.ts               # JCS (RFC 8785) canonical serialization
│   ├── hashing.ts                    # SHA-256 content hashing, tie-breaking
│   ├── constructors.ts               # 6 DSL constructors (ONLY way to create events)
│   ├── validate.ts                   # Event structural + contextual validation
│   └── index.ts
├── causal-core-lock/
│   ├── types.ts                      # CausalGraph, TopologicalOrdering, integrity types
│   ├── graph-builder.ts              # buildCausalGraph, extendCausalGraph, verifyGraphIntegrity
│   ├── topological-sort.ts           # Deterministic topological sort with SHA-256 tie-breaking
│   ├── brand-seal.ts                 # Seal functions, type guards, unbrand utilities
│   └── index.ts
├── kernel-spine/
│   ├── types.ts                      # HermesState, AgentProposal, KernelTransition, IEventStore
│   ├── event-store.ts                # Append-only EventStore with DB persistence
│   ├── reducer.ts                    # Pure state reducer: HermesState = f(HermesEvent[])
│   ├── checkpoint.ts                 # State snapshot system
│   ├── proposer.ts                   # LLM-based agent proposer (agents are pure proposers)
│   ├── kernel.ts                     # HermesKernel — single deterministic transition loop
│   └── index.ts
├── frontier/
│   ├── types.ts                      # FrontierGraph, FrontierState, PrioritizedFrontier
│   ├── compute-frontier.ts           # computeFrontier, advanceFrontier, prioritizeFrontier
│   └── index.ts
├── ui-topology/
│   ├── types.ts                      # CausalNodeProjection, EventStreamEntry, LayoutConfig
│   ├── graph-renderer.ts             # projectToReactFlow (nodes + edges)
│   ├── event-projection.ts           # projectToEventStream
│   ├── agent-projection.ts           # projectAgentState, getRoleColor
│   ├── frontier-viz.ts               # projectFrontierState
│   └── index.ts
└── hqa/
    ├── types.ts                      # 6 query types, predicate types, result types
    ├── structural.ts                 # SELECT, TRACE, CUT operators
    ├── semantic.ts                   # FOLD, DIFF operators
    ├── counterfactual.ts             # SIMULATE operator
    ├── executor.ts                   # executeQuery dispatcher
    ├── builder.ts                    # Fluent query builder
    └── index.ts
```

### 12.9 UI Integration

The Hermes module is accessible via the "HERMES" tab in the Agent Studio OS navigation. It provides:

- **3-panel layout**: Event Stream (left), Causal Graph (center), Frontier Panel (right)
- **Causal Graph view**: React Flow visualization with tier-colored nodes, frontier highlights
- **Event Stream view**: Chronological event list with tier badges and summaries
- **Frontier view**: Frontier stats, executable events, active branches
- **Run controls**: Goal input, Run/Stop buttons

### 12.10 API Routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/hermes/run` | Start a new Hermes causal execution run |
| POST | `/api/hermes/stop` | Stop a running Hermes run |
| GET | `/api/hermes/state?runId=xxx` | Get projected state for a run |

### 12.11 Database Models

| Model | Purpose |
|-------|---------|
| `HermesEvent` | Append-only event log with causal structure |
| `CausalCheckpoint` | State snapshots for fast replay |

### 12.12 Verification Status

**All 7 phases verified end-to-end (2024-06-15):**

| Phase | Package | Verification |
|-------|---------|-------------|
| 0.5 | `test-harness` | ✅ Brands, validators, generators compile and pass property checks |
| 1.0 | `event-dsl` | ✅ Event constructors produce valid HermesEvents with SHA-256 hashes |
| 1.1 | `causal-core-lock` | ✅ CCL branded types, graph builder, topological sort functional |
| 1.5 | `kernel-spine` | ✅ Kernel transition loop executes with LLM proposer via z-ai-web-dev-sdk |
| 2.0 | `frontier` | ✅ `computeFrontier()` correctly identifies frontier events |
| 2.5 | `ui-topology` | ✅ React Flow projection renders causal graph with tier-colored nodes |
| 3.0 | `hqa` | ✅ Query algebra operators compile and execute |

**Key integration fixes applied during verification:**

1. **State polling**: Added 1.5s polling in `hermes-store.ts` after `startRun()` so UI reflects kernel progress
2. **Error handling**: Kernel now properly transitions to "failed" on transition errors instead of staying in "running"
3. **Tool action routing**: Added `search`/`write`/`code`/`browser` as valid actionType cases (LLM sometimes returns these instead of "use_tool")
4. **Auto-proposer**: Kernel auto-creates a default `LLMAgentProposer` when no proposers are registered
5. **DB-backed state recovery**: State API route loads events from database when in-memory store is empty (handles Next.js serverless context isolation)
6. **Event-derived status**: `deriveRunStatus()` infers terminal state from event log when kernel context is unavailable
