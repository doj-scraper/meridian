'use client'

import { AnimatePresence } from 'framer-motion'
import { useMeridianStore } from '@/store/meridian-store'
import { StarfieldBackground } from './starfield-background'
import { MenuBar } from './menu-bar'
import { SearchBar } from './search-bar'
import { TelemetryBar } from './telemetry-bar'
import { GlobeModule } from './globe-module'
import { ClockWidget } from './clock-widget'
import { ChatPanel } from './chat-panel'

// Widgets
import { AgentsWidget } from './widgets/agents-widget'
import { ProviderWidget } from './widgets/provider-widget'
import { NetworkWidget } from './widgets/network-widget'
import { SkillsWidget } from './widgets/skills-widget'
import { MemoryWidget } from './widgets/memory-widget'
import { TimelineWidget } from './widgets/timeline-widget'
import { WorkflowDesignWidget } from './widgets/workflow-design-widget'
import { HeatmapWidget } from './widgets/heatmap-widget'
import { FileExplorerWidget } from './widgets/file-explorer-widget'
import { MetaAgentsWidget } from './widgets/meta-agents-widget'
import { ChatWidget } from './widgets/chat-widget'
import { ImagesWidget } from './widgets/images-widget'
import { WorkflowReplayWidget } from './widgets/workflow-replay-widget'
import { AARWidget } from './widgets/aar-widget'
import { ExpensesWidget } from './widgets/expenses-widget'
import { GDriveWidget } from './widgets/gdrive-widget'
import { CanvasWidget } from './widgets/canvas-widget'

export function MeridianShell() {
  const chatOpen = useMeridianStore((s) => s.chatOpen)

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative" style={{ background: '#030508', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
      {/* Layer 0: Starfield Background */}
      <StarfieldBackground />

      {/* Layer 1: Menu Bar */}
      <MenuBar />

      {/* Layer 2: Search/Chat Bar */}
      <SearchBar />

      {/* Layer 3: Main Content Grid - Asymmetric Command Center Layout */}
      <div className="flex-1 flex min-h-0 relative z-10">
        {/* Left Column: 3-column grid of data-dense sub-modules */}
        <div
          className="shrink-0 grid"
          style={{
            width: '540px',
            gridTemplateColumns: '1fr 1fr 1fr',
            gridTemplateRows: 'repeat(5, 1fr)',
            gap: '1px',
            padding: '1px',
            background: 'rgba(168, 85, 247, 0.08)',
          }}
        >
          {/* Row 1 - System Status */}
          <AgentsWidget />
          <ProviderWidget />
          <NetworkWidget />

          {/* Row 2 - Resources */}
          <SkillsWidget />
          <MemoryWidget />
          <TimelineWidget />

          {/* Row 3 - Process */}
          <WorkflowDesignWidget />
          <HeatmapWidget />
          <FileExplorerWidget />

          {/* Row 4 - Decision Support */}
          <MetaAgentsWidget />
          <ChatWidget />
          <ImagesWidget />

          {/* Row 5 - Post-Action Audit */}
          <WorkflowReplayWidget />
          <AARWidget />
          <ExpensesWidget />
        </div>

        {/* Right Column: Large globe module + utility widgets above */}
        <div
          className="flex-1 grid min-w-0"
          style={{
            gridTemplateColumns: '1fr 1fr 1fr',
            gridTemplateRows: '140px 1fr',
            gap: '1px',
            padding: '1px',
            background: 'rgba(168, 85, 247, 0.08)',
          }}
        >
          {/* Top row: Utility widgets above the globe */}
          <ClockWidget />
          <GDriveWidget />
          <CanvasWidget />

          {/* Main area: Globe Module - the dominant visual element */}
          <div className="col-span-3" style={{ minHeight: 0 }}>
            <GlobeModule />
          </div>
        </div>
      </div>

      {/* Layer 4: Telemetry Bar */}
      <TelemetryBar />

      {/* Chat Panel Overlay */}
      <AnimatePresence>
        {chatOpen && <ChatPanel />}
      </AnimatePresence>
    </div>
  )
}
