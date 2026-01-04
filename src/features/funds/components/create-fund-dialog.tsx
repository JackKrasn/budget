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
import { useCreateFund, useCreateDistributionRule } from '../hooks'
import {
  TrendingUp,
  Home,
  ShoppingBag,
  Calendar,
  Plane,
  Wallet,
  PiggyBank,
  Gift,
  Car,
  Briefcase,
  GraduationCap,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RuleType } from '@/lib/api/types'

const FUND_ICONS = [
  { value: 'trending-up', icon: TrendingUp, label: 'Инвестиции' },
  { value: 'home', icon: Home, label: 'Дом' },
  { value: 'shopping-bag', icon: ShoppingBag, label: 'Покупки' },
  { value: 'calendar', icon: Calendar, label: 'События' },
  { value: 'plane', icon: Plane, label: 'Путешествия' },
  { value: 'wallet', icon: Wallet, label: 'Кошелёк' },
  { value: 'piggy-bank', icon: PiggyBank, label: 'Накопления' },
  { value: 'gift', icon: Gift, label: 'Подарки' },
  { value: 'car', icon: Car, label: 'Авто' },
  { value: 'briefcase', icon: Briefcase, label: 'Работа' },
  { value: 'graduation-cap', icon: GraduationCap, label: 'Образование' },
  { value: 'heart', icon: Heart, label: 'Здоровье' },
]

const FUND_COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#ef4444', // red
  '#3b82f6', // blue
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

const formSchema = z.object({
  name: z.string().min(1, 'Введите название фонда'),
  icon: z.string().min(1, 'Выберите иконку'),
  color: z.string().min(1, 'Выберите цвет'),
  isVirtual: z.string(),
  // Distribution rule (optional - can be added later)
  createRule: z.boolean(),
  ruleType: z.enum(['percentage', 'fixed']),
  ruleValue: z.string(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateFundDialogProps {
  children: React.ReactNode
}

export function CreateFundDialog({ children }: CreateFundDialogProps) {
  const [open, setOpen] = useState(false)
  const createFund = useCreateFund()
  const createRule = useCreateDistributionRule()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      icon: 'wallet',
      color: '#10b981',
      isVirtual: 'true',
      createRule: true,
      ruleType: 'percentage',
      ruleValue: '10',
    },
  })

  const shouldCreateRule = form.watch('createRule')
  const ruleType = form.watch('ruleType')

  async function onSubmit(values: FormValues) {
    try {
      // Create fund first
      const fund = await createFund.mutateAsync({
        name: values.name,
        icon: values.icon,
        color: values.color,
        isVirtual: values.isVirtual === 'true',
      })

      // Then create distribution rule if requested
      if (values.createRule && values.ruleType && values.ruleValue) {
        await createRule.mutateAsync({
          fundId: fund.id,
          ruleType: values.ruleType as RuleType,
          value: parseFloat(values.ruleValue),
          isActive: true,
        })
      }

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
          <DialogTitle>Новый фонд</DialogTitle>
          <DialogDescription>
            Создайте фонд для финансирования расходов
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
                    <Input placeholder="Например: Отпуск 2025" {...field} />
                  </FormControl>
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
                    {FUND_ICONS.map((item) => {
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
                    {FUND_COLORS.map((color) => (
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

            {/* Distribution Rule */}
            <div className="space-y-4 rounded-lg border border-border/50 bg-muted/20 p-4">
              <FormField
                control={form.control}
                name="createRule"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-border"
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="cursor-pointer">
                        Добавить правило распределения
                      </FormLabel>
                      <FormDescription>
                        Автоматически распределять доход в этот фонд
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {shouldCreateRule && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="ruleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Процент</SelectItem>
                            <SelectItem value="fixed">Фикс. сумма</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ruleValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {ruleType === 'percentage' ? 'Процент' : 'Сумма'}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder={ruleType === 'percentage' ? '10' : '5000'}
                              {...field}
                              className="pr-10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {ruleType === 'percentage' ? '%' : '₽'}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Virtual */}
            <FormField
              control={form.control}
              name="isVirtual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип фонда</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">
                        Виртуальный (учётный)
                      </SelectItem>
                      <SelectItem value="false">
                        Реальный (привязан к счёту)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Виртуальные фонды используются для учёта, реальные — привязаны к
                    банковским счетам
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
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createFund.isPending}
              >
                {createFund.isPending ? 'Создание...' : 'Создать фонд'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
