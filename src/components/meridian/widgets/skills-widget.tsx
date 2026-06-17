'use client'

import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

interface Skill {
  name: string
  calls: number
  status: 'active' | 'idle'
}

const SEED_SKILLS: Skill[] = [
  { name: 'memory.query', calls: 198, status: 'active' },
  { name: 'web.search', calls: 142, status: 'active' },
  { name: 'code.exec', calls: 87, status: 'active' },
  { name: 'file.write', calls: 56, status: 'active' },
  { name: 'data.analyze', calls: 34, status: 'idle' },
  { name: 'image.gen', calls: 23, status: 'active' },
]

const MAX_CALLS = Math.max(...SEED_SKILLS.map((s) => s.calls))

export function SkillsWidget() {
  const activeCount = SEED_SKILLS.filter((s) => s.status === 'active').length

  return (
    <WidgetContainer
      id="skills"
      title="SKILLS"
      onHoverInfo="Skill registry - available capabilities and invocation counts for the current session"
    >
      <div className="flex flex-col h-full">
        {/* Summary */}
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span
            className="text-[9px] tracking-[0.2em] font-bold"
            style={{ color: '#5a6578' }}
          >
            {SEED_SKILLS.length} SKILLS
          </span>
          <span
            className="text-[9px] tracking-[0.1em]"
            style={{ color: activeCount > 0 ? '#00ff88' : '#5a6578' }}
          >
            {activeCount} ACTIVE
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-1.5"
          style={{ background: 'rgba(168, 85, 247,0.1)' }}
        />

        {/* Skill list */}
        <div className="flex-1 overflow-y-auto max-h-48 space-y-1 pr-0.5 scrollbar-thin">
          {SEED_SKILLS.map((skill, i) => {
            const barWidth = (skill.calls / MAX_CALLS) * 100
            return (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className="flex flex-col gap-0.5 px-1 py-0.5 rounded-sm cursor-pointer"
                whileHover={{ background: 'rgba(168, 85, 247,0.04)' }}
              >
                {/* Skill row: name + call count */}
                <div className="flex items-center gap-1.5">
                  {/* Status indicator */}
                  <div
                    className="w-1 h-1 rounded-full shrink-0"
                    style={{
                      background:
                        skill.status === 'active' ? '#00ff88' : '#5a6578',
                    }}
                  />

                  {/* Skill name */}
                  <span
                    className="text-[10px] font-mono tracking-[0.1em] shrink-0"
                    style={{ color: '#c8d0dc' }}
                  >
                    {skill.name}
                  </span>

                  <div className="flex-1" />

                  {/* Call count */}
                  <span
                    className="text-[9px] font-mono tracking-[0.05em] shrink-0"
                    style={{ color: '#5a6578' }}
                  >
                    {skill.calls}
                  </span>
                </div>

                {/* Call count bar */}
                <div className="flex items-center gap-0 pl-2.5">
                  <div
                    className="h-[2px] rounded-full"
                    style={{
                      width: `${barWidth}%`,
                      background:
                        skill.status === 'active'
                          ? 'rgba(168, 85, 247,0.4)'
                          : 'rgba(90,101,120,0.25)',
                      maxWidth: 'calc(100% - 2px)',
                    }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </WidgetContainer>
  )
}
