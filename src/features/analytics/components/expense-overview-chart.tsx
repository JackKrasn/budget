"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"
import { motion } from "framer-motion"
import { Activity, TrendingDown } from "lucide-react"

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

interface DailyData {
  date: string
  dateLabel: string
  amount: number
  cumulative: number
}

interface ExpenseOverviewChartProps {
  data: DailyData[]
  budgetLimit?: number
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
  cumulative: {
    label: "Накопительно",
    color: "oklch(0.65 0.18 160)",
  },
  amount: {
    label: "За день",
    color: "oklch(0.60 0.15 200)",
  },
} satisfies ChartConfig

export function ExpenseOverviewChart({
  data,
  budgetLimit,
  title = "Накопительные расходы",
  description,
  className,
}: ExpenseOverviewChartProps) {
  const [showDaily, setShowDaily] = React.useState(false)

  // Calculate stats
  const stats = React.useMemo(() => {
    if (data.length === 0) return null

    const total = data[data.length - 1]?.cumulative || 0
    const dailyAvg = total / data.length
    const maxDay = data.reduce((max, d) => (d.amount > max.amount ? d : max), data[0])
    const daysWithExpenses = data.filter((d) => d.amount > 0).length

    return {
      total,
      dailyAvg,
      maxDay,
      daysWithExpenses,
      remainingBudget: budgetLimit ? budgetLimit - total : null,
      budgetProgress: budgetLimit ? (total / budgetLimit) * 100 : null,
    }
  }, [data, budgetLimit])

  if (data.length === 0) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-chart-1" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <div className="text-center text-muted-foreground">
            <TrendingDown className="mx-auto h-12 w-12 opacity-20" />
            <p className="mt-4">Нет данных за этот период</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden", className)}>
        {/* Mesh gradient background */}
        <div className="absolute inset-0 rounded-xl pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-1/[0.03] via-transparent to-chart-2/[0.02]" />
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-1/10">
                  <Activity className="h-4 w-4 text-chart-1" />
                </div>
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="mt-1 text-muted-foreground/80">
                  {description}
                </CardDescription>
              )}
            </div>

            {/* Toggle button */}
            <button
              onClick={() => setShowDaily(!showDaily)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                showDaily
                  ? "bg-chart-2/10 text-chart-2"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {showDaily ? "По дням" : "Накопительно"}
            </button>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 12, left: 12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-cumulative)" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="var(--color-cumulative)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--color-cumulative)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-amount)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-amount)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="dateLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                tick={{ fill: "var(--muted-foreground)" }}
                interval="preserveStartEnd"
                minTickGap={30}
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
                cursor={{
                  stroke: "var(--border)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const item = payload[0]?.payload
                      return item?.dateLabel || ""
                    }}
                    formatter={(value, name) => (
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-muted-foreground">
                          {name === "cumulative" ? "Всего" : "За день"}
                        </span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatMoney(Number(value))} ₽
                        </span>
                      </div>
                    )}
                  />
                }
              />
              {/* Budget limit line */}
              {budgetLimit && (
                <ReferenceLine
                  y={budgetLimit}
                  stroke="var(--destructive)"
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  strokeOpacity={0.7}
                  label={{
                    value: `Лимит: ${formatCompact(budgetLimit)}`,
                    position: "right",
                    fill: "var(--destructive)",
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                />
              )}
              {/* Cumulative area */}
              {!showDaily && (
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="var(--color-cumulative)"
                  strokeWidth={2.5}
                  fill="url(#fillCumulative)"
                  animationDuration={1000}
                  animationEasing="ease-out"
                  dot={false}
                  activeDot={{
                    r: 6,
                    stroke: "var(--background)",
                    strokeWidth: 2,
                    fill: "var(--color-cumulative)",
                  }}
                />
              )}
              {/* Daily area */}
              {showDaily && (
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-amount)"
                  strokeWidth={2}
                  fill="url(#fillAmount)"
                  animationDuration={800}
                  animationEasing="ease-out"
                  dot={false}
                  activeDot={{
                    r: 5,
                    stroke: "var(--background)",
                    strokeWidth: 2,
                    fill: "var(--color-amount)",
                  }}
                />
              )}
            </AreaChart>
          </ChartContainer>

          {/* Stats grid */}
          {stats && (
            <div className="mt-4 grid grid-cols-4 gap-3 border-t border-border/50 pt-4">
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums">
                  {formatMoney(stats.total)}
                </p>
                <p className="text-xs text-muted-foreground">Всего</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums">
                  {formatMoney(Math.round(stats.dailyAvg))}
                </p>
                <p className="text-xs text-muted-foreground">В среднем/день</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums text-chart-2">
                  {stats.daysWithExpenses}
                </p>
                <p className="text-xs text-muted-foreground">Дней с тратами</p>
              </div>
              <div className="text-center">
                {stats.remainingBudget !== null ? (
                  <>
                    <p
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        stats.remainingBudget < 0
                          ? "text-destructive"
                          : "text-chart-1"
                      )}
                    >
                      {stats.remainingBudget < 0 ? "-" : ""}
                      {formatMoney(Math.abs(stats.remainingBudget))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.remainingBudget < 0 ? "Перерасход" : "Осталось"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold tabular-nums text-destructive">
                      {formatMoney(stats.maxDay.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Макс. день</p>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
