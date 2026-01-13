import { useEffect, useMemo } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useSetBalance } from '../hooks'
import type { AccountWithType } from '@/lib/api/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

const formSchema = z.object({
  currentBalance: z.string().min(1, 'Введите баланс'),
  reason: z.string().optional(),
  date: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface SyncBalanceDialogProps {
  account: AccountWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SyncBalanceDialog({
  account,
  open,
  onOpenChange,
}: SyncBalanceDialogProps) {
  const setBalance = useSetBalance()
  const currencySymbol = account
    ? CURRENCY_SYMBOLS[account.currency] || account.currency
    : '₽'

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentBalance: '0',
      reason: '',
      date: new Date().toISOString().split('T')[0],
    },
  })

  const watchedBalance = form.watch('currentBalance')
  const parsedBalance = watchedBalance ? parseFloat(watchedBalance) : 0

  // Calculate adjustment preview
  const adjustmentPreview = useMemo(() => {
    if (!account || !watchedBalance || isNaN(parsedBalance)) {
      return null
    }
    const diff = parsedBalance - account.current_balance
    return {
      amount: diff,
      isPositive: diff > 0,
      isNegative: diff < 0,
      isZero: diff === 0,
    }
  }, [account, watchedBalance, parsedBalance])

  // Reset form when account changes
  useEffect(() => {
    if (account && open) {
      form.reset({
        currentBalance: String(account.current_balance),
        reason: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }, [account, open, form])

  async function onSubmit(values: FormValues) {
    if (!account) return

    try {
      const balance = parseFloat(values.currentBalance)
      if (isNaN(balance)) return

      await setBalance.mutateAsync({
        accountId: account.id,
        currentBalance: balance,
        reason: values.reason || undefined,
        date: values.date || undefined,
      })
      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    }
  }

  const formatNumber = (num: number) =>
    num.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Синхронизация баланса
          </DialogTitle>
          <DialogDescription>
            Укажите текущий баланс из приложения банка для {account?.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Current calculated balance */}
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground mb-1">
                Текущий расчётный баланс
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {account ? formatNumber(account.current_balance) : '0'}{' '}
                {currencySymbol}
              </p>
            </div>

            {/* New balance input */}
            <FormField
              control={form.control}
              name="currentBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Баланс в банке</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        className="pr-10"
                        {...field}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currencySymbol}
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Введите баланс из приложения банка
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Причина (опционально)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Пропущенные расходы, кэшбэк..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата корректировки</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Adjustment Preview */}
            {adjustmentPreview && !adjustmentPreview.isZero && (
              <Alert
                className={
                  adjustmentPreview.isPositive
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-red-500/50 bg-red-500/10'
                }
              >
                <div className="flex items-center gap-2">
                  {adjustmentPreview.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>
                    Будет создана корректировка:{' '}
                    <span
                      className={`font-semibold ${
                        adjustmentPreview.isPositive
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {adjustmentPreview.isPositive ? '+' : ''}
                      {formatNumber(adjustmentPreview.amount)} {currencySymbol}
                    </span>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {adjustmentPreview?.isZero && (
              <Alert className="border-muted-foreground/30">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-muted-foreground" />
                  <AlertDescription className="text-muted-foreground">
                    Баланс совпадает, корректировка не требуется
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
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
                disabled={
                  setBalance.isPending || adjustmentPreview?.isZero === true
                }
              >
                {setBalance.isPending ? 'Сохранение...' : 'Применить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
