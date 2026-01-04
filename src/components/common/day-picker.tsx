import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DayPickerProps {
  value: number
  onChange: (day: number) => void
  disabled?: boolean
}

export function DayPicker({ value, onChange, disabled }: DayPickerProps) {
  const [open, setOpen] = useState(false)

  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  const handleSelect = (day: number) => {
    onChange(day)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value ? `${value} число` : 'Выберите день'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        <div className="mb-2 text-sm font-medium text-center text-muted-foreground">
          Выберите день месяца
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <Button
              key={day}
              variant={value === day ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-9 w-9 p-0 font-normal',
                value === day && 'bg-primary text-primary-foreground',
                day > 28 && 'text-muted-foreground'
              )}
              onClick={() => handleSelect(day)}
            >
              {day}
            </Button>
          ))}
        </div>
        <div className="mt-2 text-xs text-center text-muted-foreground">
          Дни 29-31 могут отсутствовать в некоторых месяцах
        </div>
      </PopoverContent>
    </Popover>
  )
}
