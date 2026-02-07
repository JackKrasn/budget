import { useMemo } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ImportDateRange, ImportByDateSummary } from '@/lib/api/types'

interface PeriodSelectorProps {
  fullPeriod: ImportDateRange
  byDate: Record<string, ImportByDateSummary>
  selectedMode: 'full' | 'custom' | 'days'
  onModeChange: (mode: 'full' | 'custom' | 'days') => void
  dateFrom: Date | undefined
  dateTo: Date | undefined
  onDateChange: (from: Date | undefined, to: Date | undefined) => void
  selectedDays: string[]
  onDaysChange: (days: string[]) => void
}

export function PeriodSelector({
  fullPeriod,
  byDate,
  selectedMode,
  onModeChange,
  dateFrom,
  dateTo,
  onDateChange,
  selectedDays,
  onDaysChange,
}: PeriodSelectorProps) {
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'd MMM yyyy', { locale: ru })
  }

  const fullPeriodFrom = new Date(fullPeriod.from)
  const fullPeriodTo = new Date(fullPeriod.to)

  // Calculate total operations for full period
  const totalOperations = useMemo(() => {
    return Object.values(byDate).reduce(
      (sum, day) => sum + day.expenses + day.transfers + day.incomes,
      0
    )
  }, [byDate])

  // Calculate operations for selected custom period
  const customPeriodOperations = useMemo(() => {
    if (!dateFrom || !dateTo) return 0
    const fromStr = format(dateFrom, 'yyyy-MM-dd')
    const toStr = format(dateTo, 'yyyy-MM-dd')

    return Object.entries(byDate)
      .filter(([date]) => date >= fromStr && date <= toStr)
      .reduce((sum, [, day]) => sum + day.expenses + day.transfers + day.incomes, 0)
  }, [byDate, dateFrom, dateTo])

  // Calculate operations for selected days
  const selectedDaysOperations = useMemo(() => {
    return selectedDays.reduce((sum, date) => {
      const day = byDate[date]
      return sum + (day ? day.expenses + day.transfers + day.incomes : 0)
    }, 0)
  }, [byDate, selectedDays])

  // Handler for multi-day calendar selection
  const handleDayClick = (day: Date | undefined) => {
    if (!day) return
    const dateStr = format(day, 'yyyy-MM-dd')

    if (selectedDays.includes(dateStr)) {
      onDaysChange(selectedDays.filter((d) => d !== dateStr))
    } else {
      onDaysChange([...selectedDays, dateStr])
    }
  }

  // Check if date has operations
  const getDateOperations = (date: Date): number => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const day = byDate[dateStr]
    return day ? day.expenses + day.transfers + day.incomes : 0
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedMode} onValueChange={(v) => onModeChange(v as 'full' | 'custom' | 'days')}>
        {/* Full period option */}
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="full" id="period-full" />
          <Label htmlFor="period-full" className="flex items-center gap-2 cursor-pointer">
            Весь период ({formatDate(fullPeriod.from)} — {formatDate(fullPeriod.to)})
            <Badge variant="secondary" className="text-xs">
              {totalOperations} операций
            </Badge>
          </Label>
        </div>

        {/* Custom date range option */}
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="custom" id="period-custom" className="mt-1" />
          <div className="space-y-2">
            <Label htmlFor="period-custom" className="flex items-center gap-2 cursor-pointer">
              Выбрать даты
              {selectedMode === 'custom' && dateFrom && dateTo && (
                <Badge variant="secondary" className="text-xs">
                  {customPeriodOperations} операций
                </Badge>
              )}
            </Label>

            {selectedMode === 'custom' && (
              <div className="flex items-center gap-2">
                {/* Date From */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-[140px] justify-start text-left font-normal',
                        !dateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'd MMM', { locale: ru }) : 'С'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => onDateChange(date, dateTo)}
                      disabled={(date) => date < fullPeriodFrom || date > fullPeriodTo}
                      locale={ru}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-muted-foreground">—</span>

                {/* Date To */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-[140px] justify-start text-left font-normal',
                        !dateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'd MMM', { locale: ru }) : 'По'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => onDateChange(dateFrom, date)}
                      disabled={(date) =>
                        date < fullPeriodFrom ||
                        date > fullPeriodTo ||
                        Boolean(dateFrom && date < dateFrom)
                      }
                      locale={ru}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        {/* Specific days option */}
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="days" id="period-days" className="mt-1" />
          <div className="space-y-2">
            <Label htmlFor="period-days" className="flex items-center gap-2 cursor-pointer">
              Выбрать конкретные дни
              {selectedMode === 'days' && selectedDays.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedDays.length} дней, {selectedDaysOperations} операций
                </Badge>
              )}
            </Label>

            {selectedMode === 'days' && (
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={undefined}
                  onSelect={handleDayClick}
                  disabled={(date) => {
                    const ops = getDateOperations(date)
                    return date < fullPeriodFrom || date > fullPeriodTo || ops === 0
                  }}
                  modifiers={{
                    selected: selectedDays.map((d) => new Date(d)),
                    hasOperations: Object.keys(byDate).map((d) => new Date(d)),
                  }}
                  modifiersStyles={{
                    selected: {
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                    },
                  }}
                  locale={ru}
                  numberOfMonths={1}
                  className="rounded-md"
                />
                {selectedDays.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex flex-wrap gap-1">
                      {selectedDays.sort().map((date) => (
                        <Badge
                          key={date}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => onDaysChange(selectedDays.filter((d) => d !== date))}
                        >
                          {format(new Date(date), 'd MMM', { locale: ru })}
                          <span className="ml-1 opacity-70">×</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </RadioGroup>
    </div>
  )
}
