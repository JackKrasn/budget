import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

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
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCreateExpense, useExpenseCategories } from '../hooks'
import { useAccounts } from '@/features/accounts'
import { useFunds } from '@/features/funds'
import { TagSelector } from './tag-selector'
import { Wallet, Plus, X, CalendarIcon } from 'lucide-react'
import { getIconByName } from '@/lib/icon-registry'

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
  amount: number
}

interface CreateExpenseDialogProps {
  children: React.ReactNode
  defaultAccountId?: string
}

export function CreateExpenseDialog({ children, defaultAccountId }: CreateExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [fundAllocations, setFundAllocations] = useState<FundAllocation[]>([])
  const [selectedFundId, setSelectedFundId] = useState<string>('')
  const [fundAmount, setFundAmount] = useState<string>('')

  const createExpense = useCreateExpense()
  const { data: categoriesData } = useExpenseCategories()
  const { data: accountsData } = useAccounts()
  const { data: fundsData } = useFunds()

  const categories = categoriesData?.data ?? []
  const accounts = accountsData?.data ?? []
  const funds = fundsData?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: '',
      accountId: defaultAccountId || '',
      amount: '',
      currency: 'RUB',
      date: new Date().toISOString().split('T')[0],
      description: '',
      tagIds: [],
      useFundAllocation: false,
    },
  })

  const useFundAllocation = form.watch('useFundAllocation')
  const totalAmount = parseFloat(form.watch('amount') || '0')
  const totalFromFunds = fundAllocations.reduce((sum, a) => sum + a.amount, 0)

  const addFundAllocation = () => {
    if (!selectedFundId || !fundAmount) return

    const fund = funds.find((f) => f.fund.id === selectedFundId)
    if (!fund) return

    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) return

    // Check if fund already added
    if (fundAllocations.some((a) => a.fundId === selectedFundId)) {
      return
    }

    setFundAllocations([
      ...fundAllocations,
      { fundId: selectedFundId, fundName: fund.fund.name, amount },
    ])
    setSelectedFundId('')
    setFundAmount('')
  }

  const removeFundAllocation = (fundId: string) => {
    setFundAllocations(fundAllocations.filter((a) => a.fundId !== fundId))
  }

  async function onSubmit(values: FormValues) {
    try {
      await createExpense.mutateAsync({
        categoryId: values.categoryId,
        accountId: values.accountId,
        amount: parseFloat(values.amount),
        currency: values.currency,
        date: values.date,
        description: values.description || undefined,
        tagIds: values.tagIds || [],
        fundAllocations:
          values.useFundAllocation && fundAllocations.length > 0
            ? fundAllocations.map((a) => ({
                fundId: a.fundId,
                amount: a.amount,
              }))
            : undefined,
      })

      form.reset()
      setFundAllocations([])
      setOpen(false)
    } catch {
      // Error is handled in mutation
    }
  }

  // Reset fund allocations when dialog closes
  useEffect(() => {
    if (!open) {
      setFundAllocations([])
      setSelectedFundId('')
      setFundAmount('')
    }
  }, [open])

  // Update accountId when defaultAccountId changes
  useEffect(() => {
    if (defaultAccountId) {
      form.setValue('accountId', defaultAccountId)
    }
  }, [defaultAccountId, form])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Новый расход</DialogTitle>
          <DialogDescription>Добавьте информацию о расходе</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Account - выбираем первым */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Счёт</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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

            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сумма</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
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
                    <FormLabel>Валюта</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RUB">₽ RUB</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                        <SelectItem value="EUR">€ EUR</SelectItem>
                        <SelectItem value="GEL">₾ GEL</SelectItem>
                        <SelectItem value="TRY">₺ TRY</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Категория</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
                                style={{ backgroundColor: `${cat.color}20` }}
                              >
                                <Icon
                                  className="h-3.5 w-3.5"
                                  style={{ color: cat.color }}
                                />
                              </div>
                              {cat.name}
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
                <FormItem className="flex flex-col">
                  <FormLabel>Дата</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(parseDateString(field.value), 'PPP', { locale: ru })
                          ) : (
                            <span>Выберите дату</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Необязательное описание..."
                      className="resize-none"
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

            <Separator />

            {/* Fund Allocation */}
            <FormField
              control={form.control}
              name="useFundAllocation"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-border"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="cursor-pointer">
                      Финансировать из фонда
                    </FormLabel>
                    <FormDescription>
                      Списать часть или всю сумму из накопительных фондов
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {useFundAllocation && (
              <div className="space-y-4 rounded-lg border border-border/50 bg-muted/20 p-4">
                {/* Fund allocations list */}
                {fundAllocations.length > 0 && (
                  <div className="space-y-2">
                    {fundAllocations.map((allocation) => (
                      <div
                        key={allocation.fundId}
                        className="flex items-center justify-between rounded-md bg-background/50 p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span>{allocation.fundName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {allocation.amount.toLocaleString('ru-RU')} ₽
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              removeFundAllocation(allocation.fundId)
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Summary */}
                    <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">
                        Из фондов:
                      </span>
                      <span className="font-medium">
                        {totalFromFunds.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    {totalAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Собственные средства:
                        </span>
                        <span className="font-medium">
                          {Math.max(0, totalAmount - totalFromFunds).toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Add fund allocation */}
                <div className="grid grid-cols-[1fr,auto,auto] gap-2">
                  <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выбрать фонд" />
                    </SelectTrigger>
                    <SelectContent>
                      {funds
                        .filter(
                          (f) =>
                            f.fund.status === 'active' &&
                            !fundAllocations.some((a) => a.fundId === f.fund.id)
                        )
                        .map((fund) => (
                          <SelectItem key={fund.fund.id} value={fund.fund.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: fund.fund.color }}
                              />
                              {fund.fund.name}
                              <span className="text-muted-foreground ml-1">
                                ({fund.totalRub.toLocaleString('ru-RU')} ₽)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Сумма"
                    className="w-24"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addFundAllocation}
                    disabled={!selectedFundId || !fundAmount}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createExpense.isPending}
              >
                {createExpense.isPending ? 'Создание...' : 'Добавить расход'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
