import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  FormDescription,
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
import { CategoryIcon, FundIcon, DayPicker } from '@/components/common'
import { AccountIcon } from '@/components/ui/account-icon'
import type {
  RecurringExpenseWithCategory,
  ExpenseCategoryWithTags,
  Fund,
  AccountWithType,
} from '@/lib/api/types'

const formSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  accountId: z.string().optional(),
  fundId: z.string().optional(),
  amount: z.string().min(1, 'Введите сумму'),
  dayOfMonth: z.string().min(1, 'Выберите день'),
  isActive: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface RecurringExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: RecurringExpenseWithCategory | null
  categories: ExpenseCategoryWithTags[]
  accounts: AccountWithType[]
  funds: Fund[]
  onSubmit: (data: {
    categoryId: string
    accountId?: string
    fundId?: string
    name: string
    amount: number
    currency: string
    dayOfMonth: number
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
  onSubmit,
  isPending,
}: RecurringExpenseDialogProps) {
  const isEditing = !!expense

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      accountId: '',
      fundId: '',
      amount: '',
      dayOfMonth: '1',
      isActive: true,
    },
  })

  // При открытии с данными для редактирования
  useEffect(() => {
    if (expense) {
      form.reset({
        name: expense.name,
        categoryId: expense.category_id,
        accountId: expense.account_id ?? '',
        fundId: expense.fund_id ?? '',
        amount: String(expense.amount),
        dayOfMonth: String(expense.day_of_month),
        isActive: expense.is_active,
      })
    } else {
      form.reset({
        name: '',
        categoryId: '',
        accountId: '',
        fundId: '',
        amount: '',
        dayOfMonth: '1',
        isActive: true,
      })
    }
  }, [expense, form])

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      categoryId: data.categoryId,
      accountId: data.accountId || undefined,
      fundId: data.fundId || undefined,
      name: data.name,
      amount: parseFloat(data.amount),
      currency: 'RUB',
      dayOfMonth: parseInt(data.dayOfMonth, 10),
      isActive: data.isActive,
    })
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Редактировать шаблон' : 'Создать шаблон'}
          </DialogTitle>
          <DialogDescription>
            Шаблон будет использоваться для автоматической генерации
            обязательных расходов каждый месяц
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Аренда квартиры" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Счёт списания (опционально)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Не выбран" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Не выбран</SelectItem>
                      {accounts.map((account) => (
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
                  <FormDescription>
                    Счёт по умолчанию для оплаты расхода
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fundId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Фонд (опционально)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Не выбран" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Не выбран</SelectItem>
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
                  <FormDescription>
                    Расход будет финансироваться из этого фонда
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сумма</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>День месяца</FormLabel>
                    <FormControl>
                      <DayPicker
                        value={parseInt(field.value, 10) || 1}
                        onChange={(day) => field.onChange(String(day))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Активен</FormLabel>
                    <FormDescription>
                      Неактивные шаблоны не генерируются
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                {isEditing ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
