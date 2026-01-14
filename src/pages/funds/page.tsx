import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Wallet, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useFunds,
  useDeleteFund,
  FundCard,
  CreateFundDialog,
  ContributionDialog,
  WithdrawalDialog,
} from '@/features/funds'
import type { FundBalance } from '@/lib/api/types'

const CURRENCY_OPTIONS = [
  { value: 'RUB', label: 'RUB', symbol: '₽' },
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'EUR', label: 'EUR', symbol: '€' },
  { value: 'GEL', label: 'GEL', symbol: '₾' },
  { value: 'TRY', label: 'TRY', symbol: '₺' },
]

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function FundsPage() {
  const [baseCurrency, setBaseCurrency] = useState('RUB')
  const { data, isLoading, error } = useFunds({ baseCurrency })
  const deleteFund = useDeleteFund()
  const [selectedFund, setSelectedFund] = useState<FundBalance | null>(null)
  const [contributionOpen, setContributionOpen] = useState(false)
  const [withdrawalOpen, setWithdrawalOpen] = useState(false)

  const funds = data?.data ?? []
  const summary = data?.summary
  const currencySymbol = CURRENCY_OPTIONS.find(c => c.value === baseCurrency)?.symbol ?? '₽'
  const activeFunds = funds.filter((f) => f.fund.status === 'active')
  const pausedFunds = funds.filter((f) => f.fund.status === 'paused')
  const completedFunds = funds.filter((f) => f.fund.status === 'completed')

  const handleDelete = (fund: FundBalance) => {
    if (confirm(`Вы уверены, что хотите удалить фонд "${fund.fund.name}"?`)) {
      deleteFund.mutate(fund.fund.id)
    }
  }

  const handleDeposit = (fund: FundBalance) => {
    setSelectedFund(fund)
    setContributionOpen(true)
  }

  const handleWithdraw = (fund: FundBalance) => {
    setSelectedFund(fund)
    setWithdrawalOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Фонды
          </h1>
          <p className="mt-1 text-muted-foreground">
            Распределение средств по целевым фондам
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={baseCurrency} onValueChange={setBaseCurrency}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label} {currency.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CreateFundDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Новый фонд
            </Button>
          </CreateFundDialog>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего в фондах</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(summary?.totalBase ?? 0)} {currencySymbol}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <span className="text-lg font-bold text-chart-2">%</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Распределяется от дохода
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {summary?.totalDistributionPercentage ?? 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <span className="text-lg font-bold text-chart-3">#</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Активных фондов</p>
                <p className="text-xl font-bold tabular-nums">
                  {activeFunds.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Ошибка загрузки: {error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Funds Content */}
      {!isLoading && !error && (
        <>
          {/* Active Funds */}
          {activeFunds.length > 0 ? (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {activeFunds.map((fund) => (
                <motion.div key={fund.fund.id} variants={item}>
                  <FundCard
                    fund={fund}
                    onDeposit={() => handleDeposit(fund)}
                    onWithdraw={() => handleWithdraw(fund)}
                    onDelete={() => handleDelete(fund)}
                  />
                </motion.div>
              ))}

              {/* Add New Fund Card */}
              <motion.div variants={item}>
                <CreateFundDialog>
                  <Card className="flex h-full min-h-[200px] cursor-pointer items-center justify-center border-dashed border-border/50 bg-card/30 transition-all hover:border-border hover:bg-card/50">
                    <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-muted-foreground">
                        Добавить фонд
                      </p>
                    </CardContent>
                  </Card>
                </CreateFundDialog>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/30"
            >
              <Wallet className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium">Нет фондов</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Создайте первый фонд для накопления
                </p>
              </div>
              <CreateFundDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать фонд
                </Button>
              </CreateFundDialog>
            </motion.div>
          )}

          {/* Paused Funds */}
          {pausedFunds.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-muted-foreground">
                Приостановлены ({pausedFunds.length})
              </h2>
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {pausedFunds.map((fund) => (
                  <motion.div key={fund.fund.id} variants={item}>
                    <FundCard
                      fund={fund}
                      onDeposit={() => handleDeposit(fund)}
                      onWithdraw={() => handleWithdraw(fund)}
                      onDelete={() => handleDelete(fund)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Completed Funds */}
          {completedFunds.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-muted-foreground">
                Завершены ({completedFunds.length})
              </h2>
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {completedFunds.map((fund) => (
                  <motion.div key={fund.fund.id} variants={item}>
                    <FundCard
                      fund={fund}
                      onDelete={() => handleDelete(fund)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </>
      )}

      {/* Contribution Dialog */}
      <ContributionDialog
        fund={selectedFund}
        open={contributionOpen}
        onOpenChange={setContributionOpen}
      />

      {/* Withdrawal Dialog */}
      <WithdrawalDialog
        fund={selectedFund}
        open={withdrawalOpen}
        onOpenChange={setWithdrawalOpen}
      />
    </div>
  )
}
