import { create } from 'zustand'

// ─── Widget View Modes ───────────────────────────────────────────
export type ViewMode = 'container' | 'expanded' | 'floating' | 'fullscreen'

export interface WidgetState {
  id: string
  title: string
  viewMode: ViewMode
  position?: { x: number; y: number }
  size?: { w: number; h: number }
  isHovered: boolean
  isActive: boolean
}

// ─── Globe Module ────────────────────────────────────────────────
export type GlobeZone = 'pre-action' | 'post-action'

export interface GlobeItem {
  id: string
  label: string
  zone: GlobeZone
  category: string
  status: 'active' | 'idle' | 'warning' | 'error'
  description: string
}

// ─── Meta Agents ─────────────────────────────────────────────────
export interface MetaAgent {
  id: string
  name: string
  role: 'evaluator' | 'challenger' | 'synthesizer'
  status: 'active' | 'idle' | 'debating'
  lastOpinion: string
  alignment: number // 0-100
}

// ─── Workflow ────────────────────────────────────────────────────
export interface WorkflowPhase {
  id: string
  name: string
  status: 'pending' | 'active' | 'complete' | 'blocked'
  tasks: WorkflowTask[]
}

export interface WorkflowTask {
  id: string
  name: string
  agentId?: string
  status: 'pending' | 'active' | 'complete' | 'failed'
  duration?: number
}

export interface Workflow {
  id: string
  name: string
  objective: string
  phases: WorkflowPhase[]
  status: 'draft' | 'active' | 'paused' | 'complete'
  roi?: number
  costIncurred: number
  createdAt: string
}

// ─── Provider ────────────────────────────────────────────────────
export interface ProviderModel {
  id: string
  name: string
  contextWindow: number
  inputCost1k: number
  outputCost1k: number
  capabilities: string[]
}

export interface Provider {
  id: string
  name: string
  type: string
  status: 'connected' | 'disconnected' | 'error'
  latencyMs: number
  models: ProviderModel[]
  activeModel?: string
}

// ─── Chat ────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  agentName?: string
}

// ─── Telemetry ───────────────────────────────────────────────────
export interface TelemetryEntry {
  id: string
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'event'
  source: string
  message: string
}

// ─── System Metrics ──────────────────────────────────────────────
export interface SystemMetrics {
  totalAgents: number
  activeAgents: number
  totalWorkflows: number
  activeWorkflows: number
  totalTokens: number
  totalCost: number
  costRate: number
  uptime: number
  eventsPerSecond: number
  kernelStatus: 'running' | 'idle' | 'error'
}

// ─── ROI Data ────────────────────────────────────────────────────
export interface ROIdata {
  period: string
  investment: number
  return_: number
  netGain: number
  roiPercent: number
  tasksCompleted: number
  agentsUtilized: number
  avgLatencyMs: number
}

// ─── Heatmap Cell ────────────────────────────────────────────────
export interface HeatmapCell {
  row: string
  col: string
  value: number // 0-1
}

// ─── File Item ───────────────────────────────────────────────────
export interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder' | 'image'
  size: string
  modified: string
  path: string
}

// ─── Network Peer ────────────────────────────────────────────────
export interface NetworkPeer {
  id: string
  name: string
  ip: string
  status: 'online' | 'offline' | 'relay'
  latencyMs: number
  os: string
}

// ─── Store State ─────────────────────────────────────────────────
interface MeridianState {
  // Widgets
  widgets: Record<string, WidgetState>
  activeWidgetId: string | null
  setWidgetViewMode: (id: string, mode: ViewMode) => void
  setWidgetHovered: (id: string, hovered: boolean) => void
  setActiveWidget: (id: string | null) => void

  // Globe
  globeItems: GlobeItem[]
  selectedGlobeZone: GlobeZone | null
  selectedGlobeItem: string | null
  setGlobeSelection: (zone: GlobeZone | null, itemId: string | null) => void

  // Search / Chat
  searchQuery: string
  setSearchQuery: (q: string) => void
  chatMessages: ChatMessage[]
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  addChatMessage: (msg: ChatMessage) => void

  // Telemetry
  telemetryEntries: TelemetryEntry[]
  addTelemetryEntry: (entry: Omit<TelemetryEntry, 'id'>) => void
  telemetryPaused: boolean
  setTelemetryPaused: (paused: boolean) => void

  // Meta Agents
  metaAgents: MetaAgent[]
  updateMetaAgent: (id: string, updates: Partial<MetaAgent>) => void

  // Workflows
  workflows: Workflow[]
  selectedWorkflowId: string | null
  setSelectedWorkflow: (id: string | null) => void

  // Providers
  providers: Provider[]
  selectedProviderId: string | null
  setSelectedProvider: (id: string | null) => void

  // System Metrics
  systemMetrics: SystemMetrics

  // ROI
  roiData: ROIdata[]

  // Heatmap
  heatmapData: HeatmapCell[]

  // Files
  files: FileItem[]

  // Network
  networkPeers: NetworkPeer[]

  // Floating windows
  floatingWindows: Array<{ id: string; widgetId: string; x: number; y: number; w: number; h: number }>
  openFloatingWindow: (widgetId: string, x: number, y: number, w: number, h: number) => void
  closeFloatingWindow: (id: string) => void

  // Menu
  activeMenu: string | null
  setActiveMenu: (menu: string | null) => void
}

// ─── Seed Data ───────────────────────────────────────────────────

const SEED_GLOBE_ITEMS: GlobeItem[] = [
  { id: 'planning', label: 'PLANNING', zone: 'pre-action', category: 'design', status: 'active', description: 'Strategic planning and objective definition' },
  { id: 'specifications', label: 'SPECIFICATIONS', zone: 'pre-action', category: 'design', status: 'idle', description: 'Technical specifications and requirements' },
  { id: 'timeline', label: 'TIMELINE', zone: 'pre-action', category: 'design', status: 'active', description: 'Project timeline and milestone tracking' },
  { id: 'skills', label: 'SKILLS', zone: 'pre-action', category: 'resources', status: 'idle', description: 'Available skill registry and capabilities' },
  { id: 'agent-creation', label: 'AGENT CREATION', zone: 'pre-action', category: 'resources', status: 'idle', description: 'Design and instantiate new agents' },
  { id: 'workflow-design', label: 'WORKFLOW DESIGN', zone: 'pre-action', category: 'process', status: 'active', description: 'Visual workflow composition and simulation' },
  { id: 'workflow-sim', label: 'WORKFLOW SIM', zone: 'pre-action', category: 'process', status: 'idle', description: 'Simulate workflow execution before commit' },
  { id: 'chat-pre', label: 'INTERACTION', zone: 'pre-action', category: 'resources', status: 'active', description: 'Agent interaction and collaboration interface' },
  { id: 'file-explorer', label: 'FILE EXPLORER', zone: 'pre-action', category: 'resources', status: 'idle', description: 'Document and resource file management' },
  { id: 'telemetry', label: 'TELEMETRY', zone: 'post-action', category: 'monitoring', status: 'active', description: 'Real-time system telemetry and health' },
  { id: 'usage-stats', label: 'USAGE STATS', zone: 'post-action', category: 'analytics', status: 'active', description: 'Token usage, latency, throughput metrics' },
  { id: 'expenses', label: 'EXPENSES', zone: 'post-action', category: 'analytics', status: 'active', description: 'Cost tracking and budget analysis' },
  { id: 'workflow-replay', label: 'WORKFLOW REPLAY', zone: 'post-action', category: 'audit', status: 'idle', description: 'Replay and inspect past workflow runs' },
  { id: 'aar', label: 'AAR', zone: 'post-action', category: 'audit', status: 'idle', description: 'After Action Report and review' },
  { id: 'logs', label: 'LOGS', zone: 'post-action', category: 'monitoring', status: 'active', description: 'System and agent execution logs' },
]

const SEED_META_AGENTS: MetaAgent[] = [
  { id: 'evaluator', name: 'EVALUATOR', role: 'evaluator', status: 'active', lastOpinion: 'Workflow phase alignment: 94%. Objective focus maintained across 3 active tasks.', alignment: 94 },
  { id: 'challenger', name: 'CHALLENGER', role: 'challenger', status: 'debating', lastOpinion: 'Phase 2 task allocation shows 40% resource concentration on single agent. Recommend redistribution.', alignment: 67 },
  { id: 'synthesizer', name: 'SYNTHESIZER', role: 'synthesizer', status: 'active', lastOpinion: 'Consensus: workflow is on track with minor resource allocation concern. Human review recommended for Phase 2.', alignment: 82 },
]

const SEED_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Market Analysis Pipeline',
    objective: 'Comprehensive market analysis for Q2 expansion strategy',
    status: 'active',
    roi: 340,
    costIncurred: 47.82,
    createdAt: '2025-01-15T08:00:00Z',
    phases: [
      { id: 'p1', name: 'Data Collection', status: 'complete', tasks: [
        { id: 't1', name: 'Scrape market data', status: 'complete', agentId: 'agent-1', duration: 120 },
        { id: 't2', name: 'Validate sources', status: 'complete', agentId: 'agent-2', duration: 45 },
      ]},
      { id: 'p2', name: 'Analysis', status: 'active', tasks: [
        { id: 't3', name: 'Trend identification', status: 'active', agentId: 'agent-3', duration: 200 },
        { id: 't4', name: 'Competitor mapping', status: 'pending' },
      ]},
      { id: 'p3', name: 'Report Generation', status: 'pending', tasks: [
        { id: 't5', name: 'Draft report', status: 'pending' },
        { id: 't6', name: 'Executive summary', status: 'pending' },
      ]},
    ],
  },
  {
    id: 'wf-2',
    name: 'Infrastructure Audit',
    objective: 'Security and performance audit of production infrastructure',
    status: 'paused',
    roi: 180,
    costIncurred: 23.15,
    createdAt: '2025-01-14T14:00:00Z',
    phases: [
      { id: 'p4', name: 'Discovery', status: 'complete', tasks: [
        { id: 't7', name: 'Port scan analysis', status: 'complete', duration: 90 },
      ]},
      { id: 'p5', name: 'Vulnerability Assessment', status: 'paused', tasks: [
        { id: 't8', name: 'CVE matching', status: 'pending' },
      ]},
    ],
  },
  {
    id: 'wf-3',
    name: 'Content Strategy Sprint',
    objective: 'Generate Q2 content calendar with SEO optimization',
    status: 'draft',
    roi: 0,
    costIncurred: 0,
    createdAt: '2025-01-16T10:00:00Z',
    phases: [
      { id: 'p6', name: 'Research', status: 'pending', tasks: [
        { id: 't9', name: 'Keyword analysis', status: 'pending' },
      ]},
    ],
  },
]

const SEED_PROVIDERS: Provider[] = [
  { id: 'openai', name: 'OpenAI', type: 'openai', status: 'connected', latencyMs: 340, models: [
    { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, inputCost1k: 0.0025, outputCost1k: 0.01, capabilities: ['chat', 'code', 'vision', 'tools'] },
    { id: 'o1', name: 'o1', contextWindow: 200000, inputCost1k: 0.015, outputCost1k: 0.06, capabilities: ['chat', 'code', 'reasoning'] },
  ], activeModel: 'gpt-4o' },
  { id: 'anthropic', name: 'Anthropic', type: 'anthropic', status: 'connected', latencyMs: 420, models: [
    { id: 'claude-3.5', name: 'Claude 3.5 Sonnet', contextWindow: 200000, inputCost1k: 0.003, outputCost1k: 0.015, capabilities: ['chat', 'code', 'vision', 'tools'] },
  ], activeModel: 'claude-3.5' },
  { id: 'opencode', name: 'OpenCode', type: 'opencode', status: 'disconnected', latencyMs: 0, models: [] },
  { id: 'kilo', name: 'Kilo Code', type: 'kilo', status: 'disconnected', latencyMs: 0, models: [] },
  { id: 'kiro', name: 'Kiro-Cli', type: 'kiro', status: 'disconnected', latencyMs: 0, models: [] },
  { id: 'crush', name: 'Crush', type: 'crush', status: 'disconnected', latencyMs: 0, models: [] },
  { id: 'antigravity', name: 'Antigravity CLI', type: 'antigravity', status: 'disconnected', latencyMs: 0, models: [] },
]

const SEED_ROI: ROIdata[] = [
  { period: 'Week 1', investment: 120.00, return_: 340.00, netGain: 220.00, roiPercent: 183, tasksCompleted: 24, agentsUtilized: 5, avgLatencyMs: 380 },
  { period: 'Week 2', investment: 95.50, return_: 412.00, netGain: 316.50, roiPercent: 331, tasksCompleted: 31, agentsUtilized: 7, avgLatencyMs: 350 },
  { period: 'Week 3', investment: 143.20, return_: 520.00, netGain: 376.80, roiPercent: 263, tasksCompleted: 42, agentsUtilized: 8, avgLatencyMs: 290 },
  { period: 'Week 4', investment: 87.60, return_: 298.00, netGain: 210.40, roiPercent: 240, tasksCompleted: 28, agentsUtilized: 6, avgLatencyMs: 310 },
]

const SEED_HEATMAP: HeatmapCell[] = (() => {
  const rows = ['Research', 'Analysis', 'Execution', 'Review', 'Deployment']
  const cols = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const cells: HeatmapCell[] = []
  for (const r of rows) {
    for (const c of cols) {
      cells.push({ row: r, col: c, value: Math.random() })
    }
  }
  return cells
})()

const SEED_FILES: FileItem[] = [
  { id: 'f1', name: 'project-spec.md', type: 'file', size: '24KB', modified: '2h ago', path: '/docs/spec.md' },
  { id: 'f2', name: 'workflow-config.json', type: 'file', size: '8KB', modified: '1h ago', path: '/config/workflow.json' },
  { id: 'f3', name: 'market-data.csv', type: 'file', size: '1.2MB', modified: '4h ago', path: '/data/market.csv' },
  { id: 'f4', name: 'architecture.png', type: 'image', size: '340KB', modified: '1d ago', path: '/assets/arch.png' },
  { id: 'f5', name: 'reports', type: 'folder', size: '--', modified: '3h ago', path: '/reports/' },
  { id: 'f6', name: 'audit-log.json', type: 'file', size: '156KB', modified: '30m ago', path: '/logs/audit.json' },
  { id: 'f7', name: 'agent-memory.db', type: 'file', size: '2.1MB', modified: '5m ago', path: '/data/memory.db' },
  { id: 'f8', name: 'roi-dashboard.png', type: 'image', size: '520KB', modified: '6h ago', path: '/assets/roi.png' },
]

const SEED_NETWORK: NetworkPeer[] = [
  { id: 'n1', name: 'meridian-prod', ip: '100.64.0.1', status: 'online', latencyMs: 2, os: 'linux' },
  { id: 'n2', name: 'gpu-node-01', ip: '100.64.0.10', status: 'online', latencyMs: 8, os: 'linux' },
  { id: 'n3', name: 'dev-workstation', ip: '100.64.0.20', status: 'online', latencyMs: 3, os: 'darwin' },
  { id: 'n4', name: 'nas-primary', ip: '100.64.0.50', status: 'online', latencyMs: 5, os: 'linux' },
  { id: 'n5', name: 'ec2-prod-use1', ip: '100.64.1.1', status: 'relay', latencyMs: 45, os: 'linux' },
  { id: 'n6', name: 'gcp-west-c2', ip: '100.64.2.1', status: 'offline', latencyMs: 0, os: 'linux' },
]

const SEED_WIDGETS: Record<string, WidgetState> = {
  'agents': { id: 'agents', title: 'AGENTS', viewMode: 'container', isHovered: false, isActive: false },
  'provider': { id: 'provider', title: 'INFERENCE', viewMode: 'container', isHovered: false, isActive: false },
  'network': { id: 'network', title: 'NETWORK', viewMode: 'container', isHovered: false, isActive: false },
  'skills': { id: 'skills', title: 'SKILLS', viewMode: 'container', isHovered: false, isActive: false },
  'memory': { id: 'memory', title: 'MEMORY', viewMode: 'container', isHovered: false, isActive: false },
  'timeline': { id: 'timeline', title: 'TIMELINE', viewMode: 'container', isHovered: false, isActive: false },
  'workflow-design': { id: 'workflow-design', title: 'WORKFLOW', viewMode: 'container', isHovered: false, isActive: false },
  'heatmap': { id: 'heatmap', title: 'HEATMAP', viewMode: 'container', isHovered: false, isActive: false },
  'file-explorer': { id: 'file-explorer', title: 'FILES', viewMode: 'container', isHovered: false, isActive: false },
  'meta-agents': { id: 'meta-agents', title: 'META AGENTS', viewMode: 'container', isHovered: false, isActive: false },
  'chat': { id: 'chat', title: 'COMM', viewMode: 'container', isHovered: false, isActive: false },
  'images': { id: 'images', title: 'MEDIA', viewMode: 'container', isHovered: false, isActive: false },
  'workflow-replay': { id: 'workflow-replay', title: 'REPLAY', viewMode: 'container', isHovered: false, isActive: false },
  'aar': { id: 'aar', title: 'AAR', viewMode: 'container', isHovered: false, isActive: false },
  'expenses': { id: 'expenses', title: 'ROI', viewMode: 'container', isHovered: false, isActive: false },
  'clock': { id: 'clock', title: 'CLOCK', viewMode: 'container', isHovered: false, isActive: false },
  'gdrive': { id: 'gdrive', title: 'DRIVE', viewMode: 'container', isHovered: false, isActive: false },
  'canvas': { id: 'canvas', title: 'CANVAS', viewMode: 'container', isHovered: false, isActive: false },
}

// ─── Store ───────────────────────────────────────────────────────
export const useMeridianStore = create<MeridianState>((set, get) => ({
  // Widgets
  widgets: SEED_WIDGETS,
  activeWidgetId: null,
  setWidgetViewMode: (id, mode) =>
    set((s) => ({
      widgets: { ...s.widgets, [id]: { ...s.widgets[id], viewMode: mode } },
    })),
  setWidgetHovered: (id, hovered) =>
    set((s) => ({
      widgets: { ...s.widgets, [id]: { ...s.widgets[id], isHovered: hovered } },
    })),
  setActiveWidget: (id) => set({ activeWidgetId: id }),

  // Globe
  globeItems: SEED_GLOBE_ITEMS,
  selectedGlobeZone: null,
  selectedGlobeItem: null,
  setGlobeSelection: (zone, itemId) =>
    set({ selectedGlobeZone: zone, selectedGlobeItem: itemId }),

  // Search / Chat
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  chatMessages: [
    { id: 'sys-1', role: 'system', content: 'Meridian Runtime initialized. Kernel spine active. All systems nominal.', timestamp: Date.now() - 60000 },
    { id: 'asst-1', role: 'assistant', content: 'Three workflows are currently registered. The Market Analysis Pipeline is active with Phase 2 in progress. The Evaluator meta-agent reports 94% objective alignment.', timestamp: Date.now() - 30000, agentName: 'SYNTHESIZER' },
  ],
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),

  // Telemetry
  telemetryEntries: [
    { id: 't1', timestamp: Date.now() - 120000, level: 'event', source: 'kernel', message: 'Kernel spine initialized. Causal core lock engaged.' },
    { id: 't2', timestamp: Date.now() - 90000, level: 'info', source: 'frontier', message: 'Frontier solver computed: 3 executable events pending.' },
    { id: 't3', timestamp: Date.now() - 60000, level: 'info', source: 'agent-3', message: 'Agent researcher-01 proposed PROPOSE action on task "Trend identification".' },
    { id: 't4', timestamp: Date.now() - 45000, level: 'event', source: 'reducer', message: 'Reducer accepted event evt_a3f2. State transition applied.' },
    { id: 't5', timestamp: Date.now() - 30000, level: 'warn', source: 'meta-challenger', message: 'Resource concentration alert: 40% allocation on single agent in Phase 2.' },
    { id: 't6', timestamp: Date.now() - 15000, level: 'info', source: 'provider-openai', message: 'GPT-4o inference: 1,247 tokens processed. Latency: 340ms.' },
    { id: 't7', timestamp: Date.now() - 5000, level: 'event', source: 'frontier', message: 'Frontier updated: 2 events executed, 1 new event emitted.' },
  ],
  addTelemetryEntry: (entry) =>
    set((s) => ({
      telemetryEntries: [
        ...s.telemetryEntries.slice(-99),
        { ...entry, id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ],
    })),
  telemetryPaused: false,
  setTelemetryPaused: (paused) => set({ telemetryPaused: paused }),

  // Meta Agents
  metaAgents: SEED_META_AGENTS,
  updateMetaAgent: (id, updates) =>
    set((s) => ({
      metaAgents: s.metaAgents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  // Workflows
  workflows: SEED_WORKFLOWS,
  selectedWorkflowId: 'wf-1',
  setSelectedWorkflow: (id) => set({ selectedWorkflowId: id }),

  // Providers
  providers: SEED_PROVIDERS,
  selectedProviderId: null,
  setSelectedProvider: (id) => set({ selectedProviderId: id }),

  // System Metrics
  systemMetrics: {
    totalAgents: 14,
    activeAgents: 6,
    totalWorkflows: 3,
    activeWorkflows: 1,
    totalTokens: 284910,
    totalCost: 71.35,
    costRate: 2.41,
    uptime: 86400,
    eventsPerSecond: 3.2,
    kernelStatus: 'running',
  },

  // ROI
  roiData: SEED_ROI,

  // Heatmap
  heatmapData: SEED_HEATMAP,

  // Files
  files: SEED_FILES,

  // Network
  networkPeers: SEED_NETWORK,

  // Floating windows
  floatingWindows: [],
  openFloatingWindow: (widgetId, x, y, w, h) =>
    set((s) => ({
      floatingWindows: [
        ...s.floatingWindows,
        { id: `fw-${Date.now()}`, widgetId, x, y, w, h },
      ],
    })),
  closeFloatingWindow: (id) =>
    set((s) => ({
      floatingWindows: s.floatingWindows.filter((w) => w.id !== id),
    })),

  // Menu
  activeMenu: null,
  setActiveMenu: (menu) => set({ activeMenu: menu === get().activeMenu ? null : menu }),
}))
