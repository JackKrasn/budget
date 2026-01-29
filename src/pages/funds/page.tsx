import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Wallet,
  AlertCircle,
  Loader2,
  Package,
  LayoutGrid,
  List,
  Search,
  X,
  TrendingUp,
  Home,
  ShoppingBag,
  Calendar,
  Plane,
  PiggyBank,
  Gift,
  Car,
  Briefcase,
  GraduationCap,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFunds, useDeleteFund, FundCard, CreateFundDialog, AssetsByFundList } from '@/features/funds'
import type { FundBalance } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type ViewMode = 'cards' | 'table'

const FUND_ICONS: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  home: Home,
  'shopping-bag': ShoppingBag,
  calendar: Calendar,
  plane: Plane,
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  gift: Gift,
  car: Car,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  heart: Heart,
}

const CURRENCY_OPTIONS = [
  { value: 'RUB', label: 'RUB', symbol: '₽' },
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'EUR', label: 'EUR', symbol: '€' },
  { value: 'GEL', label: 'GEL', symbol: '₾' },
  { value: 'TRY', label: 'TRY', symbol: '₺' },
]

const STATUS_LABELS: Record<string, string> = {
  active: 'Активный',
  paused: 'Приостановлен',
  completed: 'Завершён',
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
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
  const navigate = useNavigate()
  const [baseCurrency, setBaseCurrency] = useState('RUB')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, error } = useFunds({ baseCurrency })
  const deleteFund = useDeleteFund()

  const funds = data?.data ?? []
  const summary = data?.summary
  const currencySymbol =
    CURRENCY_OPTIONS.find((c) => c.value === baseCurrency)?.symbol ?? '₽'

  // Filter funds by search query
  const filteredFunds = useMemo(() => {
    if (!searchQuery.trim()) return funds
    const query = searchQuery.toLowerCase()
    return funds.filter((f) => f.fund.name.toLowerCase().includes(query))
  }, [funds, searchQuery])

  const activeFunds = filteredFunds.filter((f) => f.fund.status === 'active')
  const pausedFunds = filteredFunds.filter((f) => f.fund.status === 'paused')
  const completedFunds = filteredFunds.filter((f) => f.fund.status === 'completed')

  const handleDelete = (fund: FundBalance) => {
    if (confirm(`Вы уверены, что хотите удалить фонд "${fund.fund.name}"?`)) {
      deleteFund.mutate(fund.fund.id)
    }
  }

  const renderFundCard = (fund: FundBalance) => (
    <motion.div key={fund.fund.id} variants={item}>
      <FundCard fund={fund} onDelete={() => handleDelete(fund)} />
    </motion.div>
  )

  const renderTableRow = (fund: FundBalance) => {
    const Icon = FUND_ICONS[fund.fund.icon] || Wallet

    return (
      <TableRow
        key={fund.fund.id}
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => navigate(`/funds/${fund.fund.id}`)}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${fund.fund.color}20` }}
            >
              <Icon className="h-4 w-4" style={{ color: fund.fund.color }} />
            </div>
            <div>
              <p className="font-medium">{fund.fund.name}</p>
              {fund.fund.is_virtual && (
                <span className="text-xs text-muted-foreground">Виртуальный</span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              fund.fund.status === 'active' && 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10',
              fund.fund.status === 'paused' && 'border-amber-500/50 text-amber-600 bg-amber-500/10',
              fund.fund.status === 'completed' && 'border-blue-500/50 text-blue-600 bg-blue-500/10'
            )}
          >
            {STATUS_LABELS[fund.fund.status] || fund.fund.status}
          </Badge>
        </TableCell>
        <TableCell>
          {fund.assets.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {fund.assets.slice(0, 2).map((asset) => (
                <Badge key={asset.asset.id} variant="secondary" className="text-xs font-normal">
                  {asset.asset.name}
                </Badge>
              ))}
              {fund.assets.length > 2 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  +{fund.assets.length - 2}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <span className="font-semibold tabular-nums">
            {formatMoney(fund.totalBase)} {currencySymbol}
          </span>
        </TableCell>
      </TableRow>
    )
  }

  const renderFundsGrid = (fundsList: FundBalance[], showAddCard = false, listKey = 'default') => (
    <motion.div
      key={`grid-${listKey}`}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {fundsList.map(renderFundCard)}
      {showAddCard && (
        <motion.div variants={item}>
          <CreateFundDialog>
            <Card className="flex h-full min-h-[200px] cursor-pointer items-center justify-center border-dashed border-border/50 bg-card/30 transition-all hover:border-border hover:bg-card/50">
              <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Добавить фонд</p>
              </CardContent>
            </Card>
          </CreateFundDialog>
        </motion.div>
      )}
    </motion.div>
  )

  const renderFundsTable = (fundsList: FundBalance[], listKey = 'default') => (
    <motion.div
      key={`table-${listKey}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-border/50 bg-card/30 overflow-hidden"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Фонд</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Активы</TableHead>
            <TableHead className="text-right">Баланс</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fundsList.map(renderTableRow)}
        </TableBody>
      </Table>
    </motion.div>
  )

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
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Фонды</h1>
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
                <p className="text-xl font-bold tabular-nums">{activeFunds.length}</p>
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
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Tabs for Funds and Assets */}
      <Tabs defaultValue="funds" className="space-y-6">
        <TabsList>
          <TabsTrigger value="funds" className="gap-2">
            <Wallet className="h-4 w-4" />
            Фонды
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2">
            <Package className="h-4 w-4" />
            Активы
          </TabsTrigger>
        </TabsList>

        {/* Funds Tab */}
        <TabsContent value="funds" className="space-y-6">
          {/* Search and View Mode Controls */}
          {funds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center justify-between gap-4"
            >
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Search results indicator */}
                {searchQuery && (
                  <span className="text-sm text-muted-foreground">
                    Найдено: {filteredFunds.length}
                  </span>
                )}

                {/* View mode toggle */}
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(v) => v && setViewMode(v as ViewMode)}
                  className="bg-muted/50 p-1 rounded-lg"
                >
                  <ToggleGroupItem value="cards" aria-label="Карточки" className="px-3">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Карточки</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="table" aria-label="Таблица" className="px-3">
                    <List className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Таблица</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </motion.div>
          )}

          {!isLoading && !error && (
            <>
              {/* Active Funds */}
              {activeFunds.length > 0 ? (
                viewMode === 'cards' ? (
                  renderFundsGrid(activeFunds, true, 'active')
                ) : (
                  renderFundsTable(activeFunds, 'active')
                )
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/30"
                >
                  <Wallet className="h-12 w-12 text-muted-foreground/50" />
                  <div className="text-center">
                    <p className="font-medium">
                      {searchQuery ? 'Ничего не найдено' : 'Нет фондов'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchQuery
                        ? 'Попробуйте изменить поисковый запрос'
                        : 'Создайте первый фонд для накопления'}
                    </p>
                  </div>
                  {!searchQuery && (
                    <CreateFundDialog>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Создать фонд
                      </Button>
                    </CreateFundDialog>
                  )}
                </motion.div>
              )}

              {/* Paused Funds */}
              {pausedFunds.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h2 className="text-lg font-medium text-muted-foreground">
                    Приостановлены ({pausedFunds.length})
                  </h2>
                  {viewMode === 'cards' ? (
                    renderFundsGrid(pausedFunds, false, 'paused')
                  ) : (
                    <div className="opacity-60">
                      {renderFundsTable(pausedFunds, 'paused')}
                    </div>
                  )}
                </div>
              )}

              {/* Completed Funds */}
              {completedFunds.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h2 className="text-lg font-medium text-muted-foreground">
                    Завершены ({completedFunds.length})
                  </h2>
                  {viewMode === 'cards' ? (
                    renderFundsGrid(completedFunds, false, 'completed')
                  ) : (
                    <div className="opacity-60">
                      {renderFundsTable(completedFunds, 'completed')}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <AssetsByFundList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
