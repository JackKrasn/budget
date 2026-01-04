import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { exchangeRatesApi } from '@/lib/api'
import type { CreateExchangeRateRequest } from '@/lib/api'
import { toast } from 'sonner'

// === Query Keys ===

export const exchangeRateKeys = {
  all: ['exchange-rates'] as const,
  rates: () => [...exchangeRateKeys.all, 'rates'] as const,
}

// === Hooks ===

/**
 * Получить текущие курсы валют
 */
export function useExchangeRates() {
  return useQuery({
    queryKey: exchangeRateKeys.rates(),
    queryFn: () => exchangeRatesApi.getRates(),
    staleTime: 5 * 60 * 1000, // 5 минут
  })
}

/**
 * Обновить курс валюты
 */
export function useUpdateExchangeRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExchangeRateRequest) =>
      exchangeRatesApi.updateRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.rates() })
      toast.success('Курс валюты обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
