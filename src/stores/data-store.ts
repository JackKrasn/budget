import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Fund, Income, IncomeDistribution } from '@/types'

// Генерация UUID (fallback для non-secure contexts, например при доступе по IP)
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback для non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Начальные данные фондов
const initialFunds: Fund[] = [
  {
    id: generateId(),
    name: 'Инвестиции',
    icon: 'trending-up',
    color: '#10b981',
    distributionRule: { type: 'percentage', value: 20 },
    currentBalance: 450000,
    isVirtual: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Ремонт',
    icon: 'home',
    color: '#f59e0b',
    targetAmount: 500000,
    distributionRule: { type: 'percentage', value: 10 },
    currentBalance: 125000,
    isVirtual: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Дорогие покупки',
    icon: 'shopping-bag',
    color: '#8b5cf6',
    distributionRule: { type: 'percentage', value: 5 },
    currentBalance: 85000,
    isVirtual: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Ежегодные расходы',
    icon: 'calendar',
    color: '#ec4899',
    distributionRule: { type: 'percentage', value: 8 },
    currentBalance: 72000,
    isVirtual: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Отпуск',
    icon: 'plane',
    color: '#06b6d4',
    targetAmount: 300000,
    deadline: '2025-07-01',
    distributionRule: { type: 'percentage', value: 7 },
    currentBalance: 95000,
    isVirtual: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

interface DataState {
  funds: Fund[]
  incomes: Income[]

  // Фонды
  addFund: (fund: Omit<Fund, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateFund: (id: string, updates: Partial<Fund>) => void
  deleteFund: (id: string) => void

  // Доходы
  addIncome: (income: Omit<Income, 'id' | 'createdAt' | 'distributions' | 'remainingForBudget'>) => Income
  updateIncomeDistribution: (incomeId: string, fundId: string, updates: Partial<IncomeDistribution>) => void
  confirmDistribution: (incomeId: string, fundId: string, actualAmount: number) => void

  // Утилиты
  calculateDistributions: (amount: number) => { fundId: string; plannedAmount: number }[]
  getTotalDistributionPercentage: () => number
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      funds: initialFunds,
      incomes: [],

      // === Фонды ===
      addFund: (fund) => {
        const newFund: Fund = {
          ...fund,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ funds: [...state.funds, newFund] }))
      },

      updateFund: (id, updates) => {
        set((state) => ({
          funds: state.funds.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
          ),
        }))
      },

      deleteFund: (id) => {
        set((state) => ({ funds: state.funds.filter((f) => f.id !== id) }))
      },

      // === Доходы ===
      addIncome: (incomeData) => {
        const distributions = get().calculateDistributions(incomeData.amount)

        const totalDistributed = distributions.reduce((sum, d) => sum + d.plannedAmount, 0)
        const remainingForBudget = incomeData.amount - totalDistributed

        const incomeDistributions: IncomeDistribution[] = distributions.map((d) => ({
          fundId: d.fundId,
          plannedAmount: d.plannedAmount,
          actualAmount: 0,
          isCompleted: false,
        }))

        const newIncome: Income = {
          ...incomeData,
          id: generateId(),
          distributions: incomeDistributions,
          remainingForBudget,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({ incomes: [newIncome, ...state.incomes] }))
        return newIncome
      },

      updateIncomeDistribution: (incomeId, fundId, updates) => {
        set((state) => ({
          incomes: state.incomes.map((income) =>
            income.id === incomeId
              ? {
                  ...income,
                  distributions: income.distributions.map((d) =>
                    d.fundId === fundId ? { ...d, ...updates } : d
                  ),
                }
              : income
          ),
        }))
      },

      confirmDistribution: (incomeId, fundId, actualAmount) => {
        // Обновляем распределение дохода
        set((state) => ({
          incomes: state.incomes.map((income) => {
            if (income.id !== incomeId) return income

            const newDistributions = income.distributions.map((d) =>
              d.fundId === fundId
                ? { ...d, actualAmount, isCompleted: true }
                : d
            )

            // Пересчитываем остаток для бюджета
            const totalActual = newDistributions.reduce(
              (sum, d) => sum + (d.isCompleted ? d.actualAmount : 0),
              0
            )
            const totalPlanned = newDistributions.reduce(
              (sum, d) => sum + (!d.isCompleted ? d.plannedAmount : 0),
              0
            )

            return {
              ...income,
              distributions: newDistributions,
              remainingForBudget: income.amount - totalActual - totalPlanned,
            }
          }),
        }))

        // Увеличиваем баланс фонда
        set((state) => ({
          funds: state.funds.map((fund) =>
            fund.id === fundId
              ? {
                  ...fund,
                  currentBalance: fund.currentBalance + actualAmount,
                  updatedAt: new Date().toISOString(),
                }
              : fund
          ),
        }))
      },

      // === Утилиты ===
      calculateDistributions: (amount) => {
        const { funds } = get()
        const activeFunds = funds.filter((f) => f.status === 'active')

        return activeFunds.map((fund) => {
          let plannedAmount = 0

          if (fund.distributionRule.type === 'percentage' && fund.distributionRule.value) {
            plannedAmount = Math.round((amount * fund.distributionRule.value) / 100)
          } else if (fund.distributionRule.type === 'fixed' && fund.distributionRule.value) {
            plannedAmount = fund.distributionRule.value
          }

          return {
            fundId: fund.id,
            plannedAmount,
          }
        })
      },

      getTotalDistributionPercentage: () => {
        const { funds } = get()
        return funds
          .filter((f) => f.status === 'active' && f.distributionRule.type === 'percentage')
          .reduce((sum, f) => sum + (f.distributionRule.value || 0), 0)
      },
    }),
    {
      name: 'budget-data',
    }
  )
)
