# Agent System Reference

> Complete documentation for the Agent Studio OS agent engine — how agents think, act, coordinate, and learn.

---

## Table of Contents

1. [Agent Lifecycle](#1-agent-lifecycle)
2. [Agent Configuration](#2-agent-configuration)
3. [Execution Loop](#3-execution-loop)
4. [Tool System](#4-tool-system)
5. [Role System](#5-role-system)
6. [Orchestration Modes](#6-orchestration-modes)
7. [Memory System](#7-memory-system)
8. [Policy & Governance](#8-policy--governance)
9. [Reflection Loop](#9-reflection-loop)
10. [Metrics & Observability](#10-metrics--observability)
11. [Building Agents with AI](#11-building-agents-with-ai)
12. [API Reference for Agent Operations](#12-api-reference-for-agent-operations)

---

## 1. Agent Lifecycle

An agent goes through the following lifecycle from creation to execution:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CREATED   │────►│  CONFIGURED │────►│   RUNNING   │────►│  COMPLETED  │
│             │     │             │     │             │     │             │
│  Agent      │     │  Goal,      │     │  Executing  │     │  Goal       │
│  exists in  │     │  tools,     │     │  steps in   │     │  achieved   │
│  database   │     │  role set   │     │  loop       │     │  or failed  │
└─────────────┘     └─────────────┘     └──────┬──────┘     └─────────────┘
                                               │
                                        ┌──────┴──────┐
                                        │             │
                                        ▼             ▼
                                  ┌──────────┐  ┌──────────┐
                                  │  STOPPED │  │  FAILED  │
                                  │          │  │          │
                                  │  User    │  │  Error   │
                                  │  halted  │  │  occured │
                                  └──────────┘  └──────────┘
```

### Creation Paths

```
Path 1: Template Quick-Create
  User clicks template → createAgent() with preset config → agent appears in DB + canvas

Path 2: AI Builder
  User describes agent → buildAgent(userInput) → LLM generates config → save to DB

Path 3: Manual Create
  User clicks "New Agent" → createAgent() with minimal defaults → configure in inspector

Path 4: Template Instantiation
  POST /api/template/instantiate → creates agent from saved template with optional overrides
```

---

## 2. Agent Configuration

### Complete Agent Schema

```typescript
interface AgentConfig {
  // ── Identity ──
  name: string;               // Display name (required)
  goal: string;               // What the agent should accomplish (required)
  personality: string;        // Behavioral modifier ("helpful and thorough assistant")

  // ── Capabilities ──
  tools: string[];            // Available tools: search, write, code, browser, finish
  role: AgentRole;            // Role assignment (general, planner, researcher, executor, critic, reviewer)
  model: string;              // LLM model: gemini-2.5-pro, gemini-2.5-flash, gpt-4o, etc.

  // ── Execution ──
  maxSteps: number;           // Maximum iteration steps (1-20, default 10)
  autoRun: boolean;           // Whether to auto-execute on creation (default true)
  outputFormat: string;       // Output format: text, json, markdown

  // ── Orchestration ──
  orchestrationMode: OrchestrationMode;  // single | sequential | group | hierarchical | parallel
  maxConcurrency: number;     // Max parallel agents (for parallel mode, default 3)

  // ── Memory ──
  shortTermMemory: boolean;   // Enable session-scoped memory (default true)
  longTermMemory: boolean;    // Enable persistent cross-run memory (default false)

  // ── Reflection ──
  reflectionEnabled: boolean;        // Enable critic-generator loop (default false)
  reflectionMaxIter: number;         // Max reflection iterations (1-10, default 3)
  reflectionCriteria: string;        // Approval criteria string (default "APPROVED")

  // ── Canvas ──
  graphData: {                 // React Flow graph position data
    nodes: Node[];
    edges: Edge[];
  } | null;

  // ── Team ──
  teamId: string | null;      // Team membership (if part of a team)
}
```

### Role Definitions

```
┌────────────┬────────┬───────────────────────────────────────────────────┐
│ Role       │ Color  │ Description                                       │
├────────────┼────────┼───────────────────────────────────────────────────┤
│ general    │ gray   │ Default — no special behavior, all tools           │
│ planner    │ cyan   │ Decomposes goals into subtasks, delegates work     │
│ researcher │ green  │ Gathers and synthesizes information                │
│ executor   │ yellow │ Performs actions, writes content, generates code   │
│ critic     │ amber  │ Evaluates output quality, identifies improvements  │
│ reviewer   │ red    │ Audits for correctness, compliance, and safety     │
└────────────┴────────┴───────────────────────────────────────────────────┘
```

### Role Permissions Matrix

```
┌────────────┬──────┬──────┬──────┬──────┬──────────┐
│ Role       │ Read │ Write│ Exec │Approve│ Delegate │
├────────────┼──────┼──────┼──────┼──────┼──────────┤
│ general    │  ✓   │  ✓   │  ✓   │  ✗   │    ✗     │
│ planner    │  ✓   │  ✓   │  ✓   │  ✓   │    ✓     │
│ researcher │  ✓   │  ✓   │  ✗   │  ✗   │    ✗     │
│ executor   │  ✓   │  ✓   │  ✓   │  ✗   │    ✗     │
│ critic     │  ✓   │  ✓   │  ✗   │  ✓   │    ✗     │
│ reviewer   │  ✓   │  ✓   │  ✗   │  ✓   │    ✗     │
└────────────┴──────┴──────┴──────┴──────┴──────────┘
```

### Default Tools Per Role

| Role | Default Tools |
|------|--------------|
| general | search, write, code, browser |
| planner | search, write |
| researcher | search, write, browser |
| executor | search, write, code |
| critic | search, write |
| reviewer | search, write |

---

## 3. Execution Loop

### Single Agent Run Loop

```
┌──────────────────────────────────────────────────────────┐
│                    runAgent() Loop                        │
│                                                          │
│  1. Initialize run (create AgentRun in DB)               │
│  2. Emit "status" event → { status: "running" }         │
│  3. Loop (up to maxSteps):                               │
│     │                                                    │
│     ├── a. Check policy (policyEngine.check)             │
│     │   ├── ALLOW → proceed                             │
│     │   ├── BLOCK → emit "policy" event, stop           │
│     │   ├── ASK_USER → create ApprovalRequest, wait      │
│     │   └── SHADOW → proceed + log audit                │
│     │                                                    │
│     ├── b. Plan next action (planner.plan)               │
│     │   ├── Send goal + context + tools to LLM           │
│     │   ├── Parse LLM response → AgentAction             │
│     │   └── Emit "plan" event                            │
│     │                                                    │
│     ├── c. Execute action (tools.execute)                │
│     │   ├── Dispatch to tool handler                     │
│     │   ├── Verify output (deterministic check)          │
│     │   └── Emit "action" + "result" events             │
│     │                                                    │
│     ├── d. Record step in DB                             │
│     │   └── Step { stepNum, tool, input, result, ... }   │
│     │                                                    │
│     ├── e. Update memory (memoryManager.set)             │
│     │                                                    │
│     ├── f. Check if done:                                │
│     │   ├── Tool was "finish" → break loop               │
│     │   └── Evaluator says goal met → break loop         │
│     │                                                    │
│     └── g. If not done → continue to next step           │
│                                                          │
│  4. Finalize run                                         │
│     ├── Set AgentRun status → completed/failed/stopped   │
│     ├── Compute metrics (tokens, latency, steps)         │
│     └── Emit "done" event                                │
│                                                          │
│  5. Cleanup                                              │
│     ├── Clear run memory (session tier)                  │
│     └── Remove from active runs                          │
└──────────────────────────────────────────────────────────┘
```

### Step Execution Detail

```
runStep(agent, runId, stepNum, history, memory)
  │
  ├── 1. Build context
  │     ├── Agent goal + personality
  │     ├── Role prompt modifier
  │     ├── Tool descriptions
  │     ├── Memory entries
  │     └── Step history (previous actions + results)
  │
  ├── 2. Call planner.plan()
  │     ├── Format prompt with context
  │     ├── Call ZAI LLM SDK
  │     └── Parse response → AgentAction
  │         ├── Strategy 1: Direct JSON parse
  │         ├── Strategy 2: Extract from ```json``` code block
  │         ├── Strategy 3: Greedy JSON extraction (first { to last })
  │         └── Strategy 4: Infer from tool mention in text
  │
  ├── 3. Emit "plan" event
  │
  ├── 4. Execute tool
  │     ├── search → ZAI Web Search API
  │     ├── write → Save to memory
  │     ├── code → Execute with verification
  │     ├── browser → ZAI Page Reader API
  │     └── finish → Return result string
  │
  ├── 5. Verify output
  │     ├── JSON validation (if applicable)
  │     ├── Code compilation check (if code tool)
  │     └── URL reachability (if browser tool)
  │
  ├── 6. Record Step in DB
  │
  └── 7. Return step result
```

### Event Types

| Event Type | When Emitted | Data |
|-----------|-------------|------|
| `status` | Run starts/stops | `{ status: "running" \| "completed" \| "failed" }` |
| `plan` | LLM generates next action | `{ step, tool, reasoning }` |
| `action` | Tool execution begins | `{ step, tool, input }` |
| `result` | Tool execution completes | `{ step, output, success }` |
| `thinking` | LLM is processing (intermediate) | `{ message }` |
| `error` | Error occurs | `{ message }` |
| `done` | Run completes | `{ result, totalSteps, totalTokens }` |
| `reflection` | Reflection iteration completes | `{ iteration, critique, approved }` |
| `policy` | Policy blocks action | `{ tool, action, reason }` |
| `handoff` | Agent passes output to next (sequential) | `{ fromAgent, toAgent }` |
| `group_message` | Agent speaks in group chat | `{ agent, message }` |

---

## 4. Tool System

### Built-in Tools

```
┌──────────────────────────────────────────────────────────────────┐
│                        Tool Arsenal                              │
│                                                                  │
│  ┌────────────┐  Risk: Low                                      │
│  │ web_search │  Search the web using ZAI Web Search API         │
│  │            │  Input: { query: string }                        │
│  │            │  Output: Search results with snippets            │
│  └────────────┘                                                  │
│                                                                  │
│  ┌────────────┐  Risk: Low                                      │
│  │ write_file │  Save content to agent memory                   │
│  │            │  Input: { filename: string, content: string }   │
│  │            │  Output: Confirmation + memory key              │
│  └────────────┘                                                  │
│                                                                  │
│  ┌────────────┐  Risk: Medium                                   │
│  │execute_code│  Execute code with optional verification        │
│  │            │  Input: { code: string, language: string }      │
│  │            │  Output: Execution result + verification status │
│  └────────────┘                                                  │
│                                                                  │
│  ┌────────────┐  Risk: Low                                      │
│  │ browse_url │  Read and extract web page content              │
│  │            │  Input: { url: string }                         │
│  │            │  Output: Page content (text/HTML)               │
│  └────────────┘                                                  │
│                                                                  │
│  ┌────────────┐  Risk: None                                     │
│  │  finish    │  Signal goal completion with final output       │
│  │            │  Input: { output: string }                      │
│  │            │  Output: Final result → run ends                │
│  └────────────┘                                                  │
│                                                                  │
│  ┌────────────┐  Risk: Low                                      │
│  │save_memory │  Persist data to memory tiers                   │
│  │            │  Input: { key: string, value: any, tier: enum } │
│  │            │  Output: Confirmation                           │
│  └────────────┘                                                  │
│                                                                  │
│  ┌────────────┐  Risk: Low                                      │
│  │read_memory │  Retrieve data from memory tiers                │
│  │            │  Input: { key: string, tier?: enum }            │
│  │            │  Output: Stored value                           │
│  └────────────┘                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Tool Risk Levels

| Risk Level | Color | Policy Default | Example Tools |
|-----------|-------|---------------|---------------|
| `low` | Green | Auto-allow | web_search, browse_url, finish, save_memory, read_memory |
| `medium` | Yellow | May require approval | execute_code |
| `high` | Orange | Requires approval | — |
| `critical` | Red | Always requires approval | — |

### Verification Methods

| Method | Description | Applied To |
|--------|-------------|-----------|
| `json_schema` | Validate output against a JSON schema | write, code |
| `code_compiles` | Check that code compiles without errors | code |
| `url_reachable` | HTTP HEAD to verify URL returns 2xx | browser |
| `regex_match` | Pattern matching against output | any |
| `custom` | User-defined validator function | any |

---

## 5. Role System

### Role Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Role System                           │
│                                                          │
│  Each role provides:                                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Prompt Modifier                                    │  │
│  │  Injected into LLM prompt to shape agent behavior  │  │
│  │  e.g., "You are a planner. Break goals into        │  │
│  │  subtasks and delegate to appropriate agents."     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Default Tools                                      │  │
│  │  Pre-configured tool set for the role               │  │
│  │  Planner: search, write                             │  │
│  │  Executor: search, write, code                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Permissions                                        │  │
│  │  Access control: read, write, execute, approve,     │  │
│  │  delegate                                            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Default Personality                                │  │
│  │  Behavioral baseline for the role                   │  │
│  │  Planner: "strategic and methodical"                │  │
│  │  Critic: "analytical and constructively critical"   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Effective Personality Composition

```
Final Prompt = Base Personality + Role Prompt Modifier

Example: Agent with personality="helpful assistant" and role="planner"

  Base:       "You are a helpful assistant."
  + Modifier: "You are a planner. Break goals into subtasks and
               delegate to appropriate agents. Think step by step."
  = Effective: "You are a helpful assistant. You are a planner.
               Break goals into subtasks and delegate to appropriate
               agents. Think step by step."
```

---

## 6. Orchestration Modes

### Mode Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                    Orchestration Engine                            │
│                                                                   │
│  ┌─────────────┐  Simplest ←─────────────────────── Most Complex │
│  │             │                                                  │
│  │   SINGLE    │  One agent, one run, linear execution            │
│  │             │  No coordination overhead                         │
│  │      │      │                                                  │
│  │      ▼      │                                                  │
│  │ SEQUENTIAL  │  A→B→C handoff chain                             │
│  │             │  Each agent receives previous agent's output      │
│  │      │      │                                                  │
│  │      ▼      │                                                  │
│  │   GROUP     │  Shared scratchpad, LLM speaker selection        │
│  │             │  Agents discuss until termination condition       │
│  │      │      │                                                  │
│  │      ▼      │                                                  │
│  │HIERARCHICAL │  Manager → Workers → Synthesizer                 │
│  │             │  Top-down task decomposition and delegation       │
│  │      │      │                                                  │
│  │      ▼      │                                                  │
│  │  PARALLEL   │  Fan-out with semaphore concurrency control       │
│  │             │  All agents run simultaneously, merge results     │
│  └─────────────┘                                                  │
└───────────────────────────────────────────────────────────────────┘
```

### Single Mode

```
User Goal → Agent → [Plan → Execute → Verify]* → Result
```

- One agent runs the full loop
- No coordination overhead
- Best for simple, well-defined tasks

### Sequential Mode

```
┌────────┐     ┌────────┐     ┌────────┐
│Agent A │────►│Agent B │────►│Agent C │
│Research│     │Analyze │     │  Write │
└────────┘     └────────┘     └────────┘
     │              │              │
     ▼              ▼              ▼
  Output A      Output B      Final Output
  = Input B     = Input C

Events emitted: handoff (fromAgent, toAgent) between each step
```

- Agents run in series
- Each agent's output becomes the next agent's input
- Handoff events emitted between transitions

### Group Chat Mode

```
┌───────────────────────────────────────────┐
│              Shared Scratchpad             │
│                                           │
│  Agent A: "I found data on X..."          │
│  Agent B: "Building on that, Y shows..."  │
│  Agent A: "The key insight is Z..."       │
│  Agent C: "I can verify this by..."       │
│                                           │
│  LLM Speaker Selection:                   │
│  After each message, LLM chooses which    │
│  agent speaks next based on context       │
└───────────────────────────────────────────┘
         │
         ▼
  Termination condition met → Synthesize final output

Events emitted: group_message (agent, message)
```

- All agents share a conversation scratchpad
- LLM decides which agent speaks next
- Terminates on max_steps, text_mention, or max_messages

### Hierarchical Mode

```
         ┌──────────┐
         │ Manager  │
         │(Planner) │
         └────┬─────┘
              │
     ┌────────┼────────┐
     │        │        │
     ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐
│Worker 1││Worker 2││Worker 3│
│Research││Execute ││Review  │
└────┬───┘└────┬───┘└────┬───┘
     │         │         │
     └─────────┼─────────┘
               │
               ▼
         ┌──────────────┐
         │ Synthesizer  │
         │ (Manager)    │
         └──────────────┘
               │
               ▼
          Final Output
```

- Manager decomposes goal into subtasks
- Delegates subtasks to worker agents
- Workers execute independently
- Manager synthesizes all worker outputs

### Parallel Mode

```
           ┌──────────┐
           │  Fan-out  │
           └────┬─────┘
                │
      ┌─────────┼─────────┐
      │         │         │
      ▼         ▼         ▼
┌──────────┐┌──────────┐┌──────────┐
│ Agent A  ││ Agent B  ││ Agent C  │
│          ││          ││          │
│ Semaphore││ Semaphore││ Semaphore│
│  Slot 1  ││  Slot 2  ││  Slot 3  │
└────┬─────┘└────┬─────┘└────┬─────┘
     │           │           │
     └───────────┼───────────┘
                 │
                 ▼
          ┌────────────┐
          │  Merge     │
          │  Results   │
          └────────────┘
```

- All agents run simultaneously
- Semaphore controls max concurrency (configurable, default 3)
- Results merged in agent order after all complete
- Best for independent research tasks

### Team Configuration

```typescript
interface TeamConfig {
  name: string;                    // Team display name
  mode: OrchestrationMode;         // sequential | group | hierarchical | parallel
  maxConcurrency: number;          // Max parallel agents (parallel mode only)
  terminationType: string;         // max_steps | text_mention | max_messages
  terminationValue: number;        // Threshold for termination condition
  sharedContext: boolean;          // Whether agents share context
  agents: AgentConfig[];           // Agent configurations
}
```

---

## 7. Memory System

### 3-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   MemoryManager                          │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  TIER 1: SESSION (In-Memory)                       │ │
│  │                                                    │ │
│  │  • Stored in Map<runId, Map<key, entry>>           │ │
│  │  • Scoped to a single run                          │ │
│  │  • Auto-expires after 24 hours                     │ │
│  │  • Fastest read/write                              │ │
│  │  • Cleared on clearSession() or run end            │ │
│  │  • Use case: temporary working data, context       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  TIER 2: PERSISTENT (Database)                     │ │
│  │                                                    │ │
│  │  • Stored in AgentMemory table                     │ │
│  │  • Unique key: (agentId, key, tier)                │ │
│  │  • Upsert semantics (update or create)             │ │
│  │  • Survives across runs                            │ │
│  │  • Use case: learned facts, user preferences       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  TIER 3: ARTIFACT (Database)                       │ │
│  │                                                    │ │
│  │  • Stored in Artifact table                        │ │
│  │  • Unique key: (agentId, name)                     │ │
│  │  • Rich metadata (type, runId, custom metadata)    │ │
│  │  • Large content blobs (code, documents, data)     │ │
│  │  • Use case: generated reports, code files, data   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  API:                                                    │
│    get(agentId, key, tier?) → value                      │
│    set(agentId, key, value, tier, runId?) → void         │
│    delete(agentId, key, tier) → void                     │
│    list(agentId, tier?) → MemoryEntry[]                  │
│    clearSession(runId) → void                            │
│    saveArtifact(agentId, name, type, content, meta?) → a │
│    listArtifacts(agentId) → Artifact[]                   │
│    getArtifact(agentId, name) → Artifact                 │
└─────────────────────────────────────────────────────────┘
```

### Memory in Agent Execution

```
During runStep():
  │
  ├── Read: Load relevant memories into LLM context
  │   ├── Session: current run's working data
  │   ├── Persistent: cross-run learned facts
  │   └── Artifact: reference documents
  │
  ├── Execute: Tool may produce output worth remembering
  │
  └── Write: Save new insights
      ├── Session: temporary calculations, intermediate state
      ├── Persistent: confirmed facts, discovered patterns
      └── Artifact: generated files, reports, code
```

---

## 8. Policy & Governance

### Policy Engine Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PolicyEngine                          │
│                                                          │
│  Input: tool, role, riskLevel, agentId                  │
│                                                          │
│  1. Load all enabled policies (sorted by priority DESC) │
│                                                          │
│  2. Evaluate each policy:                               │
│     ┌─────────────────────────────────────┐             │
│     │  Condition Match:                    │             │
│     │  • tool: ["execute_code", ...]       │             │
│     │  • role: ["executor", ...]           │             │
│     │  • riskLevel: ["high", "critical"]   │             │
│     │  • agentId: ["specific-agent-id"]    │             │
│     │                                      │             │
│     │  If ALL condition fields match →     │             │
│     │    Apply this policy's action         │             │
│     └─────────────────────────────────────┘             │
│                                                          │
│  3. First matching policy wins (priority order)         │
│                                                          │
│  4. Return PolicyCheckResult:                           │
│     ├── action: allow | block | ask_user | shadow       │
│     ├── matchedPolicy: PolicyRule | null                │
│     └── reason: string                                  │
│                                                          │
│  5. Log to AuditLog (always, regardless of action)      │
└─────────────────────────────────────────────────────────┘
```

### Policy Actions

| Action | Behavior | UI Impact |
|--------|----------|-----------|
| `allow` | Execute tool normally | No interruption |
| `block` | Prevent execution, return error | Red error event in stream |
| `ask_user` | Pause execution, create ApprovalRequest | ApprovalModal appears |
| `shadow` | Execute tool + log audit, no interruption | No visible interruption |

### Default Policies (Pre-seeded)

| Priority | Name | Condition | Action |
|----------|------|-----------|--------|
| 100 | Block critical risk | riskLevel = critical | block |
| 90 | Require approval for code execution | tool = execute_code | ask_user |
| 80 | Block all for reviewer role | role = reviewer | block (execute) |
| 70 | Allow read operations | tool = search \| browse_url \| read_memory | allow |
| 60 | Allow general role | role = general | allow |

### Approval Workflow

```
┌──────────┐     ┌───────────────┐     ┌──────────────┐
│  Agent   │────►│ ApprovalReq   │────►│  Human User  │
│  Wants   │     │  (pending)    │     │  Sees Modal  │
│  to Act  │     │  in DB        │     │              │
└──────────┘     └───────────────┘     └──────┬───────┘
                                               │
                                        ┌──────┴───────┐
                                        │              │
                                     Approved        Denied
                                        │              │
                                        ▼              ▼
                                   Execute tool    Emit error
                                   + update        + update
                                   approval        approval
                                   status          status
```

---

## 9. Reflection Loop

### Critic-Generator Pattern

```
┌──────────────────────────────────────────────────────────┐
│                  Reflection Loop                          │
│                                                          │
│  Initial Output (from agent execution)                   │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────────┐                                        │
│  │  ITERATION 1 │                                        │
│  │              │                                        │
│  │  Generator:  │  "Here is the analysis..."            │
│  │  produces    │                                        │
│  │  output      │                                        │
│  │              │                                        │
│  │  Critic:     │  "The analysis lacks depth on X.      │
│  │  evaluates   │   Please revise with more detail."    │
│  │              │                                        │
│  │  Approved?   │  NO → Continue                        │
│  └──────────────┘                                        │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────────┐                                        │
│  │  ITERATION 2 │                                        │
│  │              │                                        │
│  │  Generator:  │  "Revised analysis with X detail..."  │
│  │  revises     │                                        │
│  │  based on    │                                        │
│  │  critique    │                                        │
│  │              │                                        │
│  │  Critic:     │  "APPROVED"                            │
│  │  evaluates   │                                        │
│  │              │                                        │
│  │  Approved?   │  YES → Break                           │
│  └──────────────┘                                        │
│       │                                                  │
│       ▼                                                  │
│  Return final output                                     │
│                                                          │
│  Safety: Max iterations (default 3) prevents infinite    │
│  loops. If max reached without approval, return latest.  │
└──────────────────────────────────────────────────────────┘
```

### Reflection Configuration

```typescript
interface ReflectionConfig {
  enabled: boolean;            // Master toggle
  maxIterations: number;       // Max critic-generator cycles (1-10)
  criteria: string;            // Approval criteria string (default "APPROVED")
}
```

### Reflection Persistence

Each iteration is stored in the `ReflectionIteration` database table:

| Field | Type | Description |
|-------|------|-------------|
| `id` | cuid | Primary key |
| `runId` | string | FK to AgentRun |
| `iteration` | number | Cycle number (1, 2, 3...) |
| `output` | string | Generator's output |
| `critique` | string | Critic's evaluation |
| `approved` | boolean | Whether critic approved |

---

## 10. Metrics & Observability

### Metrics Collection

```
┌─────────────────────────────────────────────────────────┐
│                 MetricsCollector                         │
│                                                          │
│  Per-Run Metrics:                                        │
│  ├── Total tokens used                                   │
│  ├── Total latency (ms)                                  │
│  ├── Number of steps                                     │
│  ├── Tool usage distribution (count per tool)            │
│  ├── Verification pass/fail rate                         │
│  └── Error count                                         │
│                                                          │
│  System-Wide Metrics:                                    │
│  ├── Total runs                                          │
│  ├── Completed runs                                      │
│  ├── Failed runs                                         │
│  ├── Active runs                                         │
│  ├── Total agents                                        │
│  ├── Total tokens used (all time)                        │
│  ├── Average latency per run                             │
│  ├── Average steps per run                               │
│  └── Error rate (%)                                      │
│                                                          │
│  Timeline Events (per run):                              │
│  ├── run_start                                           │
│  ├── step_start                                          │
│  ├── llm_call (with token count + duration)              │
│  ├── tool_execution (with duration)                      │
│  ├── step_end                                            │
│  └── run_end                                             │
└─────────────────────────────────────────────────────────┘
```

### Audit Trail

Every policy check and approval creates an immutable audit log entry:

| Field | Description |
|-------|-------------|
| `agentId` | Which agent triggered the check |
| `runId` | Which run |
| `action` | What action was requested (tool name) |
| `details` | Full condition match details (JSON) |
| `outcome` | allow, block, ask_user, shadow |
| `riskLevel` | Assessed risk level |

---

## 11. Building Agents with AI

### AI Builder Flow

```
User Input: "I need an agent that researches quantum computing
             and writes a summary report"

       │
       ▼
┌──────────────┐
│  Planner     │
│  .build()    │
│              │
│  1. Create   │
│     system   │
│     prompt   │
│              │
│  2. Call LLM │
│     with     │
│     ZAI SDK  │
│              │
│  3. Parse    │
│     JSON     │
│     response │
└──────┬───────┘
       │
       ▼
AgentConfig {
  name: "Quantum Research Agent",
  goal: "Research quantum computing topics and produce
         comprehensive summary reports",
  personality: "analytical and detail-oriented researcher",
  tools: ["search", "write", "browser"],
  role: "researcher",
  model: "gemini-2.5-pro",
  orchestrationMode: "single",
  maxSteps: 15,
  outputFormat: "markdown",
  reflectionEnabled: false,
  shortTermMemory: true,
  longTermMemory: true
}
       │
       ▼
  Save to DB → Add to Canvas → Select in Inspector
```

### JSON Extraction Strategies

When the LLM returns a response, the planner tries 4 strategies to extract valid JSON:

```
Strategy 1: Direct Parse
  → Try JSON.parse(entire response)
  → Success rate: Low (LLM often adds prose)

Strategy 2: Code Block Extraction
  → Find ```json ... ``` in response
  → Parse the content between backticks
  → Success rate: Medium

Strategy 3: Greedy JSON Extraction
  → Find first { and last }
  → Parse substring
  → Success rate: High (catches most cases)

Strategy 4: Tool Mention Inference
  → If no JSON found, scan text for tool names
  → Create a simple action based on mention
  → Success rate: Fallback only
```

---

## 12. API Reference for Agent Operations

### Create Agent

```
POST /api/agent/create
Body: {
  name: string,              (required)
  goal: string,              (required)
  personality?: string,
  tools?: string[],
  role?: string,
  model?: string,
  orchestrationMode?: string,
  maxSteps?: number,
  autoRun?: boolean,
  outputFormat?: string,
  reflectionEnabled?: boolean,
  reflectionMaxIter?: number,
  reflectionCriteria?: string,
  shortTermMemory?: boolean,
  longTermMemory?: boolean,
  maxConcurrency?: number
}
Response: AgentInfo
```

### Build Agent with AI

```
POST /api/agent/build
Body: {
  userInput: string,         (required - natural language description)
  save?: boolean             (default: true - save to DB)
}
Response: {
  config: AgentConfig,       (generated configuration)
  agent?: AgentInfo          (if save=true, the saved agent)
}
```

### Run Agent

```
POST /api/agent/run
Body: {
  agentId: string,           (required)
  goal?: string              (optional override)
}
Response: {
  runId: string              (use for SSE stream)
}

Then connect to SSE:
GET /api/agent/stream?runId={runId}
```

### Stop Agent

```
POST /api/agent/stop
Body: {
  runId: string              (required)
}
Response: { success: true }
```

### Run Team

```
POST /api/team/run
Body: {
  teamId: string,            (required)
  goal?: string              (optional)
}
Response: {
  runId: string
}
```

### Get Metrics

```
GET /api/metrics/run?runId={runId}
Response: {
  totalTokens: number,
  totalLatencyMs: number,
  stepCount: number,
  toolUsage: Record<string, number>,
  verificationResults: { passed: number, failed: number }
}

GET /api/metrics/system
Response: {
  totalRuns: number,
  completedRuns: number,
  failedRuns: number,
  activeRuns: number,
  totalAgents: number,
  totalTokensUsed: number,
  avgLatencyMs: number,
  avgStepsPerRun: number,
  errorRate: number
}
```

---

## Appendix: Quick Reference

### Event Stream Cheat Sheet

| SSE Event | When | What to Show |
|-----------|------|-------------|
| `status` | Run lifecycle change | Status bar update |
| `thinking` | LLM processing | Thinking indicator |
| `plan` | Next action decided | Step card with reasoning |
| `action` | Tool starts | Tool icon + input preview |
| `result` | Tool completes | Output preview |
| `error` | Something went wrong | Red error card |
| `done` | Run finished | Completion banner |
| `reflection` | Critic evaluates | Iteration card |
| `policy` | Policy blocks action | Yellow warning card |
| `handoff` | Sequential agent handoff | Agent transition card |
| `group_message` | Group chat message | Agent bubble |

### Run Status Values

| Status | Color | Description |
|--------|-------|-------------|
| `pending` | Gray | Created but not started |
| `running` | Cyan | Currently executing |
| `completed` | Green | Successfully finished |
| `failed` | Red | Errored out |
| `stopped` | Yellow | User manually stopped |

### Orchestration Mode Decision Tree

```
Need multiple agents?
├── No → SINGLE
└── Yes
    ├── Need agents to run one after another?
    │   └── Yes → SEQUENTIAL
    └── No
        ├── Need agents to discuss together?
        │   └── Yes → GROUP
        └── No
            ├── Need a manager to coordinate?
            │   └── Yes → HIERARCHICAL
            └── No → PARALLEL (run independently)
```

---

*This document covers the complete agent system in Agent Studio OS. Last updated: 2025-01-18.*
