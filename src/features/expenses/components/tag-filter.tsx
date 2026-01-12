import { useState } from 'react'
import { Check, ChevronDown, Tag } from 'lucide-react'
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
import type { ExpenseTag } from '@/lib/api/types'

interface TagFilterProps {
  tags: ExpenseTag[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function TagFilter({ tags, selectedId, onSelect }: TagFilterProps) {
  const [open, setOpen] = useState(false)

  const selectedTag = tags.find((t) => t.id === selectedId)

  const handleSelect = (tagId: string) => {
    if (selectedId === tagId) {
      onSelect(null)
    } else {
      onSelect(tagId)
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
          className="justify-between min-w-[160px]"
        >
          {selectedTag ? (
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedTag.color }}
              />
              {selectedTag.name}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Все метки
            </div>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск метки..." />
          <CommandList>
            <CommandEmpty>Метка не найдена</CommandEmpty>
            <CommandGroup>
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
                <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="flex-1">Все метки</span>
              </CommandItem>

              {tags.map((tag) => {
                const isSelected = selectedId === tag.id
                return (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => handleSelect(tag.id)}
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
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1">{tag.name}</span>
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
