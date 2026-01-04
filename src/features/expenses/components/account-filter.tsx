import { useState } from 'react'
import { Check, ChevronDown, CreditCard, Wallet } from 'lucide-react'
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
import type { AccountWithType } from '@/lib/api/types'

interface AccountFilterProps {
  accounts: AccountWithType[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function AccountFilter({
  accounts,
  selectedId,
  onSelect,
}: AccountFilterProps) {
  const [open, setOpen] = useState(false)

  const selectedAccount = accounts.find((a) => a.id === selectedId)

  const handleSelect = (accountId: string) => {
    // Toggle: если уже выбран — сбросить
    if (selectedId === accountId) {
      onSelect(null)
    } else {
      onSelect(accountId)
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
          {selectedAccount ? (
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>{selectedAccount.name}</span>
              <span className="text-xs text-muted-foreground">
                ({selectedAccount.currency})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Все счета
            </div>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск счёта..." />
          <CommandList>
            <CommandEmpty>Счёт не найден</CommandEmpty>
            <CommandGroup>
              {/* Опция "Все счета" */}
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
                <Wallet className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="flex-1">Все счета</span>
              </CommandItem>

              {accounts.map((account) => {
                const isSelected = selectedId === account.id
                return (
                  <CommandItem
                    key={account.id}
                    value={account.name}
                    onSelect={() => handleSelect(account.id)}
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
                    <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{account.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {account.currency}
                    </span>
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
