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
import { useUpdateCredit } from '../hooks'
import { useAccounts } from '@/features/accounts'
import { useExpenseCategories } from '@/features/expenses'
import { CategoryIcon } from '@/components/common'
import type { CreditListRow } from '@/lib/api/credits'

const formSchema = z.object({
  name: z.string().min(1, 'Введите название кредита'),
  accountId: z.string().min(1, 'Выберите счёт'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  paymentDay: z.string().min(1, 'Введите день платежа'),
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
      status: 'active',
      notes: '',
    },
  })

  // Load credit data into form
  useEffect(() => {
    if (credit) {
      form.reset({
        name: credit.name,
        accountId: credit.account_id,
        categoryId: credit.category_id,
        paymentDay: String(credit.payment_day),
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать кредит</DialogTitle>
          <DialogDescription>
            Измените параметры кредита (сумма, ставка и срок не редактируются)
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

            {/* Payment Day */}
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

            {/* Status */}
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
                      <SelectItem value="active">Активный</SelectItem>
                      <SelectItem value="completed">Погашен</SelectItem>
                      <SelectItem value="cancelled">Отменён</SelectItem>
                    </SelectContent>
                  </Select>
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
                disabled={updateCredit.isPending}
              >
                {updateCredit.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
