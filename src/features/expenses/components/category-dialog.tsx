import { useState, useEffect } from 'react'
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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Plane,
  Heart,
  Gift,
  GraduationCap,
  Smartphone,
  Zap,
  Coffee,
  Film,
  ShoppingBag,
  Wallet,
  DollarSign,
  Briefcase,
  Bus,
  TrendingUp,
} from 'lucide-react'
import type { ExpenseCategory } from '@/lib/api/types'

const AVAILABLE_ICONS = [
  { name: 'shopping-cart', icon: ShoppingCart, label: 'Продукты' },
  { name: 'home', icon: Home, label: 'Дом' },
  { name: 'car', icon: Car, label: 'Авто' },
  { name: 'utensils', icon: Utensils, label: 'Еда' },
  { name: 'plane', icon: Plane, label: 'Путешествия' },
  { name: 'heart', icon: Heart, label: 'Здоровье' },
  { name: 'gift', icon: Gift, label: 'Подарки' },
  { name: 'graduation-cap', icon: GraduationCap, label: 'Образование' },
  { name: 'smartphone', icon: Smartphone, label: 'Телефон' },
  { name: 'zap', icon: Zap, label: 'Коммуналка' },
  { name: 'coffee', icon: Coffee, label: 'Кафе' },
  { name: 'film', icon: Film, label: 'Развлечения' },
  { name: 'shopping-bag', icon: ShoppingBag, label: 'Покупки' },
  { name: 'wallet', icon: Wallet, label: 'Кошелёк' },
  { name: 'dollar-sign', icon: DollarSign, label: 'Деньги' },
  { name: 'briefcase', icon: Briefcase, label: 'Работа' },
  { name: 'bus', icon: Bus, label: 'Транспорт' },
  { name: 'trending-up', icon: TrendingUp, label: 'Инвестиции' },
]

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
]

const formSchema = z.object({
  code: z.string().min(1, 'Введите код категории'),
  name: z.string().min(1, 'Введите название'),
  icon: z.string().min(1, 'Выберите иконку'),
  color: z.string().min(1, 'Выберите цвет'),
})

type FormValues = z.infer<typeof formSchema>

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: ExpenseCategory
  onSubmit: (data: FormValues) => Promise<void>
  isPending?: boolean
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  isPending,
}: CategoryDialogProps) {
  const [selectedIcon, setSelectedIcon] = useState(category?.icon || AVAILABLE_ICONS[0].name)
  const [selectedColor, setSelectedColor] = useState(category?.color || DEFAULT_COLORS[0])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: category?.code || '',
      name: category?.name || '',
      icon: category?.icon || AVAILABLE_ICONS[0].name,
      color: category?.color || DEFAULT_COLORS[0],
    },
  })

  useEffect(() => {
    if (category) {
      form.reset({
        code: category.code,
        name: category.name,
        icon: category.icon,
        color: category.color,
      })
      setSelectedIcon(category.icon)
      setSelectedColor(category.color)
    } else {
      form.reset({
        code: '',
        name: '',
        icon: AVAILABLE_ICONS[0].name,
        color: DEFAULT_COLORS[0],
      })
      setSelectedIcon(AVAILABLE_ICONS[0].name)
      setSelectedColor(DEFAULT_COLORS[0])
    }
  }, [category, form])

  useEffect(() => {
    form.setValue('icon', selectedIcon)
  }, [selectedIcon, form])

  useEffect(() => {
    form.setValue('color', selectedColor)
  }, [selectedColor, form])

  async function handleSubmit(values: FormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Редактировать категорию' : 'Новая категория'}
          </DialogTitle>
          <DialogDescription>
            {category
              ? 'Измените параметры категории расходов'
              : 'Создайте новую категорию для классификации расходов'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Код</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="food, transport, etc."
                      {...field}
                      disabled={!!category}
                    />
                  </FormControl>
                  <FormMessage />
                  {category && (
                    <p className="text-xs text-muted-foreground">
                      Код нельзя изменить после создания
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Продукты" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon */}
            <div className="space-y-2">
              <Label>Иконка</Label>
              <div className="grid grid-cols-6 gap-2">
                {AVAILABLE_ICONS.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.name}
                      type="button"
                      className={`flex h-12 w-12 items-center justify-center rounded-md border-2 transition-all ${
                        selectedIcon === item.name
                          ? 'border-primary bg-primary/10 scale-105'
                          : 'border-border hover:border-primary/50 hover:bg-accent'
                      }`}
                      onClick={() => setSelectedIcon(item.name)}
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Цвет</Label>
              <div className="grid grid-cols-8 gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-9 w-9 rounded-md border-2 transition-all ${
                      selectedColor === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? 'Сохранение...' : category ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
