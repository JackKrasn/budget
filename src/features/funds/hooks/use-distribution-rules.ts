import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { distributionRulesApi } from '@/lib/api'
import type {
  DistributionRulesListParams,
  CreateDistributionRuleRequest,
  UpdateDistributionRuleRequest,
} from '@/lib/api'
import { toast } from 'sonner'
import { fundKeys } from './use-funds'

// === Query Keys ===

export const distributionRuleKeys = {
  all: ['distribution-rules'] as const,
  lists: () => [...distributionRuleKeys.all, 'list'] as const,
  list: (params?: DistributionRulesListParams) =>
    [...distributionRuleKeys.lists(), params] as const,
  details: () => [...distributionRuleKeys.all, 'detail'] as const,
  detail: (id: string) => [...distributionRuleKeys.details(), id] as const,
  byFund: (fundId: string) =>
    [...distributionRuleKeys.lists(), { fundId }] as const,
  active: () => [...distributionRuleKeys.lists(), { active: true }] as const,
}

// === Hooks ===

/**
 * Получить список всех правил распределения
 */
export function useDistributionRules(params?: DistributionRulesListParams) {
  return useQuery({
    queryKey: distributionRuleKeys.list(params),
    queryFn: () => distributionRulesApi.list(params),
  })
}

/**
 * Получить активные правила распределения
 */
export function useActiveDistributionRules() {
  return useQuery({
    queryKey: distributionRuleKeys.active(),
    queryFn: () => distributionRulesApi.list({ active: true }),
  })
}

/**
 * Получить правила распределения для конкретного фонда
 */
export function useFundDistributionRules(fundId: string) {
  return useQuery({
    queryKey: distributionRuleKeys.byFund(fundId),
    queryFn: () => distributionRulesApi.list({ fundId }),
    enabled: !!fundId,
  })
}

/**
 * Получить правило по ID
 */
export function useDistributionRule(id: string) {
  return useQuery({
    queryKey: distributionRuleKeys.detail(id),
    queryFn: () => distributionRulesApi.get(id),
    enabled: !!id,
  })
}

/**
 * Создать правило распределения
 */
export function useCreateDistributionRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDistributionRuleRequest) =>
      distributionRulesApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionRuleKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: distributionRuleKeys.byFund(variables.fundId),
      })
      // Also invalidate funds to update summary
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Правило распределения создано')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить правило распределения
 */
export function useUpdateDistributionRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateDistributionRuleRequest
    }) => distributionRulesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionRuleKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: distributionRuleKeys.detail(variables.id),
      })
      // Also invalidate funds to update summary
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Правило распределения обновлено')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить правило распределения
 */
export function useDeleteDistributionRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => distributionRulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: distributionRuleKeys.lists() })
      // Also invalidate funds to update summary
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Правило распределения удалено')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
