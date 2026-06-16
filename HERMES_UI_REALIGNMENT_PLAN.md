# Hermes UI Realignment Plan
## Operator Hierarchy Model: Global → Domain → Object → Action → Event

---

## Design Philosophy

> "Strict top-left hierarchy. The user's eye is intentionally guided from global operational status in the upper-left corner, down through hierarchical navigation trees, then into the active operational workspace. Every major UI element reinforces a top-down, left-to-right information flow. The interface prioritizes situational awareness before interaction."

**Core Principle**: Awareness comes before interaction. The operator should know the health of the entire system in under a second.

**Visual Weight Hierarchy** (decreasing dominance):
```
1. Top Ribbon      ← Most Important (always visible, never obscured)
2. Left Tree       ← Second (structural navigation)
3. Center Canvas   ← Third (active workspace)
4. Right Inspector ← Fourth (contextual details)
5. Bottom Feed     ← Fifth (history/telemetry)
```

**Information Journey**:
```
Status → Domain → Object → Operation → Details → Events
```

---

## Target Layout

```
┌─────────────────────────────────────────────────────────┐
│ LEVEL 0 — GLOBAL OPERATIONAL STATUS RIBBON             │
│ Hermes ● │ 14 Agents │ 3 Missions │ 4 Models │ $2.41/hr │ Telemetry Live │
├──────────┬──────────────────────────────────┬───────────┤
│          │                                  │           │
│ LEVEL 1  │     LEVEL 3 — ACTIVE WORKSPACE   │ LEVEL 4   │
│ Domain   │                                  │ Inspector │
│          │     ◉ ACTIVE OPERATION           │           │
│ LEVEL 2  │    ○ ○ ○ ○ ○                     │ Status    │
│ Objects  │                                  │ Provider  │
│          │                                  │ Cost      │
│          │                                  │ Latency   │
│          │                                  │ Tokens    │
│          │                                  │ Memory    │
├──────────┴──────────────────────────────────┴───────────┤
│ LEVEL 5 — LIVE TELEMETRY / EVENT FEED                   │
│ [14:32:01] Agent:Researcher emitted PROPOSE action      │
│ [14:32:00] Kernel accepted event evt_a3f2              │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Global Operational Status Ribbon (Level 0)

**Goal**: Transform the existing 44px menu bar into a persistent, information-dense operational status ribbon that provides instant system-wide awareness.

### Current State
- `agent-studio.tsx` topbar: h-11 (44px) with logo, menubar, module tabs, and toggle buttons
- `SystemIndicator`: Small dot in the top-right — the only health signal
- No system-wide metrics visible without drilling in

### Target State
- **Height**: 48px (expanded from 44px) — every pixel earns its place
- **Left zone**: Logo + connection status indicator ("Hermes ● Connected")
- **Center zone**: Live system metrics strip — agent count, mission count, model count, node count, cost rate, telemetry status
- **Right zone**: Module tabs (retain existing tab navigation) + user controls

### Component Architecture

```
GlobalStatusRibbon
├── RibbonLeft
│   ├── Logo "HERMES" (bold, electric yellow)
│   └── ConnectionStatus — green dot + "Connected" / red dot + "Disconnected"
│
├── RibbonCenter
│   ├── MetricPill — "14 Agents" (clickable → filters tree to Agents domain)
│   ├── MetricPill — "3 Missions" (clickable → filters tree to Operations domain)
│   ├── MetricPill — "4 Models" (clickable → filters tree to Infrastructure domain)
│   ├── MetricPill — "7 Nodes" (clickable → filters tree to Infrastructure domain)
│   ├── MetricPill — "$2.41/hr" (amber, cost awareness)
│   └── TelemetryStatus — "Telemetry Live" with pulse animation
│
└── RibbonRight
    ├── ModuleTabs — Operations | Agents | Infrastructure | Knowledge | Execution | Reports | Security
    └── SettingsGear
```

### Data Sources
- Agent count → from `agent-store.agents.length`
- Mission/operation count → from Hermes store `agents` filtered by role
- Model count → computed from distinct `model` fields across agents
- Cost rate → aggregated from `systemMetrics` in agent-store
- Telemetry → from Hermes kernel connection status
- Node count → from `causalNodes.length` in hermes-store

### Visual Design
- Background: `#0a0e14` (one shade darker than main bg)
- Bottom border: 2px solid `#ffd60a` (electric yellow — the "awareness line")
- Metric pills: `bg-[#141b23]` with `border border-[#2a3441]`, compact padding `px-3 py-0.5`
- Active metric (on hover): `border-[#ffd60a]`
- Connection status: green dot with subtle pulse animation
- Cost metric: amber/yellow text to draw attention
- Telemetry "Live": animated dot (similar to live indicators in broadcast)

### Interaction
- Clicking a MetricPill → navigates the left tree to the corresponding domain and selects it
- Connection status click → reconnect attempt
- Module tabs remain the primary navigation mechanism (but reorganized into the 7 Hermes domains)

### Key Files to Modify
- `src/components/agent/agent-studio.tsx` — Replace topbar section with `<GlobalStatusRibbon />`
- New: `src/components/hermes/global-status-ribbon.tsx`
- New: `src/components/hermes/metric-pill.tsx`

### Acceptance Criteria
- [ ] Ribbon is always visible regardless of scroll or module
- [ ] All 6+ metric pills show live data within 2 seconds of page load
- [ ] Clicking any metric pill navigates the left tree to the corresponding domain
- [ ] Connection status accurately reflects Hermes kernel state
- [ ] Cost metric updates at least every 5 seconds during active runs
- [ ] Ribbon does not obscure any workspace content
- [ ] Visual weight is clearly the strongest element on screen

---

## Phase 2: Hierarchical Navigation Tree (Levels 1–2)

**Goal**: Replace the flat "EXPLORER" sidebar with a proper domain-driven hierarchical tree that enforces the Global → Domain → Object information flow.

### Current State
- `AgentSidebar`: 260px, flat sections (Agents, Skills, Workflows, Templates, Recent Runs)
- No domain concept — everything is at the same level
- No expand/collapse beyond section headers
- Objects (agents, teams) are listed without domain context

### Target State
- **Width**: 260px (unchanged)
- **Structure**: 7 Hermes domains, each expandable to Level 2 objects
- **Active domain**: Highlighted with left accent bar (electric yellow)
- **Search**: Top of tree for quick filtering
- **Collapse**: Each domain independently collapsible

### Domain Map (Level 1 → Level 2)

```
📂 Operations (Level 1)
 ├─ 🎯 Market Research    (Level 2 — mission)
 ├─ 🚀 Deployment         (Level 2 — mission)
 ├─ 📡 Monitoring          (Level 2 — mission)
 └─ 🚨 Incident Response  (Level 2 — mission)

📂 Agents (Level 1)
 ├─ 🔍 Researcher         (Level 2 — agent)
 ├─ 📝 Writer             (Level 2 — agent)
 ├─ 💻 Coder              (Level 2 — agent)
 └─ 🔎 Analyst            (Level 2 — agent)

📂 Infrastructure (Level 1)
 ├─ 🖥️ Desktop            (Level 2 — compute)
 ├─ 💾 NAS                (Level 2 — storage)
 ├─ ☁️ EC2-Prod           (Level 2 — compute)
 └─ 🌐 GCP-West           (Level 2 — compute)

📂 Knowledge (Level 1)
 ├─ 📚 Documentation      (Level 2 — corpus)
 ├─ 🧠 Memory Store       (Level 2 — memory)
 └─ 📊 Datasets            (Level 2 — data)

📂 Execution (Level 1)
 ├─ ▶️ Active Runs        (Level 2 — runs)
 ├─ ⏳ Queued              (Level 2 — queue)
 └─ ✅ Completed           (Level 2 — history)

📂 Reports (Level 1)
 ├─ 📈 Performance         (Level 2 — report)
 ├─ 💰 Cost Analysis      (Level 2 — report)
 └─ 🛡️ Security Audit    (Level 2 — report)

📂 Security (Level 1)
 ├─ 🔒 Policies           (Level 2 — policy)
 ├─ ✋ Approvals          (Level 2 — approval)
 └─ 📋 Audit Log          (Level 2 — audit)
```

### Component Architecture

```
HermesNavTree
├── TreeSearch — Filter input at top
├── TreeLevel1 — DomainNode (collapsible)
│   ├── DomainHeader — Icon + label + count badge + expand chevron
│   └── TreeLevel2 — ObjectNode (list, animated collapse)
│       ├── ObjectRow — Icon + name + status dot + role badge
│       └── ObjectContextMenu — Right-click actions
└── TreeFooter — Collapse all / Expand all
```

### Domain-Object Mapping (Data Architecture)

| Domain | Level 2 Source | Data Source |
|--------|---------------|-------------|
| Operations | Missions/Goals | Hermes store `runGoal` + active runs |
| Agents | Agent instances | `agent-store.agents` |
| Infrastructure | Compute/Model nodes | Agent `model` fields + system config |
| Knowledge | Memory/Corpus | `agent-store` memory entities |
| Execution | Runs | `agent-store.runs` + Hermes `eventStream` |
| Reports | Generated reports | Hermes HQA query results |
| Security | Policies/Approvals | `agent-store.policies` + `pendingApprovals` |

### Visual Design
- Domain headers: `font-bold text-xs uppercase tracking-wider`, `text-[#8a94a3]`
- Active domain: Left border 2px `#ffd60a`, `bg-[#141b23]`
- Object rows: `text-sm text-[#d7dde5]`, hover `bg-[#141b23]`
- Selected object: `bg-[#1a212b]` with `border-l-2 border-[#ffd60a]`
- Status dots: Green (active), Yellow (idle), Red (error), Gray (offline)
- Count badges: `bg-[#1a212b] text-[#8a94a3] text-[10px]`
- Expand/collapse: Smooth height animation (framer-motion)
- Search: `bg-[#0a0e14] border-[#2a3441]` with search icon

### Interaction
- Click domain header → expand/collapse + set active domain in store
- Click object → select in store → update center workspace + right inspector
- Double-click object → open in workspace with detail view
- Right-click object → context menu (rename, duplicate, delete, inspect)
- Search → filters objects across all domains (domains with no matches collapse)
- Metric pill click (from ribbon) → expand that domain + scroll to top

### Key Files to Modify
- `src/components/agent/agent-sidebar.tsx` → Replace with `HermesNavTree`
- New: `src/components/hermes/hermes-nav-tree.tsx`
- New: `src/components/hermes/domain-node.tsx`
- New: `src/components/hermes/object-node.tsx`
- `src/store/agent-store.ts` — Add `activeDomain`, `expandedDomains`, `selectedObjectId` state
- `src/store/hermes-store.ts` — Add domain-relevant computed views

### Acceptance Criteria
- [ ] All 7 domains render with correct Level 2 objects from live data
- [ ] Expanding/collapsing a domain is smooth (≤200ms animation)
- [ ] Clicking an object updates the center workspace and right inspector
- [ ] Search filters objects across domains in real-time (<100ms)
- [ ] Metric pill clicks from the ribbon navigate to the correct domain
- [ ] The left tree has the second-strongest visual presence after the ribbon
- [ ] No flat lists — everything is in a domain hierarchy
- [ ] Status dots reflect real-time object health

---

## Phase 3: Workspace & Inspector Realignment (Levels 3–4)

**Goal**: Restructure the center workspace and right inspector to serve the Operator Hierarchy Model — workspace as the active operational view (Level 3), inspector as contextual details (Level 4), with the Mission Hub positioned in the upper-center.

### Current State
- Center canvas: React Flow graph (agents module), or Hermes causal graph view
- Right inspector: Agent configuration form (320px)
- No "operation-centric" view — everything is agent-centric
- Module tabs switch entire layouts (canvas vs hermes vs router vs pipeline)

### Target State
- Center workspace adapts based on selected Level 2 object
- Mission Hub (circular operation view) positioned upper-center
- Right inspector shows Level 4 details in context (no giant modals)
- Workspace transitions are contextual, not full module switches

### Workspace Views by Domain

| Domain Selected | Workspace View | What Renders |
|----------------|---------------|-------------|
| Operations | Mission Hub | Circular operation diagram with agents as satellite nodes |
| Agents | Agent Graph | React Flow canvas (existing, refined) |
| Infrastructure | Infra Map | Model/compute topology |
| Knowledge | Knowledge Graph | Memory/corpus connections |
| Execution | Causal DAG | Hermes causal graph (existing) |
| Reports | Report Viewer | HQA query results, charts |
| Security | Policy Matrix | Policy rules, approval queue |

### Mission Hub Component (Upper-Center)

The signature visual element — a radial operation diagram:

```
         ┌─────────┐
    ┌────┤ MISSION ├────┐
    │    └────┬────┘    │
    │         │         │
  ┌─┴─┐   ┌─┴─┐   ┌─┴─┐
  │ R │   │ W │   │ C │    ← Agent satellites
  └─┬─┘   └─┬─┘   └─┬─┘
    │         │         │
    ▼         ▼         ▼
  Events   Events   Events   ← Causal links
```

- **Position**: Upper-center of workspace (not dead center)
- **Center node**: Operation name + status + progress
- **Satellite nodes**: Agents assigned to this operation, positioned radially
- **Links**: Causal edges from the Hermes DAG, animated along connections
- **Frontier pulse**: Active frontier events glow and pulse
- **Click satellite**: Selects that agent → right inspector updates

### Component Architecture

```
HermesWorkspace
├── WorkspaceHeader
│   ├── Breadcrumb — Domain > Object > View
│   └── ViewSwitcher — tabs per domain (Overview, Timeline, Agents, Files, Cost, AAR)
│
├── WorkspaceContent (flex-1, varies by domain)
│   ├── OperationsDomain → MissionHub + OperationTimeline
│   ├── AgentsDomain → AgentCanvas (refactored existing)
│   ├── InfraDomain → InfraTopology
│   ├── KnowledgeDomain → KnowledgeGraph
│   ├── ExecutionDomain → HermesCausalGraph (existing)
│   ├── ReportsDomain → ReportViewer
│   └── SecurityDomain → PolicyDashboard (existing)
│
└── WorkspaceToolbar
    ├── Zoom controls
    ├── Filter controls
    └── View mode toggles
```

```
HermesInspector (Right Panel, 280px)
├── InspectorHeader — Object name + type icon + status badge
├── InspectorContent
│   ├── OverviewSection — Key metrics at a glance
│   ├── DetailSection — Contextual properties (varies by object type)
│   └── ActionsSection — Quick actions (Run, Stop, Edit, Delete)
└── InspectorFooter — Related objects / breadcrumbs
```

### Inspector Variants by Object Type

| Object Type | Inspector Sections |
|-------------|-------------------|
| Mission | Status, Agents, Progress, Cost, Timeline |
| Agent | Status, Provider, Cost, Latency, Tokens, Memory (existing config, compacted) |
| Infrastructure | Node status, Model, Region, Uptime, Cost, Capacity |
| Knowledge | Corpus size, Last indexed, Queries, Hit rate |
| Run | Steps, Duration, Tokens, Errors, Causal depth |
| Report | Generated at, Query, Confidence, Sources |
| Policy | Conditions, Actions, Trigger count, Last triggered |

### Visual Design — Workspace
- Breadcrumb: `text-xs text-[#8a94a3]` with `text-[#ffd60a]` for current
- View switcher tabs: Compact underline tabs, `border-b-2 border-[#ffd60a]` on active
- Mission Hub center node: `bg-[#0f141b] border-2 border-[#ffd60a]`, `box-shadow: 0 0 20px rgba(255,214,10,0.3)`
- Satellite nodes: Smaller, role-colored borders
- Frontier pulse: `@keyframes frontier-pulse { 0%,100% { box-shadow: 0 0 4px #ffd60a } 50% { box-shadow: 0 0 16px #ffd60a } }`

### Visual Design — Inspector
- Width: 280px (reduced from 320px — details should not dominate)
- Background: `#0a0e14` (darker than workspace to recede visually)
- Section headers: `text-[10px] uppercase tracking-wider text-[#8a94a3]`
- Values: `text-sm text-[#d7dde5]`
- Status badges: Colored pills matching existing role colors
- No modals — everything in-context

### Key Files to Modify
- `src/components/agent/agent-studio.tsx` — Replace center/right layout with workspace + inspector
- `src/components/agent/agent-canvas.tsx` — Refactor as `AgentsDomain` workspace view
- `src/components/agent/agent-inspector.tsx` → Refactor as `HermesInspector`
- `src/components/agent/hermes-causal-graph.tsx` — Becomes `ExecutionDomain` workspace view
- New: `src/components/hermes/hermes-workspace.tsx`
- New: `src/components/hermes/hermes-inspector.tsx`
- New: `src/components/hermes/mission-hub.tsx`
- New: `src/components/hermes/workspace-header.tsx`
- New: `src/components/hermes/infra-topology.tsx`
- New: `src/components/hermes/knowledge-graph.tsx`
- `src/store/agent-store.ts` — Add workspace view state, breadcrumbs
- `src/store/hermes-store.ts` — Add domain-specific workspace data

### Acceptance Criteria
- [ ] Selecting an object in the left tree updates both workspace and inspector
- [ ] Mission Hub renders in upper-center with satellite agent nodes
- [ ] Each of the 7 domains has a distinct workspace view
- [ ] Inspector shows contextual details for every object type (no generic fallback)
- [ ] No giant modals — everything appears in context
- [ ] Workspace has third-strongest visual presence; inspector has fourth
- [ ] Breadcrumb trail shows: Domain > Object > View
- [ ] View switcher tabs work per-domain (at least Overview + 1 other view per domain)
- [ ] Causal DAG view (Execution domain) renders with existing Hermes data
- [ ] Agent graph view (Agents domain) preserves all existing React Flow functionality

---

## Phase 4: Telemetry Event Feed (Level 5) + Full Integration

**Goal**: Add the persistent bottom event feed that serves as the living history of the system, and wire all 5 layers together into a cohesive operator hierarchy where every interaction reinforces the Global → Domain → Object → Action → Event flow.

### Current State
- No persistent bottom feed
- Events are scattered: agent run view shows step events, Hermes shows event stream in a side panel
- No unified chronological view of system activity
- Layers don't reinforce each other — ribbon, tree, workspace, inspector are independent

### Target State
- **Bottom feed**: 160px persistent panel, always visible, showing live telemetry
- **Cross-layer wiring**: Actions in any layer update all other layers
- **Event sourcing**: Bottom feed is the UI projection of the Hermes Event Log (the source of truth)
- **Bidirectional navigation**: Click an event → navigate to its object in the tree → update workspace + inspector

### Component Architecture

```
HermesEventFeed (Bottom Panel, h-[160px])
├── FeedHeader (h-8, collapsible)
│   ├── Label — "LIVE EVENTS"
│   ├── FilterButtons — All | System | Agent | Execution | Security
│   ├── PauseButton — Pause/resume scroll
│   └── CollapseToggle — Minimize to single line
│
└── FeedContent (ScrollArea, h-[120px])
    └── EventRow per event — Timestamp + Tier icon + Agent name + Event type + Summary
        ├── Click → Navigate to object in tree + select in workspace
        ├── Frontier events → Yellow left border
        └── Error events → Red left border
```

### Cross-Layer Integration Map

```
Ribbon metric click
  → Expands corresponding domain in tree
  → Scrolls to top of that domain
  → Workspace shows domain overview

Tree object click
  → Workspace shows that object's view
  → Inspector shows that object's details
  → Feed filters to that object's events (optional)
  → Ribbon highlights the corresponding metric

Workspace action (e.g., "Start Run")
  → Ribbon updates metrics (agent count, cost)
  → Tree updates status dot on the object
  → Feed shows new events in real-time
  → Inspector updates with live metrics

Inspector action (e.g., "Edit Agent")
  → Workspace reflects changes immediately
  → Tree updates object name/status
  → Feed logs the configuration change event

Feed event click
  → Tree navigates to and highlights the source object
  → Workspace shows that object's view
  → Inspector shows that object's details
```

### Event Feed Data Pipeline

```
Hermes Kernel Spine
  ↓ (event emission)
EventStore.commit(event)
  ↓ (SSE or polling)
hermes-store.updateEventStream()
  ↓ (Zustand subscription)
HermesEventFeed renders new EventRow
  ↓ (user click)
navigateToObject(event.sourceAgentId)
  ↓
tree.selectDomainForObject(agentId)
workspace.setViewForObject(agentId)
inspector.setObjectContext(agentId)
```

### Full Layout Composition

After Phase 4, the complete shell structure:

```
AgentStudio
├── <GlobalStatusRibbon />           ← Level 0 (h-12, sticky top)
├── <div className="flex-1 flex">
│   ├── <HermesNavTree />            ← Levels 1-2 (w-[260px], left)
│   ├── <HermesWorkspace />          ← Level 3 (flex-1, center)
│   └── <HermesInspector />          ← Level 4 (w-[280px], right)
│
├── <HermesEventFeed />              ← Level 5 (h-[160px], sticky bottom)
└── Overlay dialogs (builder wizard, approval modal)
```

### Keyboard Navigation Enhancements

| Shortcut | Action |
|----------|--------|
| `⌘1-7` | Switch to domain by number |
| `⌘B` | Toggle nav tree |
| `⌘I` | Toggle inspector |
| `⌘E` | Toggle event feed |
| `⌘K` | Command palette (search across all levels) |
| `⌘J` | Jump to object by name |
| `↑/↓` | Navigate tree objects |
| `Enter` | Select focused tree object |
| `Esc` | Clear selection / close inspector |

### Visual Design — Event Feed
- Background: `#070a0f` (darkest zone — recedes most)
- Top border: 1px solid `#2a3441`
- Event rows: `text-xs font-mono`
- Timestamp: `text-[#8a94a3]`
- Agent name: Role-colored
- Event type: Tier-colored badge (same as existing Hermes tier colors)
- Frontier events: `border-l-2 border-[#ffd60a]`
- Error events: `border-l-2 border-[#ef4444]`
- Auto-scroll: Latest events at bottom, auto-scrolls unless paused
- Custom scrollbar: Same as existing 6px style

### Key Files to Modify
- New: `src/components/hermes/hermes-event-feed.tsx`
- `src/components/agent/agent-studio.tsx` — Add event feed to bottom, restructure shell
- `src/store/hermes-store.ts` — Add feed state, filtering, cross-layer navigation actions
- `src/store/agent-store.ts` — Add cross-layer integration actions
- New: `src/hooks/use-keyboard-navigation.ts`
- `src/app/api/hermes/events/route.ts` — SSE endpoint for live event streaming

### Acceptance Criteria
- [ ] Event feed is always visible at the bottom (unless collapsed)
- [ ] Feed shows real-time events from the Hermes kernel spine
- [ ] Clicking an event in the feed navigates the tree + workspace + inspector
- [ ] Feed filters work (All, System, Agent, Execution, Security)
- [ ] Ribbon metric clicks navigate the tree correctly
- [ ] Tree object clicks update workspace + inspector + feed filter
- [ ] Workspace actions (Run, Stop, Edit) propagate to all other layers
- [ ] Inspector actions propagate to workspace + tree
- [ ] Keyboard shortcuts ⌘1-7, ⌘B, ⌘I, ⌘E, ⌘K all work
- [ ] Feed auto-scrolls to latest unless paused
- [ ] Collapsing feed leaves a single-line summary visible
- [ ] The complete 5-layer hierarchy renders with correct visual weight ordering
- [ ] No information is duplicated across layers — each layer adds context
- [ ] The information journey (Status → Domain → Object → Operation → Details → Events) feels natural and continuous

---

## Implementation Order & Dependencies

```
Phase 1: Global Status Ribbon
    ↓ (ribbon provides metric navigation targets)
Phase 2: Hierarchical Nav Tree
    ↓ (tree provides object selection that drives workspace)
Phase 3: Workspace & Inspector
    ↓ (workspace actions produce events for the feed)
Phase 4: Event Feed + Integration
```

Each phase builds on the previous, but individual components within each phase can be developed in parallel.

---

## Migration Strategy

### What Gets Replaced
| Current Component | Phase | New Component |
|-------------------|-------|---------------|
| Topbar (menubar + tabs) | 1 | GlobalStatusRibbon |
| AgentSidebar (flat list) | 2 | HermesNavTree |
| Module tab switching | 2 | Domain-driven workspace |
| AgentInspector (config form) | 3 | HermesInspector (contextual) |
| HermesEventStream (side panel) | 4 | HermesEventFeed (bottom panel) |

### What Gets Preserved
| Current Component | Phase | How It's Preserved |
|-------------------|-------|-------------------|
| React Flow agent canvas | 3 | Becomes AgentsDomain workspace view |
| HermesCausalGraph | 3 | Becomes ExecutionDomain workspace view |
| RoutingEngine | 3 | Becomes SecurityDomain or InfraDomain view |
| PipelineStudio | 3 | Becomes ExecutionDomain sub-view |
| AgentBuilderWizard | 3 | Remains as overlay dialog |
| ApprovalModal | 3 | Remains as overlay dialog |
| PolicyDashboard | 3 | Becomes SecurityDomain workspace view |

### Shared Infrastructure
- `agent-store.ts` evolves throughout — adding `activeDomain`, `selectedObjectId`, `workspaceView`, `feedState`
- `hermes-store.ts` evolves — adding domain projections, feed subscriptions, cross-layer actions
- All existing Hermes library code (`src/lib/hermes/`) remains untouched — the UI is a strict projection layer

---

## Design Tokens for Operator Hierarchy

```css
/* Visual Weight Zones — darkest/lightest indicates importance */
--ribbon-bg:     #070a0f;   /* Darkest — most important */
--tree-bg:       #0a0e14;   /* Dark */
--workspace-bg:  #05070a;   /* Main working area */
--inspector-bg:  #0a0e14;   /* Dark — recedes */
--feed-bg:       #070a0f;   /* Darkest — but least prominent visually */

/* Accent hierarchy */
--ribbon-accent: #ffd60a;   /* Electric yellow — highest alert */
--tree-accent:   #ffd60a;   /* Yellow for active domain/selection */
--workspace-accent: #00d1ff; /* Cyan for interactive elements */
--inspector-accent: #8a94a3; /* Muted — details don't shout */
--feed-accent:   #8a94a3;   /* Muted — events are reference, not action */

/* Typography weight by level */
--ribbon-text:   12px bold uppercase;   /* Commanding */
--tree-domain:   11px bold uppercase;   /* Structural */
--tree-object:   13px medium;           /* Navigational */
--workspace-title: 16px bold;           /* Operational */
--inspector-label: 10px uppercase;      /* Reference */
--feed-text:     12px mono;             /* Log-style */
```
