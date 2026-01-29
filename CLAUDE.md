# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal finance management application (Russian language UI) built with React + Tauri for desktop.

## Commands

```bash
# Development
npm run dev           # Start Vite dev server on port 5273
npm run tauri:dev     # Start Tauri desktop app in dev mode

# Build
npm run build         # TypeScript check + Vite production build
npm run tauri:build   # Build desktop application

# Quality
npm run lint          # Run ESLint
```

## Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS 4, shadcn/ui (new-york style)
- **Desktop**: Tauri 2 (Rust)
- **State**: TanStack Query for server state, Zustand for client state
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

### Project Structure

```
src/
├── app/              # App providers and router configuration
├── components/
│   ├── ui/           # shadcn/ui components (DO NOT MODIFY manually)
│   ├── common/       # Shared components (CategoryIcon, etc.)
│   └── layout/       # AppLayout, Sidebar, Header
├── features/         # Feature modules (domain-driven)
│   ├── budget/       # Budget planning, planned expenses/incomes
│   ├── expenses/     # Expense tracking
│   ├── incomes/      # Income tracking
│   ├── funds/        # Savings funds (sinking funds)
│   ├── accounts/     # Bank accounts, cards, cash
│   ├── credits/      # Loans and credits
│   ├── deposits/     # Bank deposits
│   ├── assets/       # Investment assets
│   └── analytics/    # Reports and charts
├── lib/
│   └── api/          # API client and type definitions
├── pages/            # Route pages (one folder per route)
├── stores/           # Zustand stores (settings, theme)
└── types/            # Shared TypeScript types
```

### Feature Module Pattern

Each feature follows this structure:
```
features/{feature}/
├── components/       # Feature-specific components
├── hooks/            # React Query hooks (useXxx, useCreateXxx, etc.)
└── index.ts          # Public exports
```

### API Layer

- Backend API base: `http://localhost:8100/api/v1` (configurable via `VITE_API_URL`)
- All API types defined in `src/lib/api/types.ts`
- Backend uses snake_case, frontend uses camelCase for requests
- Response types match backend snake_case directly

### React Query Patterns

```typescript
// Query keys pattern
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (params?) => [...expenseKeys.lists(), params] as const,
}

// Hooks pattern
export function useExpenses(params?) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expensesApi.list(params),
  })
}
```

### Multi-Currency Support

- Base currency: RUB
- Supported: RUB, USD, EUR, GEL, TRY
- `planned_amount_base` - amount converted to RUB at creation time
- `exchange_rate` - rate used for conversion
- Currency symbols: `CURRENCY_SYMBOLS` from `@/types`

### Path Aliases

- `@/` maps to `src/` directory

## Conventions

- UI language: Russian
- Money formatting: `toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`
- Date formatting: `date-fns` with `ru` locale
- Toast notifications: `sonner` library
- Icons: `lucide-react`

### Reusable UI Components

#### AccountIcon

Use `AccountIcon` from `@/components/ui/account-icon` to display bank account icons with automatic bank logo detection.

```typescript
import { AccountIcon } from '@/components/ui/account-icon'

// With bank logo (auto-detected from bank name)
<AccountIcon
  bankName={account.bank_name}   // e.g. "Тинькофф", "Сбер" - shows bank logo
  typeCode={account.type_code}   // e.g. "card", "cash" - fallback icon
  color={account.color}          // icon/background tint color
  size="sm"                      // "sm" | "md" | "lg"
  showBackground={false}         // true = with colored bg, false = icon only
/>
```

Props:
- `bankName` - Bank name for logo lookup (uses `@/lib/banks` registry)
- `typeCode` - Account type for fallback icon: `card`, `cash`, `deposit`, `credit`, `investment`, `crypto_wallet`
- `color` - Custom color for icon/background
- `size` - Icon size: `sm` (16px), `md` (20px), `lg` (24px)
- `showBackground` - Whether to show colored background container

## Version Management

Update version in both files when releasing:
1. `package.json` - `version` field
2. `src-tauri/tauri.conf.json` - `version` field
