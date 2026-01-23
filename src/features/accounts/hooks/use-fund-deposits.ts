import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fundDepositsApi } from '@/lib/api'
import type { ListFundDepositsParams, UpdateFundDepositRequest } from '@/lib/api/types'
import { toast } from 'sonner'
import { incomeKeys } from '@/features/incomes'
import { accountKeys } from './use-accounts'
import { fundKeys } from '@/features/funds'

// === Query Keys ===

export const fundDepositKeys = {
  all: ['fund-deposits'] as const,
  lists: () => [...fundDepositKeys.all, 'list'] as const,
  list: (params?: ListFundDepositsParams) =>
    params ? [...fundDepositKeys.lists(), params] : fundDepositKeys.lists(),
  details: () => [...fundDepositKeys.all, 'detail'] as const,
  detail: (id: string) => [...fundDepositKeys.details(), id] as const,
}

// === Hooks ===

/**
 * Получить список переводов в фонды
 */
export function useFundDeposits(params?: ListFundDepositsParams) {
  return useQuery({
    queryKey: fundDepositKeys.list(params),
    queryFn: () => fundDepositsApi.list(params),
  })
}

/**
 * Получить перевод в фонд по ID
 */
export function useFundDeposit(id: string) {
  return useQuery({
    queryKey: fundDepositKeys.detail(id),
    queryFn: () => fundDepositsApi.get(id),
    enabled: !!id,
  })
}

/**
 * Обновить перевод в фонд
 */
export function useUpdateFundDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFundDepositRequest }) =>
      fundDepositsApi.update(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: fundDepositKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      // Invalidate all fund data (lists, details, assets, transactions)
      queryClient.invalidateQueries({ queryKey: fundKeys.all })

      // Only show success toast if no balance info (balance info will be shown in dialog)
      if (!result?.accountBalance && !result?.fundBalance) {
        toast.success('Перевод обновлён')
      }
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить перевод в фонд (откатывает распределение если оно было из дохода)
 */
export function useDeleteFundDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => fundDepositsApi.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fundDepositKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      // Invalidate all fund data (lists, details, assets, transactions)
      queryClient.invalidateQueries({ queryKey: fundKeys.all })
      // Invalidate income queries in case this was an income distribution deposit
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: incomeKeys.details() })

      // Only show success toast if no balance info (balance info will be shown in dialog)
      if (!data?.accountBalance && !data?.fundBalance) {
        toast.success('Перевод удалён')
      }
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
