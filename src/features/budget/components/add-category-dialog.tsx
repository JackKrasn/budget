import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExpenseCategories } from '@/features/expenses'
import type { ExpenseCategoryWithTags } from '@/lib/api/types'

const formSchema = z.object({
  categoryId: z.string().min(1, 'Выберите категорию'),
  plannedAmount: z.string().min(1, 'Введите сумму'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingCategoryIds: string[]
  onAdd: (categoryId: string, plannedAmount: number, notes?: string) => Promise<void>
  isPending?: boolean
}

export function AddCategoryDialog({
  open,
  onOpenChange,
  existingCategoryIds,
  onAdd,
  isPending,
}: AddCategoryDialogProps) {
  const { data: categoriesData } = useExpenseCategories()
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategoryWithTags | null>(null)

  const availableCategories = (categoriesData?.data ?? []).filter(
    (c) => !existingCategoryIds.includes(c.id)
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: '',
      plannedAmount: '',
      notes: '',
    },
  })

  const handleCategoryChange = (categoryId: string) => {
    const category = availableCategories.find((c) => c.id === categoryId)
    setSelectedCategory(category ?? null)
    form.setValue('categoryId', categoryId)
  }

  async function onSubmit(values: FormValues) {
    await onAdd(values.categoryId, parseFloat(values.plannedAmount) || 0, values.notes)
    form.reset()
    setSelectedCategory(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить категорию</DialogTitle>
          <DialogDescription>
            Выберите категорию и укажите планируемую сумму
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <Select
                    onValueChange={handleCategoryChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию">
                          {selectedCategory && (
                            <div className="flex items-center gap-2">
                              <span
                                className="flex h-6 w-6 items-center justify-center rounded text-sm"
                                style={{
                                  backgroundColor:
                                    selectedCategory.color + '20',
                                }}
                              >
                                {selectedCategory.icon}
                              </span>
                              {selectedCategory.name}
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCategories.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          Все категории уже добавлены
                        </div>
                      ) : (
                        availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="flex h-6 w-6 items-center justify-center rounded text-sm"
                                style={{
                                  backgroundColor: category.color + '20',
                                }}
                              >
                                {category.icon}
                              </span>
                              {category.name}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plannedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Планируемая сумма (₽)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending || availableCategories.length === 0}
              >
                {isPending ? 'Добавление...' : 'Добавить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
