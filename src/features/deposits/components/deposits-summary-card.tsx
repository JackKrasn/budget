import { motion } from 'framer-motion'
import { Landmark, TrendingUp, Coins, PiggyBank } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { DepositsSummary } from '@/lib/api'

interface DepositsSummaryCardProps {
  summary: DepositsSummary
  currency?: string
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

export function DepositsSummaryCard({ summary, currency = 'RUB' }: DepositsSummaryCardProps) {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency

  const formatAmount = (amount: number | undefined | null) => {
    if (amount == null) return '0'
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const stats = [
    {
      label: 'Активных депозитов',
      value: summary.totalDeposits.toString(),
      icon: Landmark,
      color: 'text-primary',
      bgColor: 'from-primary/10 to-primary/5',
    },
    {
      label: 'Начальная сумма',
      value: `${formatAmount(summary.totalPrincipal)} ${currencySymbol}`,
      icon: Coins,
      color: 'text-blue-500',
      bgColor: 'from-blue-500/10 to-blue-500/5',
    },
    {
      label: 'Текущая стоимость',
      value: `${formatAmount(summary.totalCurrentValue)} ${currencySymbol}`,
      icon: PiggyBank,
      color: 'text-violet-500',
      bgColor: 'from-violet-500/10 to-violet-500/5',
    },
    {
      label: 'Заработано',
      value: `+${formatAmount(summary.totalInterestEarned)} ${currencySymbol}`,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'from-emerald-500/10 to-emerald-500/5',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/40 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/30">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-5 relative overflow-hidden"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-50`} />

                <div className="relative">
                  <div className={`flex items-center gap-2 ${stat.color} mb-2`}>
                    <stat.icon className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
