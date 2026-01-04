import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Currency } from '@/types'

interface SettingsState {
  mainCurrency: Currency
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean

  setMainCurrency: (currency: Currency) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mainCurrency: 'RUB',
      theme: 'dark',
      sidebarOpen: true,

      setMainCurrency: (currency) => set({ mainCurrency: currency }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'budget-settings',
    }
  )
)
