import { useState } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateAccount, useAccountTypes } from '../hooks'

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
]

const formSchema = z.object({
  name: z.string().min(1, 'Введите название счёта'),
  accountTypeId: z.string().min(1, 'Выберите тип счёта'),
  currency: z.string().min(1, 'Выберите валюту'),
  bankName: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  initialBalance: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateAccountDialogProps {
  children: React.ReactNode
}

export function CreateAccountDialog({ children }: CreateAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const createAccount = useCreateAccount()
  const { data: accountTypesData, isLoading: isLoadingTypes } = useAccountTypes()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      accountTypeId: '',
      currency: 'RUB',
      bankName: '',
      icon: 'credit-card',
      color: '#10b981',
      initialBalance: '',
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      const initialBalance = values.initialBalance
        ? parseFloat(values.initialBalance)
        : undefined

      await createAccount.mutateAsync({
        name: values.name,
        accountTypeId: values.accountTypeId,
        currency: values.currency,
        bankName: values.bankName || undefined,
        icon: values.icon || undefined,
        color: values.color || undefined,
        initialBalance: initialBalance && !isNaN(initialBalance) ? initialBalance : undefined,
      })
      form.reset()
      setOpen(false)
    } catch {
      // Error is handled in mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Новый счёт</DialogTitle>
          <DialogDescription>
            Добавьте банковскую карту, наличные или депозит
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
                    defaultValue={field.value}
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                    <Input placeholder="Например: Тинькофф" {...field} />
                  </FormControl>
                  <FormDescription>
                    Название банка или платформы
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Initial Balance */}
            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Начальный баланс (опционально)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Текущий баланс на счёте
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createAccount.isPending}
              >
                {createAccount.isPending ? 'Создание...' : 'Создать счёт'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
