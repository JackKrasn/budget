import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import DashboardPage from '@/pages/dashboard/page'
import BudgetPage from '@/pages/budget/page'
import FundsPage from '@/pages/funds/page'
import AssetsPage from '@/pages/assets/page'
import AccountsPage from '@/pages/accounts/page'
import ExpensesPage from '@/pages/expenses/page'
import IncomesPage from '@/pages/incomes/page'
import CategoriesPage from '@/pages/categories/page'
import AnalyticsPage from '@/pages/analytics/page'
import SettingsPage from '@/pages/settings/page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'budget',
        element: <BudgetPage />,
      },
      {
        path: 'funds',
        element: <FundsPage />,
      },
      {
        path: 'expenses',
        element: <ExpensesPage />,
      },
      {
        path: 'incomes',
        element: <IncomesPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
      },
      {
        path: 'assets',
        element: <AssetsPage />,
      },
      {
        path: 'accounts',
        element: <AccountsPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
])
