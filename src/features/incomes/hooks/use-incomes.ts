import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { incomesApi } from '@/lib/api'
import type {
  IncomesListParams,
  CreateIncomeRequest,
  UpdateIncomeRequest,
  UpdateDistributionRequest,
  ConfirmDistributionRequest,
} from '@/lib/api/types'
import { toast } from 'sonner'
import { fundKeys } from '@/features/funds'
import { accountKeys } from '@/features/accounts/hooks/use-accounts'

export const incomeKeys = {
  all: ['incomes'] as const,
  lists: () => [...incomeKeys.all, 'list'] as const,
  list: (params?: IncomesListParams) => [...incomeKeys.lists(), params] as const,
  details: () => [...incomeKeys.all, 'detail'] as const,
  detail: (id: string) => [...incomeKeys.details(), id] as const,
}

export function useIncomes(params?: IncomesListParams) {
  return useQuery({
    queryKey: incomeKeys.list(params),
    queryFn: () => incomesApi.list(params),
  })
}

export function useIncome(id: string) {
  return useQuery({
    queryKey: incomeKeys.detail(id),
    queryFn: () => incomesApi.get(id),
    enabled: !!id,
    refetchOnMount: 'always',
    staleTime: 0,
  })
}

export function useCreateIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIncomeRequest) => incomesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      // Invalidate accounts to refresh balance
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Доход добавлен')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useUpdateIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncomeRequest }) =>
      incomesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: incomeKeys.detail(id) })
      // Invalidate accounts to refresh balance
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Доход обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useDeleteIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => incomesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      // Invalidate accounts to refresh balance
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Доход удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useUpdateDistribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      incomeId,
      fundId,
      data,
    }: {
      incomeId: string
      fundId: string
      data: UpdateDistributionRequest
    }) => incomesApi.updateDistribution(incomeId, fundId, data),
    onSuccess: (_, { incomeId }) => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.detail(incomeId) })
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      toast.success('Распределение обновлено')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useConfirmDistribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      incomeId,
      fundId,
      data,
    }: {
      incomeId: string
      fundId: string
      data: ConfirmDistributionRequest
    }) => incomesApi.confirmDistribution(incomeId, fundId, data),
    onSuccess: (_, { incomeId }) => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.detail(incomeId) })
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Распределение подтверждено')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
