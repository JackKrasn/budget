import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarIcon,
  Landmark,
  TrendingUp,
  Home,
  ShoppingBag,
  Calendar as CalendarLucide,
  Plane,
  Wallet,
  PiggyBank,
  Gift,
  Car,
  Briefcase,
  GraduationCap,
  Heart,
  ArrowRight,
  Clock,
  Percent,
  Banknote,
  ChevronRight,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useCreateDeposit } from '../hooks'
import { useFunds } from '@/features/funds/hooks'

const CURRENCIES = [
  { value: 'RUB', label: 'Рубль', symbol: '₽' },
  { value: 'USD', label: 'Доллар', symbol: '$' },
  { value: 'EUR', label: 'Евро', symbol: '€' },
  { value: 'GEL', label: 'Лари', symbol: '₾' },
  { value: 'TRY', label: 'Лира', symbol: '₺' },
]

const ACCRUAL_PERIODS = [
  { value: 'monthly', label: 'Ежемесячно', short: '1 мес' },
  { value: 'quarterly', label: 'Ежеквартально', short: '3 мес' },
  { value: 'annually', label: 'Ежегодно', short: '12 мес' },
  { value: 'at_maturity', label: 'В конце срока', short: 'Срок' },
]

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

const FUND_ICONS: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  home: Home,
  'shopping-bag': ShoppingBag,
  calendar: CalendarLucide,
  plane: Plane,
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  gift: Gift,
  car: Car,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  heart: Heart,
}

const formSchema = z.object({
  name: z.string().min(3, 'Минимум 3 символа'),
  fundId: z.string().min(1, 'Выберите фонд'),
  currency: z.string().min(1, 'Выберите валюту'),
  principalAmount: z.string().min(1, 'Введите сумму'),
  interestRate: z.string().min(1, 'Введите ставку'),
  termMonths: z.string().min(1, 'Введите срок'),
  accrualPeriod: z.enum(['monthly', 'quarterly', 'annually', 'at_maturity']),
  hasCapitalization: z.boolean(),
  startDate: z.date({ message: 'Выберите дату открытия' }),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateDepositDialogProps {
  children: React.ReactNode
}

// Animated number display component
function AnimatedValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="tabular-nums"
    >
      {value.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      {suffix}
    </motion.span>
  )
}

export function CreateDepositDialog({ children }: CreateDepositDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const createDeposit = useCreateDeposit()
  const { data: fundsData, isLoading: isLoadingFunds } = useFunds({ status: 'active' })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      fundId: '',
      currency: 'RUB',
      principalAmount: '',
      interestRate: '',
      termMonths: '12',
      accrualPeriod: 'monthly',
      hasCapitalization: true,
      startDate: new Date(),
      notes: '',
    },
  })

  const watchedValues = form.watch()

  // Calculate projected yield
  const projectedYield = useMemo(() => {
    const principal = parseFloat(watchedValues.principalAmount) || 0
    const rate = parseFloat(watchedValues.interestRate) || 0
    const months = parseInt(watchedValues.termMonths) || 0
    const hasCapitalization = watchedValues.hasCapitalization
    const accrualPeriod = watchedValues.accrualPeriod

    if (!principal || !rate || !months) return null

    const annualRate = rate / 100
    let periodsPerYear: number

    switch (accrualPeriod) {
      case 'monthly':
        periodsPerYear = 12
        break
      case 'quarterly':
        periodsPerYear = 4
        break
      case 'annually':
        periodsPerYear = 1
        break
      case 'at_maturity':
        periodsPerYear = 12 / months
        break
      default:
        periodsPerYear = 12
    }

    const totalPeriods = (months / 12) * periodsPerYear
    const periodRate = annualRate / periodsPerYear

    let finalAmount: number
    if (hasCapitalization) {
      finalAmount = principal * Math.pow(1 + periodRate, totalPeriods)
    } else {
      finalAmount = principal * (1 + annualRate * (months / 12))
    }

    const monthlyYield = (finalAmount - principal) / months

    return {
      finalAmount,
      yield: finalAmount - principal,
      monthlyYield,
      effectiveRate: ((finalAmount / principal - 1) / (months / 12)) * 100,
      maturityDate: addMonths(watchedValues.startDate || new Date(), months),
    }
  }, [watchedValues])

  async function onSubmit(values: FormValues) {
    try {
      await createDeposit.mutateAsync({
        name: values.name,
        fundId: values.fundId,
        currency: values.currency,
        principalAmount: parseFloat(values.principalAmount),
        interestRate: parseFloat(values.interestRate),
        termMonths: parseInt(values.termMonths),
        accrualPeriod: values.accrualPeriod,
        hasCapitalization: values.hasCapitalization,
        startDate: format(values.startDate, 'yyyy-MM-dd'),
        notes: values.notes || undefined,
      })
      form.reset()
      setStep(1)
      setOpen(false)
    } catch {
      // Error is handled in mutation
    }
  }

  const currencySymbol = CURRENCY_SYMBOLS[watchedValues.currency] || watchedValues.currency

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setStep(1)
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-[680px] gap-0 border-border/50 shadow-2xl">
        {/* Premium Header with gradient */}
        <div className="relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-amber-500/[0.05]" />
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />

          <DialogHeader className="relative px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg shadow-primary/25">
                    <Landmark className="h-7 w-7 text-primary-foreground" />
                  </div>
                </motion.div>
                <div className="space-y-1">
                  <DialogTitle className="text-xl font-semibold tracking-tight">
                    Новый депозит
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Добавьте банковский вклад с автоматическим расчётом
                  </DialogDescription>
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1.5">
                {[1, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStep(s)}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      step === s
                        ? 'w-6 bg-primary'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                  />
                ))}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable form content */}
        <div className="overflow-y-auto max-h-[calc(92vh-180px)] px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Deposit Name - Premium Input */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Название депозита
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Input
                                placeholder="Сбербанк — Лучший %"
                                className="h-12 bg-muted/30 border-muted-foreground/10 pl-4 pr-4 text-base transition-all focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                {...field}
                              />
                              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-amber-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Fund Selection - Card Style */}
                    <FormField
                      control={form.control}
                      name="fundId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Привязка к фонду
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isLoadingFunds}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 bg-muted/30 border-muted-foreground/10 transition-all hover:bg-muted/50 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20">
                                <SelectValue placeholder="Выберите фонд" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fundsData?.data.map((fundBalance) => {
                                const FundIcon = FUND_ICONS[fundBalance.fund.icon] || Wallet
                                return (
                                  <SelectItem
                                    key={fundBalance.fund.id}
                                    value={fundBalance.fund.id}
                                    className="py-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                        <FundIcon className="h-4 w-4 text-primary" />
                                      </div>
                                      <span className="font-medium">{fundBalance.fund.name}</span>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Депозит отобразится как актив выбранного фонда
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Currency Selection - Visual Cards */}
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Валюта вклада
                          </FormLabel>
                          <div className="grid grid-cols-5 gap-2">
                            {CURRENCIES.map((currency) => (
                              <button
                                key={currency.value}
                                type="button"
                                onClick={() => field.onChange(currency.value)}
                                className={cn(
                                  'relative flex flex-col items-center gap-0.5 rounded-xl p-3 transition-all duration-200',
                                  'border-2 hover:border-primary/50',
                                  field.value === currency.value
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-transparent bg-muted/40 hover:bg-muted/60'
                                )}
                              >
                                <span className="text-2xl font-bold">{currency.symbol}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                  {currency.value}
                                </span>
                                {field.value === currency.value && (
                                  <motion.div
                                    layoutId="currency-indicator"
                                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Amount and Rate - Premium Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="principalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <Banknote className="h-3.5 w-3.5" />
                              Сумма вклада
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="100 000"
                                  className="h-12 bg-muted/30 border-muted-foreground/10 pr-10 text-lg font-semibold tabular-nums transition-all focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                  {...field}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
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
                        name="interestRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <Percent className="h-3.5 w-3.5" />
                              Ставка годовых
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="21.0"
                                  className="h-12 bg-muted/30 border-muted-foreground/10 pr-10 text-lg font-semibold tabular-nums transition-all focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                  {...field}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                                  %
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Term and Period */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="termMonths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5" />
                              Срок вклада
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  placeholder="12"
                                  className="h-12 bg-muted/30 border-muted-foreground/10 pr-16 text-lg font-semibold tabular-nums transition-all focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                  {...field}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  мес
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accrualPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Период начисления
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-muted/30 border-muted-foreground/10 transition-all hover:bg-muted/50 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20">
                                  <SelectValue placeholder="Выберите" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ACCRUAL_PERIODS.map((period) => (
                                  <SelectItem key={period.value} value={period.value}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{period.label}</span>
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

                    {/* Next Step Button */}
                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full h-12 text-base font-medium gap-2 group"
                    >
                      Далее
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Capitalization Toggle - Premium Card */}
                    <FormField
                      control={form.control}
                      name="hasCapitalization"
                      render={({ field }) => (
                        <FormItem>
                          <div className={cn(
                            'relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300',
                            field.value
                              ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
                              : 'border-muted-foreground/10 bg-muted/30'
                          )}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                                  field.value
                                    ? 'bg-emerald-500/20'
                                    : 'bg-muted-foreground/10'
                                )}>
                                  <TrendingUp className={cn(
                                    'h-6 w-6 transition-colors',
                                    field.value ? 'text-emerald-500' : 'text-muted-foreground'
                                  )} />
                                </div>
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base font-semibold cursor-pointer">
                                    Капитализация процентов
                                  </FormLabel>
                                  <FormDescription className="text-sm">
                                    Проценты прибавляются к телу вклада
                                  </FormDescription>
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="scale-125"
                                />
                              </FormControl>
                            </div>
                            {field.value && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4 pt-4 border-t border-emerald-500/20"
                              >
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                  Эффективная ставка будет выше номинальной за счёт сложного процента
                                </p>
                              </motion.div>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Start Date - Premium Calendar */}
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            Дата открытия вклада
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full h-12 justify-start text-left font-normal bg-muted/30 border-muted-foreground/10 hover:bg-muted/50 transition-all',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                                  {field.value ? (
                                    <span className="font-medium">
                                      {format(field.value, 'd MMMM yyyy', { locale: ru })}
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
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date('2020-01-01')
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Yield Preview */}
                    <AnimatePresence>
                      {projectedYield && projectedYield.yield > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3"
                        >
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Прогноз доходности
                          </p>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">На конец срока</p>
                              <p className="text-lg font-semibold tabular-nums">
                                <AnimatedValue value={projectedYield.finalAmount} />
                                <span className="text-sm ml-1 text-muted-foreground">{currencySymbol}</span>
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Доход</p>
                              <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                +<AnimatedValue value={projectedYield.yield} />
                                <span className="text-sm ml-1">{currencySymbol}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 pt-2 border-t border-border/30 text-xs text-muted-foreground">
                            <span>
                              ~{projectedYield.monthlyYield.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}/мес
                            </span>
                            <span>•</span>
                            <span>
                              до {format(projectedYield.maturityDate, 'd MMM yyyy', { locale: ru })}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Заметки
                            <span className="ml-2 text-muted-foreground/50 normal-case tracking-normal">
                              (опционально)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Банк, условия, особенности..."
                              className="resize-none bg-muted/30 border-muted-foreground/10 min-h-[80px] transition-all focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={() => setStep(1)}
                      >
                        Назад
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-12 gap-2 text-base font-medium group relative overflow-hidden"
                        disabled={createDeposit.isPending}
                      >
                        {createDeposit.isPending ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Создание...
                          </>
                        ) : (
                          <>
                            Создать депозит
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
