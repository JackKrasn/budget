import { motion, AnimatePresence } from 'framer-motion'
import { TrendingDown, TrendingUp, RefreshCw } from 'lucide-react'
import { useExchangeRates } from '@/features/expenses/hooks/use-exchange-rates'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Link } from 'react-router-dom'

const CURRENCY_CONFIG: Record<string, { symbol: string; flag: string; name: string }> = {
  USD: { symbol: '$', flag: '🇺🇸', name: 'Доллар США' },
  EUR: { symbol: '€', flag: '🇪🇺', name: 'Евро' },
  GEL: { symbol: '₾', flag: '🇬🇪', name: 'Грузинский лари' },
  TRY: { symbol: '₺', flag: '🇹🇷', name: 'Турецкая лира' },
  CNY: { symbol: '¥', flag: '🇨🇳', name: 'Китайский юань' },
  GBP: { symbol: '£', flag: '🇬🇧', name: 'Фунт стерлингов' },
  AED: { symbol: 'د.إ', flag: '🇦🇪', name: 'Дирхам ОАЭ' },
}

// Приоритет отображения валют
const PRIORITY_CURRENCIES = ['USD', 'EUR']

export function HeaderRates() {
  const { data, isLoading, error } = useExchangeRates()

  const rates = data?.data ?? []

  // Фильтруем только приоритетные валюты для header
  const displayRates = rates
    .filter((r) => PRIORITY_CURRENCIES.includes(r.from_currency))
    .sort(
      (a, b) =>
        PRIORITY_CURRENCIES.indexOf(a.from_currency) -
        PRIORITY_CURRENCIES.indexOf(b.from_currency)
    )

  if (error) {
    return null
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5"
            >
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Загрузка...</span>
            </motion.div>
          ) : displayRates.length > 0 ? (
            <motion.div
              key="rates"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex items-center"
            >
              <Link
                to="/exchange-rates"
                className="group flex items-center gap-0.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted/50"
              >
                {displayRates.map((rate, index) => {
                  const config = CURRENCY_CONFIG[rate.from_currency]
                  const isUp = rate.rate > 0 // В будущем можно добавить сравнение с прошлым курсом

                  return (
                    <Tooltip key={rate.id}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: index * 0.05,
                            duration: 0.2,
                            ease: [0.34, 1.56, 0.64, 1],
                          }}
                          className={cn(
                            'flex items-center gap-1.5 rounded-md px-2 py-1 transition-all duration-200',
                            'hover:bg-accent/50',
                            index > 0 && 'border-l border-border/30 ml-0.5 pl-2.5'
                          )}
                        >
                          {/* Currency symbol with gradient */}
                          <span className="text-xs font-semibold tracking-tight text-muted-foreground/80">
                            {config?.symbol || rate.from_currency}
                          </span>

                          {/* Rate value */}
                          <span className="tabular-nums text-sm font-bold tracking-tight text-foreground">
                            {rate.rate.toLocaleString('ru-RU', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>

                          {/* Trend indicator - subtle */}
                          <motion.div
                            animate={{
                              y: isUp ? [0, -1, 0] : [0, 1, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: 'reverse',
                              ease: 'easeInOut',
                            }}
                          >
                            {isUp ? (
                              <TrendingUp className="h-3 w-3 text-emerald-500/60" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-rose-500/60" />
                            )}
                          </motion.div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="flex flex-col gap-1 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{config?.flag}</span>
                          <span className="font-medium">
                            {config?.name || rate.from_currency}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          1 {rate.from_currency} = {rate.rate.toLocaleString('ru-RU', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })} ₽
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}

                {/* More rates indicator */}
                {rates.length > displayRates.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="ml-1 flex items-center"
                  >
                    <span className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground">
                      +{rates.length - displayRates.length}
                    </span>
                  </motion.div>
                )}
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}
