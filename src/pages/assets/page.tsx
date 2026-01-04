import { motion } from 'framer-motion'

export default function AssetsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Активы</h1>
        <p className="mt-1 text-muted-foreground">
          Валюты, акции, криптовалюты и вклады
        </p>
      </div>

      <div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30">
        <p className="text-muted-foreground">
          Список активов будет здесь
        </p>
      </div>
    </motion.div>
  )
}
