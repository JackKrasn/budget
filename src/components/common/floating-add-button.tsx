import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FloatingAddButtonProps {
  onClick?: () => void
  className?: string
}

export function FloatingAddButton({ onClick, className }: FloatingAddButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex h-14 w-14 items-center justify-center rounded-full',
        'bg-primary text-primary-foreground shadow-lg',
        'hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'transition-colors duration-200',
        className
      )}
      aria-label="Добавить расход"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </motion.button>
  )
}
