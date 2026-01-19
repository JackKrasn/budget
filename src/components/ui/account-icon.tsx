import { CreditCard, Wallet, PiggyBank, Landmark, TrendingUp, Bitcoin } from 'lucide-react'
import { getBankByName } from '@/lib/banks'
import { cn } from '@/lib/utils'

const ACCOUNT_TYPE_ICONS: Record<string, React.ElementType> = {
  card: CreditCard,
  cash: Wallet,
  deposit: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
  crypto_wallet: Bitcoin,
  default: Landmark,
}

interface AccountIconProps {
  bankName?: string | null
  typeCode?: string | null
  color?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showBackground?: boolean
}

const sizeClasses = {
  sm: { icon: 'h-4 w-4', container: 'h-6 w-6', logo: 'h-4 w-4' },
  md: { icon: 'h-5 w-5', container: 'h-9 w-9', logo: 'h-5 w-5' },
  lg: { icon: 'h-6 w-6', container: 'h-11 w-11', logo: 'h-6 w-6' },
}

export function AccountIcon({
  bankName,
  typeCode,
  color,
  size = 'md',
  className,
  showBackground = true,
}: AccountIconProps) {
  const bank = bankName ? getBankByName(bankName) : undefined
  const Icon = ACCOUNT_TYPE_ICONS[typeCode || 'default'] || ACCOUNT_TYPE_ICONS.default
  const sizes = sizeClasses[size]
  const iconColor = color || '#10b981'

  // Если есть логотип банка — показываем его
  if (bank) {
    if (showBackground) {
      return (
        <div
          className={cn(
            'flex items-center justify-center rounded-xl transition-transform',
            sizes.container,
            className
          )}
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <img
            src={bank.logo}
            alt={bank.name}
            className={cn('object-contain', sizes.logo)}
          />
        </div>
      )
    }
    return (
      <img
        src={bank.logo}
        alt={bank.name}
        className={cn('object-contain', sizes.logo, className)}
      />
    )
  }

  // Fallback на Lucide иконку
  if (showBackground) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl transition-transform',
          sizes.container,
          className
        )}
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Icon className={sizes.icon} style={{ color: iconColor }} />
      </div>
    )
  }

  return <Icon className={cn(sizes.icon, className)} style={{ color: iconColor }} />
}
