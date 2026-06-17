# Meridian Runtime — UI Architecture Plan
## "Command Center, Not Dashboard"

---

## Codename: Meridian Runtime

> The line that divides pre-action from post-action. The line of engagement. The meridian between intent and outcome.

---

## Design Philosophy

**Not a dashboard. A command center.**

The operator should know the state of every system in under 1 second — not by reading, but by *seeing*. Shape, position, color, motion — the UI speaks in graphics before it speaks in text.

**Core Principles:**
1. **Graphical-first** — Data density through shape, color, motion. Text is secondary.
2. **Widget architecture** — Everything is a container. No drawers. No hidden panels. No canvas paradigm.
3. **Top-down hierarchy** — Most critical information is highest and leftmost.
4. **Line of Engagement** — The vertical meridian dividing pre-action (intent) from post-action (outcome).
5. **Transparent depth** — Glass containers over a living starfield. Depth without weight.
6. **Modular expansion** — Every widget is a standard container. Users add, remove, resize, reconfigure.

**View Modes** (every widget supports all four):
```
Container  → Small square in the grid (default)
Expanded   → Takes the globe module's space
Floating   → Draggable window overlay
Fullscreen → Displaces everything
```

---

## Target Layout — Asymmetric Command Center

```
┌─ FILE ─ EDIT ─ VIEW ─ HELP ─ ABOUT ──────── 🔍 SEARCH / CHAT / ASK ────────┐
├──────────┬──────────┬──────────┬──────────────────────────────────────────────┤
│ AGENTS   │ PROVIDER │ NETWORK  │                                              │
│ [live]   │ [cfg]    │ [tailsc] │            ╭─────────────╰                  │
├──────────┼──────────┼──────────┤        PRE │  ╲  Planning  ╱                │
│ SKILLS   │ MEMORY   │ TIMELINE │  ACTION    │   ─ ─ ─ ─ ─ ─ ─ ─ ─         │
│ [live]   │ [live]   │ [gantt]  │    ZONE    │   ─ LINE OF  ─ ─ ─ ─         │
├──────────┼──────────┼──────────┤            │   ─ ENGAGE-  ─ ─ ─ ─         │
│ WORKFLOW │ HEATMAP  │ FILE     │  POST      │   ─ MENT ─ ─ ─ ─ ─ ─         │
│ [design] │ [dense]  │ [explr]  │  ACTION    │  ╱  Telemetry ╲               │
├──────────┼──────────┼──────────┤        ZONE │  ╲  Logs     ╱                │
│ CHAT     │ IMAGE    │ CLOCK    │            ╰─────────────╯                  │
│ [agent]  │ [view]   │ [analog] │           GLOBE MODULE                     │
├──────────┴──────────┴──────────┼──────────────────────────────────────────────┤
│ WORKFLOW  │ AAR      │ EXPENSE │ TELEMETRY LOG ── scrolling ── live ──────  │
│ [replay]  │ [report] │ [cost]  │ [14:32:01] Kernel accepted evt_a3f2       │
└──────────┴──────────┴─────────┴──────────────────────────────────────────────┘
```

### Layout Breakdown

| Zone | Position | Content | Size |
|------|----------|---------|------|
| Menu Bar | Top (h-10) | File, Edit, View, Help, About + Search/Chat | Full width |
| Left Grid | Left (3 cols) | 9 sub-modules in 3×3 arrangement | ~300px wide |
| Globe | Right-center | Main operational sphere | ~500-600px |
| Right of Globe | Far right | 0-2 sub-modules (if any) | ~150px |
| Bottom Grid | Bottom-left (3 cols) | 3 sub-modules | ~300px wide |
| Telemetry Bar | Bottom (h-8) | Scrolling status text | Full width |

**Total sub-modules: ~15-18** (9 left + 3 bottom + 3 right-of-globe area + globe internals)

---

## The Globe Module — Core Visual Element

### Structure

```
          ╭─────────────────╮
         ╱                   ╲
        │  PRE-ACTION ZONE    │
        │                     │
        │  ◉ Planning         │
        │  ◉ Specifications   │
        │  ◉ Project Timeline │
        │  ◉ Skills           │
        │  ◉ Agent Creation   │
        │  ◉ Workflow Design  │
        │  ◉ Workflow Sim     │
        │─────────────────────│ ← LINE OF ENGAGEMENT (vertical center line)
        │  ◉ Telemetry Logs   │
        │  ◉ Usage Stats      │
        │  ◉ Expenses         │
        │  ◉ Workflow Replay  │
        │  ◉ After Action Rpt │
        │  ◉ Logs             │
        │  POST-ACTION ZONE   │
         ╲                   ╱
          ╰─────────────────╯
```

### Visual Design
- **Shape**: Circle (or slightly oblong for workflow views), encased in a square container (no rounded edges on the container)
- **Container**: Square with sharp corners, thin border (`1px solid rgba(0,209,255,0.3)`)
- **Globe interior**: Circular, transparent fill (`bg-[rgba(5,7,10,0.6)]`)
- **Line of Engagement**: Vertical center line, `1px solid rgba(255,214,10,0.5)` with subtle pulse
- **Pre-action items**: Left side, cyan-tinted icons, hover reveals detail
- **Post-action items**: Right side, amber-tinted icons, hover reveals detail
- **Active node**: Glowing border, `box-shadow: 0 0 12px rgba(0,209,255,0.4)`
- **Workflow view**: Globe morphs to oblong, showing agent nodes as live processes with connecting edges

### Interaction
- **Hover** on any item → Status bar at bottom updates with name + info
- **Click** on pre-action item → Opens as floating window for configuration
- **Click** on post-action item → Expands into the globe space showing detailed data
- **Double-click** → Goes fullscreen
- **Drag** an item → Reposition within the globe or extract to floating window

---

## Starfield Background

### Implementation
- **Engine**: tsparticles (lightweight, non-GPU-intensive canvas renderer)
- **Base layer**: Slow-drifting starfield (~100-150 particles), near-static
- **Shooting stars**: Intermittent streaks (every 8-15 seconds), with particle burst on fade
- **Color**: White/blue-white stars, cyan-tinted streaks
- **Opacity**: Very low — `0.3-0.5` for stars, `0.6-0.8` for streaks
- **Performance**: `fps_limit: 30`, `detectRetina: false`, pause when tab is hidden
- **Z-index**: Behind all containers (`z-0`)
- **Container interaction**: None — purely aesthetic depth layer

### Configuration
- User can adjust: star density, streak frequency, color tint, speed
- "Performance mode" toggle: reduces to 50 particles, no streaks
- "Cinematic mode": increases density, adds nebula blobs

---

## Widget Container System

### Standard Container
```
┌─ TITLE ─────── [□] [━] [✕] ─┐
│                               │
│   CONTENT AREA                │
│   (widget-specific)           │
│                               │
│   ┌─ mini detail ──────────┐ │
│   │ 12 agents │ 3 active   │ │
│   └────────────────────────┘ │
└───────────────────────────────┘
```

### Container Specification
- **Border**: `1px solid rgba(0,209,255,0.25)` — thin, translucent cyan
- **Background**: `rgba(5,7,10,0.7)` — translucent dark, starfield shows through
- **Title bar**: 24px, `text-[10px] uppercase tracking-wider text-[#8a94a3]`
- **Controls**: Expand (□), Float (━), Close (✕) — 16px icons
- **Corners**: Sharp (0 radius) — command center aesthetic
- **Shadow**: None — transparency provides depth
- **Hover**: Border brightens to `rgba(0,209,255,0.5)`, subtle glow
- **Active/Selected**: Border becomes `rgba(255,214,10,0.6)`, yellow glow

### View Mode Transitions
```
Container → Expanded:    Widget scales up, takes globe space (animated, 300ms)
Container → Floating:    Widget detaches, becomes draggable overlay (300ms)
Expanded  → Container:   Widget shrinks back to grid position (300ms)
Any       → Fullscreen:  Widget fills viewport, others minimize (200ms)
```

---

## Sub-Module Catalog (15-18 widgets)

### Left Column — 3×3 Grid (9 widgets)

| # | Widget | Data Source | Visual |
|---|--------|-------------|--------|
| 1 | **Agents** | `agent-store.agents` | Live agent list with status dots |
| 2 | **Provider Config** | New: provider registry | Model/provider tiles with status |
| 3 | **Network** | Tailscale API | Network topology mini-map |
| 4 | **Skills** | `agent-store` tools | Skill registry with usage counts |
| 5 | **Memory** | `memory-v2.ts` | Memory heat graph |
| 6 | **Timeline** | Hermes events | Compact Gantt/sparkline |
| 7 | **Workflow Design** | Task graphs | Mini workflow editor |
| 8 | **Heatmap** | System metrics | Color-density activity map |
| 9 | **File Explorer** | Artifacts/files | Tree browser with icons |

### Bottom Row — 1×3 Grid (3 widgets)

| # | Widget | Data Source | Visual |
|---|--------|-------------|--------|
| 10 | **Workflow Replay** | Past runs | Step-through replay |
| 11 | **After Action Report** | HQA queries | Report summary cards |
| 12 | **Expenses** | Cost tracking | Cost counter + breakdown |

### Right of Globe — 2 widgets

| # | Widget | Data Source | Visual |
|---|--------|-------------|--------|
| 13 | **Chat** | LLM conversations | Agent chat interface |
| 14 | **Image View** | Generated images | Gallery/thumbnail view |

### Below Left Grid / Utility Row — 3 widgets

| # | Widget | Data Source | Visual |
|---|--------|-------------|--------|
| 15 | **Analog Clock** | System time | SVG analog clock face |
| 16 | **Google Drive** | File integration | Folder browser |
| 17 | **Workflow Studio** | Full editor | Expanded workflow canvas |

### Globe Internal Widgets (not counted separately — accessed via globe)

- Planning, Specifications, Project Timeline, Agent Creation
- Workflow Simulation, Telemetry Logs, Usage Stats, Logs

---

## Provider Integration Architecture

### Supported Providers (Phase 4)

```
┌─ PROVIDER REGISTRY ─────────────────────────┐
│                                               │
│  ● OpenAI        ── GPT-4o, o1, o3-mini     │
│  ● Anthropic     ── Claude 3.5, Claude 4     │
│  ● OpenCode      ── Local inference           │
│  ● Kilo Code     ── Code-specialized          │
│  ● Kiro-Cli      ── CLI agent runtime         │
│  ● Crush         ── High-throughput           │
│  ● Antigravity   ── Google CLI agent          │
│  ● Custom        ── User-defined endpoint     │
│                                               │
│  [ + Add Provider ]                           │
└───────────────────────────────────────────────┘
```

### Provider Data Model
```typescript
interface ProviderConfig {
  id: string
  name: string
  type: 'openai' | 'anthropic' | 'opencode' | 'kilo' | 'kiro' | 'crush' | 'antigravity' | 'custom'
  endpoint?: string
  apiKey?: string          // encrypted at rest
  models: ModelConfig[]
  status: 'connected' | 'disconnected' | 'error'
  latencyMs?: number
  costPer1kTokens?: number
  tailscaleHost?: string  // if accessed via Tailscale
}

interface ModelConfig {
  id: string
  name: string
  contextWindow: number
  inputCostPer1k?: number
  outputCostPer1k?: number
  capabilities: string[]  // 'chat', 'code', 'vision', 'tools'
}
```

### Tailscale Integration
- SSH connectivity via Tailscale network
- Provider endpoints accessible through Tailscale tunneling
- Network widget shows Tailscale peer status
- SSH login for remote Meridian instances

---

## Phase Plan

### Phase 1: Foundation Shell & Starfield
**Duration**: Core infrastructure

**Delivers**:
- Starfield background (tsparticles) — living depth layer
- Menu bar (File, Edit, View, Help, About)
- Search/Chat/Ask top bar
- Grid layout system (asymmetric: 3-col left, globe right, bottom row)
- Widget container component (with 4 view modes)
- Telemetry scrolling bar at bottom
- Rename project to "Meridian Runtime"

**Key New Components**:
- `MeridianShell` — Root layout replacing AgentStudio
- `StarfieldBackground` — tsparticles canvas layer
- `MenuBar` — Top menu with dropdowns
- `SearchBar` — Search/Chat/Ask input
- `WidgetContainer` — Standard widget wrapper with view mode controls
- `TelemetryBar` — Bottom scrolling status
- `WidgetGrid` — CSS Grid layout manager for asymmetric arrangement

**Key Files**:
- `src/app/page.tsx` — Replace AgentStudio with MeridianShell
- `src/app/globals.css` — New transparent/glass theme
- `src/app/layout.tsx` — Update title to "Meridian Runtime"
- New: `src/components/meridian/meridian-shell.tsx`
- New: `src/components/meridian/starfield-background.tsx`
- New: `src/components/meridian/menu-bar.tsx`
- New: `src/components/meridian/search-bar.tsx`
- New: `src/components/meridian/widget-container.tsx`
- New: `src/components/meridian/telemetry-bar.tsx`
- New: `src/components/meridian/widget-grid.tsx`
- New: `src/store/meridian-store.ts` — Widget layout, view modes, status

**Acceptance Criteria**:
- [ ] Starfield renders behind all content with intermittent shooting stars
- [ ] Menu bar has File, Edit, View, Help, About with dropdown menus
- [ ] Search bar accepts input (chat functionality can be stub)
- [ ] Grid layout positions: 3-col left, globe placeholder right, bottom row
- [ ] WidgetContainer renders with thin translucent borders, starfield visible through
- [ ] Hover on any widget → telemetry bar shows widget name + summary
- [ ] WidgetContainer supports: Container, Expanded, Floating, Fullscreen modes
- [ ] Telemetry bar scrolls status text at bottom, always visible
- [ ] Page title and branding say "Meridian Runtime"
- [ ] No drawers, no hidden panels — everything visible in the grid

---

### Phase 2: The Globe Module & Pre/Post Action Zones
**Duration**: Core visual element

**Delivers**:
- Globe module — large circular display in square container
- Line of Engagement — vertical center line dividing pre/post action
- Pre-action zone (left): Planning, Specs, Timeline, Skills, Agents, Workflow Design, Workflow Sim, Chat, File Explorer, Image Explorer
- Post-action zone (right): Telemetry, Usage Stats, Expenses, Workflow Replay, AAR, Logs
- Interaction: hover reveals, click to expand, double-click for fullscreen
- Workflow oblong view — when viewing a workflow, globe morphs to show agent nodes as live processes

**Key New Components**:
- `GlobeModule` — Main circular display
- `LineOfEngagement` — Animated center line
- `GlobeNode` — Clickable item within globe (pre/post action)
- `WorkflowSphere` — Oblong workflow view with live process nodes

**Key Files**:
- New: `src/components/meridian/globe-module.tsx`
- New: `src/components/meridian/line-of-engagement.tsx`
- New: `src/components/meridian/globe-node.tsx`
- New: `src/components/meridian/workflow-sphere.tsx`
- `src/store/meridian-store.ts` — Add globe state, selected zone, active items

**Acceptance Criteria**:
- [ ] Globe renders as circle inside square sharp-cornered container
- [ ] Line of Engagement is a visible vertical center line with subtle animation
- [ ] Pre-action items appear on the left side of the line
- [ ] Post-action items appear on the right side of the line
- [ ] Hovering an item updates the telemetry bar with name + info
- [ ] Clicking a pre-action item opens a floating window for configuration
- [ ] Clicking a post-action item expands detailed data into the globe
- [ ] Double-clicking any item goes fullscreen
- [ ] Workflow view morphs globe to oblong shape with process nodes
- [ ] Globe is aligned right in the layout, not centered
- [ ] Globe has highest visual weight among all widgets

---

### Phase 3: Data-Dense Sub-Module Widgets
**Duration**: All 15-18 widgets with real data

**Delivers**:
- All sub-module widgets populated with live data from existing stores + new data sources
- Each widget is data-dense — maximum information in minimum space
- Heatmap, sparklines, mini-charts, status indicators
- Real-time updates via Zustand subscriptions
- Widget-specific interactions (click to drill down, hover for detail)

**Widget Implementation Order** (by data availability):

**Round 1** — Existing data sources (immediate):
1. Agents (agent-store)
2. Skills (agent-store tools)
3. Memory (memory-v2)
4. Timeline (Hermes events)
5. Expenses (system metrics)

**Round 2** — Hermes integration:
6. Heatmap (system metrics, computed)
7. Workflow Replay (past runs)
8. After Action Report (HQA queries)
9. Chat (LLM conversations)
10. File Explorer (artifacts)

**Round 3** — New data sources:
11. Provider Config (new provider registry)
12. Network/Tailscale (new integration)
13. Image View (generated images)
14. Analog Clock (system time, SVG)
15. Google Drive (file integration)
16. Workflow Studio (full editor)
17. Workflow Design (mini editor)

**Key New Components**:
- One component per widget in `src/components/meridian/widgets/`
- Each widget follows the WidgetContainer standard

**Key Files**:
- New: `src/components/meridian/widgets/agents-widget.tsx`
- New: `src/components/meridian/widgets/provider-widget.tsx`
- New: `src/components/meridian/widgets/network-widget.tsx`
- New: `src/components/meridian/widgets/skills-widget.tsx`
- New: `src/components/meridian/widgets/memory-widget.tsx`
- New: `src/components/meridian/widgets/timeline-widget.tsx`
- New: `src/components/meridian/widgets/workflow-design-widget.tsx`
- New: `src/components/meridian/widgets/heatmap-widget.tsx`
- New: `src/components/meridian/widgets/file-explorer-widget.tsx`
- New: `src/components/meridian/widgets/chat-widget.tsx`
- New: `src/components/meridian/widgets/image-view-widget.tsx`
- New: `src/components/meridian/widgets/clock-widget.tsx`
- New: `src/components/meridian/widgets/google-drive-widget.tsx`
- New: `src/components/meridian/widgets/workflow-studio-widget.tsx`
- New: `src/components/meridian/widgets/workflow-replay-widget.tsx`
- New: `src/components/meridian/widgets/aar-widget.tsx`
- New: `src/components/meridian/widgets/expenses-widget.tsx`
- `src/store/meridian-store.ts` — Add widget registry, layout config, data subscriptions
- New: `src/lib/meridian/widget-registry.ts` — Widget type definitions and registration

**Acceptance Criteria**:
- [ ] All 15-17 widgets render in their grid positions
- [ ] Each widget displays real data from its source (no stubs)
- [ ] Heatmap shows color-density activity across system dimensions
- [ ] Agents widget shows live agent list with status dots
- [ ] Expenses widget shows running cost counter
- [ ] Timeline widget shows compact Gantt or sparkline
- [ ] Hover on any widget updates telemetry bar
- [ ] Each widget can be expanded, floated, or fullscreened
- [ ] Widgets update in real-time when underlying data changes
- [ ] Data density is maximized — no empty space in widgets

---

### Phase 4: Provider Integration, Infrastructure & Configurable Design
**Duration**: Deep infrastructure

**Delivers**:
- Provider registry with all 7+ providers (OpenAI, Anthropic, OpenCode, Kilo Code, Kiro-Cli, Crush, Antigravity)
- Tailscale integration for network connectivity and SSH
- SSH login capability
- Provider configuration floating windows
- Model selection per agent
- Inference configuration
- Widget layout persistence (user can rearrange and save)
- Design configuration: outline weight, 3D shapes, custom SVG icons, performance modes
- Cross-widget integration (click agent in Agents widget → globe highlights that agent)
- Search/Chat bar connected to LLM via z-ai-web-dev-sdk

**Key New Components**:
- `ProviderRegistry` — Provider management system
- `ProviderConfigWindow` — Floating config window for providers
- `TailscaleStatus` — Network connectivity widget enhancement
- `SSHLogin` — Authentication flow
- `LayoutManager` — Drag-and-drop widget arrangement
- `DesignConfigurator` — UI customization panel (outline weight, 3D, performance mode)

**Key Files**:
- New: `src/lib/meridian/provider-registry.ts` — Provider type definitions
- New: `src/app/api/meridian/provider/route.ts` — Provider CRUD
- New: `src/app/api/meridian/ssh/route.ts` — SSH connectivity
- New: `src/app/api/meridian/tailscale/route.ts` — Tailscale status
- New: `src/components/meridian/provider-config-window.tsx`
- New: `src/components/meridian/ssh-login.tsx`
- New: `src/components/meridian/layout-manager.tsx`
- New: `src/components/meridian/design-configurator.tsx`
- `prisma/schema.prisma` — Add ProviderConfig, WidgetLayout models
- `src/store/meridian-store.ts` — Add provider state, layout persistence, design config

**Acceptance Criteria**:
- [ ] At least 3 providers configurable (OpenAI, Anthropic, Custom)
- [ ] Provider config opens in floating window
- [ ] Model selection works per-agent
- [ ] Tailscale network status shows in Network widget
- [ ] SSH login flow works (even if mock for now)
- [ ] Widget layout persists across page reloads
- [ ] Users can drag widgets to rearrange
- [ ] Design configurator allows: outline weight, performance mode, star density
- [ ] Search/Chat bar connects to LLM and returns responses
- [ ] Clicking an agent in the Agents widget highlights it in the Globe
- [ ] Provider registry is expandable (custom endpoints work)

---

## Design Tokens — Meridian Runtime

```css
/* Background depth layers */
--starfield-bg:        #020408;    /* Deepest space */
--container-bg:        rgba(5,7,10,0.7);   /* Translucent dark */
--container-bg-hover:  rgba(5,7,10,0.85);  /* Less translucent on hover */
--globe-bg:            rgba(5,7,10,0.6);   /* Globe interior */

/* Borders — thin, translucent, colored */
--border-default:      1px solid rgba(0,209,255,0.25);   /* Cyan whisper */
--border-hover:        1px solid rgba(0,209,255,0.5);    /* Cyan focus */
--border-active:       1px solid rgba(255,214,10,0.6);   /* Yellow engagement */
--border-engagement:   1px solid rgba(255,214,10,0.5);   /* Line of Engagement */

/* Accent colors */
--accent-cyan:         #00d1ff;    /* Primary accent — interaction */
--accent-yellow:       #ffd60a;    /* Engagement line — attention */
--accent-green:        #22c55e;    /* Active/healthy status */
--accent-red:          #ef4444;    /* Error/alert status */
--accent-amber:        #f59e0b;    /* Post-action zone tint */

/* Typography — minimal, reference-grade */
--text-primary:        #d7dde5;    /* Readable */
--text-secondary:      #8a94a3;    /* Structural */
--text-tertiary:       #4a5568;    /* De-emphasized */
--text-widget-title:   10px uppercase tracking-wider;  /* Widget headers */
--text-widget-body:    12px mono;  /* Widget data */
--text-telemetry:      11px mono;  /* Status bar */

/* Spacing — tight, command-center density */
--widget-gap:          4px;        /* Minimal gap between widgets */
--widget-padding:      8px;        /* Internal padding */
--grid-col-width:      ~160px;     /* Small widget column */
--globe-size:          ~500px;     /* Main module diameter */

/* Animation — subtle, purposeful */
--pulse-frontier:      2s ease-in-out infinite;
--star-drift:          60s linear infinite;
--streak-interval:     8-15s;
--widget-transition:   300ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Technical Architecture

### Starfield Engine
```
tsparticles
├── Base: ~120 white/blue-white particles, speed: 0.3, opacity: 0.3-0.5
├── Shooting Stars: Custom emitter, interval: 8-15s, trail length: 40px
├── Burst: On streak end, 8-12 particles explode outward then fade
├── Performance: fps_limit=30, pauseOnHide=true, fullScreen={zIndex: -1}
└── Config: Stored in meridian-store, user-adjustable
```

### Widget Layout Engine
```
CSS Grid (asymmetric)
├── Template:
│   "menu    menu    menu    menu    menu"     auto
│   "search  search  search  search  search"   40px
│   "w1      w2      w3      globe   globe"   1fr
│   "w4      w5      w6      globe   globe"   1fr
│   "w7      w8      w9      globe   globe"   1fr
│   "w10     w11     w12     w13     w14"      auto
│   "tele    tele    tele    tele    tele"     32px
│
├── Columns: 160px 160px 160px 1fr 1fr
├── Gap: 4px
└── Responsive: On mobile, stack vertically, globe on top
```

### Widget View Mode System
```
WidgetContainer
├── mode: 'container' → Render in grid cell, fixed size
├── mode: 'expanded'  → Absolute position, takes globe grid area
├── mode: 'floating'  → Absolute position, draggable, user-positioned
├── mode: 'fullscreen'→ Fixed position, z-50, covers all
│
├── Transitions: framer-motion layoutId for smooth morphing
├── State: meridian-store.widgetStates[widgetId]
└── Persistence: Layout saved to localStorage + optionally to DB
```

### Provider System
```
ProviderRegistry (singleton)
├── providers: Map<string, ProviderConfig>
├── registerProvider(config) → validates, stores, tests connection
├── getProvider(id) → returns config
├── testConnection(id) → pings endpoint, measures latency
├── listModels(id) → fetches available models
└── routeRequest(agentId, prompt) → selects provider based on agent config
```

### Data Flow
```
Hermes Kernel Spine
  ↓ (events)
MeridianStore.updateFromEvent()
  ↓ (Zustand)
Widget subscriptions → re-render with new data
  ↓ (user interaction)
SearchBar / GlobeNode / Widget → API routes → z-ai-web-dev-sdk / Prisma
  ↓ (response)
MeridianStore.update() → widgets re-render
  ↓ (telemetry)
TelemetryBar.pushStatus(message) → scrolling display
```

---

## Migration from Current UI

### What Gets Replaced
| Current | Phase | New |
|---------|-------|-----|
| `AgentStudio` shell | 1 | `MeridianShell` |
| Topbar + Menubar | 1 | `MenuBar` + `SearchBar` |
| `AgentSidebar` (flat list) | 3 | `AgentsWidget` (grid widget) |
| `AgentCanvas` (React Flow) | 2 | `WorkflowSphere` (inside Globe) |
| `AgentInspector` (form panel) | 3 | Floating config windows |
| `HermesModule` (3-panel) | 2 | `GlobeModule` (pre/post action) |
| `HermesEventStream` (side panel) | 3 | `TelemetryBar` (bottom) + Timeline widget |
| `HermesCausalGraph` | 2 | Inside Globe's execution zone |
| `PipelineStudio` | 3 | `WorkflowStudioWidget` (expandable) |
| `RoutingEngine` | 3 | Inside Provider widget |

### What Gets Preserved
| Current | How |
|---------|-----|
| All Hermes library code (`src/lib/hermes/`) | Untouched — UI is a projection layer |
| All agent orchestration (`src/lib/agent/`) | Untouched — powers the backend |
| All API routes | Untouched — same data sources |
| Prisma schema | Extended, not replaced |
| Zustand stores | Evolved — `meridian-store.ts` adds widget/layout state |
| z-ai-web-dev-sdk | Still the ONLY LLM interface |
