import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Landmark,
  Plus,
  Filter,
  Search,
  ArrowUpDown,
  AlertTriangle,
  TrendingUp,
  Home,
  ShoppingBag,
  Calendar,
  Plane,
  Wallet,
  PiggyBank,
  Gift,
  Car,
  Briefcase,
  GraduationCap,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  useDeposits,
  useMaturingDeposits,
  DepositCard,
  CreateDepositDialog,
  EditDepositDialog,
  DepositDetailsSheet,
  CloseDepositDialog,
  DeleteDepositDialog,
  DepositsSummaryCard,
} from '@/features/deposits'
import { useFunds } from '@/features/funds/hooks'
import type { Deposit, DepositStatus } from '@/lib/api'

type SortOption = 'maturity' | 'amount' | 'rate' | 'created'

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

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'Активные' },
  { value: 'matured', label: 'Погашенные' },
  { value: 'closed_early', label: 'Закрыты досрочно' },
]

const SORT_OPTIONS = [
  { value: 'maturity', label: 'По дате погашения' },
  { value: 'amount', label: 'По сумме' },
  { value: 'rate', label: 'По ставке' },
  { value: 'created', label: 'По дате создания' },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function DepositsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [fundFilter, setFundFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('maturity')

  // Selected deposit states
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCloseOpen, setIsCloseOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Fetch data
  const { data: depositsData, isLoading, error } = useDeposits(
    statusFilter !== 'all' ? { status: statusFilter as DepositStatus } : undefined
  )
  const { data: fundsData } = useFunds({ status: 'active' })
  const { data: maturingData } = useMaturingDeposits({ days: 30 })

  const deposits = depositsData?.data ?? []
  const summary = depositsData?.summary
  const funds = fundsData?.data ?? []
  const maturingDeposits = maturingData?.data ?? []

  // Filter and sort deposits
  const filteredDeposits = useMemo(() => {
    let result = [...deposits]

    // Filter by fund
    if (fundFilter !== 'all') {
      result = result.filter((d) => d.fundId === fundFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (d) =>
          d.assetName.toLowerCase().includes(query) ||
          d.fundName?.toLowerCase().includes(query) ||
          d.notes?.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'maturity':
          return (a.daysRemaining || 0) - (b.daysRemaining || 0)
        case 'amount':
          return (b.currentAmount || 0) - (a.currentAmount || 0)
        case 'rate':
          return (b.interestRate || 0) - (a.interestRate || 0)
        case 'created': {
          const dateA = typeof a.createdAt === 'string' ? a.createdAt : a.createdAt?.Time || ''
          const dateB = typeof b.createdAt === 'string' ? b.createdAt : b.createdAt?.Time || ''
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        }
        default:
          return 0
      }
    })

    return result
  }, [deposits, fundFilter, searchQuery, sortBy])

  // Event handlers
  const handleDepositClick = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setIsDetailsOpen(true)
  }

  const handleEdit = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setIsEditOpen(true)
    setIsDetailsOpen(false)
  }

  const handleCloseEarly = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setIsCloseOpen(true)
    setIsDetailsOpen(false)
  }

  const handleDelete = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setIsDeleteOpen(true)
    setIsDetailsOpen(false)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Ошибка загрузки: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
            <Landmark className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Депозиты</h1>
            <p className="text-sm text-muted-foreground">
              Управление банковскими вкладами и начислениями
            </p>
          </div>
        </div>

        <CreateDepositDialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Новый депозит
          </Button>
        </CreateDepositDialog>
      </motion.div>

      {/* Maturing Alert */}
      <AnimatePresence>
        {maturingDeposits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 ring-1 ring-amber-500/20"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {maturingDeposits.length === 1
                    ? 'Депозит погашается в ближайшие 30 дней'
                    : `${maturingDeposits.length} депозитов погашаются в ближайшие 30 дней`}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {maturingDeposits.slice(0, 3).map((deposit) => (
                    <Badge
                      key={deposit.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-amber-500/10"
                      onClick={() => handleDepositClick(deposit)}
                    >
                      {deposit.assetName} ({deposit.daysRemaining} дн.)
                    </Badge>
                  ))}
                  {maturingDeposits.length > 3 && (
                    <Badge variant="outline">+{maturingDeposits.length - 3} ещё</Badge>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      {summary && <DepositsSummaryCard summary={summary} />}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск депозитов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Fund Filter */}
        <Select value={fundFilter} onValueChange={setFundFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Фонд" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все фонды</SelectItem>
            {funds.map((fundBalance) => {
              const FundIcon = FUND_ICONS[fundBalance.fund.icon] || Wallet
              return (
                <SelectItem key={fundBalance.fund.id} value={fundBalance.fund.id}>
                  <div className="flex items-center gap-2">
                    <FundIcon className="h-4 w-4" />
                    <span>{fundBalance.fund.name}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Сортировка
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value as SortOption)}
                className={sortBy === option.value ? 'bg-accent' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Deposits Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : filteredDeposits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Landmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Депозиты не найдены</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all' || fundFilter !== 'all'
              ? 'Попробуйте изменить параметры поиска'
              : 'Создайте свой первый депозит'}
          </p>
          {!searchQuery && statusFilter === 'all' && fundFilter === 'all' && (
            <CreateDepositDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Создать депозит
              </Button>
            </CreateDepositDialog>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredDeposits.map((deposit) => (
            <motion.div key={deposit.id} variants={item}>
              <DepositCard
                deposit={deposit}
                onClick={() => handleDepositClick(deposit)}
                onEdit={() => handleEdit(deposit)}
                onDelete={() => handleDelete(deposit)}
                onCloseEarly={
                  deposit.status === 'active'
                    ? () => handleCloseEarly(deposit)
                    : undefined
                }
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Dialogs */}
      <DepositDetailsSheet
        deposit={selectedDeposit}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onEdit={() => selectedDeposit && handleEdit(selectedDeposit)}
        onDelete={() => selectedDeposit && handleDelete(selectedDeposit)}
        onCloseEarly={
          selectedDeposit?.status === 'active'
            ? () => handleCloseEarly(selectedDeposit)
            : undefined
        }
      />

      <EditDepositDialog
        deposit={selectedDeposit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <CloseDepositDialog
        deposit={selectedDeposit}
        open={isCloseOpen}
        onOpenChange={setIsCloseOpen}
      />

      <DeleteDepositDialog
        deposit={selectedDeposit}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </div>
  )
}
