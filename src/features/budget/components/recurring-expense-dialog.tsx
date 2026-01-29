import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  CalendarClock,
  Calendar,
  CalendarRange,
  ChevronDown,
  Wallet,
  PiggyBank,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { CategoryIcon, FundIcon, DayPicker } from '@/components/common'
import { AccountIcon } from '@/components/ui/account-icon'
import { cn } from '@/lib/utils'
import type {
  RecurringExpenseWithCategory,
  RecurringExpenseFrequency,
  ExpenseCategoryWithTags,
  Fund,
  AccountWithType,
} from '@/lib/api/types'
import type { Currency } from '@/types'
import { CURRENCY_SYMBOLS } from '@/types'

const CURRENCIES: Currency[] = ['RUB', 'USD', 'EUR', 'GEL', 'TRY']

const FREQUENCIES: { value: RecurringExpenseFrequency; label: string; shortLabel: string; icon: typeof Calendar }[] = [
  { value: 'daily', label: 'Ежедневно', shortLabel: 'День', icon: CalendarClock },
  { value: 'weekly', label: 'Еженедельно', shortLabel: 'Нед', icon: CalendarDays },
  { value: 'monthly', label: 'Ежемесячно', shortLabel: 'Мес', icon: Calendar },
  { value: 'yearly', label: 'Ежегодно', shortLabel: 'Год', icon: CalendarRange },
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'Понедельник', short: 'Пн' },
  { value: 1, label: 'Вторник', short: 'Вт' },
  { value: 2, label: 'Среда', short: 'Ср' },
  { value: 3, label: 'Четверг', short: 'Чт' },
  { value: 4, label: 'Пятница', short: 'Пт' },
  { value: 5, label: 'Суббота', short: 'Сб' },
  { value: 6, label: 'Воскресенье', short: 'Вс' },
]

const MONTHS = [
  { value: 1, label: 'Январь', short: 'Янв' },
  { value: 2, label: 'Февраль', short: 'Фев' },
  { value: 3, label: 'Март', short: 'Мар' },
  { value: 4, label: 'Апрель', short: 'Апр' },
  { value: 5, label: 'Май', short: 'Май' },
  { value: 6, label: 'Июнь', short: 'Июн' },
  { value: 7, label: 'Июль', short: 'Июл' },
  { value: 8, label: 'Август', short: 'Авг' },
  { value: 9, label: 'Сентябрь', short: 'Сен' },
  { value: 10, label: 'Октябрь', short: 'Окт' },
  { value: 11, label: 'Ноябрь', short: 'Ноя' },
  { value: 12, label: 'Декабрь', short: 'Дек' },
]

const formSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  currency: z.string().min(1, 'Выберите валюту'),
  accountId: z.string().optional(),
  fundId: z.string().optional(),
  amount: z.string().min(1, 'Введите сумму'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  dayOfMonth: z.string().optional(),
  dayOfWeek: z.string().optional(),
  monthOfYear: z.string().optional(),
  isActive: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.frequency === 'weekly' && !data.dayOfWeek) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Выберите день недели',
      path: ['dayOfWeek'],
    })
  }
  if (data.frequency === 'monthly' && !data.dayOfMonth) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Выберите день месяца',
      path: ['dayOfMonth'],
    })
  }
  if (data.frequency === 'yearly') {
    if (!data.dayOfMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Выберите день месяца',
        path: ['dayOfMonth'],
      })
    }
    if (!data.monthOfYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Выберите месяц',
        path: ['monthOfYear'],
      })
    }
  }
})

type FormData = z.infer<typeof formSchema>

interface DefaultValues {
  categoryId?: string
  dayOfMonth?: number
  frequency?: RecurringExpenseFrequency
}

interface RecurringExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: RecurringExpenseWithCategory | null
  categories: ExpenseCategoryWithTags[]
  accounts: AccountWithType[]
  funds: Fund[]
  /** Значения по умолчанию для новых шаблонов */
  defaultValues?: DefaultValues
  onSubmit: (data: {
    categoryId: string
    accountId?: string
    fundId?: string
    name: string
    amount: number
    currency: string
    frequency: RecurringExpenseFrequency
    dayOfMonth?: number
    dayOfWeek?: number
    monthOfYear?: number
    isActive: boolean
  }) => Promise<void>
  isPending?: boolean
}

export function RecurringExpenseDialog({
  open,
  onOpenChange,
  expense,
  categories,
  accounts,
  funds,
  defaultValues,
  onSubmit,
  isPending,
}: RecurringExpenseDialogProps) {
  const isEditing = !!expense
  const [optionsOpen, setOptionsOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      currency: 'RUB',
      accountId: '',
      fundId: '',
      amount: '',
      frequency: 'monthly',
      dayOfMonth: '1',
      dayOfWeek: '',
      monthOfYear: '',
      isActive: true,
    },
  })

  const selectedCurrency = form.watch('currency')
  const selectedFrequency = form.watch('frequency')
  const accountId = form.watch('accountId')
  const fundId = form.watch('fundId')

  // Filter accounts by selected currency
  const filteredAccounts = accounts.filter(
    (account) => account.currency === selectedCurrency
  )

  // При открытии с данными для редактирования
  useEffect(() => {
    if (expense) {
      form.reset({
        name: expense.name,
        categoryId: expense.category_id,
        currency: expense.currency || 'RUB',
        accountId: expense.account_id ?? '',
        fundId: expense.fund_id ?? '',
        amount: String(expense.amount),
        frequency: expense.frequency || 'monthly',
        dayOfMonth: expense.day_of_month ? String(expense.day_of_month) : '',
        dayOfWeek: expense.day_of_week !== undefined ? String(expense.day_of_week) : '',
        monthOfYear: expense.month_of_year ? String(expense.month_of_year) : '',
        isActive: expense.is_active,
      })
      // Open options if account or fund is set
      if (expense.account_id || expense.fund_id) {
        setOptionsOpen(true)
      }
    } else {
      // Применяем defaultValues если есть
      form.reset({
        name: '',
        categoryId: defaultValues?.categoryId || '',
        currency: 'RUB',
        accountId: '',
        fundId: '',
        amount: '',
        frequency: defaultValues?.frequency || 'monthly',
        dayOfMonth: defaultValues?.dayOfMonth ? String(defaultValues.dayOfMonth) : '1',
        dayOfWeek: '',
        monthOfYear: '',
        isActive: true,
      })
      setOptionsOpen(false)
    }
  }, [expense, form, defaultValues])

  // Reset account when currency changes (account must match currency)
  useEffect(() => {
    const currentAccountId = form.getValues('accountId')
    if (currentAccountId) {
      const account = accounts.find((a) => a.id === currentAccountId)
      if (account && account.currency !== selectedCurrency) {
        form.setValue('accountId', '')
      }
    }
  }, [selectedCurrency, accounts, form])

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      categoryId: data.categoryId,
      accountId: data.accountId || undefined,
      fundId: data.fundId || undefined,
      name: data.name,
      amount: parseFloat(data.amount),
      currency: data.currency,
      frequency: data.frequency,
      dayOfMonth: data.dayOfMonth ? parseInt(data.dayOfMonth, 10) : undefined,
      dayOfWeek: data.dayOfWeek ? parseInt(data.dayOfWeek, 10) : undefined,
      monthOfYear: data.monthOfYear ? parseInt(data.monthOfYear, 10) : undefined,
      isActive: data.isActive,
    })
    form.reset()
    onOpenChange(false)
  }

  // Check if optional fields are filled
  const hasOptionalFields = !!(accountId || fundId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle className="text-lg">
            {isEditing ? 'Редактировать шаблон' : 'Новый шаблон расхода'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="px-5 pb-5 space-y-4">
              {/* Row 1: Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Название</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Например: Аренда квартиры"
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 2: Category + Amount + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Категория</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Выберите" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <CategoryIcon
                                  code={cat.code}
                                  iconName={cat.icon}
                                  color={cat.color}
                                  size="sm"
                                />
                                <span>{cat.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-[1fr_80px] gap-2">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Сумма</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-9"
                            {...field}
                          />
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
                        <FormLabel className="text-xs text-muted-foreground">Валюта</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {CURRENCY_SYMBOLS[currency]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Frequency Section */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <FormLabel className="text-xs font-medium">Периодичность</FormLabel>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {FREQUENCIES.map((freq) => {
                          const Icon = freq.icon
                          const isSelected = field.value === freq.value
                          return (
                            <button
                              key={freq.value}
                              type="button"
                              onClick={() => field.onChange(freq.value)}
                              className={cn(
                                'flex flex-col items-center gap-1 rounded-md border py-2 px-1 transition-all text-center',
                                'hover:border-primary/50 hover:bg-background',
                                isSelected
                                  ? 'border-primary bg-background shadow-sm'
                                  : 'border-transparent bg-background/50'
                              )}
                            >
                              <Icon
                                className={cn(
                                  'h-4 w-4',
                                  isSelected ? 'text-primary' : 'text-muted-foreground'
                                )}
                              />
                              <span
                                className={cn(
                                  'text-[10px] font-medium leading-none',
                                  isSelected ? 'text-primary' : 'text-muted-foreground'
                                )}
                              >
                                {freq.shortLabel}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conditional Schedule Fields */}
                <AnimatePresence mode="wait">
                  {selectedFrequency === 'weekly' && (
                    <motion.div
                      key="weekly"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <FormField
                        control={form.control}
                        name="dayOfWeek"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-xs text-muted-foreground">День недели</FormLabel>
                            <div className="flex gap-1">
                              {DAYS_OF_WEEK.map((day) => {
                                const isSelected = field.value === String(day.value)
                                return (
                                  <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => field.onChange(String(day.value))}
                                    className={cn(
                                      'flex-1 h-8 rounded-md text-xs font-medium transition-all',
                                      'hover:bg-primary/10',
                                      isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background text-muted-foreground border'
                                    )}
                                    title={day.label}
                                  >
                                    {day.short}
                                  </button>
                                )
                              })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  {selectedFrequency === 'monthly' && (
                    <motion.div
                      key="monthly"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <FormField
                        control={form.control}
                        name="dayOfMonth"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-xs text-muted-foreground">День месяца</FormLabel>
                            <FormControl>
                              <DayPicker
                                value={parseInt(field.value || '1', 10)}
                                onChange={(day) => field.onChange(String(day))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  {selectedFrequency === 'yearly' && (
                    <motion.div
                      key="yearly"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-3"
                    >
                      <FormField
                        control={form.control}
                        name="monthOfYear"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-xs text-muted-foreground">Месяц</FormLabel>
                            <div className="grid grid-cols-6 gap-1">
                              {MONTHS.map((month) => {
                                const isSelected = field.value === String(month.value)
                                return (
                                  <button
                                    key={month.value}
                                    type="button"
                                    onClick={() => field.onChange(String(month.value))}
                                    className={cn(
                                      'h-7 rounded text-[10px] font-medium transition-all',
                                      'hover:bg-primary/10',
                                      isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background text-muted-foreground border'
                                    )}
                                    title={month.label}
                                  >
                                    {month.short}
                                  </button>
                                )
                              })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dayOfMonth"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-xs text-muted-foreground">День месяца</FormLabel>
                            <FormControl>
                              <DayPicker
                                value={parseInt(field.value || '1', 10)}
                                onChange={(day) => field.onChange(String(day))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Collapsible Optional Section */}
              <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                      'hover:bg-muted/50',
                      hasOptionalFields ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <Wallet className="h-3.5 w-3.5" />
                        <PiggyBank className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs">Счёт и фонд</span>
                      {hasOptionalFields && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          указано
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        optionsOpen && 'rotate-180'
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <FormField
                      control={form.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Счёт списания</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Не выбран" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="text-muted-foreground">Не выбран</span>
                              </SelectItem>
                              {filteredAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex items-center gap-2">
                                    <AccountIcon
                                      bankName={account.bank_name}
                                      typeCode={account.type_code}
                                      size="sm"
                                    />
                                    <span>{account.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {filteredAccounts.length === 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              Нет счетов в {selectedCurrency}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fundId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Фонд</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Не выбран" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="text-muted-foreground">Не выбран</span>
                              </SelectItem>
                              {funds.map((fund) => (
                                <SelectItem key={fund.id} value={fund.id}>
                                  <div className="flex items-center gap-2">
                                    <FundIcon name={fund.name} color={fund.color} size="sm" />
                                    <span>{fund.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Footer */}
            <DialogFooter className="border-t bg-muted/30 px-5 py-3">
              <div className="flex w-full items-center justify-between">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="scale-90"
                        />
                      </FormControl>
                      <FormLabel className="text-xs font-normal text-muted-foreground cursor-pointer">
                        Активен
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" size="sm" disabled={isPending}>
                    {isEditing ? 'Сохранить' : 'Создать'}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
