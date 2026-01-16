# Финансирование расходов из фондов — Спецификация для фронтенда

## Обзор

API расходов теперь возвращает полную информацию о финансировании из фондов. Это позволяет показывать пользователю:
- Какие фонды профинансировали расход
- Сумму от каждого фонда
- Цвет фонда для визуального отображения

---

## API Changes

### GET /api/v1/expenses — Список расходов

**Response:**
```typescript
interface ListResponse {
  data: ListExpenseRow[];
  total: number;
  summary: Summary;
}

interface ListExpenseRow {
  id: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  amount: number;
  amountBase: number;
  exchangeRate: number | null;
  currency: string;
  date: string;
  description: string | null;
  accountId: string | null;
  fundedAmount: number;              // общая сумма финансирования из фондов
  fundAllocations: FundAllocation[]; // детали по каждому фонду (NEW!)
  tags: Tag[];
}

interface FundAllocation {
  id: string;        // ID записи allocation
  fundId: string;    // ID фонда
  fundName: string;  // название фонда
  fundColor: string; // цвет фонда для UI (NEW!)
  amount: number;    // сумма финансирования из этого фонда
}

interface Summary {
  totalAmount: number;
  totalFromFunds: number;
}

interface Tag {
  id: string;
  name: string;
  color: string | null;
}
```

### GET /api/v1/expenses/:id — Детали расхода

Возвращает `ExpenseWithCategory` с теми же полями `fundAllocations`.

### POST /api/v1/expenses — Создание расхода

Request body без изменений:
```typescript
interface CreateExpenseRequest {
  categoryId: string;
  amount: number;
  currency: string;
  date: string;
  description?: string;
  accountId?: string;
  fundAllocations?: { fundId: string; amount: number }[];
  tagIds?: string[];
}
```

Response теперь включает `fundAllocations` с `fundColor`.

---

## UI Implementation

### 1. Отображение в списке расходов

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Дата       │ Категория   │ Сумма          │ Счёт              │ Фонд         │
│────────────┼─────────────┼────────────────┼───────────────────┼──────────────│
│ 15.01.2026 │ Продукты    │ 1 500 RUB      │ ВТБ Зарплатный    │              │
│ 15.01.2026 │ Дети        │ 25 000 RUB     │ ВТБ Зарплатный    │ ● Эмилия     │
│            │             │ 🏦 из фонда    │                   │   25 000 ₽   │
│ 14.01.2026 │ Авто        │ 15 000 RUB     │ Тинькофф          │ ● Авто       │
│            │             │ 🏦 частично    │                   │   10 000 ₽   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Логика:**
- Если `fundAllocations.length === 0` — не показывать ничего в колонке "Фонд"
- Если `fundedAmount >= amount` — показать "из фонда" (полное финансирование)
- Если `fundedAmount > 0 && fundedAmount < amount` — показать "частично из фонда"

---

### 2. Компонент ExpenseFundingBadge

```typescript
interface FundAllocation {
  id: string;
  fundId: string;
  fundName: string;
  fundColor: string;
  amount: number;
}

interface ListExpenseRow {
  // ... other fields
  fundedAmount: number;
  fundAllocations: FundAllocation[];
}

function ExpenseFundingBadge({ expense }: { expense: ListExpenseRow }) {
  if (expense.fundAllocations.length === 0) {
    return null;
  }

  const isFullyFunded = expense.fundedAmount >= expense.amount;

  return (
    <div className="flex flex-col gap-1">
      {expense.fundAllocations.map((alloc) => (
        <div key={alloc.id} className="flex items-center gap-2 text-sm">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: alloc.fundColor }}
          />
          <span className="text-muted-foreground truncate">{alloc.fundName}</span>
          <span className="font-mono">{formatMoney(alloc.amount)} ₽</span>
        </div>
      ))}
      {!isFullyFunded && (
        <span className="text-xs text-muted-foreground">
          Частичное финансирование
        </span>
      )}
    </div>
  );
}
```

---

### 3. Индикатор финансирования в колонке суммы

```typescript
function ExpenseAmountCell({ expense }: { expense: ListExpenseRow }) {
  const hasFunding = expense.fundAllocations.length > 0;
  const isFullyFunded = expense.fundedAmount >= expense.amount;

  return (
    <div>
      <span className="font-medium">
        {formatMoney(expense.amount)} {expense.currency}
      </span>
      {hasFunding && (
        <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
          <Landmark className="w-3 h-3" />
          <span>{isFullyFunded ? 'из фонда' : 'частично из фонда'}</span>
        </div>
      )}
    </div>
  );
}
```

---

### 4. Tooltip с деталями финансирования

При наведении на индикатор фонда показывать полную информацию:

```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Landmark } from "lucide-react";

function FundingTooltip({ expense }: { expense: ListExpenseRow }) {
  if (expense.fundAllocations.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            <Landmark className="w-4 h-4 text-green-600" />
            {expense.fundAllocations.length > 1 && (
              <span className="text-xs text-muted-foreground">
                ×{expense.fundAllocations.length}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Финансирование из фондов</p>
            {expense.fundAllocations.map((alloc) => (
              <div
                key={alloc.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: alloc.fundColor }}
                  />
                  <span>{alloc.fundName}</span>
                </div>
                <span className="font-mono">
                  {formatMoney(alloc.amount)} ₽
                </span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between">
              <span>Итого из фондов:</span>
              <span className="font-medium">
                {formatMoney(expense.fundedAmount)} ₽
              </span>
            </div>
            {expense.fundedAmount < expense.amount && (
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Из бюджета:</span>
                <span>
                  {formatMoney(expense.amount - expense.fundedAmount)} ₽
                </span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

### 5. Полный компонент строки расхода

```typescript
import { TableRow, TableCell } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/utils";

function ExpenseRow({ expense }: { expense: ListExpenseRow }) {
  const hasFunding = expense.fundAllocations.length > 0;

  return (
    <TableRow>
      {/* Дата */}
      <TableCell className="text-muted-foreground">
        {formatDate(expense.date)}
      </TableCell>

      {/* Категория */}
      <TableCell>
        <div className="flex items-center gap-2">
          {expense.categoryIcon && (
            <span className="text-lg">{expense.categoryIcon}</span>
          )}
          <span>{expense.categoryName}</span>
        </div>
      </TableCell>

      {/* Сумма */}
      <TableCell>
        <ExpenseAmountCell expense={expense} />
      </TableCell>

      {/* Счёт */}
      <TableCell className="text-muted-foreground">
        {expense.accountId ? "Счёт" : "—"}
      </TableCell>

      {/* Финансирование из фондов */}
      <TableCell>
        {hasFunding ? (
          <ExpenseFundingBadge expense={expense} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
```

---

### 6. Helper функции

```typescript
// Определение статуса финансирования
interface ExpenseWithFunding extends ListExpenseRow {
  isFullyFunded: boolean;
  isPartiallyFunded: boolean;
  unfundedAmount: number;
}

function getExpenseFundingStatus(
  expense: ListExpenseRow
): ExpenseWithFunding {
  return {
    ...expense,
    isFullyFunded: expense.fundedAmount >= expense.amount,
    isPartiallyFunded:
      expense.fundedAmount > 0 && expense.fundedAmount < expense.amount,
    unfundedAmount: expense.amount - expense.fundedAmount,
  };
}

// Форматирование денег
function formatMoney(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Форматирование даты
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
```

---

### 7. Фильтр по финансированию (опционально)

Добавить фильтр в панель фильтров списка расходов:

```typescript
type FundingFilter = "all" | "budget" | "funds";

function FundingFilterSelect({
  value,
  onChange,
}: {
  value: FundingFilter;
  onChange: (value: FundingFilter) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Финансирование" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все расходы</SelectItem>
        <SelectItem value="budget">Только из бюджета</SelectItem>
        <SelectItem value="funds">Только из фондов</SelectItem>
      </SelectContent>
    </Select>
  );
}

// Фильтрация на клиенте
function filterByFunding(
  expenses: ListExpenseRow[],
  filter: FundingFilter
): ListExpenseRow[] {
  switch (filter) {
    case "budget":
      return expenses.filter((e) => e.fundedAmount === 0);
    case "funds":
      return expenses.filter((e) => e.fundedAmount > 0);
    default:
      return expenses;
  }
}
```

---

## TypeScript Types

Полный набор типов для копирования в проект:

```typescript
// types/expense.ts

export interface FundAllocation {
  id: string;
  fundId: string;
  fundName: string;
  fundColor: string;
  amount: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface ListExpenseRow {
  id: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  amount: number;
  amountBase: number;
  exchangeRate: number | null;
  currency: string;
  date: string;
  description: string | null;
  accountId: string | null;
  fundedAmount: number;
  fundAllocations: FundAllocation[];
  tags: Tag[];
}

export interface ExpenseSummary {
  totalAmount: number;
  totalFromFunds: number;
}

export interface ExpenseListResponse {
  data: ListExpenseRow[];
  total: number;
  summary: ExpenseSummary;
}

export interface CreateExpenseRequest {
  categoryId: string;
  amount: number;
  currency: string;
  date: string;
  description?: string;
  accountId?: string;
  fundAllocations?: { fundId: string; amount: number }[];
  tagIds?: string[];
}

export type FundingFilter = "all" | "budget" | "funds";
```

---

## Связь с историей фондов

При создании расхода с `fundAllocations`, в истории фонда создаётся транзакция типа `withdrawal`.

### Обновить константы транзакций фондов

```typescript
// constants/fundTransactions.ts

export const TRANSACTION_TYPES = {
  buy: {
    label: "Покупка",
    icon: "ShoppingCart",
    color: "green",
    description: "Покупка актива за валюту фонда",
  },
  sell: {
    label: "Продажа",
    icon: "DollarSign",
    color: "blue",
    description: "Продажа актива за валюту фонда",
  },
  transfer_in: {
    label: "Входящий перевод",
    icon: "ArrowDownLeft",
    color: "green",
    description: "Получение актива из другого фонда",
  },
  transfer_out: {
    label: "Исходящий перевод",
    icon: "ArrowUpRight",
    color: "orange",
    description: "Отправка актива в другой фонд",
  },
  deposit: {
    label: "Пополнение",
    icon: "Plus",
    color: "green",
    description: "Пополнение с банковского счёта",
  },
  withdrawal: {
    label: "Списание на расход",
    icon: "Receipt",
    color: "red",
    description: "Финансирование расхода из фонда",
  },
} as const;

export type TransactionType = keyof typeof TRANSACTION_TYPES;
```

### Поле expense_id в транзакции

Транзакции типа `withdrawal` содержат поле `expense_id` — ID расхода, который был профинансирован:

```typescript
interface FundTransaction {
  id: string;
  fund_id: string;
  transaction_type: TransactionType;
  asset_id: string;
  amount: number;
  // ... other fields
  expense_id: string | null; // для withdrawal — ссылка на расход
}
```

Это позволяет из истории фонда перейти к расходу.

---

## Чеклист реализации

- [ ] Обновить TypeScript типы (`types/expense.ts`)
- [ ] Добавить `fundAllocations` в state management (если используется)
- [ ] Обновить таблицу расходов — добавить колонку "Фонд"
- [ ] Реализовать компонент `ExpenseFundingBadge`
- [ ] Реализовать компонент `ExpenseAmountCell` с индикатором
- [ ] Реализовать `FundingTooltip` для деталей
- [ ] Обновить детальную страницу расхода
- [ ] Добавить фильтр по финансированию (опционально)
- [ ] Добавить тип `withdrawal` в константы транзакций фондов
- [ ] Протестировать создание расхода с fundAllocations
- [ ] Протестировать удаление расхода с fundAllocations (деньги возвращаются в фонд)

---

## Пример JSON Response

```json
{
  "data": [
    {
      "id": "d471edd4-5ed5-41f2-8a9a-f0123e12e464",
      "categoryId": "a1b2c3d4-...",
      "categoryCode": "children",
      "categoryName": "Дети",
      "categoryIcon": "👶",
      "categoryColor": "#f59e0b",
      "amount": 25000,
      "amountBase": 25000,
      "exchangeRate": null,
      "currency": "RUB",
      "date": "2026-01-15",
      "description": "Детский сад",
      "accountId": "e5f6g7h8-...",
      "fundedAmount": 25000,
      "fundAllocations": [
        {
          "id": "alloc-123",
          "fundId": "fund-456",
          "fundName": "Резерв на Эмилию",
          "fundColor": "#22c55e",
          "amount": 25000
        }
      ],
      "tags": []
    },
    {
      "id": "x789y012-...",
      "categoryId": "...",
      "categoryCode": "auto",
      "categoryName": "Авто",
      "categoryIcon": "🚗",
      "categoryColor": "#3b82f6",
      "amount": 15000,
      "amountBase": 15000,
      "exchangeRate": null,
      "currency": "RUB",
      "date": "2026-01-14",
      "description": "ТО автомобиля",
      "accountId": "...",
      "fundedAmount": 10000,
      "fundAllocations": [
        {
          "id": "alloc-789",
          "fundId": "fund-auto",
          "fundName": "Авто резерв",
          "fundColor": "#ef4444",
          "amount": 10000
        }
      ],
      "tags": []
    }
  ],
  "total": 2,
  "summary": {
    "totalAmount": 40000,
    "totalFromFunds": 35000
  }
}
```
