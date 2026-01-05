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
import { useUpdateExpense, useExpenseCategories } from '../hooks'
import { useAccounts } from '@/features/accounts'
import { TagSelector } from './tag-selector'
import {
  Wallet,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Plane,
  Heart,
  Gift,
  GraduationCap,
  Smartphone,
  Zap,
  Coffee,
  Film,
  ShoppingBag,
  CalendarIcon,
} from 'lucide-react'
import type { ExpenseListRow } from '@/lib/api/types'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  food: Utensils,
  transport: Car,
  housing: Home,
  utilities: Zap,
  health: Heart,
  education: GraduationCap,
  entertainment: Film,
  shopping: ShoppingBag,
  travel: Plane,
  gifts: Gift,
  phone: Smartphone,
  coffee: Coffee,
  groceries: ShoppingCart,
  default: Wallet,
}

const formSchema = z.object({
  categoryId: z.string().min(1, 'Выберите категорию'),
  accountId: z.string().min(1, 'Выберите счёт'),
  amount: z.string().min(1, 'Введите сумму'),
  currency: z.string().min(1, 'Выберите валюту'),
  date: z.string().min(1, 'Введите дату'),
  description: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditExpenseDialogProps {
  expense: ExpenseListRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
}: EditExpenseDialogProps) {
  const updateExpense = useUpdateExpense()
  const { data: categoriesData } = useExpenseCategories()
  const { data: accountsData } = useAccounts()

  const categories = categoriesData?.data ?? []
  const accounts = accountsData?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: '',
      accountId: '',
      amount: '',
      currency: 'RUB',
      date: new Date().toISOString().split('T')[0],
      description: '',
      tagIds: [],
    },
  })

  // Load expense data into form
  useEffect(() => {
    if (expense) {
      form.reset({
        categoryId: expense.categoryId,
        accountId: expense.accountId,
        amount: String(expense.amount),
        currency: expense.currency,
        date: expense.date.split('T')[0],
        description: expense.description || '',
        tagIds: expense.tags?.map((tag) => tag.id) || [],
      })
    }
  }, [expense, form])

  async function onSubmit(values: FormValues) {
    if (!expense) return

    try {
      await updateExpense.mutateAsync({
        id: expense.id,
        data: {
          categoryId: values.categoryId,
          accountId: values.accountId,
          amount: parseFloat(values.amount),
          currency: values.currency,
          date: values.date,
          description: values.description || undefined,
          tagIds: values.tagIds || [],
        },
      })

      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать расход</DialogTitle>
          <DialogDescription>Измените информацию о расходе</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Account */}
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
                        const Icon = CATEGORY_ICONS[cat.code] || CATEGORY_ICONS.default
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
                disabled={updateExpense.isPending}
              >
                {updateExpense.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
