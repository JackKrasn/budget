import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { exchangeRatesApi } from '@/lib/api'
import type { CreateExchangeRateRequest } from '@/lib/api'
import { toast } from 'sonner'

// === Query Keys ===

export const exchangeRateKeys = {
  all: ['exchange-rates'] as const,
  list: () => [...exchangeRateKeys.all, 'list'] as const,
}

// === Hooks ===

/**
 * Получить список курсов валют
 */
export function useExchangeRates() {
  return useQuery({
    queryKey: exchangeRateKeys.list(),
    queryFn: () => exchangeRatesApi.list(),
    staleTime: 5 * 60 * 1000, // 5 минут
  })
}

/**
 * Добавить курс валюты
 */
export function useCreateExchangeRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExchangeRateRequest) =>
      exchangeRatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.list() })
      toast.success('Курс валюты добавлен')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить курс валюты
 */
export function useUpdateExchangeRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { rate: number; source?: string } }) =>
      exchangeRatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.list() })
      toast.success('Курс валюты обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
