import * as React from 'react'
import { Check, ChevronsUpDown, Building2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { BANKS, getBankByName, type Bank } from '@/lib/banks'

interface BankComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function BankCombobox({
  value,
  onValueChange,
  placeholder = 'Выберите банк...',
  className,
}: BankComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')

  const selectedBank = value ? getBankByName(value) : undefined

  const handleSelect = (bank: Bank) => {
    onValueChange(bank.name)
    setOpen(false)
    setInputValue('')
  }

  const handleInputChange = (search: string) => {
    setInputValue(search)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue && !BANKS.some(b => b.name.toLowerCase() === inputValue.toLowerCase())) {
      // Если нажали Enter и введённого банка нет в списке — используем введённое значение
      onValueChange(inputValue)
      setOpen(false)
      setInputValue('')
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedBank ? (
              <>
                <img
                  src={selectedBank.logo}
                  alt={selectedBank.name}
                  className="h-5 w-5 shrink-0 object-contain"
                />
                <span className="truncate">{selectedBank.name}</span>
              </>
            ) : value ? (
              <>
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{value}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Поиск банка..."
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <CommandEmpty>
            {inputValue ? (
              <div className="py-2 px-3 text-sm">
                <p className="text-muted-foreground">Банк не найден.</p>
                <p className="text-muted-foreground">
                  Нажмите <kbd className="rounded bg-muted px-1">Enter</kbd> чтобы использовать "{inputValue}"
                </p>
              </div>
            ) : (
              <p className="py-2 text-sm text-muted-foreground">Начните вводить название</p>
            )}
          </CommandEmpty>
          <div
            className="max-h-[300px] overflow-y-auto overscroll-contain"
            onWheelCapture={(e) => e.stopPropagation()}
          >
            <CommandGroup>
              {BANKS.filter((bank) => {
                if (!inputValue) return true
                const query = inputValue.toLowerCase()
                return (
                  bank.name.toLowerCase().includes(query) ||
                  bank.id.includes(query) ||
                  bank.aliases?.some((a) => a.toLowerCase().includes(query))
                )
              }).map((bank) => (
                <CommandItem
                  key={bank.id}
                  value={bank.name}
                  onSelect={() => handleSelect(bank)}
                  className="flex items-center gap-2"
                >
                  <img
                    src={bank.logo}
                    alt={bank.name}
                    className="h-5 w-5 shrink-0 object-contain"
                  />
                  <span>{bank.name}</span>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      selectedBank?.id === bank.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
