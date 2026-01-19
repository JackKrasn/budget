import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DateRange } from 'react-day-picker'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DateRangePickerProps {
  from: Date
  to: Date
  onRangeChange: (from: Date, to: Date) => void
}

type PeriodType = 'month' | 'custom'

export function DateRangePicker({ from, to, onRangeChange }: DateRangePickerProps) {
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [date, setDate] = useState<DateRange | undefined>({
    from,
    to,
  })
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)

  // Генерируем список доступных месяцев (от 2020 до текущего месяца)
  const getAvailableMonths = () => {
    const months: { value: string; label: string; year: number; month: number }[] = []
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    for (let year = 2020; year <= currentYear; year++) {
      const maxMonth = year === currentYear ? currentMonth : 11
      for (let month = 0; month <= maxMonth; month++) {
        const date = new Date(year, month, 1)
        months.push({
          value: `${year}-${month}`,
          label: format(date, 'LLLL yyyy', { locale: ru }),
          year,
          month,
        })
      }
    }

    return months.reverse() // Показываем новые месяцы сначала
  }

  const goToPreviousMonth = () => {
    const newDate = new Date(from.getFullYear(), from.getMonth() - 1, 1)
    const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1)
    const lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0)
    onRangeChange(firstDay, lastDay)
  }

  const goToNextMonth = () => {
    const newDate = new Date(from.getFullYear(), from.getMonth() + 1, 1)
    const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1)
    const lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0)
    onRangeChange(firstDay, lastDay)
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    onRangeChange(firstDay, lastDay)
  }

  const selectMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    onRangeChange(firstDay, lastDay)
    setMonthPickerOpen(false)
  }

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setDate(range)
    if (range?.from && range?.to) {
      onRangeChange(range.from, range.to)
    }
  }

  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type)
    if (type === 'month') {
      goToCurrentMonth()
    }
  }

  const formatDateRange = () => {
    if (periodType === 'month') {
      return format(from, 'LLLL yyyy', { locale: ru })
    }
    return `${format(from, 'd MMM', { locale: ru })} - ${format(to, 'd MMM yyyy', { locale: ru })}`
  }

  const canGoNext = from < new Date()

  return (
    <div className="flex items-center gap-2">
      {/* Period Type Selector */}
      <Select value={periodType} onValueChange={handlePeriodTypeChange}>
        <SelectTrigger className="w-[140px] text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">По месяцам</SelectItem>
          <SelectItem value="custom">Свой период</SelectItem>
        </SelectContent>
      </Select>

      {periodType === 'month' ? (
        <>
          {/* Month Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[180px] capitalize text-foreground"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0" align="start">
                <ScrollArea className="h-[300px]">
                  <div className="p-2 space-y-1">
                    {getAvailableMonths().map(({ value, label, year, month }) => {
                      const isSelected =
                        from.getFullYear() === year && from.getMonth() === month
                      return (
                        <Button
                          key={value}
                          variant={isSelected ? 'default' : 'ghost'}
                          className="w-full justify-start capitalize"
                          onClick={() => selectMonth(year, month)}
                        >
                          {label}
                        </Button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              disabled={!canGoNext}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Custom Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'min-w-[280px] justify-start text-left font-normal',
                  date?.from ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'd LLL y', { locale: ru })} -{' '}
                      {format(date.to, 'd LLL y', { locale: ru })}
                    </>
                  ) : (
                    format(date.from, 'd LLL y', { locale: ru })
                  )
                ) : (
                  <span>Выберите период</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleCustomRangeSelect}
                numberOfMonths={2}
                locale={ru}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  )
}
