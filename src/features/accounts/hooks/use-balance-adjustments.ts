import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { balanceAdjustmentsApi } from '@/lib/api'
import type {
  CreateBalanceAdjustmentRequest,
  UpdateAdjustmentRequest,
  SetBalanceRequest,
  BalanceAdjustmentsListParams,
} from '@/lib/api'
import { toast } from 'sonner'
import { accountKeys } from './use-accounts'

// === Query Keys ===

export const balanceAdjustmentKeys = {
  all: ['balanceAdjustments'] as const,
  lists: () => [...balanceAdjustmentKeys.all, 'list'] as const,
  list: (params?: BalanceAdjustmentsListParams) =>
    [...balanceAdjustmentKeys.lists(), params] as const,
  details: () => [...balanceAdjustmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...balanceAdjustmentKeys.details(), id] as const,
}

// === Hooks ===

/**
 * Получить список корректировок баланса
 */
export function useBalanceAdjustments(params?: BalanceAdjustmentsListParams) {
  return useQuery({
    queryKey: balanceAdjustmentKeys.list(params),
    queryFn: () => balanceAdjustmentsApi.list(params),
  })
}

/**
 * Получить корректировки для конкретного счёта
 */
export function useAccountBalanceAdjustments(accountId: string) {
  return useQuery({
    queryKey: balanceAdjustmentKeys.list({ accountId }),
    queryFn: () => balanceAdjustmentsApi.list({ accountId }),
    enabled: !!accountId,
  })
}

/**
 * Создать корректировку баланса (ручной ввод)
 */
export function useCreateBalanceAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBalanceAdjustmentRequest) =>
      balanceAdjustmentsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: balanceAdjustmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: accountKeys.detail(variables.accountId),
      })
      toast.success('Корректировка создана')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Установить баланс счёта (автоматический расчёт корректировки)
 */
export function useSetBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SetBalanceRequest) => balanceAdjustmentsApi.setBalance(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: balanceAdjustmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: accountKeys.detail(variables.accountId),
      })
      toast.success('Баланс синхронизирован')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить корректировку баланса
 */
export function useUpdateBalanceAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdjustmentRequest }) =>
      balanceAdjustmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: balanceAdjustmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Корректировка обновлена')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить корректировку баланса
 */
export function useDeleteBalanceAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => balanceAdjustmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: balanceAdjustmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Корректировка удалена')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
