# Agent Studio OS

> Visual AI Agent Builder — Design, orchestrate, and monitor autonomous AI agents with a neo-brutalist dark interface.

---

## Overview

Agent Studio OS is a full-stack web application for building and managing AI agent systems. It provides a visual canvas for designing agents, a multi-mode orchestration engine for running them, a policy governance layer for controlling them, and real-time monitoring for observing them — all from a single interface.

The platform is organized into **five major modules**:

| Module | Description | Status |
|--------|-------------|--------|
| **Agents Canvas** | Visual React Flow canvas for designing, configuring, and running individual and multi-agent workflows | ✅ Active |
| **Hermes Causal DAG** | Causal execution substrate with event-sourced kernel, frontier solver, and HQA query algebra | ✅ Active |
| **AI LLM Router** | ε-Greedy routing engine with Q-learning heatmap, telemetry, and self-learning provider switching | ✅ Active |
| **Pipeline Pro** | DevOps-style pipeline visualization with animated DAG connectors and stage status tracking | ✅ Active |
| **Workflow Studio** | Visual workflow designer for creating, editing, and testing multi-agent workflows before deployment | 🔜 Coming Soon |

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 16 (App Router) | Turbopack, standalone output |
| **Language** | TypeScript 5 | Strict mode, path aliases |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Neo-brutalist theme, zero border-radius |
| **Database** | Prisma ORM (SQLite) | 16 models, migration-ready for PostgreSQL |
| **State** | Zustand | Global client state with async actions |
| **Canvas** | React Flow (@xyflow/react) | Custom nodes, animated edges |
| **Animation** | Framer Motion | Sidebar transitions, node glow effects |
| **AI SDK** | z-ai-web-dev-sdk | LLM, web search, page reader |
| **Streaming** | Server-Sent Events (SSE) | Real-time agent event stream |
| **Auth** | NextAuth.js v4 | Available, not yet active |
| **Runtime** | Bun | Package manager + dev server |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) ≥ 1.0
- Node.js ≥ 18 (for compatibility)

### Installation

```bash
# Install dependencies
bun install

# Initialize the database
bun run db:push

# Start the development server (port 3000)
bun run dev
```

The app will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server on port 3000 (Turbopack) |
| `bun run build` | Production build (standalone output) |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint checks |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run Prisma migrations |
| `bun run db:reset` | Reset database (destructive) |

---

## Features

### 🤖 Agent Design & Execution
- **AI Builder Wizard** — Describe what you want in natural language; AI generates a complete agent configuration
- **Template Library** — Quick-create from preset templates (Research Agent, Content Writer, Code Assistant, Business Analyst)
- **Multi-Agent Templates** — Deep Research (sequential), Code Reviewer (reflection), Parallel Research
- **Visual Canvas** — Drag-and-drop React Flow canvas with custom brutalist agent nodes
- **Real-time Execution** — SSE-powered event stream showing thinking, planning, tool calls, and results as they happen

### 🔀 Multi-Agent Orchestration
- **5 Orchestration Modes**:
  - **Single** — One agent runs independently
  - **Sequential** — Agents pass output to the next (A → B → C)
  - **Group Chat** — Shared scratchpad with LLM-driven speaker selection
  - **Hierarchical** — Manager decomposes, delegates to workers, synthesizes results
  - **Parallel** — Fan-out with semaphore-controlled concurrency
- **Team Builder** — Compose agent teams with orchestration mode and termination conditions
- **Agent Roles** — Planner, Researcher, Executor, Critic, Reviewer — each with permissions and prompt modifiers

### 🛡️ Policy & Governance Engine
- **Policy Rules** — Define allow/block/ask_user/shadow actions based on tool, role, and risk level
- **Human-in-the-Loop** — Approval modal for high-risk operations
- **Audit Trail** — Immutable log of all policy checks and decisions
- **Default Policies** — Pre-seeded rules for common safety scenarios

### 🔄 Reflection Loop
- **Critic-Generator Pattern** — Iterative self-critique and revision until approval criteria are met
- **Configurable** — Max iterations, approval criteria (default: "APPROVED")
- **Persistent** — All reflection iterations stored in database

### 🧠 3-Tier Memory System
- **Session** — In-memory, run-scoped, 24h auto-expiry
- **Persistent** — Database-backed, cross-run, with upsert semantics
- **Artifact** — Named versioned content blobs (code, documents, data)
- **Memory Inspector** — UI for browsing all memory tiers

### 📊 Metrics & Monitoring
- **System Dashboard** — Total runs, active runs, error rate, agent count, token usage
- **Run Metrics** — Per-run token counts, latency, tool usage breakdown
- **Timeline Events** — Fine-grained event log (run_start, step_start, llm_call, tool_execution, etc.)
- **System Indicator** — Real-time status bar (idle/running/waiting_approval/error)

### 🗺️ AI LLM Router
- **ε-Greedy Policy** — Balance exploration vs exploitation for provider selection
- **Q-Table Heatmap** — Visualize learned quality values per task type × provider
- **Telemetry** — Request latency, token usage, success rates per provider
- **UCB1 Backup** — Upper Confidence Bound fallback strategy

### 📋 Pipeline Pro
- **Visual Pipeline** — DevOps-style stage visualization with SVG connectors
- **Animated Flow** — Flowing particle animations along connector paths
- **Stage Status** — Color-coded status indicators (pending, running, success, failed)
- **Collapsible Stages** — Expand/collapse individual pipeline stages

### ⚡ Hermes Causal DAG Architecture
- **Kernel Inversion** — `action → emit event → reducer applies state` (not `action → mutate state → emit logs`)
- **7-Layer Package Architecture** — Strict unidirectional dependency: test-harness → causal-core-lock → kernel-spine → frontier → hqa → ui-topology
- **Event DSL** — Compile-time topology enforcement; events only exist via DSL constructors
- **Causal Core Lock (CCL)** — `VerifiedCausalGraph` branded type; construction impossible outside authorized packages
- **Kernel Spine** — Single deterministic transition loop; agents are pure proposers
- **Causal Frontier Solver** — `computeFrontier()` is the ONLY legal answer to "what happens next"
- **HQA Query Algebra** — Closed operator system (SELECT, TRACE, CUT, FOLD, DIFF, SIMULATE) — cannot mutate kernel
- **UI Topology** — Strict projection subsystem; React Flow = dumb renderer, XState = epistemic UI state only
- **Real-time Execution** — LLM-powered proposer generates actions, kernel executes via z-ai-web-dev-sdk, events stream to UI
- **5 Event Tiers** — MODEL, DECISION, EXECUTION, SYSTEM, TELEMETRY with tier-colored visualization
- **Causal Graph View** — React Flow DAG with depth-based layout, frontier highlights, tier badges
- **Event Stream** — Chronological event timeline with causal parent linking
- **Frontier Panel** — Live frontier state, visited/visitable counts, active branches

### 🎨 Design System
- **Neo-Brutalist** — Black borders, hard shadows, no border-radius
- **Dark Theme** — Deep backgrounds (#05070a / #0f141b), yellow (#ffd60a) and cyan (#00d1ff) accents
- **IBM Plex Mono** — Monospaced font throughout
- **Standard Menubar** — File, Edit, View, Help with keyboard shortcuts
- **Collapsible Panels** — Sidebar and inspector collapse to thin strips with visual indicators

---

## Project Structure

```
my-project/
├── prisma/
│   └── schema.prisma          # Database schema (16 models)
├── db/
│   └── custom.db              # SQLite database file
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── globals.css        # Global styles + theme
│   │   └── api/               # 30+ API route handlers
│   │       ├── agent/         # Agent CRUD + run + stream
│   │       ├── hermes/        # Hermes causal DAG (run, stop, state)
│   │       ├── team/          # Team CRUD + orchestration
│   │       ├── template/      # Template CRUD + instantiate
│   │       ├── policy/        # Policy CRUD
│   │       ├── approval/      # Approval list + respond
│   │       ├── memory/        # Memory get/set/list
│   │       ├── artifacts/     # Artifact list/get
│   │       ├── metrics/       # Run + system metrics
│   │       ├── timeline/      # Timeline events
│   │       ├── audit/         # Audit log
│   │       ├── tools/         # Tool registry list
│   │       ├── trigger/       # Trigger CRUD + execute
│   │       └── task-graph/    # Task graph CRUD
│   ├── components/
│   │   ├── agent/             # Core UI components (16 files)
│   │   ├── pipeline/          # Pipeline module (3 files)
│   │   └── ui/                # shadcn/ui primitives (50 files)
│   ├── lib/
│   │   ├── agent/             # Agent engine (14 files)
│   │   ├── hermes/            # Hermes Causal DAG Architecture (7 packages, ~8150 LOC)
│   │   │   ├── test-harness/  # Phase 0.5: Brands, validators, generators, properties
│   │   │   ├── event-dsl/     # Phase 1.0: Event constructors, canonicalization, hashing
│   │   │   ├── causal-core-lock/ # Phase 1.1: CCL firewall, graph builder, topo sort
│   │   │   ├── kernel-spine/  # Phase 1.5: Kernel, reducer, event store, proposer
│   │   │   ├── frontier/      # Phase 2.0: Frontier solver, advance, prioritize
│   │   │   ├── ui-topology/   # Phase 2.5: React Flow projection, event stream, agents
│   │   │   └── hqa/           # Phase 3.0: Query algebra (SELECT, TRACE, FOLD, etc.)
│   │   ├── db.ts              # Prisma client singleton
│   │   └── utils.ts           # Tailwind class merger
│   ├── store/
│   │   ├── agent-store.ts     # Zustand global state
│   │   └── hermes-store.ts    # Hermes causal graph projection state + polling
│   └── hooks/
│       ├── use-mobile.ts      # Responsive breakpoint hook
│       └── use-toast.ts       # Toast notification hook
├── public/                    # Static assets
├── Caddyfile                  # Reverse proxy config
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project manifest
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘B` / `Ctrl+B` | Toggle Explorer sidebar |
| `⌘I` / `Ctrl+I` | Toggle Inspector panel |
| `⌘N` | Open AI Builder (via File menu) |

---

## API Overview

The application exposes **30+ REST API endpoints** organized into 12 route groups:

| Route Group | Endpoints | Description |
|-------------|-----------|-------------|
| `/api/agent/*` | 8 | Agent CRUD, build, run, stop, stream |
| `/api/hermes/*` | 3 | Hermes causal DAG run, stop, state |
| `/api/team/*` | 6 | Team CRUD, orchestration run/stop |
| `/api/template/*` | 5 | Template CRUD + instantiate |
| `/api/policy/*` | 4 | Policy rule CRUD |
| `/api/approval/*` | 2 | List + respond to approvals |
| `/api/memory/*` | 3 | 3-tier memory access |
| `/api/artifacts/*` | 2 | Artifact list/get |
| `/api/metrics/*` | 2 | Run + system metrics |
| `/api/timeline` | 1 | Timeline events |
| `/api/audit/*` | 1 | Audit log |
| `/api/tools/*` | 1 | Tool registry |
| `/api/trigger/*` | 5 | Trigger CRUD + execute |
| `/api/task-graph/*` | 5 | Task graph CRUD |

---

## Database Schema

16 Prisma models with the following core entities:

- **Agent** — Core entity with V1+V2 fields (role, model, orchestration, reflection)
- **AgentRun** / **Step** — Execution tracking with metrics and verification
- **Team** — Multi-agent orchestration groups
- **AgentMemory** / **Artifact** — 3-tier memory + versioned content
- **PolicyRule** / **ApprovalRequest** / **AuditLog** — Governance layer
- **TimelineEvent** / **ReflectionIteration** — Observability
- **AgentTemplate** / **AgentTrigger** — Reusability + scheduling
- **TaskNode** / **TaskEdge** / **TaskGraph** — Visual workflow DAG
- **HermesEvent** / **CausalCheckpoint** — Causal DAG event log + state snapshots

---

## License

Proprietary — All rights reserved.
