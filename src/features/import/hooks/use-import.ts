import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importApi } from '@/lib/api'
import type { AnalyzeImportRequest, ExecuteImportRequest } from '@/lib/api/types'
import { toast } from 'sonner'
import { expenseKeys } from '@/features/expenses/hooks/use-expenses'
import { incomeKeys } from '@/features/incomes/hooks/use-incomes'
import { accountKeys } from '@/features/accounts/hooks/use-accounts'

/**
 * Мутация для анализа CSV файла
 */
export function useAnalyzeImport() {
  return useMutation({
    mutationFn: (data: AnalyzeImportRequest) => importApi.analyze(data),
    onError: (error) => {
      toast.error(`Ошибка анализа: ${error.message}`)
    },
  })
}

/**
 * Мутация для выполнения импорта
 */
export function useExecuteImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExecuteImportRequest) => importApi.execute(data),
    onSuccess: (data) => {
      const { summary } = data
      const total =
        summary.expensesImported + summary.transfersImported + summary.incomesImported

      // Инвалидируем кэш затронутых сущностей
      if (summary.expensesImported > 0) {
        queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      }
      if (summary.incomesImported > 0) {
        queryClient.invalidateQueries({ queryKey: incomeKeys.all })
      }
      // Переводы влияют на балансы счетов
      if (summary.transfersImported > 0) {
        queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      }

      if (data.summary.errorsCount > 0) {
        toast.warning(`Импортировано ${total} операций, ошибок: ${data.summary.errorsCount}`)
      } else {
        toast.success(`Импортировано ${total} операций`)
      }
    },
    onError: (error) => {
      toast.error(`Ошибка импорта: ${error.message}`)
    },
  })
}
