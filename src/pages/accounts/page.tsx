import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  CreditCard,
  AlertCircle,
  Loader2,
  ArrowLeftRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  LayoutGrid,
  Layers,
  List,
  ChevronDown,
  ChevronRight,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  useAccounts,
  useDeleteAccount,
  useUpdateAccount,
  AccountCard,
  CreateAccountDialog,
  EditAccountDialog,
  SyncBalanceDialog,
  TransferDialog,
  RepayCreditCardDialog,
} from '@/features/accounts'
import type { AccountWithType } from '@/lib/api/types'
import { getBankByName } from '@/lib/banks'
import { AccountIcon } from '@/components/ui/account-icon'
import { cn } from '@/lib/utils'

type SortField = 'balance' | 'name' | 'created'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'cards' | 'grouped' | 'table'

interface SortConfig {
  field: SortField
  direction: SortDirection
}

interface BankGroup {
  bankName: string | null
  bankLogo?: string
  accounts: AccountWithType[]
  totalBalance: number
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
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

export default function AccountsPage() {
  const [editAccount, setEditAccount] = useState<AccountWithType | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [syncAccount, setSyncAccount] = useState<AccountWithType | null>(null)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [repayAccount, setRepayAccount] = useState<AccountWithType | null>(null)
  const [repayDialogOpen, setRepayDialogOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'balance', direction: 'desc' })
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [bankFilter, setBankFilter] = useState<string>('all')

  const { data, isLoading, error } = useAccounts()
  const deleteAccount = useDeleteAccount()
  const updateAccount = useUpdateAccount()

  const accounts = data?.data ?? []
  const totalBalance = data?.totalBalance ?? 0

  // Get unique bank names for filter
  const uniqueBanks = useMemo(() => {
    const banks = new Set<string>()
    for (const account of accounts) {
      if (account.bank_name) {
        banks.add(account.bank_name)
      }
    }
    return Array.from(banks).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [accounts])

  // Sort function
  const sortAccounts = (accountsToSort: AccountWithType[]) => {
    return [...accountsToSort].sort((a, b) => {
      let comparison = 0
      switch (sortConfig.field) {
        case 'balance':
          comparison = a.current_balance - b.current_balance
          break
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ru')
          break
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return sortConfig.direction === 'desc' ? -comparison : comparison
    })
  }

  // Filter and sort accounts
  const activeAccounts = useMemo(() => {
    let filtered = accounts.filter((a) => !a.is_archived)

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((a) =>
        a.name.toLowerCase().includes(query) ||
        a.bank_name?.toLowerCase().includes(query)
      )
    }

    // Apply bank filter
    if (bankFilter !== 'all') {
      if (bankFilter === '__no_bank__') {
        filtered = filtered.filter((a) => !a.bank_name)
      } else {
        filtered = filtered.filter((a) => a.bank_name === bankFilter)
      }
    }

    return sortAccounts(filtered)
  }, [accounts, sortConfig, searchQuery, bankFilter])

  const archivedAccounts = useMemo(() => {
    const filtered = accounts.filter((a) => a.is_archived)
    return sortAccounts(filtered)
  }, [accounts, sortConfig])

  // Group accounts by bank
  const groupedAccounts = useMemo((): BankGroup[] => {
    const groups = new Map<string, AccountWithType[]>()

    for (const account of activeAccounts) {
      const bankKey = account.bank_name || '__no_bank__'
      const existing = groups.get(bankKey) || []
      groups.set(bankKey, [...existing, account])
    }

    const result: BankGroup[] = []

    // Sort groups: banks with accounts first (sorted by total balance), then "no bank" last
    const sortedEntries = Array.from(groups.entries()).sort(([keyA, accountsA], [keyB, accountsB]) => {
      // "No bank" always last
      if (keyA === '__no_bank__') return 1
      if (keyB === '__no_bank__') return -1

      // Sort by total balance descending
      const totalA = accountsA.reduce((sum, acc) => sum + acc.current_balance, 0)
      const totalB = accountsB.reduce((sum, acc) => sum + acc.current_balance, 0)
      return totalB - totalA
    })

    for (const [bankKey, bankAccounts] of sortedEntries) {
      const bankName = bankKey === '__no_bank__' ? null : bankKey
      const bank = bankName ? getBankByName(bankName) : undefined
      const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.current_balance, 0)

      result.push({
        bankName,
        bankLogo: bank?.logo,
        accounts: bankAccounts,
        totalBalance,
      })
    }

    return result
  }, [activeAccounts])

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split('-') as [SortField, SortDirection]
    setSortConfig({ field, direction })
  }

  const getSortValue = () => `${sortConfig.field}-${sortConfig.direction}`

  const handleEdit = (account: AccountWithType) => {
    setEditAccount(account)
    setEditDialogOpen(true)
  }

  const handleArchive = (id: string, isArchived: boolean) => {
    updateAccount.mutate({
      id,
      data: { isArchived: !isArchived },
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот счёт?')) {
      deleteAccount.mutate(id)
    }
  }

  const handleSyncBalance = (account: AccountWithType) => {
    setSyncAccount(account)
    setSyncDialogOpen(true)
  }

  const handleRepay = (account: AccountWithType) => {
    setRepayAccount(account)
    setRepayDialogOpen(true)
  }

  const toggleGroupCollapse = (bankKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(bankKey)) {
        next.delete(bankKey)
      } else {
        next.add(bankKey)
      }
      return next
    })
  }

  const renderAccountCard = (account: AccountWithType) => (
    <motion.div key={account.id} variants={item}>
      <AccountCard
        account={account}
        onEdit={() => handleEdit(account)}
        onArchive={() => handleArchive(account.id, account.is_archived)}
        onDelete={() => handleDelete(account.id)}
        onSyncBalance={() => handleSyncBalance(account)}
        onRepay={() => handleRepay(account)}
      />
    </motion.div>
  )

  const renderTableRow = (account: AccountWithType) => {
    const currencySymbol = CURRENCY_SYMBOLS[account.currency] || account.currency
    const bank = account.bank_name ? getBankByName(account.bank_name) : undefined

    return (
      <TableRow
        key={account.id}
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => handleEdit(account)}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <AccountIcon
              bankName={account.bank_name}
              typeCode={account.type_code}
              color={account.color}
              size="md"
              showBackground
            />
            <p className="font-medium">{account.name}</p>
          </div>
        </TableCell>
        <TableCell>
          {account.bank_name ? (
            <div className="flex items-center gap-2">
              {bank?.logo && (
                <img src={bank.logo} alt={account.bank_name} className="h-4 w-4 object-contain" />
              )}
              <span className="text-sm">{account.bank_name}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {account.is_credit ? 'Кредитная карта' : account.type_name}
            </span>
            {account.is_archived && (
              <Badge variant="outline" className="text-xs">
                В архиве
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm">{account.currency}</span>
        </TableCell>
        <TableCell className="text-right">
          <span className={cn(
            'font-semibold tabular-nums',
            account.current_balance < 0 && 'text-destructive'
          )}>
            {account.current_balance.toLocaleString('ru-RU', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} {currencySymbol}
          </span>
        </TableCell>
      </TableRow>
    )
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
            Счета
          </h1>
          <p className="mt-1 text-muted-foreground">
            Банковские карты, наличные и депозиты
          </p>
        </div>
        <div className="flex gap-2">
          <TransferDialog>
            <Button variant="outline">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Перевод
            </Button>
          </TransferDialog>
          <CreateAccountDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Новый счёт
            </Button>
          </CreateAccountDialog>
        </div>
      </motion.div>

      {/* View mode and Sort controls */}
      {accounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-4"
        >
          {/* Search and filters row */}
          <div className="flex flex-wrap items-center gap-3">
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

            {/* Bank filter */}
            <Select value={bankFilter} onValueChange={setBankFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Все банки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все банки</SelectItem>
                <SelectItem value="__no_bank__">Без банка</SelectItem>
                {uniqueBanks.map((bank) => {
                  const bankInfo = getBankByName(bank)
                  return (
                    <SelectItem key={bank} value={bank}>
                      <div className="flex items-center gap-2">
                        {bankInfo?.logo && (
                          <img src={bankInfo.logo} alt={bank} className="h-4 w-4 object-contain" />
                        )}
                        {bank}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {/* Sort control */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={getSortValue()} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance-desc">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-3 w-3" />
                      По балансу (убыв.)
                    </div>
                  </SelectItem>
                  <SelectItem value="balance-asc">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-3 w-3" />
                      По балансу (возр.)
                    </div>
                  </SelectItem>
                  <SelectItem value="name-asc">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-3 w-3" />
                      По названию (А-Я)
                    </div>
                  </SelectItem>
                  <SelectItem value="name-desc">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-3 w-3" />
                      По названию (Я-А)
                    </div>
                  </SelectItem>
                  <SelectItem value="created-desc">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-3 w-3" />
                      Сначала новые
                    </div>
                  </SelectItem>
                  <SelectItem value="created-asc">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-3 w-3" />
                      Сначала старые
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4">
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
              <ToggleGroupItem value="grouped" aria-label="По банкам" className="px-3">
                <Layers className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">По банкам</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Таблица" className="px-3">
                <List className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Таблица</span>
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Active filters indicator */}
            {(searchQuery || bankFilter !== 'all') && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Найдено: {activeAccounts.length}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setBankFilter('all')
                  }}
                  className="h-7 px-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Сбросить
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}

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
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего счетов</p>
                <p className="text-xl font-bold tabular-nums">
                  {activeAccounts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CreditCard className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Общий баланс</p>
                <p className="text-xl font-bold tabular-nums">
                  {totalBalance.toLocaleString('ru-RU', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} ₽
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
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Active Accounts */}
      {!isLoading && !error && (
        <>
          {activeAccounts.length > 0 ? (
            <>
              {/* Cards View */}
              {viewMode === 'cards' && (
                <motion.div
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {activeAccounts.map(renderAccountCard)}

                  {/* Add New Account Card */}
                  <motion.div variants={item}>
                    <CreateAccountDialog>
                      <Card className="flex h-full min-h-[180px] cursor-pointer items-center justify-center border-dashed border-border/50 bg-card/30 transition-all hover:border-border hover:bg-card/50">
                        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <Plus className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="font-medium text-muted-foreground">
                            Добавить счёт
                          </p>
                        </CardContent>
                      </Card>
                    </CreateAccountDialog>
                  </motion.div>
                </motion.div>
              )}

              {/* Grouped by Bank View */}
              {viewMode === 'grouped' && (
                <div className="space-y-4">
                  {groupedAccounts.map((group) => {
                    const groupKey = group.bankName || '__no_bank__'
                    const isCollapsed = collapsedGroups.has(groupKey)

                    return (
                      <Collapsible
                        key={groupKey}
                        open={!isCollapsed}
                        onOpenChange={() => toggleGroupCollapse(groupKey)}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-border/50 bg-card/30 overflow-hidden"
                        >
                          {/* Bank Header */}
                          <CollapsibleTrigger asChild>
                            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                {isCollapsed ? (
                                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                                {group.bankLogo ? (
                                  <img
                                    src={group.bankLogo}
                                    alt={group.bankName || ''}
                                    className="h-8 w-8 object-contain rounded"
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="text-left">
                                  <h2 className="font-semibold">
                                    {group.bankName || 'Без банка'}
                                  </h2>
                                  <p className="text-sm text-muted-foreground">
                                    {group.accounts.length} {group.accounts.length === 1 ? 'счёт' : group.accounts.length < 5 ? 'счёта' : 'счетов'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Баланс</p>
                                <p className="font-semibold tabular-nums">
                                  {group.totalBalance.toLocaleString('ru-RU', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} ₽
                                </p>
                              </div>
                            </button>
                          </CollapsibleTrigger>

                          {/* Bank Accounts Grid */}
                          <CollapsibleContent>
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 pt-0"
                              >
                                <motion.div
                                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                                  variants={container}
                                  initial="hidden"
                                  animate="show"
                                >
                                  {group.accounts.map(renderAccountCard)}
                                </motion.div>
                              </motion.div>
                            </AnimatePresence>
                          </CollapsibleContent>
                        </motion.div>
                      </Collapsible>
                    )
                  })}

                  {/* Add New Account Card */}
                  <motion.div
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    variants={container}
                    initial="hidden"
                    animate="show"
                  >
                    <motion.div variants={item}>
                      <CreateAccountDialog>
                        <Card className="flex h-full min-h-[180px] cursor-pointer items-center justify-center border-dashed border-border/50 bg-card/30 transition-all hover:border-border hover:bg-card/50">
                          <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                              <Plus className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-muted-foreground">
                              Добавить счёт
                            </p>
                          </CardContent>
                        </Card>
                      </CreateAccountDialog>
                    </motion.div>
                  </motion.div>
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-border/50 bg-card/30 overflow-hidden"
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Счёт</TableHead>
                        <TableHead>Банк</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Валюта</TableHead>
                        <TableHead className="text-right">Баланс</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeAccounts.map(renderTableRow)}
                    </TableBody>
                  </Table>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/30"
            >
              <CreditCard className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium">Нет счетов</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Добавьте первый счёт для начала работы
                </p>
              </div>
              <CreateAccountDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить счёт
                </Button>
              </CreateAccountDialog>
            </motion.div>
          )}

          {/* Archived Accounts */}
          {archivedAccounts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-muted-foreground">
                В архиве ({archivedAccounts.length})
              </h2>
              {viewMode === 'table' ? (
                <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden opacity-60">
                  <Table>
                    <TableBody>
                      {archivedAccounts.map(renderTableRow)}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <motion.div
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {archivedAccounts.map(renderAccountCard)}
                </motion.div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <EditAccountDialog
        account={editAccount}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Sync Balance Dialog */}
      <SyncBalanceDialog
        account={syncAccount}
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
      />

      {/* Repay Credit Card Dialog */}
      <RepayCreditCardDialog
        creditCard={repayAccount}
        open={repayDialogOpen}
        onOpenChange={setRepayDialogOpen}
      />
    </div>
  )
}
