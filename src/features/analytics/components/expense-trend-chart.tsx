"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
} from "recharts"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react"

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
import { cn } from "@/lib/utils"

interface MonthlyData {
  month: string
  year: number
  monthName: string
  actual: number
  planned: number
}

interface ExpenseTrendChartProps {
  data: MonthlyData[]
  title?: string
  description?: string
  className?: string
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatCompact(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}М`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}К`
  }
  return amount.toString()
}

const chartConfig = {
  actual: {
    label: "Факт",
    color: "oklch(0.65 0.18 160)",
  },
  planned: {
    label: "План",
    color: "oklch(0.60 0.01 260)",
  },
} satisfies ChartConfig

const MONTH_NAMES_SHORT: Record<string, string> = {
  "01": "Янв",
  "02": "Фев",
  "03": "Мар",
  "04": "Апр",
  "05": "Май",
  "06": "Июн",
  "07": "Июл",
  "08": "Авг",
  "09": "Сен",
  "10": "Окт",
  "11": "Ноя",
  "12": "Дек",
}

export function ExpenseTrendChart({
  data,
  title = "Динамика расходов",
  description,
  className,
}: ExpenseTrendChartProps) {
  const [activeBar, setActiveBar] = React.useState<number | null>(null)

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (data.length === 0) return null

    const totalActual = data.reduce((sum, d) => sum + d.actual, 0)
    const totalPlanned = data.reduce((sum, d) => sum + d.planned, 0)
    const avgActual = totalActual / data.length

    // Calculate trend (compare last 3 months vs previous 3)
    if (data.length >= 2) {
      const recent = data.slice(-3).reduce((sum, d) => sum + d.actual, 0) / Math.min(3, data.length)
      const previous = data.slice(0, -3).reduce((sum, d) => sum + d.actual, 0) / Math.max(1, data.length - 3)
      const trendPercent = previous > 0 ? ((recent - previous) / previous) * 100 : 0

      return {
        totalActual,
        totalPlanned,
        avgActual,
        trend: trendPercent,
        maxMonth: data.reduce((max, d) => (d.actual > max.actual ? d : max), data[0]),
        minMonth: data.reduce((min, d) => (d.actual < min.actual && d.actual > 0 ? d : min), data[0]),
      }
    }

    return {
      totalActual,
      totalPlanned,
      avgActual,
      trend: 0,
      maxMonth: data[0],
      minMonth: data[0],
    }
  }, [data])

  // Prepare chart data with enhanced info
  const chartData = React.useMemo(() => {
    return data.map((d) => ({
      ...d,
      label: MONTH_NAMES_SHORT[d.month] || d.monthName,
      isOverBudget: d.actual > d.planned && d.planned > 0,
      percentOfPlan: d.planned > 0 ? Math.round((d.actual / d.planned) * 100) : 0,
    }))
  }, [data])

  // Average line value
  const avgValue = stats?.avgActual || 0

  if (data.length === 0) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-chart-3" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="mx-auto h-12 w-12 opacity-20" />
            <p className="mt-4">Недостаточно данных</p>
            <p className="mt-1 text-sm opacity-70">
              Для отображения тренда нужны данные за несколько месяцев
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
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        {/* Gradient overlay */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-bl from-chart-3/[0.02] to-transparent pointer-events-none" />

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10">
                  <BarChart3 className="h-4 w-4 text-chart-3" />
                </div>
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="mt-1 text-muted-foreground/80">
                  {description}
                </CardDescription>
              )}
            </div>

            {/* Trend indicator */}
            {stats && (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
                  stats.trend > 5 && "bg-destructive/10 text-destructive",
                  stats.trend < -5 && "bg-chart-1/10 text-chart-1",
                  Math.abs(stats.trend) <= 5 && "bg-muted text-muted-foreground"
                )}
              >
                {stats.trend > 5 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : stats.trend < -5 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
                <span>{Math.abs(stats.trend).toFixed(0)}%</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 12, left: 12, bottom: 0 }}
              onMouseMove={(state) => {
                if (state.activeTooltipIndex !== undefined && typeof state.activeTooltipIndex === 'number') {
                  setActiveBar(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => setActiveBar(null)}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                tick={{ fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                tick={{ fill: "var(--muted-foreground)" }}
                tickFormatter={formatCompact}
                width={45}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.1 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const item = payload[0]?.payload
                      if (item) {
                        return `${item.monthName} ${item.year}`
                      }
                      return ""
                    }}
                    formatter={(value, name, item) => (
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-muted-foreground">
                          {name === "actual" ? "Факт" : "План"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold tabular-nums">
                            {formatMoney(Number(value))} ₽
                          </span>
                          {name === "actual" && item.payload.planned > 0 && (
                            <span
                              className={cn(
                                "text-xs",
                                item.payload.isOverBudget
                                  ? "text-destructive"
                                  : "text-chart-1"
                              )}
                            >
                              ({item.payload.percentOfPlan}%)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  />
                }
              />
              {/* Average line */}
              <ReferenceLine
                y={avgValue}
                stroke="var(--chart-5)"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: `Среднее: ${formatCompact(avgValue)}`,
                  position: "right",
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                }}
              />
              {/* Planned bars (background) */}
              <Bar
                dataKey="planned"
                fill="var(--color-planned)"
                radius={[4, 4, 0, 0]}
                opacity={0.3}
                maxBarSize={40}
              />
              {/* Actual bars */}
              <Bar
                dataKey="actual"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isOverBudget
                        ? "var(--destructive)"
                        : "var(--color-actual)"
                    }
                    style={{
                      transition: "all 0.2s ease",
                      opacity: activeBar === null || activeBar === index ? 1 : 0.5,
                      filter: activeBar === index ? "brightness(1.1)" : undefined,
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>

          {/* Stats footer */}
          {stats && (
            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border/50 pt-4">
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums">
                  {formatMoney(stats.avgActual)}
                </p>
                <p className="text-xs text-muted-foreground">Среднее/мес</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums text-chart-1">
                  {stats.minMonth.monthName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Минимум ({formatCompact(stats.minMonth.actual)})
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums text-destructive">
                  {stats.maxMonth.monthName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Максимум ({formatCompact(stats.maxMonth.actual)})
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
