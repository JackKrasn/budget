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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BankCombobox } from '@/components/ui/bank-combobox'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CreditCard,
  Wallet,
  PiggyBank,
  Landmark,
  TrendingUp,
  Bitcoin,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUpdateAccount, useAccountTypes } from '../hooks'
import { useFunds } from '@/features/funds/hooks/use-funds'
import type { AccountWithType } from '@/lib/api/types'

const ACCOUNT_ICONS = [
  { value: 'credit-card', icon: CreditCard, label: 'Карта' },
  { value: 'wallet', icon: Wallet, label: 'Наличные' },
  { value: 'piggy-bank', icon: PiggyBank, label: 'Вклад' },
  { value: 'landmark', icon: Landmark, label: 'Банк' },
  { value: 'trending-up', icon: TrendingUp, label: 'Инвестиции' },
  { value: 'bitcoin', icon: Bitcoin, label: 'Крипто' },
]

const ACCOUNT_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#ef4444', // red
  '#84cc16', // lime
]

const CURRENCIES = [
  { value: 'RUB', label: 'Рубль (₽)' },
  { value: 'USD', label: 'Доллар ($)' },
  { value: 'EUR', label: 'Евро (€)' },
  { value: 'GEL', label: 'Лари (₾)' },
  { value: 'TRY', label: 'Лира (₺)' },
  { value: 'CNY', label: 'Юань (¥)' },
  { value: 'AED', label: 'Дирхам (د.إ)' },
]

const formSchema = z.object({
  name: z.string().min(1, 'Введите название счёта'),
  accountTypeId: z.string().min(1, 'Выберите тип счёта'),
  currency: z.string().min(1, 'Выберите валюту'),
  bankName: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  currentBalance: z.string().optional(),
  isCredit: z.boolean().optional(),
  linkedFundId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditAccountDialogProps {
  account: AccountWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
}: EditAccountDialogProps) {
  const updateAccount = useUpdateAccount()
  const { data: accountTypesData, isLoading: isLoadingTypes } = useAccountTypes()
  const { data: fundsData } = useFunds({ status: 'active' })

  // Все активные фонды доступны для резервирования
  const activeFunds = fundsData?.data || []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      accountTypeId: '',
      currency: 'RUB',
      bankName: '',
      icon: 'credit-card',
      color: '#10b981',
      currentBalance: '',
      isCredit: false,
      linkedFundId: '',
    },
  })

  const isCredit = form.watch('isCredit')

  // Update form when account changes
  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        accountTypeId: account.account_type_id,
        currency: account.currency,
        bankName: account.bank_name || '',
        icon: account.icon || 'credit-card',
        color: account.color || '#10b981',
        currentBalance: String(account.current_balance),
        isCredit: account.is_credit || false,
        linkedFundId: account.linked_fund_id || '',
      })
    }
  }, [account, form])

  async function onSubmit(values: FormValues) {
    if (!account) return

    try {
      // Parse and check if balance changed
      const newBalance = values.currentBalance
        ? parseFloat(values.currentBalance)
        : undefined
      const balanceChanged =
        newBalance !== undefined &&
        !isNaN(newBalance) &&
        newBalance !== account.current_balance

      // Определяем linkedFundId: null для удаления, undefined для отсутствия изменения
      let linkedFundId: string | null | undefined = undefined
      if (values.isCredit) {
        linkedFundId = values.linkedFundId || null
      } else if (account.linked_fund_id) {
        // Если убрали галочку "Кредитная карта", удаляем привязку к фонду
        linkedFundId = null
      }

      await updateAccount.mutateAsync({
        id: account.id,
        data: {
          name: values.name,
          accountTypeId: values.accountTypeId,
          currency: values.currency,
          bankName: values.bankName || undefined,
          icon: values.icon || undefined,
          color: values.color || undefined,
          currentBalance: balanceChanged ? newBalance : undefined,
          isCredit: values.isCredit,
          linkedFundId,
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
          <DialogTitle>Редактировать счёт</DialogTitle>
          <DialogDescription>
            Измените параметры счёта
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
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Тинькофф Black" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Type */}
            <FormField
              control={form.control}
              name="accountTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип счёта</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingTypes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountTypesData?.data.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Валюта</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите валюту" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bank Name */}
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Банк (опционально)</FormLabel>
                  <FormControl>
                    <BankCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Выберите банк..."
                    />
                  </FormControl>
                  <FormDescription>
                    Выберите из списка или введите свой
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Balance */}
            <FormField
              control={form.control}
              name="currentBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Текущий баланс</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    При изменении создаётся корректировка баланса
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Credit */}
            <FormField
              control={form.control}
              name="isCredit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Кредитная карта</FormLabel>
                    <FormDescription>
                      Для кредитных карт при создании расхода средства автоматически резервируются в фонде
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Linked Fund for Credit Cards */}
            {isCredit && (
              <FormField
                control={form.control}
                name="linkedFundId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Фонд для резервирования</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите фонд..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeFunds.length === 0 ? (
                          <SelectItem value="_none" disabled>
                            Нет фондов с накопительным счётом
                          </SelectItem>
                        ) : (
                          activeFunds.map((fb) => (
                            <SelectItem key={fb.fund.id} value={fb.fund.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: fb.fund.color }}
                                />
                                {fb.fund.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      При создании расхода с этой карты средства будут автоматически резервироваться в выбранном фонде
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Warning if credit card without fund */}
            {isCredit && !form.watch('linkedFundId') && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Для кредитной карты необходимо указать фонд для резервирования, иначе создание расходов будет заблокировано
                </AlertDescription>
              </Alert>
            )}

            {/* Icon */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Иконка</FormLabel>
                  <div className="grid grid-cols-6 gap-2">
                    {ACCOUNT_ICONS.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => field.onChange(item.value)}
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 transition-all hover:border-border hover:bg-muted/50',
                            field.value === item.value &&
                              'border-primary bg-primary/10'
                          )}
                          title={item.label}
                        >
                          <Icon className="h-5 w-5" />
                        </button>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Цвет</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {ACCOUNT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => field.onChange(color)}
                        className={cn(
                          'h-8 w-8 rounded-full border-2 transition-all',
                          field.value === color
                            ? 'border-foreground scale-110'
                            : 'border-transparent hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
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
                disabled={updateAccount.isPending}
              >
                {updateAccount.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
