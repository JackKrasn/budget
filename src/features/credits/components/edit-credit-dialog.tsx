import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { FileText, Building2, CalendarDays, Info, Calendar } from 'lucide-react'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useUpdateCredit } from '../hooks'
import { useAccounts } from '@/features/accounts'
import { useExpenseCategories } from '@/features/expenses'
import { CategoryIcon } from '@/components/common'
import { AccountIcon } from '@/components/ui/account-icon'
import type { CreditListRow } from '@/lib/api/credits'

function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateString(dateStr: string | undefined | null): Date | undefined {
  if (!dateStr || typeof dateStr !== 'string') return undefined
  const parts = dateStr.split('-')
  if (parts.length !== 3) return undefined
  const [year, month, day] = parts.map(Number)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined
  return new Date(year, month - 1, day)
}

const formSchema = z.object({
  name: z.string().min(1, 'Введите название кредита'),
  accountId: z.string().min(1, 'Выберите счёт'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  paymentDay: z.string().min(1, 'Введите день платежа'),
  endDate: z.string().optional(),
  monthlyPayment: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled']),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditCreditDialogProps {
  credit: CreditListRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCreditDialog({
  credit,
  open,
  onOpenChange,
}: EditCreditDialogProps) {
  const updateCredit = useUpdateCredit()
  const { data: accountsData } = useAccounts()
  const { data: categoriesData } = useExpenseCategories()

  const accounts = accountsData?.data ?? []
  const categories = categoriesData?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      accountId: '',
      categoryId: '',
      paymentDay: '1',
      endDate: '',
      monthlyPayment: '',
      status: 'active',
      notes: '',
    },
  })

  // Load credit data into form
  useEffect(() => {
    if (credit) {
      // Handle end_date that might come as:
      // - string "2024-12-09"
      // - Go sql.NullTime object {Time: "2044-12-09T00:00:00Z", Valid: true}
      let endDateValue = ''
      if (credit.end_date) {
        if (typeof credit.end_date === 'string') {
          // Already a string - extract date part
          endDateValue = credit.end_date.split('T')[0]
        } else if (typeof credit.end_date === 'object' && 'Time' in (credit.end_date as object)) {
          const nullTime = credit.end_date as unknown as { Time: string; Valid: boolean }
          if (nullTime.Valid && nullTime.Time) {
            endDateValue = nullTime.Time.split('T')[0]
          }
        }
      }

      // Handle monthly_payment that might come as:
      // - number
      // - Go sql.NullFloat64 object {Float64: 65440.93, Valid: true}
      let monthlyPaymentValue = ''
      if (credit.monthly_payment) {
        if (typeof credit.monthly_payment === 'number') {
          monthlyPaymentValue = String(credit.monthly_payment)
        } else if (typeof credit.monthly_payment === 'object' && 'Float64' in (credit.monthly_payment as object)) {
          const nullFloat = credit.monthly_payment as unknown as { Float64: number; Valid: boolean }
          if (nullFloat.Valid) {
            monthlyPaymentValue = String(nullFloat.Float64)
          }
        }
      }

      form.reset({
        name: credit.name,
        accountId: credit.account_id,
        categoryId: credit.category_id,
        paymentDay: String(credit.payment_day),
        endDate: endDateValue,
        monthlyPayment: monthlyPaymentValue,
        status: credit.status,
        notes: credit.notes || '',
      })
    }
  }, [credit, form])

  async function onSubmit(values: FormValues) {
    if (!credit) return

    try {
      await updateCredit.mutateAsync({
        id: credit.id,
        data: {
          name: values.name,
          accountId: values.accountId,
          categoryId: values.categoryId,
          paymentDay: parseInt(values.paymentDay, 10),
          endDate: values.endDate || undefined,
          monthlyPayment: values.monthlyPayment ? parseFloat(values.monthlyPayment) : undefined,
          status: values.status,
          notes: values.notes || undefined,
        },
      })

      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-bold">Редактировать кредит</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Измените параметры кредита (сумма, ставка и срок не редактируются)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Основная информация</h3>
                  <p className="text-xs text-muted-foreground">Название и статус кредита</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название кредита</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: Ипотека Сбербанк"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <span>Активный</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-gray-500" />
                              <span>Погашен</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                              <span>Отменён</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Account & Category Section */}
            <div className="space-y-4 rounded-xl border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                  <Building2 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Счета и категории</h3>
                  <p className="text-xs text-muted-foreground">Счёт списания и категория расходов</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Счёт списания</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите счёт" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              <div className="flex items-center gap-2">
                                <AccountIcon
                                  bankName={acc.bank_name}
                                  typeCode={acc.type_code}
                                  color={acc.color}
                                  size="sm"
                                  showBackground={false}
                                />
                                {acc.name} ({acc.currency})
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Счёт, с которого будут списываться платежи
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Категория расходов</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormDescription>
                        Категория для учёта платежей в расходах
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Payment Settings Section */}
            <div className="space-y-4 rounded-xl border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                  <CalendarDays className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Настройки платежей</h3>
                  <p className="text-xs text-muted-foreground">День платежа, дата окончания и сумма</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="paymentDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>День платежа</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="15"
                          className="tabular-nums"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Число месяца (1-31)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Дата последнего платежа</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {(() => {
                                const date = parseDateString(field.value)
                                return date ? format(date, 'd MMMM yyyy', { locale: ru }) : <span>Выберите дату</span>
                              })()}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
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
                      <FormDescription>Дата окончания кредита</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        Ежемесячный платёж
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[280px]">
                              <p className="text-xs">
                                Укажите текущий платёж из банка, если у кредита были частично-досрочные погашения.
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
                            className="tabular-nums pr-8"
                            {...field}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            ₽
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Вместо расчётного аннуитета
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes Section */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Примечания (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Дополнительная информация о кредите..."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={updateCredit.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateCredit.isPending}
              >
                {updateCredit.isPending ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
