import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Settings className="h-6 w-6 text-muted-foreground" />
          Настройки
        </h1>
        <p className="mt-1 text-muted-foreground">
          Конфигурация приложения
        </p>
      </div>

      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          Раздел в разработке
        </p>
      </div>
    </motion.div>
  )
}
