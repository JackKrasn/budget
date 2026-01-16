import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  CalendarIcon,
  Landmark,
  Percent,
  Clock,
  Wallet,
  Tag,
  FileText,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react'
import { useCreateCredit } from '../hooks'
import { useAccounts } from '@/features/accounts'
import { useExpenseCategories } from '@/features/expenses'
import { CategoryIcon } from '@/components/common'

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

function formatCurrency(value: string): string {
  const num = parseFloat(value.replace(/\s/g, ''))
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('ru-RU').format(num)
}

const formSchema = z.object({
  name: z.string().min(1, 'Введите название кредита'),
  principalAmount: z.string().min(1, 'Введите сумму кредита'),
  isExistingCredit: z.boolean(),
  currentBalance: z.string().optional(),
  interestRate: z.string().min(1, 'Введите процентную ставку'),
  termType: z.enum(['months', 'endDate']),
  termMonths: z.string().optional(),
  endDate: z.string().optional(),
  monthlyPayment: z.string().optional(), // Платёж от банка (если были ЧДП)
  startDate: z.string().min(1, 'Выберите дату начала'),
  paymentDay: z.string().optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.termType === 'months') {
      return !!data.termMonths && data.termMonths.length > 0
    }
    return !!data.endDate && data.endDate.length > 0
  },
  {
    message: 'Укажите срок в месяцах или дату последнего платежа',
    path: ['termMonths'],
  }
)

type FormValues = z.infer<typeof formSchema>

interface CreateCreditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
}

const inputVariants = {
  focus: { scale: 1.01, transition: { duration: 0.2 } },
  blur: { scale: 1, transition: { duration: 0.2 } },
}

export function CreateCreditDialog({ open, onOpenChange }: CreateCreditDialogProps) {
  const createCredit = useCreateCredit()
  const { data: accountsData } = useAccounts()
  const { data: categoriesData } = useExpenseCategories()

  const accounts = accountsData?.data ?? []
  const categories = categoriesData?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      principalAmount: '',
      isExistingCredit: false,
      currentBalance: '',
      interestRate: '',
      termType: 'months',
      termMonths: '',
      endDate: '',
      monthlyPayment: '',
      startDate: new Date().toISOString().split('T')[0],
      paymentDay: '15',
      accountId: '',
      categoryId: '',
      notes: '',
    },
  })

  const isExistingCredit = form.watch('isExistingCredit')
  const termType = form.watch('termType')
  const principalAmount = form.watch('principalAmount')
  const interestRate = form.watch('interestRate')
  const termMonths = form.watch('termMonths')

  // Calculate monthly payment preview
  const calculatedMonthlyPayment = (() => {
    const p = parseFloat(principalAmount || '0')
    const r = parseFloat(interestRate || '0') / 100 / 12
    const n = parseInt(termMonths || '0')
    if (!p || !r || !n || isNaN(p) || isNaN(r) || isNaN(n)) return null
    const payment = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    return isFinite(payment) ? payment : null
  })()

  async function onSubmit(values: FormValues) {
    try {
      await createCredit.mutateAsync({
        name: values.name,
        principalAmount: parseFloat(values.principalAmount),
        currentBalance: values.isExistingCredit && values.currentBalance
          ? parseFloat(values.currentBalance)
          : undefined,
        interestRate: parseFloat(values.interestRate),
        // Если указана дата окончания — передаём endDate, иначе termMonths
        ...(values.termType === 'endDate' && values.endDate
          ? { endDate: values.endDate }
          : { termMonths: parseInt(values.termMonths || '0', 10) }),
        // Платёж от банка (если указан)
        monthlyPayment: values.monthlyPayment ? parseFloat(values.monthlyPayment) : undefined,
        startDate: values.startDate,
        paymentDay: values.paymentDay ? parseInt(values.paymentDay, 10) : undefined,
        accountId: values.accountId || undefined,
        categoryId: values.categoryId || undefined,
        notes: values.notes || undefined,
      })

      form.reset()
      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] overflow-hidden p-0 sm:max-w-[720px] bg-background border-border shadow-2xl">
        {/* Decorative header accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* Header */}
        <DialogHeader className="shrink-0 px-8 pt-8 pb-6 border-b border-border/40 bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                <Landmark className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Новый кредит
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Добавьте информацию о кредите для отслеживания платежей
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Credit Name - Hero Input */}
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Название кредита
                      </FormLabel>
                      <FormControl>
                        <motion.div variants={inputVariants} whileFocus="focus">
                          <Input
                            placeholder="Ипотека, Автокредит, Потребительский..."
                            className="h-14 text-lg font-medium border-2 border-border/50 bg-background  rounded-xl focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-muted-foreground/50"
                            {...field}
                          />
                        </motion.div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Key Parameters Grid */}
              <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  Параметры кредита
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Principal Amount */}
                  <FormField
                    control={form.control}
                    name="principalAmount"
                    render={({ field }) => (
                      <FormItem className="relative group">
                        <div className="absolute -inset-px bg-gradient-to-b from-emerald-500/20 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative p-4 rounded-xl border-2 border-border/50 bg-card  group-focus-within:border-emerald-500/50 transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                              <Wallet className="h-4 w-4 text-emerald-500" />
                            </div>
                            <FormLabel className="text-xs font-medium text-muted-foreground">
                              Сумма
                            </FormLabel>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="5 000 000"
                                className="h-12 text-xl font-semibold tabular-nums border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30"
                                {...field}
                              />
                              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg text-muted-foreground/50 font-medium">
                                ₽
                              </span>
                            </div>
                          </FormControl>
                        </div>
                        <FormMessage className="mt-2" />
                      </FormItem>
                    )}
                  />

                  {/* Interest Rate */}
                  <FormField
                    control={form.control}
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem className="relative group">
                        <div className="absolute -inset-px bg-gradient-to-b from-amber-500/20 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative p-4 rounded-xl border-2 border-border/50 bg-card  group-focus-within:border-amber-500/50 transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                              <Percent className="h-4 w-4 text-amber-500" />
                            </div>
                            <FormLabel className="text-xs font-medium text-muted-foreground">
                              Ставка
                            </FormLabel>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="12.5"
                                className="h-12 text-xl font-semibold tabular-nums border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30"
                                {...field}
                              />
                              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg text-muted-foreground/50 font-medium">
                                %
                              </span>
                            </div>
                          </FormControl>
                        </div>
                        <FormMessage className="mt-2" />
                      </FormItem>
                    )}
                  />

                  {/* Term - conditional based on termType */}
                  {termType === 'months' ? (
                    <FormField
                      control={form.control}
                      name="termMonths"
                      render={({ field }) => (
                        <FormItem className="relative group">
                          <div className="absolute -inset-px bg-gradient-to-b from-blue-500/20 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                          <div className="relative p-4 rounded-xl border-2 border-border/50 bg-card group-focus-within:border-blue-500/50 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                                <Clock className="h-4 w-4 text-blue-500" />
                              </div>
                              <FormLabel className="text-xs font-medium text-muted-foreground">
                                Срок
                              </FormLabel>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  placeholder="240"
                                  className="h-12 text-xl font-semibold tabular-nums border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30"
                                  {...field}
                                />
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/50 font-medium">
                                  мес
                                </span>
                              </div>
                            </FormControl>
                          </div>
                          <FormMessage className="mt-2" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="relative group">
                          <div className="absolute -inset-px bg-gradient-to-b from-blue-500/20 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                          <div className="relative p-4 rounded-xl border-2 border-border/50 bg-card group-focus-within:border-blue-500/50 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                                <CalendarIcon className="h-4 w-4 text-blue-500" />
                              </div>
                              <FormLabel className="text-xs font-medium text-muted-foreground">
                                Дата окончания
                              </FormLabel>
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      'h-12 w-full justify-start text-xl font-semibold tabular-nums p-0 hover:bg-transparent',
                                      !field.value && 'text-muted-foreground/30'
                                    )}
                                  >
                                    {field.value ? (
                                      format(parseDateString(field.value), 'dd.MM.yyyy', { locale: ru })
                                    ) : (
                                      'ДД.ММ.ГГГГ'
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? parseDateString(field.value) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      field.onChange(formatDateToString(date))
                                    }
                                  }}
                                  locale={ru}
                                  captionLayout="dropdown"
                                  startMonth={new Date(2020, 0)}
                                  endMonth={new Date(2060, 11)}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormMessage className="mt-2" />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Term Type Toggle */}
                <FormField
                  control={form.control}
                  name="termType"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => field.onChange('months')}
                          className={cn(
                            'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border-2',
                            field.value === 'months'
                              ? 'bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400'
                              : 'border-border/50 text-muted-foreground hover:border-border'
                          )}
                        >
                          Указать месяцев
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange('endDate')}
                          className={cn(
                            'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border-2',
                            field.value === 'endDate'
                              ? 'bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400'
                              : 'border-border/50 text-muted-foreground hover:border-border'
                          )}
                        >
                          Дата последнего платежа
                        </button>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Monthly Payment Preview */}
                <AnimatePresence>
                  {calculatedMonthlyPayment && termType === 'months' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 border border-emerald-500/20">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                            <ChevronRight className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Расчётный ежемесячный платёж</p>
                            <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(calculatedMonthlyPayment.toFixed(0))} ₽
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>Переплата за весь срок</p>
                          <p className="font-semibold text-foreground">
                            {formatCurrency((calculatedMonthlyPayment * parseInt(termMonths || '0') - parseFloat(principalAmount || '0')).toFixed(0))} ₽
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Date and Payment Day */}
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                className="grid grid-cols-2 gap-4"
              >
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                        Дата начала
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'h-12 px-4 justify-start text-left font-medium border-2 border-border/50 bg-card  rounded-xl hover:bg-muted/50 hover:border-border transition-all',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                              {field.value ? (
                                format(parseDateString(field.value), 'd MMMM yyyy', { locale: ru })
                              ) : (
                                <span>Выберите дату</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? parseDateString(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(formatDateToString(date))
                              }
                            }}
                            locale={ru}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        День платежа
                      </FormLabel>
                      <FormControl>
                        <div className="relative mt-2">
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="15"
                            className="h-12 text-base font-medium tabular-nums border-2 border-border/50 bg-card  rounded-xl focus:border-primary/50 transition-all pr-16"
                            {...field}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            число
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Account & Category */}
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  Привязка к счёту
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Счёт списания</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-2 border-border/50 bg-card  rounded-xl">
                              <SelectValue placeholder="Выберите счёт" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name} ({acc.currency})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Категория расходов</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-2 border-border/50 bg-card  rounded-xl">
                              <SelectValue placeholder="Выберите категорию" />
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
                                  {cat.name}
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
              </motion.div>

              {/* Existing Credit Toggle */}
              <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
              >
                <div className="rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 p-5 space-y-4">
                  <FormField
                    control={form.control}
                    name="isExistingCredit"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-1">
                          <FormLabel className="text-base font-medium cursor-pointer">
                            Существующий кредит
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Включите, если кредит уже частично погашен
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <AnimatePresence>
                    {isExistingCredit && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="currentBalance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">
                                Текущий остаток долга
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="4 200 000"
                                    className="h-12 text-lg font-semibold tabular-nums border-2 border-amber-500/30 bg-amber-500/5 rounded-xl focus:border-amber-500/50 pr-8"
                                    {...field}
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    ₽
                                  </span>
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs">
                                График будет рассчитан от этой суммы
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="monthlyPayment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground flex items-center gap-1.5">
                                Платёж от банка
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[280px]">
                                      <p className="text-xs">
                                        Укажите текущий платёж из банка, если у кредита были частично-досрочные погашения (ЧДП).
                                        Это позволит точнее рассчитать график.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="65 440"
                                    className="h-12 text-lg font-semibold tabular-nums border-2 border-purple-500/30 bg-purple-500/5 rounded-xl focus:border-purple-500/50 pr-8"
                                    {...field}
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    ₽
                                  </span>
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs">
                                Опционально. Используется вместо расчётного аннуитета
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Notes */}
              <motion.div
                custom={5}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
              >
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Примечания
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Дополнительная информация о кредите..."
                          className="min-h-[80px] resize-none border-2 border-border/50 bg-card  rounded-xl focus:border-primary/50 transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            </form>
          </Form>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-8 py-5 border-t border-border bg-muted/50">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 text-base font-medium border-2 rounded-xl hover:bg-muted/50 transition-all"
              onClick={() => onOpenChange(false)}
              disabled={createCredit.isPending}
            >
              Отмена
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              className="flex-1 h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all"
              disabled={createCredit.isPending}
            >
              {createCredit.isPending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                'Создать кредит'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
