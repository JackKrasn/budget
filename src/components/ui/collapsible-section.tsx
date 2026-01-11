import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  id: string
  title: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  headerAction?: React.ReactNode
  className?: string
  persistState?: boolean
}

const STORAGE_KEY = 'budget-sections-state'

function getSavedState(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveState(id: string, isOpen: boolean) {
  try {
    const current = getSavedState()
    current[id] = isOpen
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Ignore storage errors
  }
}

export function CollapsibleSection({
  id,
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
  headerAction,
  className,
  persistState = true,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (persistState) {
      const saved = getSavedState()
      return saved[id] ?? defaultOpen
    }
    return defaultOpen
  })

  useEffect(() => {
    if (persistState) {
      saveState(id, isOpen)
    }
  }, [id, isOpen, persistState])

  const toggle = () => setIsOpen((prev) => !prev)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader
          className={cn(
            'cursor-pointer select-none transition-colors hover:bg-muted/30',
            !isOpen && 'pb-4'
          )}
          onClick={toggle}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              {icon && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                  {icon}
                </div>
              )}
              <span>{title}</span>
              {badge}
            </CardTitle>

            <div className="flex items-center gap-2">
              {/* Prevent click propagation for header actions */}
              {headerAction && (
                <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>
              )}

              <motion.div
                animate={{ rotate: isOpen ? 0 : -90 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.2 },
              }}
            >
              <CardContent className="pt-0">{children}</CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
