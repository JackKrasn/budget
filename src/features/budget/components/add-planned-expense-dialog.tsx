import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Plus, PiggyBank, CalendarIcon, Sparkles, Banknote, Coins } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryIcon, FundIcon } from '@/components/common'
import { cn } from '@/lib/utils'
import type { ExpenseCategoryWithTags, FundBalance } from '@/lib/api/types'

// Форматирует дату в YYYY-MM-DD без смещения часового пояса
function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Парсит строку YYYY-MM-DD в Date без смещения часового пояса
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
  CNY: '¥',
  GBP: '£',
  AED: 'د.إ',
}

const formSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  fundId: z.string().optional(),
  fundAssetId: z.string().optional(),
  fundedAmount: z.string().optional(),
  plannedAmount: z.string().min(1, 'Введите сумму'),
  plannedDate: z.string().min(1, 'Выберите дату'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface AddPlannedExpenseDialogProps {
  budgetId: string
  year: number
  month: number
  categories: ExpenseCategoryWithTags[]
  funds: FundBalance[]
  onAdd: (data: {
    budgetId: string
    categoryId: string
    fundId?: string
    fundAssetId?: string
    fundedAmount?: number
    name: string
    plannedAmount: number
    currency: string
    plannedDate: string
    notes?: string
  }) => Promise<void>
  isPending?: boolean
}

export function AddPlannedExpenseDialog({
  budgetId,
  year,
  month,
  categories,
  funds,
  onAdd,
  isPending,
}: AddPlannedExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [useFundFinancing, setUseFundFinancing] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Дата по умолчанию — первый день месяца
  const defaultDate = `${year}-${String(month).padStart(2, '0')}-01`

  // Границы месяца для календаря
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      fundId: '',
      fundAssetId: '',
      fundedAmount: '',
      plannedAmount: '',
      plannedDate: defaultDate,
      notes: '',
    },
  })

  const plannedAmount = form.watch('plannedAmount')
  const fundedAmount = form.watch('fundedAmount')
  const selectedFundId = form.watch('fundId')
  const selectedFundAssetId = form.watch('fundAssetId')
  const selectedFundBalance = funds.find(f => f.fund.id === selectedFundId)
  const selectedAsset = selectedFundBalance?.assets.find(a => a.asset.id === selectedFundAssetId)

  // При смене фонда сбрасываем выбранный актив
  const handleFundChange = (fundId: string) => {
    form.setValue('fundId', fundId)
    form.setValue('fundAssetId', '')
  }

  const handleUseFundChange = (checked: boolean) => {
    setUseFundFinancing(checked)
    if (!checked) {
      form.setValue('fundId', '')
      form.setValue('fundAssetId', '')
      form.setValue('fundedAmount', '')
    } else if (plannedAmount) {
      form.setValue('fundedAmount', plannedAmount)
    }
  }

  const handleSubmit = async (data: FormData) => {
    // Определяем валюту: если выбран актив - берём его валюту, иначе RUB
    const fundAsset = selectedFundBalance?.assets.find(a => a.asset.id === data.fundAssetId)
    const currency = fundAsset?.asset.currency || 'RUB'

    await onAdd({
      budgetId,
      categoryId: data.categoryId,
      fundId: useFundFinancing && data.fundId ? data.fundId : undefined,
      fundAssetId: useFundFinancing && data.fundAssetId ? data.fundAssetId : undefined,
      fundedAmount: useFundFinancing && data.fundedAmount ? parseFloat(data.fundedAmount) : undefined,
      name: data.name,
      plannedAmount: parseFloat(data.plannedAmount),
      currency,
      plannedDate: data.plannedDate,
      notes: data.notes || undefined,
    })
    form.reset()
    setUseFundFinancing(false)
    setOpen(false)
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] overflow-hidden">
        {/* Header with gradient accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500" />

        <DialogHeader className="pt-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10">
              <Banknote className="h-4 w-4 text-slate-500" />
            </div>
            Запланировать расход
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            Добавьте обязательный платёж на {format(monthStart, 'LLLL yyyy', { locale: ru })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 pt-2">
            {/* Name field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Название платежа
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: Аренда квартиры"
                      className="h-11 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Two columns: Category and Amount */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Категория
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 bg-muted/30 border-border/50">
                          <SelectValue placeholder="Выберите">
                            {field.value && (() => {
                              const selectedCat = categories.find(c => c.id === field.value)
                              if (!selectedCat) return null
                              return (
                                <span className="flex items-center gap-2">
                                  <CategoryIcon
                                    code={selectedCat.code}
                                    iconName={selectedCat.icon}
                                    color={selectedCat.color}
                                    size="sm"
                                  />
                                  {selectedCat.name}
                                </span>
                              )
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <CategoryIcon
                                code={cat.code}
                                iconName={cat.icon}
                                color={cat.color}
                                size="sm"
                              />
                              {cat.name}
                            </span>
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
                name="plannedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Сумма
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0"
                          className="h-11 pr-8 bg-muted/30 border-border/50 focus:bg-background transition-colors tabular-nums"
                          {...field}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          ₽
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date picker with Calendar */}
            <FormField
              control={form.control}
              name="plannedDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Дата платежа
                  </FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'h-11 w-full justify-start text-left font-normal bg-muted/30 border-border/50 hover:bg-muted/50',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {field.value ? (
                            <span className="font-medium">
                              {format(parseDateString(field.value), 'd MMMM yyyy', { locale: ru })}
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
                        selected={field.value ? parseDateString(field.value) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(formatDateToString(date))
                            setCalendarOpen(false)
                          }
                        }}
                        defaultMonth={monthStart}
                        disabled={(date) => date < monthStart || date > monthEnd}
                        locale={ru}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Заметка (необязательно)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Пояснение к платежу..."
                      className="resize-none bg-muted/30 border-border/50 focus:bg-background transition-colors min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fund Financing Section */}
            {funds.length > 0 && (
              <div
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  useFundFinancing ? "border-border bg-muted/30" : "border-border/50 bg-muted/10"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="useFund"
                    checked={useFundFinancing}
                    onCheckedChange={handleUseFundChange}
                  />
                  <Label
                    htmlFor="useFund"
                    className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                  >
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    Финансировать из фонда
                  </Label>
                </div>

                <AnimatePresence>
                  {useFundFinancing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {/* Fund selection */}
                      <div className="pt-4">
                        <FormField
                          control={form.control}
                          name="fundId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-muted-foreground">
                                Фонд
                              </FormLabel>
                              <Select
                                onValueChange={handleFundChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-10 bg-background border-border/50">
                                    <SelectValue placeholder="Выберите фонд">
                                      {field.value && (() => {
                                        const fb = funds.find(f => f.fund.id === field.value)
                                        if (!fb) return null
                                        return (
                                          <span className="flex items-center gap-2">
                                            <FundIcon
                                              name={fb.fund.name}
                                              iconName={fb.fund.icon}
                                              color={fb.fund.color}
                                              size="sm"
                                            />
                                            {fb.fund.name}
                                          </span>
                                        )
                                      })()}
                                    </SelectValue>
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {funds.map((fb) => (
                                    <SelectItem key={fb.fund.id} value={fb.fund.id}>
                                      <span className="flex items-center gap-2">
                                        <FundIcon
                                          name={fb.fund.name}
                                          iconName={fb.fund.icon}
                                          color={fb.fund.color}
                                          size="sm"
                                        />
                                        {fb.fund.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Asset and Amount selection - shown after fund is selected */}
                      {selectedFundBalance && selectedFundBalance.assets.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-2 gap-3 pt-3"
                        >
                          <FormField
                            control={form.control}
                            name="fundAssetId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-muted-foreground">
                                  Валюта / Актив
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-10 bg-background border-border/50">
                                      <SelectValue placeholder="Выберите">
                                        {field.value && (() => {
                                          const asset = selectedFundBalance.assets.find(a => a.asset.id === field.value)
                                          if (!asset) return null
                                          const symbol = CURRENCY_SYMBOLS[asset.asset.currency] || asset.asset.currency
                                          return (
                                            <span className="flex items-center gap-2">
                                              <Coins className="h-4 w-4 text-muted-foreground" />
                                              {asset.asset.name}
                                              <span className="text-muted-foreground">({symbol})</span>
                                            </span>
                                          )
                                        })()}
                                      </SelectValue>
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {selectedFundBalance.assets.map((assetBalance) => {
                                      const symbol = CURRENCY_SYMBOLS[assetBalance.asset.currency] || assetBalance.asset.currency
                                      return (
                                        <SelectItem key={assetBalance.asset.id} value={assetBalance.asset.id}>
                                          <div className="flex flex-col gap-0.5">
                                            <span className="flex items-center gap-2">
                                              <Coins className="h-4 w-4 text-muted-foreground" />
                                              {assetBalance.asset.name}
                                              <span className="text-muted-foreground font-medium">({symbol})</span>
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-6">
                                              Баланс: {formatMoney(assetBalance.amount)} {symbol}
                                            </span>
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

                          <FormField
                            control={form.control}
                            name="fundedAmount"
                            render={({ field }) => {
                              const symbol = selectedAsset
                                ? CURRENCY_SYMBOLS[selectedAsset.asset.currency] || selectedAsset.asset.currency
                                : '₽'
                              return (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium text-muted-foreground">
                                    Сумма из фонда
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        className="h-10 pr-10 bg-background border-border/50 transition-colors tabular-nums"
                                        {...field}
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                        {symbol}
                                      </span>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )
                            }}
                          />
                        </motion.div>
                      )}

                      {/* Selected asset preview */}
                      {selectedAsset && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Coins className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {selectedAsset.asset.name}
                              <span className="text-muted-foreground ml-1">
                                ({CURRENCY_SYMBOLS[selectedAsset.asset.currency] || selectedAsset.asset.currency})
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Баланс: {formatMoney(selectedAsset.amount)} {CURRENCY_SYMBOLS[selectedAsset.asset.currency] || selectedAsset.asset.currency}
                            </p>
                          </div>
                          {fundedAmount && (
                            <div className="text-right">
                              <p className="text-sm font-semibold tabular-nums">
                                −{formatMoney(parseFloat(fundedAmount || '0'))} {CURRENCY_SYMBOLS[selectedAsset.asset.currency] || selectedAsset.asset.currency}
                              </p>
                              <p className={cn(
                                "text-xs tabular-nums",
                                selectedAsset.amount - parseFloat(fundedAmount || '0') < 0
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                              )}>
                                Останется: {formatMoney(selectedAsset.amount - parseFloat(fundedAmount || '0'))} {CURRENCY_SYMBOLS[selectedAsset.asset.currency] || selectedAsset.asset.currency}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Warning for negative balance */}
                      {selectedAsset && fundedAmount && selectedAsset.amount - parseFloat(fundedAmount || '0') < 0 && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-amber-500 mt-2 px-1"
                        >
                          Баланс актива станет отрицательным — это допустимо
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Footer */}
            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="flex-1 sm:flex-none"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 sm:flex-none"
              >
                {isPending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                  </motion.div>
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Добавить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
