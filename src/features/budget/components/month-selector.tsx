import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, addMonths, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'

interface MonthSelectorProps {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}

export function MonthSelector({ year, month, onChange }: MonthSelectorProps) {
  const currentDate = new Date(year, month - 1, 1)

  const handlePrev = () => {
    const prev = subMonths(currentDate, 1)
    onChange(prev.getFullYear(), prev.getMonth() + 1)
  }

  const handleNext = () => {
    const next = addMonths(currentDate, 1)
    onChange(next.getFullYear(), next.getMonth() + 1)
  }

  const handleToday = () => {
    const now = new Date()
    onChange(now.getFullYear(), now.getMonth() + 1)
  }

  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth() + 1

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-[160px] text-center">
        <span className="text-lg font-semibold capitalize">
          {format(currentDate, 'LLLL yyyy', { locale: ru })}
        </span>
      </div>

      <Button variant="outline" size="icon" onClick={handleNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrentMonth && (
        <Button variant="ghost" size="sm" onClick={handleToday}>
          Сегодня
        </Button>
      )}
    </div>
  )
}
