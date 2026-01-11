# Fund Financing API - Изменения для фронтенда

## Обзор

Добавлена возможность финансирования расходов из фондов. Пользователь может:
1. Указать фонд-подсказку для категории бюджета (UI hint)
2. Запланировать расход с финансированием из фонда
3. При создании фактического расхода указать, сколько списать из фонда

---

## Новые поля в существующих эндпоинтах

### 1. Budget Items (Статьи бюджета)

#### POST `/api/v1/budgets/{id}/items` - Создать/обновить статью

**Новые поля в запросе:**
```typescript
interface UpsertBudgetItemRequest {
  categoryId: string;
  plannedAmount?: number;
  bufferAmount: number;
  notes?: string;
  // NEW:
  fundId?: string;         // ID фонда (подсказка для UI)
  fundAllocation?: number; // Сколько выделено из фонда на эту категорию
}
```

**Пример:**
```json
POST /api/v1/budgets/123/items
{
  "categoryId": "repair-category-uuid",
  "plannedAmount": 200000,
  "bufferAmount": 0,
  "fundId": "repair-fund-uuid",
  "fundAllocation": 200000
}
```

#### GET `/api/v1/budgets/{id}` - Получить бюджет

**Новые поля в `items[]`:**
```typescript
interface BudgetItemWithCategory {
  id: string;
  budgetId: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  plannedAmount: number;
  bufferAmount: number;
  plannedExpensesSum: number;
  actualAmount: number;
  fundedAmount: number;
  remaining: number;
  notes?: string;
  // NEW:
  fundId?: string;        // ID связанного фонда
  fundName?: string;      // Название фонда
  fundAllocation: number; // Выделено из фонда
}
```

**Новый объект `fundFinancingSummary`:**
```typescript
interface FundFinancingSummary {
  totalPlanned: number;      // Всего запланировано расходов
  plannedFromIncome: number; // Из текущего дохода
  plannedFromFunds: number;  // Из фондов
  fundBreakdown: FundingSource[];
}

interface FundingSource {
  fundId: string;
  fundName: string;
  plannedAmount: number; // Запланировано из фонда
  actualAmount: number;  // Фактически потрачено из фонда
}
```

**Пример ответа:**
```json
{
  "id": "budget-uuid",
  "year": 2026,
  "month": 1,
  "items": [
    {
      "id": "item-uuid",
      "categoryId": "repair-uuid",
      "categoryName": "Ремонт",
      "plannedAmount": 200000,
      "fundId": "repair-fund-uuid",
      "fundName": "Фонд ремонта",
      "fundAllocation": 200000,
      "actualAmount": 5000,
      "fundedAmount": 5000
    }
  ],
  "fundFinancingSummary": {
    "totalPlanned": 270000,
    "plannedFromIncome": 70000,
    "plannedFromFunds": 200000,
    "fundBreakdown": [
      {
        "fundId": "repair-fund-uuid",
        "fundName": "Фонд ремонта",
        "plannedAmount": 200000,
        "actualAmount": 5000
      }
    ]
  }
}
```

---

### 2. Planned Expenses (Запланированные расходы)

#### POST `/api/v1/planned-expenses` - Создать

**Новые поля в запросе:**
```typescript
interface CreatePlannedExpenseRequest {
  budgetId: string;
  categoryId: string;
  name: string;
  plannedAmount: number;
  plannedDate?: string;
  notes?: string;
  recurringExpenseId?: string;
  // NEW:
  fundId?: string;       // ID фонда для финансирования
  fundedAmount?: number; // Сколько из фонда (может быть частичное)
}
```

**Пример - полное финансирование из фонда:**
```json
POST /api/v1/planned-expenses
{
  "budgetId": "budget-uuid",
  "categoryId": "vacation-uuid",
  "name": "Отпуск в Турции",
  "plannedAmount": 200000,
  "plannedDate": "2026-07-01",
  "fundId": "vacation-fund-uuid",
  "fundedAmount": 200000
}
```

**Пример - частичное финансирование:**
```json
POST /api/v1/planned-expenses
{
  "budgetId": "budget-uuid",
  "categoryId": "repair-uuid",
  "name": "Ремонт ванной",
  "plannedAmount": 150000,
  "fundId": "repair-fund-uuid",
  "fundedAmount": 100000
}
// 100000 из фонда, 50000 из текущего дохода
```

#### PATCH `/api/v1/planned-expenses/{id}` - Обновить

**Новые поля:**
```typescript
interface UpdatePlannedExpenseRequest {
  categoryId?: string;
  name?: string;
  plannedAmount?: number;
  plannedDate?: string;
  notes?: string;
  // NEW:
  fundId?: string;       // "" - сбросить связь с фондом
  fundedAmount?: number;
}
```

#### GET `/api/v1/planned-expenses?budgetId=xxx`

**Новые поля в ответе:**
```typescript
interface PlannedExpense {
  id: string;
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  name: string;
  plannedAmount: number;
  plannedDate?: string;
  status: 'pending' | 'confirmed' | 'skipped';
  notes?: string;
  actualAmount?: number;
  actualDate?: string;
  recurringExpenseName?: string;
  // NEW:
  fundId?: string;       // ID фонда
  fundName?: string;     // Название фонда
  fundedAmount?: number; // Сумма из фонда
}
```

---

### 3. Expenses (Расходы)

#### POST `/api/v1/expenses` - Создать расход

**Поле `fundAllocations` уже существует, напоминание:**
```typescript
interface CreateExpenseRequest {
  categoryId: string;
  amount: number;
  currency: string;
  date: string;
  description?: string;
  accountId?: string;
  tagIds?: string[];
  // Финансирование из фондов:
  fundAllocations?: FundAllocation[];
}

interface FundAllocation {
  fundId: string;
  amount: number;
}
```

**Пример - полностью из фонда:**
```json
POST /api/v1/expenses
{
  "categoryId": "repair-uuid",
  "amount": 5000,
  "currency": "RUB",
  "date": "2026-01-15",
  "description": "Краска для стен",
  "accountId": "card-uuid",
  "fundAllocations": [
    { "fundId": "repair-fund-uuid", "amount": 5000 }
  ]
}
```

**Пример - частично из фонда:**
```json
POST /api/v1/expenses
{
  "categoryId": "repair-uuid",
  "amount": 15000,
  "currency": "RUB",
  "date": "2026-01-15",
  "description": "Дрель",
  "accountId": "card-uuid",
  "fundAllocations": [
    { "fundId": "repair-fund-uuid", "amount": 10000 }
  ]
}
// 10000 из фонда, 5000 из обычного бюджета
```

**Важно:** При создании расхода с `fundAllocations`:
1. Создаётся `fund_withdrawal` (история списания)
2. Автоматически уменьшается баланс фонда (`fund_assets`)
3. Создаётся связь `expense_fund_allocation`

---

## UI/UX Рекомендации

### При создании budget_item

```
┌─────────────────────────────────────────────┐
│ Категория: [Ремонт          ▼]              │
│ Сумма:     [200 000] ₽                      │
│ Буфер:     [0      ] ₽                      │
│                                             │
│ ☑ Финансировать из фонда                    │
│   Фонд:    [Фонд ремонта    ▼]              │
│   Сумма:   [200 000] ₽                      │
└─────────────────────────────────────────────┘
```

### При создании planned_expense

```
┌─────────────────────────────────────────────┐
│ Название:  [Отпуск в Турции    ]            │
│ Категория: [Отпуск          ▼]              │
│ Сумма:     [200 000] ₽                      │
│ Дата:      [2026-07-01]                     │
│                                             │
│ ☑ Финансировать из фонда                    │
│   Фонд:    [Фонд отпуска    ▼]              │
│   Сумма:   [200 000] ₽  (вся сумма)         │
│                                             │
│   ○ Вся сумма из фонда                      │
│   ○ Частично: [______] ₽ из фонда           │
└─────────────────────────────────────────────┘
```

### При создании expense

```
┌─────────────────────────────────────────────┐
│ Название:  [Краска для стен    ]            │
│ Категория: [Ремонт          ▼]              │
│ Сумма:     [5 000] ₽                        │
│ Счёт:      [Карта Тинькофф  ▼]              │
│                                             │
│ Источник финансирования:                    │
│   ○ Из бюджета                              │
│   ● Из фонда                                │
│     Фонд: [Фонд ремонта ▼] (баланс: 195000) │
│     Сумма из фонда: [5 000] ₽               │
└─────────────────────────────────────────────┘
```

### Подсказка из budget_item

Если у `budget_item` указан `fundId`, при создании расхода в этой категории:
- Автоматически предзаполнять селектор фонда
- Показывать остаток выделенной суммы: `fundAllocation - уже_потрачено`

### Отображение в списке расходов

```
┌────────────────────────────────────────────────┐
│ 15 янв  Краска для стен                  5 000 │
│         Ремонт • из фонда "Ремонт"             │
├────────────────────────────────────────────────┤
│ 14 янв  Продукты                         3 500 │
│         Еда • из бюджета                       │
└────────────────────────────────────────────────┘
```

---

## Типы TypeScript

```typescript
// Budget Item
interface BudgetItem {
  id: string;
  budgetId: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  plannedAmount: number;
  bufferAmount: number;
  plannedExpensesSum: number;
  actualAmount: number;
  fundedAmount: number;
  remaining: number;
  fundId?: string;
  fundName?: string;
  fundAllocation: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Planned Expense
interface PlannedExpense {
  id: string;
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  recurringExpenseId?: string;
  recurringExpenseName?: string;
  name: string;
  plannedAmount: number;
  plannedDate?: string;
  status: 'pending' | 'confirmed' | 'skipped';
  notes?: string;
  actualExpenseId?: string;
  actualAmount?: number;
  actualDate?: string;
  fundId?: string;
  fundName?: string;
  fundedAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Fund Financing Summary (в ответе GET /budgets/{id})
interface FundFinancingSummary {
  totalPlanned: number;
  plannedFromIncome: number;
  plannedFromFunds: number;
  fundBreakdown: FundingSource[];
}

interface FundingSource {
  fundId: string;
  fundName: string;
  plannedAmount: number;
  actualAmount: number;
}

// Expense Fund Allocation
interface FundAllocationRequest {
  fundId: string;
  amount: number;
}

interface FundAllocationInfo {
  id: string;
  fundId: string;
  fundName: string;
  amount: number;
}
```

---

## Миграция данных

Существующие данные не требуют миграции. Новые поля опциональны:
- `fund_id` и `fund_allocation` в `budget_items` — `NULL` по умолчанию
- `fund_id` и `funded_amount` в `planned_expenses` — `NULL` по умолчанию

---

## Swagger

Обновлённая документация доступна по адресу:
```
GET /swagger/index.html
```
