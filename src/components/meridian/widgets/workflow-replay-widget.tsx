'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

const STEP_NAMES = ['Init', 'Collect', 'Analyze', 'Process', 'Validate', 'Report', 'Review', 'Complete']

export function WorkflowReplayWidget() {
  const [currentStep, setCurrentStep] = useState(3)
  const totalSteps = STEP_NAMES.length

  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1))
  const handleForward = () => setCurrentStep((s) => Math.min(totalSteps, s + 1))
  const handlePlay = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1)
    }
  }

  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <WidgetContainer
      id="workflow-replay"
      title="REPLAY"
      onHoverInfo="Workflow execution replay - step through completed workflow runs"
    >
      <div className="flex flex-col h-full justify-between gap-2">
        {/* Step counter header */}
        <div className="flex items-baseline justify-between">
          <span
            className="text-[11px] font-mono font-bold tracking-[0.1em]"
            style={{ color: '#a855f7' }}
          >
            {currentStep}/{totalSteps}
          </span>
          <span
            className="text-[9px] font-mono tracking-[0.2em]"
            style={{ color: '#5a6578' }}
          >
            {STEP_NAMES[currentStep - 1].toUpperCase()}
          </span>
        </div>

        {/* Progress bar with step markers */}
        <div className="relative w-full h-5">
          {/* Track background */}
          <div
            className="absolute top-2 left-0 right-0 h-[3px] rounded-full"
            style={{ background: 'rgba(42,52,65,0.6)' }}
          />

          {/* Completed portion */}
          <motion.div
            className="absolute top-2 left-0 h-[3px] rounded-full"
            style={{ background: '#00ff88' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />

          {/* Step markers */}
          <div className="absolute top-0 left-0 right-0 flex justify-between">
            {STEP_NAMES.map((name, i) => {
              const stepNum = i + 1
              const isCompleted = stepNum < currentStep
              const isCurrent = stepNum === currentStep
              const isPending = stepNum > currentStep

              return (
                <motion.div
                  key={name}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setCurrentStep(stepNum)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div
                    className="w-[6px] h-[6px] rounded-full"
                    style={{
                      background: isCompleted
                        ? '#00ff88'
                        : isCurrent
                          ? '#a855f7'
                          : 'rgba(42,52,65,0.8)',
                      boxShadow: isCurrent
                        ? '0 0 6px rgba(168, 85, 247,0.6)'
                        : isCompleted
                          ? '0 0 4px rgba(0,255,136,0.3)'
                          : 'none',
                    }}
                  />
                  <span
                    className="text-[7px] font-mono mt-[3px] leading-none"
                    style={{
                      color: isCurrent
                        ? '#a855f7'
                        : isCompleted
                          ? '#00ff88'
                          : isPending
                            ? '#2a3441'
                            : '#5a6578',
                    }}
                  >
                    {name.slice(0, 3).toUpperCase()}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Step details row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-col gap-[2px]">
            <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
              STEP
            </span>
            <span className="text-[10px] font-mono" style={{ color: '#c8d0dc' }}>
              {STEP_NAMES[currentStep - 1]}
            </span>
          </div>
          <div className="flex flex-col gap-[2px] text-right">
            <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
              STATUS
            </span>
            <span
              className="text-[10px] font-mono font-bold"
              style={{
                color: currentStep < totalSteps ? '#a855f7' : '#00ff88',
              }}
            >
              {currentStep < totalSteps ? 'RUNNING' : 'COMPLETE'}
            </span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-center gap-3 mt-1">
          <motion.button
            className="px-2 py-1 text-[9px] font-mono tracking-[0.15em] font-bold border rounded"
            style={{
              color: currentStep > 1 ? '#5a6578' : '#2a3441',
              borderColor: currentStep > 1 ? 'rgba(168, 85, 247,0.15)' : 'rgba(42,52,65,0.3)',
              background: 'transparent',
            }}
            onClick={handleBack}
            whileHover={currentStep > 1 ? { borderColor: 'rgba(168, 85, 247,0.4)', color: '#a855f7' } : {}}
            whileTap={currentStep > 1 ? { scale: 0.95 } : {}}
            disabled={currentStep <= 1}
          >
            BACK
          </motion.button>

          <motion.button
            className="px-3 py-1 text-[9px] font-mono tracking-[0.15em] font-bold border rounded"
            style={{
              color: '#a855f7',
              borderColor: 'rgba(168, 85, 247,0.3)',
              background: 'rgba(168, 85, 247,0.06)',
            }}
            onClick={handlePlay}
            whileHover={{ borderColor: 'rgba(168, 85, 247,0.6)', background: 'rgba(168, 85, 247,0.12)' }}
            whileTap={{ scale: 0.95 }}
          >
            PLAY
          </motion.button>

          <motion.button
            className="px-2 py-1 text-[9px] font-mono tracking-[0.15em] font-bold border rounded"
            style={{
              color: currentStep < totalSteps ? '#5a6578' : '#2a3441',
              borderColor: currentStep < totalSteps ? 'rgba(168, 85, 247,0.15)' : 'rgba(42,52,65,0.3)',
              background: 'transparent',
            }}
            onClick={handleForward}
            whileHover={currentStep < totalSteps ? { borderColor: 'rgba(168, 85, 247,0.4)', color: '#a855f7' } : {}}
            whileTap={currentStep < totalSteps ? { scale: 0.95 } : {}}
            disabled={currentStep >= totalSteps}
          >
            FWD
          </motion.button>
        </div>
      </div>
    </WidgetContainer>
  )
}
