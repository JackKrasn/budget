import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { Separator } from '@/components/ui/separator'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useUpdateFund,
  useFundHistory,
  useFundDistributionRules,
  useCreateDistributionRule,
  useUpdateDistributionRule,
  useDeleteDistributionRule,
} from '../hooks'
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

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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
  const { data: historyData, isLoading: isLoadingHistory } = useFundHistory(
    fund?.fund.id ?? '',
  )
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

  const { fund: fundData, totalRub, assets } = fund
  const Icon =
    FUND_ICONS.find((i) => i.value === fundData.icon)?.icon || Wallet

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${fundData.color}20` }}
            >
              <Icon className="h-6 w-6" style={{ color: fundData.color }} />
            </div>
            <div>
              <SheetTitle>{fundData.name}</SheetTitle>
              <SheetDescription>
                {fundData.is_virtual ? 'Виртуальный фонд' : 'Реальный фонд'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue={defaultTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            {/* Balance */}
            <div className="rounded-lg border border-border/50 bg-card/50 p-4">
              <p className="text-sm text-muted-foreground">Текущий баланс</p>
              <p className="text-3xl font-bold tabular-nums">
                {formatMoney(totalRub)}{' '}
                <span className="text-xl text-muted-foreground">₽</span>
              </p>
            </div>

            {/* Assets */}
            {assets.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Активы в фонде</h3>
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.asset.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-card/30 p-3"
                    >
                      <div>
                        <p className="font-medium">{asset.asset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.asset.ticker || asset.asset.typeCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium tabular-nums">
                          {formatMoney(asset.amount)} {asset.asset.currency}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ≈ {formatMoney(asset.valueRub)} ₽
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Информация</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Правило распределения</span>
                  {activeRule ? (
                    <Badge variant="secondary">
                      {activeRule.rule_type === 'percentage'
                        ? `${activeRule.value}%`
                        : `${formatMoney(activeRule.value || 0)} ₽`}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Не задано</Badge>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Статус</span>
                  <Badge
                    variant={
                      fundData.status === 'active'
                        ? 'default'
                        : fundData.status === 'paused'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {fundData.status === 'active'
                      ? 'Активен'
                      : fundData.status === 'paused'
                        ? 'Приостановлен'
                        : 'Завершён'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Создан</span>
                  <span>{formatDate(fundData.created_at)}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-4">
            {isLoadingHistory ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Contributions */}
                {historyData?.contributions && historyData.contributions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-green-500">
                      Пополнения
                    </h3>
                    <div className="space-y-2">
                      {historyData.contributions.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 p-3"
                        >
                          <div>
                            <p className="text-sm">{formatDate(c.date)}</p>
                            {c.note && (
                              <p className="text-xs text-muted-foreground">
                                {c.note}
                              </p>
                            )}
                          </div>
                          <p className="font-medium text-green-500">
                            +{formatMoney(c.total_amount)} {c.currency}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Withdrawals */}
                {historyData?.withdrawals && historyData.withdrawals.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-red-500">
                      Списания
                    </h3>
                    <div className="space-y-2">
                      {historyData.withdrawals.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3"
                        >
                          <div>
                            <p className="text-sm">{formatDate(w.date)}</p>
                            <p className="text-xs text-muted-foreground">
                              {w.purpose}
                            </p>
                          </div>
                          <p className="font-medium text-red-500">
                            -{formatMoney(w.total_amount)} {w.currency}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!historyData?.contributions?.length &&
                  !historyData?.withdrawals?.length) && (
                  <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                    <p>История пуста</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
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
                        <Input {...field} disabled={!isEditing} />
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
                      <FormLabel>Статус</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!isEditing}
                      >
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>Иконка</FormLabel>
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
                                'flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 transition-all',
                                isEditing && 'hover:border-border hover:bg-muted/50',
                                field.value === item.value &&
                                  'border-primary bg-primary/10',
                                !isEditing && 'opacity-60'
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
                      <FormLabel>Цвет</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {FUND_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => isEditing && field.onChange(color)}
                            disabled={!isEditing}
                            className={cn(
                              'h-8 w-8 rounded-full border-2 transition-all',
                              field.value === color
                                ? 'border-foreground scale-110'
                                : 'border-transparent',
                              isEditing && 'hover:scale-105',
                              !isEditing && 'opacity-60'
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Virtual */}
                <FormField
                  control={form.control}
                  name="isVirtual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип фонда</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!isEditing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Виртуальный</SelectItem>
                          <SelectItem value="false">Реальный</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          form.reset()
                          setIsEditing(false)
                        }}
                      >
                        Отмена
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={updateFund.isPending}
                      >
                        {updateFund.isPending ? 'Сохранение...' : 'Сохранить'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => setIsEditing(true)}
                    >
                      Редактировать
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            <Separator className="my-6" />

            {/* Distribution Rule Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Правило распределения</h3>
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
                    className="space-y-4 rounded-lg border border-border/50 bg-muted/20 p-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={ruleForm.control}
                        name="ruleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Тип</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
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
                        control={ruleForm.control}
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
                                  placeholder={
                                    ruleType === 'percentage' ? '10' : '5000'
                                  }
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
                              className="h-4 w-4 rounded border-border"
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
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
                            variant="outline"
                            size="sm"
                            className="flex-1"
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
                          className="flex-1"
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
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {activeRule.rule_type === 'percentage'
                          ? `${activeRule.value}% от дохода`
                          : `${formatMoney(activeRule.value || 0)} ₽ фиксированно`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activeRule.is_active ? 'Активно' : 'Неактивно'}
                      </p>
                    </div>
                    <Badge
                      variant={activeRule.is_active ? 'default' : 'secondary'}
                    >
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
                  className="w-full"
                  onClick={() => setIsEditingRule(true)}
                >
                  Добавить правило распределения
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
