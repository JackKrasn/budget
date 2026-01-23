import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { AccountIcon } from '@/components/ui/account-icon'
import { useDepositToFund } from '../hooks'
import { useAccounts } from '@/features/accounts'
import type { FundBalance } from '@/lib/api/types'

const formSchema = z.object({
  accountId: z.string().min(1, 'Выберите счёт'),
  amount: z.string().min(1, 'Введите сумму'),
  date: z.string().min(1, 'Выберите дату'),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface DepositToFundDialogProps {
  fund: FundBalance | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepositToFundDialog({
  fund,
  open,
  onOpenChange,
}: DepositToFundDialogProps) {
  const depositToFund = useDepositToFund()
  const { data: accountsData } = useAccounts()

  const accounts = (accountsData?.data ?? []).filter((a) => a?.id != null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    },
  })

  const watchAmount = form.watch('amount')
  const watchAccountId = form.watch('accountId')

  const selectedAccount = accounts.find((a) => a?.id === watchAccountId)

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  async function onSubmit(values: FormValues) {
    if (!fund) return

    const amount = parseFloat(values.amount)

    try {
      await depositToFund.mutateAsync({
        fundId: fund.fund.id,
        data: {
          accountId: values.accountId,
          amount,
          date: values.date,
          note: values.note || undefined,
        },
      })

      handleClose()
    } catch {
      // Error is handled in mutation
    }
  }

  if (!fund || !open) return null

  const amountNum = parseFloat(watchAmount) || 0
  const hasInsufficientFunds =
    selectedAccount && amountNum > selectedAccount.current_balance

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden border-0 bg-gradient-to-b from-background to-background/95 p-0 shadow-2xl sm:max-w-[480px]">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent px-6 pb-8 pt-6">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-green-500/20 blur-3xl" />
            <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-green-500/10 blur-2xl" />
          </div>

          <DialogHeader className="relative">
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25"
              >
                <Plus className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  Пополнить фонд
                </DialogTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {fund.fund.name}
                </p>
              </div>
            </div>

            {/* Live Amount Preview */}
            <AnimatePresence mode="wait">
              <motion.div
                key={watchAmount}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-2"
              >
                <p className="text-sm text-muted-foreground">Сумма пополнения</p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-4xl font-bold tabular-nums tracking-tight ${hasInsufficientFunds ? 'text-destructive' : ''}`}
                  >
                    {amountNum > 0 ? formatMoney(amountNum) : '0'}
                  </span>
                  <span className="text-2xl font-medium text-muted-foreground">
                    {selectedAccount?.currency || '₽'}
                  </span>
                </div>
                {hasInsufficientFunds && (
                  <p className="mt-1 text-sm text-destructive">
                    Недостаточно средств на счёте
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </DialogHeader>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 pb-6">
            {/* Account */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Банковский счёт *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Выберите счёт" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <div className="flex items-center gap-2">
                              <AccountIcon
                                bankName={a.bank_name}
                                typeCode={a.type_code}
                                color={a.color}
                                size="sm"
                                showBackground={false}
                              />
                              <span>{a.name}</span>
                              <span className="text-muted-foreground">
                                ({formatMoney(a.current_balance)} {a.currency})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Amount */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Сумма *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0"
                        className="h-12 border-0 bg-muted/50 text-lg font-medium tabular-nums transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Date */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Дата
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Note */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Комментарий
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опционально"
                        className="min-h-[80px] resize-none border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex gap-3 pt-2"
            >
              <Button
                type="button"
                variant="ghost"
                className="h-12 flex-1 text-muted-foreground hover:text-foreground"
                onClick={handleClose}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="h-12 flex-1 font-medium"
                disabled={depositToFund.isPending || hasInsufficientFunds}
              >
                {depositToFund.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Пополнение...
                  </>
                ) : (
                  'Пополнить'
                )}
              </Button>
            </motion.div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
