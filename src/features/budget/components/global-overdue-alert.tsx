import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOverduePayments } from '../hooks/use-overdue-payments'

const SESSION_STORAGE_KEY = 'overdue-alert-dismissed-timestamp'

export function GlobalOverdueAlert() {
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  const { overduePayments, overdueCount, isLoading, hasBudget } = useOverduePayments()

  // При загрузке проверяем, было ли закрыто уведомление в текущей сессии навигации
  // Используем timestamp, чтобы сбрасывать при перезагрузке страницы
  useEffect(() => {
    const dismissedTimestamp = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (dismissedTimestamp) {
      // Проверяем, была ли страница перезагружена (navigation type = reload)
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      const isReload = navEntries.length > 0 && navEntries[0].type === 'reload'

      if (isReload) {
        // При перезагрузке сбрасываем состояние
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
        setDismissed(false)
      } else {
        // При навигации внутри приложения - сохраняем состояние
        setDismissed(true)
      }
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem(SESSION_STORAGE_KEY, Date.now().toString())
  }

  const handleClick = () => {
    if (overduePayments.length === 1) {
      const payment = overduePayments[0]
      if (payment.type === 'expense') {
        navigate(`/planned-expenses/${payment.id}`)
      } else {
        navigate(`/planned-incomes/${payment.id}`)
      }
    } else {
      navigate('/planned-payments')
    }
  }

  // Не показываем если: загрузка, нет бюджета, закрыто, или нет просроченных
  if (isLoading || !hasBudget || dismissed || overdueCount === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed top-20 right-4 z-50 w-auto max-w-sm"
      >
        <div
          className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-xl px-4 py-3 cursor-pointer hover:bg-red-500/15 transition-colors shadow-lg shadow-red-500/10"
          onClick={handleClick}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-red-500">
              Просроченные платежи: {overdueCount}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {overduePayments.length === 1
                ? overduePayments[0].name
                : 'Нажмите, чтобы просмотреть'}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-red-500/50 shrink-0" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-red-500/10"
            onClick={(e) => {
              e.stopPropagation()
              handleDismiss()
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
