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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import { useCreateCredit } from '../hooks'
import { useAccounts } from '@/features/accounts'
import { useExpenseCategories } from '@/features/expenses'
import { CategoryIcon } from '@/components/common'

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

const formSchema = z.object({
  name: z.string().min(1, 'Введите название кредита'),
  principalAmount: z.string().min(1, 'Введите сумму кредита'),
  interestRate: z.string().min(1, 'Введите процентную ставку'),
  termMonths: z.string().min(1, 'Введите срок кредита'),
  startDate: z.string().min(1, 'Выберите дату начала'),
  paymentDay: z.string().min(1, 'Введите день платежа'),
  accountId: z.string().min(1, 'Выберите счёт'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  paymentsMade: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateCreditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
      interestRate: '',
      termMonths: '',
      startDate: new Date().toISOString().split('T')[0],
      paymentDay: '1',
      accountId: '',
      categoryId: '',
      paymentsMade: '',
      notes: '',
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      await createCredit.mutateAsync({
        name: values.name,
        principalAmount: parseFloat(values.principalAmount),
        interestRate: parseFloat(values.interestRate), // Бэкенд сам конвертирует (3 -> 0.03)
        termMonths: parseInt(values.termMonths, 10),
        startDate: values.startDate,
        paymentDay: parseInt(values.paymentDay, 10),
        accountId: values.accountId,
        categoryId: values.categoryId,
        paymentsMade: values.paymentsMade ? parseInt(values.paymentsMade, 10) : undefined,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Создать кредит</DialogTitle>
          <DialogDescription>
            Создайте новый кредит с автоматическим расчётом графика платежей
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название кредита</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Ипотека Сбербанк" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Principal Amount and Interest Rate */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="principalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сумма кредита</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="3000000"
                        {...field}
                      />
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
                    <FormLabel>Процентная ставка (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="12.5"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Term and Payment Day */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="termMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Срок (месяцев)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="240"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Общий срок кредита</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Число месяца (1-31)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Дата начала</FormLabel>
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
                          date > new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                        }
                        locale={ru}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Дата первого платежа</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account */}
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
                          {acc.name} ({acc.currency})
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

            {/* Category */}
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

            {/* Payments Made */}
            <FormField
              control={form.control}
              name="paymentsMade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Платежей уже сделано (необязательно)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Укажите количество уже произведённых платежей (для существующих кредитов)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Примечания (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Дополнительная информация о кредите..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createCredit.isPending}
              >
                {createCredit.isPending ? 'Создание...' : 'Создать кредит'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
