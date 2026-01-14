import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { TrendingDown, Plus, Pencil, AlertCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useExchangeRates,
  useCreateExchangeRate,
} from '@/features/expenses/hooks/use-exchange-rates'
import type { ExchangeRate } from '@/lib/api'

const CURRENCIES = [
  { value: 'USD', label: 'Доллар США', symbol: '$' },
  { value: 'EUR', label: 'Евро', symbol: '€' },
  { value: 'GEL', label: 'Грузинский лари', symbol: '₾' },
  { value: 'TRY', label: 'Турецкая лира', symbol: '₺' },
  { value: 'CNY', label: 'Китайский юань', symbol: '¥' },
  { value: 'GBP', label: 'Фунт стерлингов', symbol: '£' },
  { value: 'AED', label: 'Дирхам ОАЭ', symbol: 'د.إ' },
]

const formSchema = z.object({
  fromCurrency: z.string().min(1, 'Выберите валюту'),
  rate: z.string().min(1, 'Введите курс'),
})

type FormValues = z.infer<typeof formSchema>

export default function ExchangeRatesPage() {
  const { data, isLoading, error } = useExchangeRates()
  const createRate = useCreateExchangeRate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null)

  const rates = data?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromCurrency: '',
      rate: '',
    },
  })

  const handleOpenDialog = (rate?: ExchangeRate) => {
    if (rate) {
      setEditingRate(rate)
      form.reset({
        fromCurrency: rate.from_currency,
        rate: rate.rate.toString(),
      })
    } else {
      setEditingRate(null)
      form.reset({
        fromCurrency: '',
        rate: '',
      })
    }
    setDialogOpen(true)
  }

  async function onSubmit(values: FormValues) {
    try {
      await createRate.mutateAsync({
        fromCurrency: values.fromCurrency,
        toCurrency: 'RUB',
        rate: parseFloat(values.rate),
        source: 'manual',
      })
      setDialogOpen(false)
      form.reset()
      setEditingRate(null)
    } catch {
      // Error handled in mutation
    }
  }

  const getCurrencyLabel = (code: string) => {
    return CURRENCIES.find((c) => c.value === code)?.label ?? code
  }

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find((c) => c.value === code)?.symbol ?? code
  }

  if (error) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Ошибка загрузки курсов</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <TrendingDown className="h-6 w-6 text-muted-foreground" />
            Курсы валют
          </h1>
          <p className="mt-1 text-muted-foreground">
            Управление курсами валют к рублю
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить курс
        </Button>
      </div>

      {/* Rates Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Текущие курсы</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rates.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed">
              <TrendingDown className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium">Нет курсов валют</p>
                <p className="text-sm text-muted-foreground">
                  Добавьте первый курс валюты
                </p>
              </div>
              <Button variant="outline" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить курс
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Валюта</TableHead>
                  <TableHead className="text-right">Курс к RUB</TableHead>
                  <TableHead>Дата обновления</TableHead>
                  <TableHead className="w-[100px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium">
                          {getCurrencySymbol(rate.from_currency)}
                        </span>
                        <div>
                          <p className="font-medium">{rate.from_currency}</p>
                          <p className="text-sm text-muted-foreground">
                            {getCurrencyLabel(rate.from_currency)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-lg font-bold tabular-nums">
                        {rate.rate.toLocaleString('ru-RU', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </span>
                      <span className="ml-1 text-muted-foreground">₽</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(rate.date), 'dd MMM yyyy', {
                          locale: ru,
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(rate)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingRate ? 'Изменить курс' : 'Добавить курс валюты'}
            </DialogTitle>
            <DialogDescription>
              {editingRate
                ? `Обновите курс ${editingRate.from_currency} к рублю`
                : 'Укажите валюту и её курс к рублю'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Currency */}
              <FormField
                control={form.control}
                name="fromCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Валюта</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!editingRate}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите валюту" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.symbol} {currency.value} - {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rate */}
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Курс к рублю</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Сколько рублей за 1 единицу валюты
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createRate.isPending}
                >
                  {createRate.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
