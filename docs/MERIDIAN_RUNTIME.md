# Meridian Runtime

## Event-Driven Command Center for Agentic Workflows

---

### Philosophy

Meridian Runtime is built on a foundational principle: **business objectives are the primary concern**. Workflows are created by policy and process design. From process design and policy comes formal workflow. From workflow, tasks. From tasks, agents -- skilled at certain aspects of projects.

**Agents are an emergent property of a strict and solid foundational plane.**

This separation ensures that no agent can be blamed for a human-in-the-loop failure. The data that the user needs to make the right decisions is always visible, always contextual, always traceable.

---

### Architecture

```
Business Objectives
        |
    Workflows
        |
      Tasks
        |
    Agents (emergent)
```

The Meridian UI enforces this hierarchy through visual weight:

1. **Top** -- Awareness (system status, metrics)
2. **Left** -- Structure (navigation, data modules)
3. **Right** -- Operation (globe module, engagement line)
4. **Bottom** -- History (telemetry, event feed)

---

### UI Layout

```
┌─ FILE ─ EDIT ─ VIEW ─ HELP ─ ABOUT ──── SEARCH / CHAT / ASK ────┐
├──────────┬──────────┬──────────┬──────────┬──────────┬───────────┤
│ AGENTS   │INFERENCE │ NETWORK  │ CLOCK    │ DRIVE    │ CANVAS    │
├──────────┼──────────┼──────────┼──────────┤──────────┴───────────┤
│ SKILLS   │ MEMORY   │ TIMELINE │                              │
├──────────┼──────────┼──────────┤    OPERATIONAL SPHERE         │
│ WORKFLOW │ HEATMAP  │ FILES    │   PRE ◄── ENGAGEMENT ──► POST │
├──────────┼──────────┼──────────┤                              │
│ META AGT │ COMM     │ MEDIA    │                              │
├──────────┼──────────┼──────────┤                              │
│ REPLAY   │ AAR      │ ROI      │                              │
├──────────┴──────────┴──────────┴──────────────────────────────┤
│ TELEMETRY ── live scrolling status ── KERNEL ── 3.2 evt/s ──  │
└────────────────────────────────────────────────────────────────┘
```

---

### Component Architecture

#### Core Shell
| Component | Path | Purpose |
|-----------|------|---------|
| `MeridianShell` | `src/components/meridian/meridian-shell.tsx` | Root layout, assembles all zones |
| `StarfieldBackground` | `src/components/meridian/starfield-background.tsx` | Canvas starfield with twinkling and shooting stars |
| `MenuBar` | `src/components/meridian/menu-bar.tsx` | Top menu (File, Edit, View, Help, About) + kernel status |
| `SearchBar` | `src/components/meridian/search-bar.tsx` | Search/chat input + status pills |
| `TelemetryBar` | `src/components/meridian/telemetry-bar.tsx` | Bottom scrolling telemetry feed |
| `GlobeModule` | `src/components/meridian/globe-module.tsx` | Operational sphere with Line of Engagement |
| `WidgetContainer` | `src/components/meridian/widget-container.tsx` | Standard widget wrapper (4 view modes) |
| `ChatPanel` | `src/components/meridian/chat-panel.tsx` | Floating chat interface overlay |

#### Widget Modules (18)
| Widget | Path | Data Shown |
|--------|------|------------|
| Agents | `widgets/agents-widget.tsx` | 8 agents with status and roles |
| Inference | `widgets/provider-widget.tsx` | 7 AI providers with connection status |
| Network | `widgets/network-widget.tsx` | 6 Tailscale peers with latency |
| Skills | `widgets/skills-widget.tsx` | 6 skills with call counts |
| Memory | `widgets/memory-widget.tsx` | Short-term, long-term, artifacts |
| Timeline | `widgets/timeline-widget.tsx` | Last 6 telemetry events |
| Workflow | `widgets/workflow-design-widget.tsx` | Active workflow phases and tasks |
| Heatmap | `widgets/heatmap-widget.tsx` | 5x7 activity density grid |
| Files | `widgets/file-explorer-widget.tsx` | File browser with type icons |
| Meta Agents | `widgets/meta-agents-widget.tsx` | 3 evaluators with alignment |
| Comm | `widgets/chat-widget.tsx` | Message feed |
| Media | `widgets/images-widget.tsx` | Image gallery |
| Replay | `widgets/workflow-replay-widget.tsx` | Step-through replay controls |
| AAR | `widgets/aar-widget.tsx` | After Action Report |
| ROI | `widgets/expenses-widget.tsx` | Cost/return analysis |
| Drive | `widgets/gdrive-widget.tsx` | Google Drive integration |
| Canvas | `widgets/canvas-widget.tsx` | Resource attachments |
| Clock | `src/components/meridian/clock-widget.tsx` | Analog SVG clock |

#### State Management
| Store | Path | Purpose |
|-------|------|---------|
| `meridian-store` | `src/store/meridian-store.ts` | All Meridian UI state: widgets, globe, chat, telemetry, providers, workflows, ROI |

---

### Widget View Modes

Every widget supports 4 view modes:

| Mode | Description | Trigger |
|------|-------------|---------|
| **Container** | Small pane in the grid (default) | Default state |
| **Expanded** | Takes the globe module's space | Click expand button |
| **Floating** | Draggable overlay window | Click float button |
| **Fullscreen** | Displaces everything | Click fullscreen button |

Transitions use framer-motion with 300ms cubic-bezier easing.

---

### The Line of Engagement

The central vertical divider in the Globe Module represents the meridian between intent and outcome:

- **Pre-Action** (left): Planning, Specifications, Timeline, Skills, Agent Creation, Workflow Design, Workflow Simulation, Interaction, File Explorer
- **Post-Action** (right): Telemetry, Usage Stats, Expenses, Workflow Replay, AAR, Logs

The line pulses with an amber glow (2.5s cycle) to indicate the system is alive and processing.

---

### Meta Agents

Three meta agents evaluate workflows for task focus and present differing opinions to the human operator:

| Agent | Role | Purpose |
|-------|------|---------|
| **Evaluator** | Assesses workflow alignment | Reports objective focus percentage |
| **Challenger** | Identifies resource concentration risks | Proposes redistribution alternatives |
| **Synthesizer** | Finds consensus | Presents actionable summary to human |

The human is always the final decision-maker. No automated action is taken without human review.

---

### Starfield Background

Custom canvas-based particle system:
- ~150 twinkling stars with sine-wave opacity variation
- Shooting stars every 8-15 seconds with gradient trails
- Particle burst on shooting star termination
- 30 FPS cap for performance
- Transparent widget panes allow starfield visibility

---

### Color System

| Token | Value | Purpose |
|-------|-------|---------|
| Background | `#030508` | Deepest space |
| Pane bg | `rgba(6,10,18,0.78)` | Translucent widget fill |
| Border | `rgba(0,180,220,0.18)` | Thin cyan outline |
| Primary | `#00b4dc` | Interactive accent (cyan) |
| Engagement | `#ffa500` | Line of Engagement (amber) |
| Active | `#00ff88` | Healthy/active status (green) |
| Error | `#ff3344` | Alert status (red) |
| Text primary | `#c8d0dc` | Readable content |
| Text secondary | `#5a6578` | Structural labels |
| Text muted | `#2a3441` | De-emphasized reference |

---

### Provider Integration

Supported inference providers (configurable):

| Provider | Status | Models |
|----------|--------|--------|
| OpenAI | Connected | GPT-4o, o1 |
| Anthropic | Connected | Claude 3.5 Sonnet |
| OpenCode | Disconnected | -- |
| Kilo Code | Disconnected | -- |
| Kiro-Cli | Disconnected | -- |
| Crush | Disconnected | -- |
| Antigravity CLI | Disconnected | -- |

Provider registry is expandable -- custom endpoints can be added.

---

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 with App Router |
| Language | TypeScript 5 |
| State | Zustand |
| Animation | Framer Motion |
| Canvas | Custom HTML5 Canvas API (starfield) |
| Icons | Lucide React + custom SVG |
| UI Primitives | shadcn/ui (Radix) |
| Styling | Tailwind CSS 4 |
| AI SDK | z-ai-web-dev-sdk |
| Database | Prisma ORM (SQLite) |

---

### Backend Architecture

The Hermes Causal DAG engine (`src/lib/hermes/`) powers the event-driven kernel:

```
Hermes Kernel Spine
  |
  +-- Event DSL (compile-time topology enforcement)
  +-- Causal Core Lock (type-system firewall)
  +-- Event Store (append-only log)
  +-- Reducer (canonical state interpretation)
  +-- Frontier Solver (what happens next)
  +-- HQA (Hermes Query Algebra)
  +-- UI Topology (strict projection layer)
```

The Meridian UI is a **strict projection** of the Hermes kernel. It does not mutate state -- it renders the causal graph as a visual command center.

---

### Key Principles

1. **Awareness before interaction** -- The operator knows system health in under 1 second
2. **Business objectives first** -- ROI, workflow alignment, and task focus are the primary data
3. **Agents are emergent** -- They emerge from workflows, not the other way around
4. **Human in the loop** -- No automated action without human review
5. **No agent blaming** -- Separation of concerns ensures accountability is clear
6. **Data density** -- Maximum information, minimum space
7. **Top-down hierarchy** -- Most critical information is highest and leftmost
8. **Event sourcing** -- The Event Log is truth; the UI is projection

---

### File Structure

```
src/
  app/
    page.tsx                          -- MeridianShell entry point
    layout.tsx                        -- Root layout (IBM Plex Mono, dark)
    globals.css                       -- Meridian command center theme
  components/
    meridian/
      meridian-shell.tsx              -- Main layout shell
      starfield-background.tsx        -- Canvas starfield
      menu-bar.tsx                    -- Top menu
      search-bar.tsx                  -- Search/chat input
      telemetry-bar.tsx               -- Bottom telemetry
      globe-module.tsx                -- Operational sphere
      widget-container.tsx            -- Standard widget wrapper
      chat-panel.tsx                  -- Floating chat overlay
      clock-widget.tsx                -- Analog SVG clock
      widgets/
        agents-widget.tsx
        provider-widget.tsx
        network-widget.tsx
        skills-widget.tsx
        memory-widget.tsx
        timeline-widget.tsx
        workflow-design-widget.tsx
        heatmap-widget.tsx
        file-explorer-widget.tsx
        meta-agents-widget.tsx
        chat-widget.tsx
        images-widget.tsx
        workflow-replay-widget.tsx
        aar-widget.tsx
        expenses-widget.tsx
        gdrive-widget.tsx
        canvas-widget.tsx
  store/
    meridian-store.ts                 -- Meridian UI state
    agent-store.ts                    -- Agent management (legacy)
    hermes-store.ts                   -- Hermes causal engine state
  lib/
    hermes/                           -- Hermes Causal DAG engine
      kernel-spine/                   -- Single deterministic transition loop
      causal-core-lock/               -- Type-system firewall
      event-dsl/                      -- Compile-time topology enforcement
      frontier/                       -- Causal Frontier Solver
      hqa/                            -- Hermes Query Algebra
      ui-topology/                    -- Strict projection layer
      test-harness/                   -- Formal verification
    agent/                            -- Agent orchestration
    db.ts                             -- Prisma client
    utils.ts                          -- Utilities
