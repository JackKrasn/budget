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
import { FileText, Building2, CalendarDays, FileEdit } from 'lucide-react'
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-bold">Редактировать кредит</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Измените параметры кредита (сумма, ставка и срок не редактируются)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-6">
            {/* Basic Information Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Основная информация</h3>
                  <p className="text-xs text-muted-foreground">Название и статус кредита</p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название кредита</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Например: Ипотека Сбербанк"
                        className="h-11 text-base"
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
                        <SelectTrigger className="h-11 text-base">
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

            {/* Account & Category Section */}
            <div className="space-y-5 rounded-xl border border-border/50 bg-muted/30 p-5">
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                  <Building2 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Счета и категории</h3>
                  <p className="text-xs text-muted-foreground">Счёт списания и категория расходов</p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Счёт списания</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 text-base">
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

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категория расходов</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 text-base">
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
            </div>

            {/* Payment Settings Section */}
            <div className="space-y-5 rounded-xl border border-border/50 bg-muted/30 p-5">
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                  <CalendarDays className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Настройки платежей</h3>
                  <p className="text-xs text-muted-foreground">День ежемесячного платежа</p>
                </div>
              </div>

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
                        className="h-11 text-base tabular-nums"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Число месяца (1-31)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes Section */}
            <div className="space-y-5 rounded-xl border border-dashed border-border/50 bg-muted/10 p-5">
              <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <FileEdit className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Примечания</h3>
                  <p className="text-xs text-muted-foreground">Дополнительная информация (необязательно)</p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примечания (необязательно)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Дополнительная информация о кредите..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-8 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => onOpenChange(false)}
                disabled={updateCredit.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 font-semibold"
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
