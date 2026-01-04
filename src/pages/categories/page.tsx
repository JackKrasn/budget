import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

      {/* Categories Grid */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {categories.map((category) => (
            <Card
              key={category.id}
              className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Gradient overlay */}
              <div
                className="absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
                style={{
                  background: `linear-gradient(135deg, ${category.color} 0%, transparent 60%)`,
                }}
              />

              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <CategoryIcon
                      code={category.code}
                      color={category.color}
                      size="lg"
                      className="transition-transform group-hover:scale-105"
                    />
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {category.code}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(category)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Редактировать
                      </DropdownMenuItem>
                      {!category.is_system && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(category)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {category.is_system && (
                  <div className="mt-3">
                    <span className="inline-block rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      Системная
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
