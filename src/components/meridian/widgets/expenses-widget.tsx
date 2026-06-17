'use client'

import { motion } from 'framer-motion'
import { WidgetContainer } from '@/components/meridian/widget-container'
import { useMeridianStore } from '@/store/meridian-store'

export function ExpensesWidget() {
  const roiData = useMeridianStore((s) => s.roiData)
  const systemMetrics = useMeridianStore((s) => s.systemMetrics)

  // Aggregate from roiData
  const totalInvestment = roiData.reduce((sum, r) => sum + r.investment, 0)
  const totalReturn = roiData.reduce((sum, r) => sum + r.return_, 0)
  const totalNet = totalReturn - totalInvestment
  const totalRoiPercent = totalInvestment > 0
    ? ((totalNet / totalInvestment) * 100)
    : 0

  // Weekly sparkline bars - proportional heights
  const maxRoi = Math.max(...roiData.map((r) => Math.abs(r.roiPercent)), 1)

  return (
    <WidgetContainer
      id="expenses"
      title="ROI"
      onHoverInfo="Business objectives - ROI tracking, cost analysis, and investment return metrics"
    >
      <div className="flex flex-col h-full justify-between gap-2">
        {/* Headline numbers */}
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col gap-[1px]">
            <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
              TOTAL COST
            </span>
            <span className="text-[11px] font-mono font-bold" style={{ color: '#c8d0dc' }}>
              ${systemMetrics.totalCost.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col gap-[1px] text-right">
            <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
              RATE
            </span>
            <span className="text-[10px] font-mono" style={{ color: '#ffa500' }}>
              ${systemMetrics.costRate.toFixed(2)}/hr
            </span>
          </div>
        </div>

        {/* ROI headline */}
        <div className="flex items-baseline justify-between">
          <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: '#5a6578' }}>
            TOTAL ROI
          </span>
          <span
            className="text-[11px] font-mono font-bold"
            style={{ color: totalRoiPercent >= 0 ? '#00ff88' : '#ff3344' }}
          >
            {totalRoiPercent >= 0 ? '+' : ''}{totalRoiPercent.toFixed(0)}%
          </span>
        </div>

        {/* Sparkline bars */}
        <div className="flex items-end gap-[3px] h-8">
          {roiData.map((week, i) => {
            const heightPercent = (Math.abs(week.roiPercent) / maxRoi) * 100
            const isPositive = week.roiPercent >= 0
            return (
              <motion.div
                key={week.period}
                className="flex-1 flex flex-col items-center justify-end h-full"
                initial={{ height: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-full rounded-t-[1px]"
                  style={{
                    background: isPositive
                      ? 'rgba(0,255,136,0.6)'
                      : 'rgba(255,51,68,0.6)',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                />
              </motion.div>
            )
          })}
        </div>

        {/* Week labels */}
        <div className="flex gap-[3px]">
          {roiData.map((week) => (
            <div key={week.period} className="flex-1 text-center">
              <span className="text-[7px] font-mono" style={{ color: '#3a4553' }}>
                W{roiData.indexOf(week) + 1}
              </span>
            </div>
          ))}
        </div>

        {/* Business justification */}
        <div
          className="px-2 py-1 rounded"
          style={{ background: 'rgba(168, 85, 247,0.04)', border: '1px solid rgba(168, 85, 247,0.08)' }}
        >
          <span className="text-[8px] font-mono leading-[1.4]" style={{ color: '#5a6578' }}>
            INVESTMENT: <span style={{ color: '#c8d0dc' }}>${totalInvestment.toFixed(2)}</span>
            {' / '}RETURN: <span style={{ color: '#00ff88' }}>${totalReturn.toFixed(2)}</span>
            {' / '}NET: <span style={{ color: totalNet >= 0 ? '#00ff88' : '#ff3344' }}>${totalNet.toFixed(2)}</span>
          </span>
        </div>
      </div>
    </WidgetContainer>
  )
}
