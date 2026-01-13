"use client"

import * as React from "react"
import { Label, Pie, PieChart, Cell, Sector } from "recharts"
import { motion } from "framer-motion"
import { PieChart as PieChartIcon, TrendingDown } from "lucide-react"

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

interface CategoryData {
  categoryId: string
  categoryName: string
  categoryColor: string
  amount: number
}

interface ExpenseCategoryChartProps {
  data: CategoryData[]
  title?: string
  description?: string
  className?: string
  onCategoryClick?: (categoryId: string) => void
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Premium color palette for charts when category colors are not available
const PREMIUM_COLORS = [
  "oklch(0.65 0.18 160)", // emerald
  "oklch(0.60 0.15 200)", // teal
  "oklch(0.75 0.15 85)",  // gold
  "oklch(0.65 0.20 280)", // violet
  "oklch(0.70 0.18 30)",  // coral
  "oklch(0.55 0.15 250)", // indigo
  "oklch(0.72 0.16 140)", // mint
  "oklch(0.68 0.14 50)",  // orange
]

// Active shape for hover effect
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
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={(outerRadius || 0) + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.2))",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          cursor: "pointer",
        }}
      />
    </g>
  )
}

export function ExpenseCategoryChart({
  data,
  title = "Расходы по категориям",
  description,
  className,
  onCategoryClick,
}: ExpenseCategoryChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)

  const totalAmount = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.amount, 0)
  }, [data])

  // Sort by amount and take top categories
  const chartData = React.useMemo(() => {
    const sorted = [...data].sort((a, b) => b.amount - a.amount)
    const top = sorted.slice(0, 8)
    const others = sorted.slice(8)

    if (others.length > 0) {
      const othersSum = others.reduce((acc, curr) => acc + curr.amount, 0)
      top.push({
        categoryId: "others",
        categoryName: "Прочее",
        categoryColor: "oklch(0.60 0.01 260)",
        amount: othersSum,
      })
    }

    return top.map((item, index) => ({
      ...item,
      fill: item.categoryColor || PREMIUM_COLORS[index % PREMIUM_COLORS.length],
      percentage: totalAmount > 0 ? ((item.amount / totalAmount) * 100).toFixed(1) : "0",
    }))
  }, [data, totalAmount])

  // Generate chart config from data
  const chartConfig = React.useMemo<ChartConfig>(() => {
    const config: ChartConfig = {
      amount: { label: "Сумма" },
    }
    chartData.forEach((item) => {
      config[item.categoryId] = {
        label: item.categoryName,
        color: item.fill,
      }
    })
    return config
  }, [chartData])

  const handleClick = React.useCallback((categoryId: string) => {
    if (onCategoryClick && categoryId !== "others") {
      onCategoryClick(categoryId)
    }
  }, [onCategoryClick])

  const isClickable = !!onCategoryClick

  if (data.length === 0) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChartIcon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <div className="text-center text-muted-foreground">
            <TrendingDown className="mx-auto h-12 w-12 opacity-20" />
            <p className="mt-4">Нет данных для отображения</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden", className)}>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.02] via-transparent to-chart-2/[0.02] pointer-events-none" />

        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <PieChartIcon className="h-4 w-4 text-primary" />
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
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Chart */}
            <ChartContainer
              config={chartConfig}
              className="mx-auto lg:mx-0 aspect-square h-[320px] w-[320px] shrink-0"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name) => (
                        <div className="flex items-center justify-between gap-8">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="font-mono font-semibold tabular-nums">
                            {formatMoney(Number(value))} ₽
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="categoryName"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  cornerRadius={4}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                  onClick={isClickable ? (data) => handleClick(data.categoryId) : undefined}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                  style={isClickable ? { cursor: "pointer" } : undefined}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.categoryId}
                      fill={entry.fill}
                      stroke="transparent"
                      style={{
                        transition: "all 0.2s ease",
                        opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.4,
                        cursor: isClickable && entry.categoryId !== "others" ? "pointer" : undefined,
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
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) - 6}
                              className="fill-foreground font-bold tabular-nums text-xl"
                            >
                              {formatMoney(totalAmount)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 14}
                              className="fill-muted-foreground text-xs"
                            >
                              Всего
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Legend */}
            <div className="flex-1 min-w-0 lg:pl-4">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
                {chartData.map((item, index) => {
                  const LegendItem = isClickable && item.categoryId !== "others" ? motion.button : motion.div
                  return (
                    <LegendItem
                      key={item.categoryId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.3 }}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors text-left",
                        activeIndex === index && "bg-muted/50",
                        isClickable && item.categoryId !== "others" && "hover:bg-muted/60 cursor-pointer"
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(undefined)}
                      onClick={isClickable && item.categoryId !== "others" ? () => handleClick(item.categoryId) : undefined}
                    >
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="flex-1 truncate text-sm">
                        {item.categoryName}
                      </span>
                      <span className="text-sm font-medium tabular-nums text-muted-foreground">
                        {formatMoney(item.amount)} ₽
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                        {item.percentage}%
                      </span>
                    </LegendItem>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
