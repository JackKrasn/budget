import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import DashboardPage from '@/pages/dashboard/page'
import BudgetPage from '@/pages/budget/page'
import FundsPage from '@/pages/funds/page'
import FundDetailsPage from '@/pages/funds/[id]/page'
import AssetsPage from '@/pages/assets/page'
import AccountsPage from '@/pages/accounts/page'
import ExpensesPage from '@/pages/expenses/page'
import OperationsPage from '@/pages/operations/page'
import IncomesPage from '@/pages/incomes/page'
import IncomeDetailsPage from '@/pages/incomes/[id]/page'
import CreditsPage from '@/pages/credits/page'
import CreditDetailsPage from '@/pages/credits/[id]/page'
import DepositDetailsPage from '@/pages/deposits/[id]/page'
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
        path: 'funds/:id',
        element: <FundDetailsPage />,
      },
      {
        path: 'expenses',
        element: <ExpensesPage />,
      },
      {
        path: 'operations',
        element: <OperationsPage />,
      },
      {
        path: 'incomes',
        element: <IncomesPage />,
      },
      {
        path: 'incomes/:id',
        element: <IncomeDetailsPage />,
      },
      {
        path: 'credits',
        element: <CreditsPage />,
      },
      {
        path: 'credits/:id',
        element: <CreditDetailsPage />,
      },
      {
        path: 'deposits',
        element: <Navigate to="/assets" replace />,
      },
      {
        path: 'deposits/:id',
        element: <DepositDetailsPage />,
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
