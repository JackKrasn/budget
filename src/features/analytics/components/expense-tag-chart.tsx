"use client"

import * as React from "react"
import { Label, Pie, PieChart, Cell, Sector } from "recharts"
import { motion } from "framer-motion"
import { Tag, Hash } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TagData {
  tagId: string
  tagName: string
  tagColor: string
  totalAmount: number
  expenseCount: number
}

interface ExpenseTagChartProps {
  data: TagData[]
  title?: string
  description?: string
  className?: string
  onTagClick?: (tagId: string) => void
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Active shape with glow effect
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props

  return (
    <g>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={(outerRadius || 0) + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        filter="url(#glow)"
        style={{
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </g>
  )
}

export function ExpenseTagChart({
  data,
  title = "Расходы по меткам",
  description,
  className,
  onTagClick,
}: ExpenseTagChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)
  const isClickable = !!onTagClick

  const handleClick = React.useCallback((tagId: string) => {
    if (onTagClick) {
      onTagClick(tagId)
    }
  }, [onTagClick])

  const totalAmount = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.totalAmount, 0)
  }, [data])

  const totalExpenses = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.expenseCount, 0)
  }, [data])

  // Sort by amount and prepare chart data
  const chartData = React.useMemo(() => {
    return [...data]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        fill: item.tagColor || "oklch(0.60 0.15 200)",
        percentage: totalAmount > 0 ? ((item.totalAmount / totalAmount) * 100).toFixed(1) : "0",
      }))
  }, [data, totalAmount])

  // Generate chart config
  const chartConfig = React.useMemo<ChartConfig>(() => {
    const config: ChartConfig = {
      totalAmount: { label: "Сумма" },
    }
    chartData.forEach((item) => {
      config[item.tagId] = {
        label: item.tagName,
        color: item.fill,
      }
    })
    return config
  }, [chartData])

  const activeData = activeIndex !== undefined ? chartData[activeIndex] : null

  if (data.length === 0) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5 text-chart-2" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Hash className="mx-auto h-12 w-12 opacity-20" />
            <p className="mt-4">Нет расходов с метками</p>
            <p className="mt-1 text-sm opacity-70">
              Добавьте метки к расходам для отслеживания
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden", className)}>
        {/* Decorative gradient */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-chart-2/[0.03] via-transparent to-chart-4/[0.03] pointer-events-none" />

        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10">
              <Tag className="h-4 w-4 text-chart-2" />
            </div>
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-muted-foreground/80">
              {description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="relative pb-4">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[280px] w-[280px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, item) => (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-8">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="font-mono font-semibold tabular-nums">
                            {formatMoney(Number(value))} ₽
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.payload?.expenseCount} расходов
                        </div>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="totalAmount"
                nameKey="tagName"
                innerRadius={65}
                outerRadius={110}
                paddingAngle={3}
                cornerRadius={6}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
                onClick={isClickable ? (data) => handleClick(data.tagId) : undefined}
                animationBegin={100}
                animationDuration={900}
                animationEasing="ease-out"
                style={isClickable ? { cursor: "pointer" } : undefined}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.tagId}
                    fill={entry.fill}
                    stroke="transparent"
                    style={{
                      transition: "all 0.3s ease",
                      opacity: activeIndex === undefined || chartData[activeIndex]?.tagId === entry.tagId ? 1 : 0.4,
                      cursor: isClickable ? "pointer" : undefined,
                    }}
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {activeData ? (
                            <>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 12}
                                className="fill-foreground text-2xl font-bold tabular-nums"
                              >
                                {formatMoney(activeData.totalAmount)}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 10}
                                className="fill-muted-foreground text-xs"
                              >
                                {activeData.expenseCount} расходов
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 26}
                                className="fill-muted-foreground text-xs"
                              >
                                ({activeData.percentage}%)
                              </tspan>
                            </>
                          ) : (
                            <>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 8}
                                className="fill-foreground text-2xl font-bold tabular-nums"
                              >
                                {chartData.length}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 14}
                                className="fill-muted-foreground text-xs"
                              >
                                меток
                              </tspan>
                            </>
                          )}
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Tag badges legend */}
          <div className="mt-3 flex flex-wrap justify-center gap-2 px-2">
            {chartData.slice(0, 8).map((item, index) => (
              <motion.div
                key={item.tagId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5 px-2.5 py-1 transition-all",
                    isClickable && "cursor-pointer hover:bg-muted/60",
                    activeIndex === index && "ring-2 ring-ring ring-offset-1"
                  )}
                  style={{
                    borderColor: item.fill,
                    backgroundColor: activeIndex === index ? `${item.fill}15` : undefined,
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                  onClick={isClickable ? () => handleClick(item.tagId) : undefined}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs">{item.tagName}</span>
                </Badge>
              </motion.div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/50 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">{formatMoney(totalAmount)}</p>
              <p className="text-xs text-muted-foreground">Всего расходов</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">{totalExpenses}</p>
              <p className="text-xs text-muted-foreground">Операций с метками</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
