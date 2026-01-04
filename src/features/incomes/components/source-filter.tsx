import { Check, ChevronsUpDown, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface SourceFilterProps {
  sources: string[]
  selectedSource: string | null
  onSelect: (source: string | null) => void
}

export function SourceFilter({
  sources,
  selectedSource,
  onSelect,
}: SourceFilterProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            {selectedSource || 'Все источники'}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Поиск источника..." />
          <CommandList>
            <CommandEmpty>Источник не найден</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value=""
                onSelect={() => {
                  onSelect(null)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedSource === null ? 'opacity-100' : 'opacity-0'
                  )}
                />
                Все источники
              </CommandItem>
              {sources.map((source) => (
                <CommandItem
                  key={source}
                  value={source}
                  onSelect={() => {
                    onSelect(source)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedSource === source ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {source}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
