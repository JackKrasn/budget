import {
  Utensils,
  Car,
  Home,
  Shirt,
  Heart,
  Gamepad2,
  GraduationCap,
  Gift,
  Plane,
  ShoppingBag,
  Smartphone,
  Wifi,
  Zap,
  Droplets,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Briefcase,
  Baby,
  Dog,
  Dumbbell,
  Pill,
  Scissors,
  Coffee,
  Beer,
  Music,
  Film,
  Book,
  Palette,
  Wrench,
  ShieldCheck,
  Banknote,
  Receipt,
  CircleDollarSign,
  HelpCircle,
  Wallet,
  Umbrella,
  CalendarDays,
  Landmark,
  Gem,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getIconByName } from '@/lib/icon-registry'

// Маппинг кодов категорий на иконки Lucide
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Основные расходы
  food: Utensils,
  groceries: ShoppingBag,
  restaurants: Coffee,
  transport: Car,
  housing: Home,
  utilities: Zap,
  water: Droplets,
  internet: Wifi,
  phone: Smartphone,

  // Личные расходы
  clothing: Shirt,
  health: Heart,
  medicine: Pill,
  fitness: Dumbbell,
  gym: Dumbbell,
  beauty: Scissors,

  // Развлечения
  entertainment: Gamepad2,
  games: Gamepad2,
  music: Music,
  movies: Film,
  streaming: Film,
  books: Book,
  hobbies: Palette,

  // Образование и работа
  education: GraduationCap,
  work: Briefcase,

  // Семья и питомцы
  kids: Baby,
  children: Baby,
  pets: Dog,

  // Путешествия и подарки
  travel: Plane,
  vacation: Plane,
  gifts: Gift,

  // Алкоголь и кафе
  alcohol: Beer,
  cafe: Coffee,
  coffee: Coffee,

  // Финансы
  credit: CreditCard,
  loans: CreditCard,
  savings: PiggyBank,
  investments: TrendingUp,
  insurance: ShieldCheck,
  taxes: Receipt,

  // Доходы
  salary: Banknote,
  income: CircleDollarSign,
  bonus: Gift,

  // Прочее
  repairs: Wrench,
  maintenance: Wrench,
  other: HelpCircle,
  misc: HelpCircle,
}

// Маппинг кодов/названий фондов на иконки Lucide
const FUND_ICONS: Record<string, LucideIcon> = {
  // По коду
  vacation: Plane,
  travel: Plane,
  savings: PiggyBank,
  emergency: Umbrella,
  investments: TrendingUp,
  retirement: Landmark,
  education: GraduationCap,
  health: Heart,
  repairs: Wrench,
  car: Car,
  gifts: Gift,
  yearly: CalendarDays,
  annual: CalendarDays,
  luxury: Gem,

  // По названию (русские)
  отпуск: Plane,
  путешествия: Plane,
  накопления: PiggyBank,
  сбережения: PiggyBank,
  резерв: Umbrella,
  подушка: Umbrella,
  инвестиции: TrendingUp,
  пенсия: Landmark,
  образование: GraduationCap,
  здоровье: Heart,
  ремонт: Wrench,
  машина: Car,
  авто: Car,
  подарки: Gift,
  ежегодные: CalendarDays,
  годовые: CalendarDays,
}

interface CategoryIconProps {
  /** Код категории (например, 'food', 'transport') */
  code: string
  /** Название иконки из реестра (опционально, приоритет над code) */
  iconName?: string
  /** Цвет фона (hex или CSS color) */
  color?: string
  /** Размер контейнера */
  size?: 'sm' | 'md' | 'lg'
  /** Дополнительные классы */
  className?: string
}

const SIZE_CONFIG = {
  sm: { container: 'h-6 w-6', icon: 'h-3.5 w-3.5' },
  md: { container: 'h-8 w-8', icon: 'h-4 w-4' },
  lg: { container: 'h-10 w-10', icon: 'h-5 w-5' },
}

export function CategoryIcon({
  code,
  iconName,
  color = '#6b7280',
  size = 'md',
  className,
}: CategoryIconProps) {
  // Если передана iconName, используем её; иначе fallback на code
  const Icon: LucideIcon = iconName
    ? getIconByName(iconName)
    : CATEGORY_ICONS[code.toLowerCase()] ?? HelpCircle

  const sizeConfig = SIZE_CONFIG[size]

  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-lg',
        sizeConfig.container,
        className
      )}
      style={{ backgroundColor: color + '20' }}
    >
      <Icon
        className={sizeConfig.icon}
        style={{ color }}
      />
    </span>
  )
}

/** Получить иконку Lucide по коду категории */
export function getCategoryIcon(code: string): LucideIcon {
  return CATEGORY_ICONS[code.toLowerCase()] ?? HelpCircle
}

interface FundIconProps {
  /** Название или код фонда */
  name: string
  /** Название иконки Lucide (если есть) */
  iconName?: string
  /** Цвет фона (hex или CSS color) */
  color?: string
  /** Размер контейнера */
  size?: 'sm' | 'md' | 'lg'
  /** Дополнительные классы */
  className?: string
}

export function FundIcon({
  name,
  iconName,
  color = '#6b7280',
  size = 'md',
  className,
}: FundIconProps) {
  // Приоритет: iconName > поиск по названию > Wallet
  let Icon: LucideIcon = Wallet

  if (iconName) {
    // Если передано имя иконки, используем его
    Icon = getIconByName(iconName)
  } else {
    // Иначе ищем иконку по названию фонда (в нижнем регистре)
    const nameLower = name.toLowerCase()
    for (const [key, icon] of Object.entries(FUND_ICONS)) {
      if (nameLower.includes(key)) {
        Icon = icon
        break
      }
    }
  }

  const sizeConfig = SIZE_CONFIG[size]

  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-lg',
        sizeConfig.container,
        className
      )}
      style={{ backgroundColor: color + '20' }}
    >
      <Icon className={sizeConfig.icon} style={{ color }} />
    </span>
  )
}

/** Получить иконку Lucide по названию фонда */
export function getFundIcon(name: string): LucideIcon {
  const nameLower = name.toLowerCase()
  for (const [key, icon] of Object.entries(FUND_ICONS)) {
    if (nameLower.includes(key)) {
      return icon
    }
  }
  return Wallet
}
