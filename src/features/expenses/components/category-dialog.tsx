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
  Dumbbell,
  Baby,
  PersonStanding,
  Dog,
  Cat,
  Pizza,
  Cake,
  Beer,
  Wine,
  Apple,
  Fish,
  Beef,
  IceCream,
  Bike,
  Train,
  Fuel,
  Footprints,
  Pill,
  Stethoscope,
  Hospital,
  Scissors,
  Watch,
  Glasses,
  Gem,
  Crown,
  Sparkles,
  PartyPopper,
  Music,
  Camera,
  Headphones,
  Tv,
  Laptop,
  Monitor,
  School,
  BookOpen,
  Pencil,
  Calculator,
  PawPrint,
  Bone,
  Bed,
  Sofa,
  Lamp,
  Bath,
  Wrench,
  Flower2,
  TreePine,
  Flame,
  Snowflake,
  Sun,
  Umbrella,
  Cigarette,
} from 'lucide-react'
import type { ExpenseCategory } from '@/lib/api/types'

const AVAILABLE_ICONS = [
  // Основное
  { name: 'shopping-cart', icon: ShoppingCart, label: 'Продукты' },
  { name: 'shopping-bag', icon: ShoppingBag, label: 'Покупки' },
  { name: 'home', icon: Home, label: 'Дом' },
  { name: 'car', icon: Car, label: 'Авто' },
  { name: 'wallet', icon: Wallet, label: 'Кошелёк' },
  { name: 'dollar-sign', icon: DollarSign, label: 'Деньги' },

  // Еда и напитки
  { name: 'utensils', icon: Utensils, label: 'Еда' },
  { name: 'coffee', icon: Coffee, label: 'Кафе' },
  { name: 'pizza', icon: Pizza, label: 'Пицца' },
  { name: 'cake', icon: Cake, label: 'Торт' },
  { name: 'beer', icon: Beer, label: 'Пиво' },
  { name: 'wine', icon: Wine, label: 'Вино' },
  { name: 'apple', icon: Apple, label: 'Фрукты' },
  { name: 'fish', icon: Fish, label: 'Рыба' },
  { name: 'beef', icon: Beef, label: 'Мясо' },
  { name: 'ice-cream', icon: IceCream, label: 'Мороженое' },

  // Транспорт
  { name: 'bus', icon: Bus, label: 'Автобус' },
  { name: 'bike', icon: Bike, label: 'Велосипед' },
  { name: 'train', icon: Train, label: 'Поезд' },
  { name: 'plane', icon: Plane, label: 'Самолёт' },
  { name: 'fuel', icon: Fuel, label: 'Топливо' },
  { name: 'footprints', icon: Footprints, label: 'Пешком' },

  // Здоровье и спорт
  { name: 'heart', icon: Heart, label: 'Здоровье' },
  { name: 'dumbbell', icon: Dumbbell, label: 'Спорт' },
  { name: 'pill', icon: Pill, label: 'Лекарства' },
  { name: 'stethoscope', icon: Stethoscope, label: 'Врач' },
  { name: 'hospital', icon: Hospital, label: 'Больница' },

  // Семья и дети
  { name: 'baby', icon: Baby, label: 'Младенец' },
  { name: 'person-standing', icon: PersonStanding, label: 'Ребёнок' },

  // Питомцы
  { name: 'dog', icon: Dog, label: 'Собака' },
  { name: 'cat', icon: Cat, label: 'Кошка' },
  { name: 'paw-print', icon: PawPrint, label: 'Лапки' },
  { name: 'bone', icon: Bone, label: 'Корм' },

  // Личное
  { name: 'scissors', icon: Scissors, label: 'Красота' },
  { name: 'watch', icon: Watch, label: 'Часы' },
  { name: 'glasses', icon: Glasses, label: 'Очки' },
  { name: 'gem', icon: Gem, label: 'Украшения' },
  { name: 'crown', icon: Crown, label: 'Роскошь' },
  { name: 'sparkles', icon: Sparkles, label: 'Особое' },

  // Развлечения
  { name: 'film', icon: Film, label: 'Кино' },
  { name: 'party-popper', icon: PartyPopper, label: 'Вечеринка' },
  { name: 'music', icon: Music, label: 'Музыка' },
  { name: 'camera', icon: Camera, label: 'Фото' },
  { name: 'headphones', icon: Headphones, label: 'Аудио' },
  { name: 'gift', icon: Gift, label: 'Подарки' },

  // Техника
  { name: 'smartphone', icon: Smartphone, label: 'Телефон' },
  { name: 'tv', icon: Tv, label: 'ТВ' },
  { name: 'laptop', icon: Laptop, label: 'Ноутбук' },
  { name: 'monitor', icon: Monitor, label: 'Монитор' },

  // Образование и работа
  { name: 'graduation-cap', icon: GraduationCap, label: 'Образование' },
  { name: 'school', icon: School, label: 'Школа' },
  { name: 'book-open', icon: BookOpen, label: 'Книги' },
  { name: 'pencil', icon: Pencil, label: 'Канцелярия' },
  { name: 'calculator', icon: Calculator, label: 'Калькулятор' },
  { name: 'briefcase', icon: Briefcase, label: 'Работа' },

  // Дом
  { name: 'bed', icon: Bed, label: 'Спальня' },
  { name: 'sofa', icon: Sofa, label: 'Мебель' },
  { name: 'lamp', icon: Lamp, label: 'Освещение' },
  { name: 'bath', icon: Bath, label: 'Ванная' },
  { name: 'wrench', icon: Wrench, label: 'Ремонт' },
  { name: 'zap', icon: Zap, label: 'Электричество' },
  { name: 'flame', icon: Flame, label: 'Отопление' },
  { name: 'snowflake', icon: Snowflake, label: 'Охлаждение' },

  // Инвестиции
  { name: 'trending-up', icon: TrendingUp, label: 'Инвестиции' },

  // Природа и прочее
  { name: 'flower2', icon: Flower2, label: 'Цветы' },
  { name: 'tree-pine', icon: TreePine, label: 'Природа' },
  { name: 'sun', icon: Sun, label: 'Лето' },
  { name: 'umbrella', icon: Umbrella, label: 'Зонт' },
  { name: 'cigarette', icon: Cigarette, label: 'Табак' },
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
