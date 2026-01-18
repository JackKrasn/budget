import { motion } from 'framer-motion'
import { Tag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export interface TagSummary {
  tagId: string
  tagName: string
  tagColor: string
  totalAmount: number
  expenseCount: number
}

interface TagCardProps {
  tag: TagSummary
  onClick?: () => void
}

export function TagCard({ tag, onClick }: TagCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group relative cursor-pointer overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-xl hover:shadow-primary/5"
        onClick={onClick}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-[0.05] transition-opacity group-hover:opacity-[0.1]"
          style={{
            background: `linear-gradient(135deg, ${tag.tagColor} 0%, transparent 60%)`,
          }}
        />

        <CardContent className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Icon */}
            <div className="transition-transform group-hover:scale-110">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${tag.tagColor}20` }}
              >
                <Tag className="h-6 w-6" style={{ color: tag.tagColor }} />
              </div>
            </div>

            {/* Count badge */}
            <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              {tag.expenseCount} {tag.expenseCount === 1 ? 'запись' :
                tag.expenseCount >= 2 && tag.expenseCount <= 4 ? 'записи' : 'записей'}
            </div>
          </div>

          {/* Tag name */}
          <h3 className="mt-4 font-semibold tracking-tight">{tag.tagName}</h3>

          {/* Amount */}
          <div className="mt-3">
            <span className="text-2xl font-bold tabular-nums">
              {formatMoney(tag.totalAmount)}
            </span>
            <span className="ml-1 text-sm text-muted-foreground">P</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Grid of tag cards
interface TagGridProps {
  tags: TagSummary[]
  onTagClick?: (tagId: string) => void
}

export function TagGrid({ tags, onTagClick }: TagGridProps) {
  // Sort by total amount descending
  const sortedTags = [...tags].sort((a, b) => b.totalAmount - a.totalAmount)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortedTags.map((tag) => (
        <TagCard
          key={tag.tagId}
          tag={tag}
          onClick={() => onTagClick?.(tag.tagId)}
        />
      ))}
    </div>
  )
}
