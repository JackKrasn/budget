import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OverduePaymentsAlertProps {
  overdueCount: number
}

export function OverduePaymentsAlert({ overdueCount }: OverduePaymentsAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  return (
    <AnimatePresence>
      {overdueCount > 0 && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-20 right-6 z-50 max-w-sm"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-card/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-red-500 text-sm">
                Просроченные платежи: {overdueCount}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Требуют внимания
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
