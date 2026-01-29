import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
} from '@/features/expenses/hooks'
import { CategoryDialog } from '@/features/expenses/components/category-dialog'
import { CategoryIcon } from '@/components/common/category-icon'
import type { ExpenseCategory } from '@/lib/api/types'

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<ExpenseCategory | null>(null)

  const { data: categoriesData, isLoading, error, refetch } = useExpenseCategories()
  const createCategory = useCreateExpenseCategory()
  const updateCategory = useUpdateExpenseCategory()
  const deleteCategory = useDeleteExpenseCategory()

  const categories = categoriesData?.data ?? []

  const handleCreate = () => {
    setEditingCategory(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const handleDelete = (category: ExpenseCategory) => {
    setDeletingCategory(category)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return

    try {
      await deleteCategory.mutateAsync(deletingCategory.id)
      setDeleteDialogOpen(false)
      setDeletingCategory(null)
    } catch {
      // Error handled in mutation
    }
  }

  const handleSubmit = async (data: {
    code: string
    name: string
    icon: string
    color: string
  }) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        data: {
          name: data.name,
          icon: data.icon,
          color: data.color,
        },
      })
    } else {
      await createCategory.mutateAsync(data)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Категории расходов
          </h1>
          <p className="mt-1 text-muted-foreground">
            Управление категориями для классификации расходов
          </p>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Новая категория
        </Button>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Ошибка загрузки: {error.message}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Categories Grid - Two Columns */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm transition-colors hover:bg-muted/20"
              >
                {/* Icon */}
                <CategoryIcon
                  code={category.code}
                  iconName={category.icon}
                  color={category.color}
                  size="sm"
                  className="h-9 w-9 rounded-lg shrink-0"
                />

                {/* Name + Code */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{category.name}</span>
                    {category.is_system && (
                      <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground shrink-0">
                        Системная
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {category.code}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!category.is_system && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                      onClick={() => handleDelete(category)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground rounded-lg border border-dashed border-border/50">
              Нет категорий
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">
              Всего категорий: {categories.length}
            </div>
          )}
        </motion.div>
      )}

      {/* Category Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        onSubmit={handleSubmit}
        isPending={createCategory.isPending || updateCategory.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить категорию &quot;
              {deletingCategory?.name}&quot;? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
