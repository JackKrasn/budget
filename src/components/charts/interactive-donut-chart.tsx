import { motion } from 'framer-motion'

export interface DonutChartFund {
  fundId: string
  fundName: string
  fundColor: string | null
  value: number
  percentage?: number
}

interface InteractiveDonutChartProps {
  funds: DonutChartFund[]
  size?: number
  strokeWidth?: number
  hoveredFundId?: string | null
  onHoverFund?: (fundId: string | null) => void
  showLabel?: boolean
  labelSize?: 'sm' | 'md'
}

export function InteractiveDonutChart({
  funds,
  size = 100,
  strokeWidth = 12,
  hoveredFundId,
  onHoverFund,
  showLabel = true,
  labelSize = 'md',
}: InteractiveDonutChartProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const total = funds.reduce((sum, f) => sum + f.value, 0)

  // Calculate segments
  let currentOffset = 0
  const segments = funds.map((fund) => {
    const percentage = total > 0 ? (fund.value / total) * 100 : 0
    const length = (percentage / 100) * circumference
    const offset = currentOffset
    currentOffset += length
    return { ...fund, length, offset, percentage }
  })

  const textSizeClass = labelSize === 'sm'
    ? { count: 'text-xs font-semibold', label: 'text-[9px]' }
    : { count: 'text-lg font-bold', label: 'text-[10px]' }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Fund segments */}
        {segments.map((segment, index) => {
          const isHovered = hoveredFundId === segment.fundId
          const isOtherHovered = hoveredFundId && hoveredFundId !== segment.fundId
          return (
            <motion.circle
              key={segment.fundId}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.fundColor || '#6366f1'}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${segment.length} ${circumference - segment.length}`}
              strokeDashoffset={-segment.offset}
              initial={{ opacity: 0 }}
              animate={{
                opacity: isOtherHovered ? 0.3 : 1,
                strokeWidth: isHovered ? strokeWidth + 4 : strokeWidth,
              }}
              transition={{
                opacity: { duration: 0.15 },
                strokeWidth: { duration: 0.15 },
                delay: index * 0.1,
              }}
              style={{
                filter: isHovered ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'none',
                cursor: onHoverFund ? 'pointer' : 'default',
              }}
              onMouseEnter={() => onHoverFund?.(segment.fundId)}
              onMouseLeave={() => onHoverFund?.(null)}
            />
          )
        })}
      </svg>
      {/* Center text */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`tabular-nums ${textSizeClass.count}`}>{funds.length}</span>
          <span className={`text-muted-foreground ${textSizeClass.label}`}>
            {funds.length === 1 ? 'фонд' : funds.length < 5 ? 'фонда' : 'фондов'}
          </span>
        </div>
      )}
    </div>
  )
}
