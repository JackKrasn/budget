import { useState } from 'react'
import { Check, ChevronDown, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { FundBalance } from '@/lib/api/types'

interface FundFilterProps {
  funds: FundBalance[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function FundFilter({
  funds,
  selectedId,
  onSelect,
}: FundFilterProps) {
  const [open, setOpen] = useState(false)

  const selectedFund = funds.find((f) => f.fund.id === selectedId)

  const handleSelect = (fundId: string) => {
    if (selectedId === fundId) {
      onSelect(null)
    } else {
      onSelect(fundId)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between min-w-[180px]"
        >
          {selectedFund ? (
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedFund.fund.color }}
              />
              <span className="truncate">{selectedFund.fund.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 opacity-50" />
              <span>Все фонды</span>
            </div>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск фонда..." />
          <CommandList>
            <CommandEmpty>Фонд не найден</CommandEmpty>
            <CommandGroup>
              {/* Опция "Все фонды" */}
              <CommandItem
                value="all"
                onSelect={() => {
                  onSelect(null)
                  setOpen(false)
                }}
                className="cursor-pointer"
              >
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-full border',
                    !selectedId
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {!selectedId && <Check className="h-3 w-3" />}
                </div>
                <Landmark className="mr-2 h-4 w-4 opacity-50" />
                <span className="flex-1">Все фонды</span>
              </CommandItem>

              {funds.map((fundBalance) => {
                const fund = fundBalance.fund
                const isSelected = selectedId === fund.id
                return (
                  <CommandItem
                    key={fund.id}
                    value={fund.name}
                    onSelect={() => handleSelect(fund.id)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-full border',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div
                      className="mr-2 h-3 w-3 rounded-full"
                      style={{ backgroundColor: fund.color }}
                    />
                    <span className="flex-1 truncate">{fund.name}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
