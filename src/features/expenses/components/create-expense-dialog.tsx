import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Switch } from '@/components/ui/switch'

function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useCreateExpense, useExpenseCategories } from '../hooks'
import { useAccounts } from '@/features/accounts'
import { useFunds } from '@/features/funds'
import { TagSelector } from './tag-selector'
import {
  Wallet,
  Plus,
  X,
  CalendarIcon,
  TrendingDown,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { getIconByName } from '@/lib/icon-registry'
import { AccountIcon } from '@/components/ui/account-icon'

const formSchema = z.object({
  categoryId: z.string().min(1, 'Выберите категорию'),
  accountId: z.string().min(1, 'Выберите счёт'),
  amount: z.string().min(1, 'Введите сумму'),
  currency: z.string().min(1, 'Выберите валюту'),
  date: z.string().min(1, 'Введите дату'),
  description: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  useFundAllocation: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface FundAllocation {
  fundId: string
  fundName: string
  fundColor: string
  assetId: string
  assetName: string
  amount: number
  maxAmount: number
}

interface DefaultExpenseValues {
  categoryId?: string
  accountId?: string
  amount?: number
  currency?: string
  date?: string
  description?: string
}

interface CreateExpenseDialogProps {
  children: React.ReactNode
  defaultAccountId?: string
  /** Предзаполненные значения для формы */
  defaultValues?: DefaultExpenseValues
  /** Контролируемое состояние открытия диалога */
  open?: boolean
  /** Callback при изменении состояния открытия */
  onOpenChange?: (open: boolean) => void
  /** Callback после успешного создания расхода */
  onSuccess?: (expenseId: string) => void
}

const CURRENCY_CONFIG: Record<string, { symbol: string; name: string }> = {
  RUB: { symbol: '₽', name: 'RUB' },
  USD: { symbol: '$', name: 'USD' },
  EUR: { symbol: '€', name: 'EUR' },
  GEL: { symbol: '₾', name: 'GEL' },
  TRY: { symbol: '₺', name: 'TRY' },
}

function getCurrencySymbol(currency: string): string {
  return CURRENCY_CONFIG[currency]?.symbol ?? currency
}

export function CreateExpenseDialog({
  children,
  defaultAccountId,
  defaultValues,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: CreateExpenseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Поддержка контролируемого и неконтролируемого состояния
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }
  const [fundAllocations, setFundAllocations] = useState<FundAllocation[]>([])
  const [selectedFundId, setSelectedFundId] = useState<string>('')
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [fundAmount, setFundAmount] = useState<string>('')

  const createExpense = useCreateExpense()
  const { data: categoriesData } = useExpenseCategories()
  const { data: accountsData } = useAccounts()
  const { data: fundsData } = useFunds()

  const categories = categoriesData?.data ?? []
  const accounts = accountsData?.data ?? []
  const funds = useMemo(() => fundsData?.data ?? [], [fundsData?.data])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: defaultValues?.categoryId || '',
      accountId: defaultValues?.accountId || defaultAccountId || '',
      amount: defaultValues?.amount?.toString() || '',
      currency: defaultValues?.currency || 'RUB',
      date: defaultValues?.date || new Date().toISOString().split('T')[0],
      description: defaultValues?.description || '',
      tagIds: [],
      useFundAllocation: false,
    },
  })

  const watchedAmount = form.watch('amount')
  const watchedCurrency = form.watch('currency')
  const totalAmount = parseFloat(watchedAmount || '0')
  const totalFromFunds = fundAllocations.reduce((sum, a) => sum + a.amount, 0)
  const remainingAmount = Math.max(0, totalAmount - totalFromFunds)
  const selectedAccountId = form.watch('accountId')
  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId)
  const currencySymbol = getCurrencySymbol(watchedCurrency)

  // Available funds with currency assets
  const availableFunds = useMemo(() => {
    return funds.filter((f) => {
      if (f.fund.status !== 'active') return false
      if (fundAllocations.some((a) => a.fundId === f.fund.id)) return false
      return f.assets.some(
        (a) =>
          a.asset.typeCode === 'currency' &&
          a.asset.currency === watchedCurrency &&
          a.amount > 0
      )
    })
  }, [funds, fundAllocations, watchedCurrency])

  // Selected fund data
  const selectedFund = useMemo(() => {
    return funds.find((f) => f.fund.id === selectedFundId)
  }, [funds, selectedFundId])

  // Available assets for selected fund
  const availableAssets = useMemo(() => {
    if (!selectedFund) return []
    return selectedFund.assets.filter(
      (a) =>
        a.asset.typeCode === 'currency' &&
        a.asset.currency === watchedCurrency &&
        a.amount > 0
    )
  }, [selectedFund, watchedCurrency])

  // Auto-set currency when account changes
  useEffect(() => {
    if (selectedAccount) {
      form.setValue('currency', selectedAccount.currency)
    }
  }, [selectedAccount, form])

  // Auto-select single asset when fund is selected
  useEffect(() => {
    if (availableAssets.length === 1 && !selectedAssetId) {
      setSelectedAssetId(availableAssets[0].asset.id)
    }
  }, [availableAssets, selectedAssetId])

  // Reset fund allocations when currency changes
  useEffect(() => {
    if (fundAllocations.length > 0) {
      setFundAllocations([])
    }
    setSelectedFundId('')
    setSelectedAssetId('')
    setFundAmount('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedCurrency])

  const addFundAllocation = () => {
    if (!selectedFundId || !selectedAssetId || !fundAmount) return

    const fund = funds.find((f) => f.fund.id === selectedFundId)
    if (!fund) return

    const asset = fund.assets.find((a) => a.asset.id === selectedAssetId)
    if (!asset) return

    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) return

    if (fundAllocations.some((a) => a.fundId === selectedFundId)) {
      return
    }

    setFundAllocations([
      ...fundAllocations,
      {
        fundId: selectedFundId,
        fundName: fund.fund.name,
        fundColor: fund.fund.color,
        assetId: selectedAssetId,
        assetName: asset.asset.name,
        amount,
        maxAmount: asset.amount,
      },
    ])
    setSelectedFundId('')
    setSelectedAssetId('')
    setFundAmount('')
  }

  const removeFundAllocation = (fundId: string) => {
    setFundAllocations(fundAllocations.filter((a) => a.fundId !== fundId))
  }

  const setMaxAmount = () => {
    const asset = availableAssets.find((a) => a.asset.id === selectedAssetId)
    if (asset) {
      const maxAvailable = Math.min(asset.amount, remainingAmount || totalAmount || asset.amount)
      setFundAmount(maxAvailable.toString())
    }
  }

  async function onSubmit(values: FormValues) {
    // Собираем все allocations включая незавершённый ввод
    const allAllocations = [...fundAllocations]

    // Если пользователь выбрал фонд и ввёл сумму, но не нажал "+", добавляем автоматически
    if (selectedFundId && selectedAssetId && fundAmount) {
      const amount = parseFloat(fundAmount)
      if (!isNaN(amount) && amount > 0 && !allAllocations.some((a) => a.fundId === selectedFundId)) {
        const fund = funds.find((f) => f.fund.id === selectedFundId)
        const asset = fund?.assets.find((a) => a.asset.id === selectedAssetId)
        if (fund && asset) {
          allAllocations.push({
            fundId: selectedFundId,
            fundName: fund.fund.name,
            fundColor: fund.fund.color,
            assetId: selectedAssetId,
            assetName: asset.asset.name,
            amount,
            maxAmount: asset.amount,
          })
        }
      }
    }

    // Backend ожидает только fundId и amount
    const allocationsToSend =
      allAllocations.length > 0
        ? allAllocations.map((a) => ({
            fundId: a.fundId,
            amount: a.amount,
          }))
        : undefined

    try {
      const result = await createExpense.mutateAsync({
        categoryId: values.categoryId,
        accountId: values.accountId,
        amount: parseFloat(values.amount),
        currency: values.currency,
        date: values.date,
        description: values.description || undefined,
        tagIds: values.tagIds || [],
        fundAllocations: allocationsToSend,
      })

      form.reset()
      setFundAllocations([])
      setOpen(false)
      onSuccess?.(result.id)
    } catch {
      // Error handled in mutation
    }
  }

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setFundAllocations([])
      setSelectedFundId('')
      setSelectedAssetId('')
      setFundAmount('')
    }
  }, [open])

  // Update accountId when defaultAccountId changes
  useEffect(() => {
    if (defaultAccountId) {
      form.setValue('accountId', defaultAccountId)
    }
  }, [defaultAccountId, form])

  // Update form when defaultValues change (for controlled mode with prefilled values)
  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        categoryId: defaultValues.categoryId || '',
        accountId: defaultValues.accountId || defaultAccountId || '',
        amount: defaultValues.amount?.toString() || '',
        currency: defaultValues.currency || 'RUB',
        date: defaultValues.date || new Date().toISOString().split('T')[0],
        description: defaultValues.description || '',
        tagIds: [],
        useFundAllocation: false,
      })
    }
  }, [open, defaultValues, defaultAccountId, form])

  const hasFundsWithCurrency = availableFunds.length > 0 || fundAllocations.length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px] p-0 gap-0 bg-background">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500/20 to-orange-500/20 ring-1 ring-rose-500/30">
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Новый расход
            </DialogTitle>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
            <div className="px-5 py-4 space-y-3">
              {/* Account Selection */}
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Счёт списания
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background border-border/60 hover:border-border transition-colors">
                          <SelectValue placeholder="Выберите счёт" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            <div className="flex items-center justify-between gap-4 w-full">
                              <div className="flex items-center gap-2">
                                <AccountIcon
                                  bankName={acc.bank_name}
                                  typeCode={acc.type_code}
                                  color={acc.color}
                                  size="sm"
                                  showBackground={false}
                                />
                                <span className="font-medium">{acc.name}</span>
                              </div>
                              <span className="text-muted-foreground tabular-nums">
                                {(acc.current_balance ?? 0).toLocaleString(
                                  'ru-RU'
                                )}{' '}
                                {getCurrencySymbol(acc.currency)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount & Currency Row */}
              <div className="grid grid-cols-[1fr,80px] gap-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        Сумма
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            className="h-10 text-base font-semibold pl-3 pr-10 bg-background border-border/60 hover:border-border transition-colors tabular-nums"
                            {...field}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                            {currencySymbol}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        Валюта
                      </FormLabel>
                      <FormControl>
                        <div className="flex h-10 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-sm font-medium">
                          {CURRENCY_CONFIG[field.value]?.name ?? field.value}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Категория
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background border-border/60 hover:border-border transition-colors">
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => {
                          const Icon = getIconByName(cat.icon)
                          return (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex h-6 w-6 items-center justify-center rounded-md"
                                  style={{
                                    backgroundColor: `${cat.color}20`,
                                  }}
                                >
                                  <Icon
                                    className="h-3.5 w-3.5"
                                    style={{ color: cat.color }}
                                  />
                                </div>
                                <span className="font-medium">{cat.name}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Дата
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full h-10 pl-3 text-left font-normal bg-background border-border/60 hover:border-border transition-colors justify-start',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                            {field.value ? (
                              <span className="font-medium">
                                {format(parseDateString(field.value), 'd MMM yyyy', {
                                  locale: ru,
                                })}
                              </span>
                            ) : (
                              <span>Выберите дату</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value
                              ? parseDateString(field.value)
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(formatDateToString(date))
                            }
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date(2020, 0, 1)
                          }
                          locale={ru}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Описание
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Необязательное описание..."
                        className="h-10 bg-background border-border/60 hover:border-border transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <FormField
                control={form.control}
                name="tagIds"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TagSelector
                        selectedTagIds={field.value || []}
                        onTagsChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fund Allocation Section */}
            {hasFundsWithCurrency && (
              <div className="border-t border-border/40">
                <div className="px-5 py-3">
                  <FormField
                    control={form.control}
                    name="useFundAllocation"
                    render={({ field }) => (
                      <div
                        className={cn(
                          'rounded-xl border-2 transition-all duration-200',
                          field.value
                            ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5'
                            : 'border-border/40 bg-muted/50 hover:border-border/60'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className="w-full p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                field.value
                                  ? 'bg-emerald-500/20 text-emerald-600'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              <Wallet className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  Из фонда
                                </span>
                                {field.value && fundAllocations.length > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-emerald-500/20 text-emerald-700 border-0 text-xs px-1.5 py-0"
                                  >
                                    <Sparkles className="h-3 w-3 mr-0.5" />
                                    {fundAllocations.length}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </button>

                        {/* Expanded Fund Allocation Panel */}
                        {field.value && (
                          <div className="px-4 pb-4 space-y-3">
                            {/* Allocations List */}
                            {fundAllocations.length > 0 && (
                              <div className="space-y-2">
                                {fundAllocations.map((allocation) => (
                                  <div
                                    key={allocation.fundId}
                                    className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/40"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="h-3 w-3 rounded-full"
                                        style={{
                                          backgroundColor: allocation.fundColor,
                                        }}
                                      />
                                      <div>
                                        <p className="font-medium text-sm">
                                          {allocation.fundName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {allocation.assetName}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="secondary"
                                        className="font-semibold tabular-nums"
                                      >
                                        -{allocation.amount.toLocaleString('ru-RU')}{' '}
                                        {currencySymbol}
                                      </Badge>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() =>
                                          removeFundAllocation(allocation.fundId)
                                        }
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}

                                {/* Summary */}
                                <div className="flex items-center justify-between pt-2 px-1 text-sm">
                                  <span className="text-muted-foreground">
                                    Собственные средства:
                                  </span>
                                  <span
                                    className={cn(
                                      'font-semibold tabular-nums',
                                      remainingAmount === 0
                                        ? 'text-emerald-600'
                                        : ''
                                    )}
                                  >
                                    {remainingAmount.toLocaleString('ru-RU')}{' '}
                                    {currencySymbol}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Add New Allocation */}
                            {availableFunds.length > 0 && (
                              <div className="space-y-2 pt-2">
                                {/* Fund Selector */}
                                <Select
                                  value={selectedFundId}
                                  onValueChange={(value) => {
                                    setSelectedFundId(value)
                                    setSelectedAssetId('')
                                    setFundAmount('')
                                  }}
                                >
                                  <SelectTrigger className="bg-background border-border/60">
                                    <SelectValue placeholder="Выбрать фонд..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableFunds.map((fund) => {
                                      const currencyAsset = fund.assets.find(
                                        (a) =>
                                          a.asset.typeCode === 'currency' &&
                                          a.asset.currency === watchedCurrency
                                      )
                                      return (
                                        <SelectItem
                                          key={fund.fund.id}
                                          value={fund.fund.id}
                                        >
                                          <div className="flex items-center gap-3 w-full">
                                            <div
                                              className="h-3 w-3 rounded-full"
                                              style={{
                                                backgroundColor: fund.fund.color,
                                              }}
                                            />
                                            <span className="font-medium">
                                              {fund.fund.name}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground tabular-nums">
                                              {currencyAsset?.amount.toLocaleString(
                                                'ru-RU'
                                              ) ?? 0}{' '}
                                              {currencySymbol}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>

                                {/* Asset Selector (if multiple) */}
                                {selectedFundId && availableAssets.length > 1 && (
                                  <Select
                                    value={selectedAssetId}
                                    onValueChange={setSelectedAssetId}
                                  >
                                    <SelectTrigger className="bg-background border-border/60">
                                      <SelectValue placeholder="Выбрать счёт фонда..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableAssets.map((asset) => (
                                        <SelectItem
                                          key={asset.asset.id}
                                          value={asset.asset.id}
                                        >
                                          <div className="flex items-center justify-between gap-3 w-full">
                                            <span>{asset.asset.name}</span>
                                            <span className="text-muted-foreground tabular-nums">
                                              {asset.amount.toLocaleString(
                                                'ru-RU'
                                              )}{' '}
                                              {currencySymbol}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}

                                {/* Amount Input */}
                                {selectedFundId && selectedAssetId && (
                                  <div className="flex gap-2">
                                    <div className="relative flex-1">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Сумма из фонда"
                                        value={fundAmount}
                                        onChange={(e) =>
                                          setFundAmount(e.target.value)
                                        }
                                        className="pr-16 bg-background border-border/60 tabular-nums"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                        onClick={setMaxAmount}
                                      >
                                        MAX
                                      </Button>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="icon"
                                      onClick={addFundAllocation}
                                      disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                                      className="shrink-0"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* No funds available message */}
                            {availableFunds.length === 0 &&
                              fundAllocations.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                  Нет фондов с активами в {currencySymbol}
                                </p>
                              )}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-5 py-3 border-t border-border/40 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-9"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1 h-9 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-lg shadow-rose-500/25"
                disabled={createExpense.isPending}
              >
                {createExpense.isPending ? 'Создание...' : 'Добавить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
