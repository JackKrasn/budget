# API изменения: Бюджеты

## Обзор изменений

Удалено поле `total_planned` из таблицы `budgets`. Теперь общая сумма плановых расходов всегда вычисляется динамически из `budget_items`.

---

## Изменения в API

### GET /budgets — Список бюджетов

**Было:**
```json
{
  "data": [
    {
      "id": "uuid",
      "year": 2026,
      "month": 1,
      "total_planned": { "Float64": 0, "Valid": true },
      ...
    }
  ]
}
```

**Стало:**
```json
{
  "data": [
    {
      "id": "uuid",
      "year": 2026,
      "month": 1,
      "total_planned": 75000,
      ...
    }
  ]
}
```

**Что изменилось:**
- `total_planned` теперь возвращает `float64` (число), а не `sql.NullFloat64` (объект)
- Значение вычисляется как сумма `planned_amount` из всех `budget_items` для данного бюджета

---

### POST /budgets — Создание бюджета

**Было:**
```typescript
interface CreateBudgetRequest {
  year: number;
  month: number;
  totalPlanned?: number;  // УДАЛЕНО
  notes?: string;
  status?: string;
}
```

**Стало:**
```typescript
interface CreateBudgetRequest {
  year: number;
  month: number;
  notes?: string;
  status?: string;
}
```

**Что изменилось:**
- Удалено поле `totalPlanned` — общая сумма вычисляется автоматически из `budget_items`

---

### PATCH /budgets/:id — Обновление бюджета

**Было:**
```typescript
interface UpdateBudgetRequest {
  totalPlanned?: number;  // УДАЛЕНО
  notes?: string;
  status?: string;
}
```

**Стало:**
```typescript
interface UpdateBudgetRequest {
  notes?: string;
  status?: string;
}
```

**Что изменилось:**
- Удалено поле `totalPlanned`

---

## Чеклист для фронтенда

- [ ] Убрать поле `totalPlanned` из формы создания бюджета
- [ ] Убрать поле `totalPlanned` из формы редактирования бюджета
- [ ] Обновить тип ответа `GET /budgets`: `total_planned` теперь `number`, не объект
- [ ] Использовать `total_planned` напрямую как число для отображения суммы бюджета

---

## TypeScript типы

```typescript
// Ответ списка бюджетов
interface BudgetListItem {
  id: string;
  year: number;
  month: number;
  total_planned: number;  // Вычисляемое значение из budget_items
  notes: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

// Создание бюджета
interface CreateBudgetRequest {
  year: number;
  month: number;
  notes?: string;
  status?: string;  // по умолчанию "draft"
}

// Обновление бюджета
interface UpdateBudgetRequest {
  notes?: string;
  status?: string;
}
```

---

## Логика работы

1. При создании бюджета `total_planned = 0` (нет статей расходов)
2. При добавлении/изменении `budget_items` сумма пересчитывается автоматически
3. `GET /budgets` всегда возвращает актуальную сумму из `budget_items`
4. `GET /budgets/:id` возвращает детальную информацию с разбивкой по категориям в `summary.totalPlanned`
