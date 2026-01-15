import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Loader2,
  Settings,
  History,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useUpdateFund,
  useFundDistributionRules,
  useCreateDistributionRule,
  useUpdateDistributionRule,
  useDeleteDistributionRule,
} from '../hooks'
import { FundTransactionsHistory } from './fund-transactions-history'
import type { FundBalance, FundStatus, RuleType } from '@/lib/api/types'

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
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#ef4444',
  '#3b82f6',
  '#84cc16',
  '#f97316',
  '#6366f1',
]

const formSchema = z.object({
  name: z.string().min(1, 'Введите название фонда'),
  icon: z.string().min(1, 'Выберите иконку'),
  color: z.string().min(1, 'Выберите цвет'),
  isVirtual: z.string(),
  status: z.enum(['active', 'paused', 'completed']),
})

type FormValues = z.infer<typeof formSchema>

const ruleFormSchema = z.object({
  ruleType: z.enum(['percentage', 'fixed']),
  ruleValue: z.string().min(1, 'Введите значение'),
  isActive: z.boolean(),
})

type RuleFormValues = z.infer<typeof ruleFormSchema>

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface FundDetailsSheetProps {
  fund: FundBalance | null
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'overview' | 'history' | 'settings'
}

export function FundDetailsSheet({
  fund,
  open,
  onOpenChange,
  defaultTab = 'overview',
}: FundDetailsSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingRule, setIsEditingRule] = useState(false)
  const updateFund = useUpdateFund()
  const createRule = useCreateDistributionRule()
  const updateRule = useUpdateDistributionRule()
  const deleteRule = useDeleteDistributionRule()
  const { data: rulesData } = useFundDistributionRules(fund?.fund.id ?? '')
  const activeRule = rulesData?.data?.find((r) => r.is_active)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: fund
      ? {
          name: fund.fund.name,
          icon: fund.fund.icon,
          color: fund.fund.color,
          isVirtual: fund.fund.is_virtual ? 'true' : 'false',
          status: fund.fund.status,
        }
      : undefined,
  })

  const ruleForm = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    values: activeRule
      ? {
          ruleType: activeRule.rule_type,
          ruleValue: String(activeRule.value || ''),
          isActive: activeRule.is_active,
        }
      : {
          ruleType: 'percentage',
          ruleValue: '10',
          isActive: true,
        },
  })

  const ruleType = ruleForm.watch('ruleType')

  async function onSubmit(values: FormValues) {
    if (!fund) return

    try {
      await updateFund.mutateAsync({
        id: fund.fund.id,
        data: {
          name: values.name,
          icon: values.icon,
          color: values.color,
          isVirtual: values.isVirtual === 'true',
          status: values.status as FundStatus,
        },
      })
      setIsEditing(false)
    } catch {
      // Error is handled in mutation
    }
  }

  async function onRuleSubmit(values: RuleFormValues) {
    if (!fund) return

    try {
      if (activeRule) {
        await updateRule.mutateAsync({
          id: activeRule.id,
          data: {
            ruleType: values.ruleType as RuleType,
            value: parseFloat(values.ruleValue),
            isActive: values.isActive,
          },
        })
      } else {
        await createRule.mutateAsync({
          fundId: fund.fund.id,
          ruleType: values.ruleType as RuleType,
          value: parseFloat(values.ruleValue),
          isActive: values.isActive,
        })
      }
      setIsEditingRule(false)
    } catch {
      // Error is handled in mutation
    }
  }

  async function handleDeleteRule() {
    if (!activeRule) return

    if (confirm('Удалить правило распределения?')) {
      try {
        await deleteRule.mutateAsync(activeRule.id)
        setIsEditingRule(false)
      } catch {
        // Error is handled in mutation
      }
    }
  }

  if (!fund) return null

  const { fund: fundData, totalBase, assets } = fund
  const Icon =
    FUND_ICONS.find((i) => i.value === fundData.icon)?.icon || Wallet

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-0 bg-gradient-to-b from-background to-background/95 p-0 sm:max-w-lg">
        {/* Header with gradient background */}
        <div
          className="relative overflow-hidden px-6 pb-8 pt-6"
          style={{
            background: `linear-gradient(135deg, ${fundData.color}15 0%, ${fundData.color}05 50%, transparent 100%)`,
          }}
        >
          <div className="absolute inset-0 opacity-30">
            <div
              className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl"
              style={{ backgroundColor: `${fundData.color}30` }}
            />
            <div
              className="absolute -left-8 bottom-0 h-24 w-24 rounded-full blur-2xl"
              style={{ backgroundColor: `${fundData.color}20` }}
            />
          </div>

          <SheetHeader className="relative">
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
                style={{
                  backgroundColor: fundData.color,
                  boxShadow: `0 10px 30px ${fundData.color}40`,
                }}
              >
                <Icon className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <SheetTitle className="text-xl font-semibold tracking-tight">
                  {fundData.name}
                </SheetTitle>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={
                      fundData.status === 'active'
                        ? 'default'
                        : fundData.status === 'paused'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="text-xs"
                  >
                    {fundData.status === 'active'
                      ? 'Активен'
                      : fundData.status === 'paused'
                        ? 'Пауза'
                        : 'Завершён'}
                  </Badge>
                  {fundData.is_virtual && (
                    <Badge variant="outline" className="text-xs">
                      Виртуальный
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Balance */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-2"
            >
              <p className="text-sm text-muted-foreground">Баланс</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums tracking-tight">
                  {formatMoney(totalBase)}
                </span>
                <span className="text-2xl font-medium text-muted-foreground">
                  ₽
                </span>
              </div>
              {activeRule && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeRule.rule_type === 'percentage'
                    ? `${activeRule.value}% от дохода`
                    : `${formatMoney(activeRule.value || 0)} ₽ фиксированно`}
                </p>
              )}
            </motion.div>
          </SheetHeader>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-6">
          <Tabs defaultValue={defaultTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="overview" className="gap-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                Обзор
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 text-xs">
                <History className="h-3.5 w-3.5" />
                История
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs">
                <Settings className="h-3.5 w-3.5" />
                Настройки
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Assets */}
              {assets.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Активы в фонде
                  </h3>
                  <div className="space-y-2">
                    {assets.map((asset, index) => (
                      <motion.div
                        key={asset.asset.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="flex items-center justify-between rounded-xl border-0 bg-muted/50 p-4"
                      >
                        <div>
                          <p className="font-medium">{asset.asset.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {asset.asset.ticker || asset.asset.typeCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold tabular-nums">
                            {formatMoney(asset.amount)} {asset.asset.currency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ≈ {formatMoney(asset.valueBase)} ₽
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/30 text-center"
                >
                  <Wallet className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Нет активов в фонде
                  </p>
                </motion.div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-6">
              <FundTransactionsHistory fundId={fundData.id} />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">
                          Название
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
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
                        <FormLabel className="text-sm text-muted-foreground">
                          Статус
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!isEditing}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Активен</SelectItem>
                            <SelectItem value="paused">Приостановлен</SelectItem>
                            <SelectItem value="completed">Завершён</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <FormLabel className="text-sm text-muted-foreground">
                          Иконка
                        </FormLabel>
                        <div className="grid grid-cols-6 gap-2">
                          {FUND_ICONS.map((item) => {
                            const ItemIcon = item.icon
                            return (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => isEditing && field.onChange(item.value)}
                                disabled={!isEditing}
                                className={cn(
                                  'flex h-11 w-11 items-center justify-center rounded-xl bg-muted/50 transition-all',
                                  isEditing && 'hover:bg-muted',
                                  field.value === item.value &&
                                    'bg-primary/10 ring-2 ring-primary',
                                  !isEditing && 'opacity-50'
                                )}
                                title={item.label}
                              >
                                <ItemIcon className="h-5 w-5" />
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
                        <FormLabel className="text-sm text-muted-foreground">
                          Цвет
                        </FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {FUND_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => isEditing && field.onChange(color)}
                              disabled={!isEditing}
                              className={cn(
                                'h-9 w-9 rounded-xl transition-all',
                                field.value === color
                                  ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110'
                                  : '',
                                isEditing && 'hover:scale-105',
                                !isEditing && 'opacity-50'
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Type */}
                  <FormField
                    control={form.control}
                    name="isVirtual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">
                          Тип фонда
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!isEditing}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="false">Реальный</SelectItem>
                            <SelectItem value="true">Виртуальный</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-2">
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          className="flex-1 h-12"
                          onClick={() => {
                            form.reset()
                            setIsEditing(false)
                          }}
                        >
                          Отмена
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 h-12 font-medium"
                          disabled={updateFund.isPending}
                        >
                          {updateFund.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Сохранение...
                            </>
                          ) : (
                            'Сохранить'
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        className="w-full h-12 font-medium"
                        onClick={() => setIsEditing(true)}
                      >
                        Редактировать
                      </Button>
                    )}
                  </div>
                </form>
              </Form>

              {/* Distribution Rule */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Правило распределения
                  </h3>
                  {activeRule && !isEditingRule && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingRule(true)}
                    >
                      Изменить
                    </Button>
                  )}
                </div>

                {isEditingRule || !activeRule ? (
                  <Form {...ruleForm}>
                    <form
                      onSubmit={ruleForm.handleSubmit(onRuleSubmit)}
                      className="space-y-4 rounded-xl bg-muted/30 p-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={ruleForm.control}
                          name="ruleType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">
                                Тип
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 border-0 bg-background/50">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="percentage">Процент</SelectItem>
                                  <SelectItem value="fixed">Фикс. сумма</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={ruleForm.control}
                          name="ruleValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">
                                {ruleType === 'percentage' ? 'Процент' : 'Сумма'}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    placeholder={ruleType === 'percentage' ? '10' : '5000'}
                                    {...field}
                                    className="h-11 border-0 bg-background/50 pr-8"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    {ruleType === 'percentage' ? '%' : '₽'}
                                  </span>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={ruleForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 rounded"
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer text-sm">
                              Правило активно
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3">
                        {activeRule && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-10"
                            onClick={handleDeleteRule}
                            disabled={deleteRule.isPending}
                          >
                            Удалить
                          </Button>
                        )}
                        <div className="flex flex-1 gap-3">
                          {(isEditingRule || activeRule) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="flex-1 h-10"
                              onClick={() => {
                                ruleForm.reset()
                                setIsEditingRule(false)
                              }}
                            >
                              Отмена
                            </Button>
                          )}
                          <Button
                            type="submit"
                            size="sm"
                            className="flex-1 h-10"
                            disabled={createRule.isPending || updateRule.isPending}
                          >
                            {createRule.isPending || updateRule.isPending
                              ? 'Сохранение...'
                              : activeRule
                                ? 'Сохранить'
                                : 'Создать'}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="rounded-xl bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {activeRule.rule_type === 'percentage'
                            ? `${activeRule.value}% от дохода`
                            : `${formatMoney(activeRule.value || 0)} ₽`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activeRule.is_active ? 'Активно' : 'Неактивно'}
                        </p>
                      </div>
                      <Badge variant={activeRule.is_active ? 'default' : 'secondary'}>
                        {activeRule.rule_type === 'percentage'
                          ? `${activeRule.value}%`
                          : `${formatMoney(activeRule.value || 0)} ₽`}
                      </Badge>
                    </div>
                  </div>
                )}

                {!activeRule && !isEditingRule && (
                  <Button
                    variant="outline"
                    className="w-full h-11 border-dashed"
                    onClick={() => setIsEditingRule(true)}
                  >
                    Добавить правило
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
