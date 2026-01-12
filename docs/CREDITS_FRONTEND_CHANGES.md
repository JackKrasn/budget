# Изменения в API кредитов для фронтенда

## Обзор изменений

Упрощена функциональность кредитов:
- Можно задать текущий остаток долга (без ввода всей истории)
- Возможность ручной корректировки платежей в графике
- Поддержка частично-досрочных платежей (ЧДП) с пересчётом графика

---

## 1. Создание кредита

### Изменения в запросе `POST /api/v1/credits`

**Новое поле:**
```typescript
interface CreateCreditRequest {
  name: string;
  principalAmount: number;    // Начальная сумма кредита
  currentBalance?: number;    // НОВОЕ: Текущий остаток долга (опционально)
  interestRate: number;       // Процентная ставка (12.5 = 12.5%)
  termMonths: number;         // Оставшийся срок в месяцах
  startDate: string;          // Дата начала расчёта (YYYY-MM-DD)
  paymentDay?: number;
  accountId?: string;
  categoryId?: string;
  notes?: string;
}
```

**Логика:**
- Если `currentBalance` не указан — график считается от `principalAmount`
- Если `currentBalance` указан — график считается от него (для существующих кредитов)

**Пример использования:**
```typescript
// Новый кредит
const newCredit = {
  name: "Ипотека",
  principalAmount: 5000000,
  interestRate: 10.5,
  termMonths: 240,
  startDate: "2024-01-15"
};

// Существующий кредит (добавляем с текущей точки)
const existingCredit = {
  name: "Ипотека Сбербанк",
  principalAmount: 5000000,    // Изначально было
  currentBalance: 4200000,     // Текущий остаток
  interestRate: 10.5,
  termMonths: 180,             // Осталось месяцев
  startDate: "2024-01-15"
};
```

---

## 2. Изменения в ответах

### Кредит теперь содержит `currentBalance`

```typescript
interface Credit {
  id: string;
  name: string;
  principalAmount: number;
  currentBalance: number;     // НОВОЕ: Текущий остаток
  interestRate: number;
  termMonths: number;
  startDate: string;
  paymentDay?: number;
  accountId?: string;
  categoryId?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Элемент графика содержит новые поля

```typescript
interface ScheduleItem {
  id: string;
  creditId: string;
  paymentNumber: number;
  dueDate: string;
  principalPart: number;
  interestPart: number;
  totalPayment: number;
  remainingBalance: number;
  isPaid: boolean;
  isManual: boolean;                    // НОВОЕ: Был ли платёж изменён вручную
  originalTotalPayment?: number;        // НОВОЕ: Оригинальная сумма (если isManual=true)
}
```

---

## 3. Редактирование платежа в графике

### Новый эндпоинт `PATCH /api/v1/credits/:id/schedule/:scheduleId`

**Запрос:**
```typescript
interface UpdateScheduleItemRequest {
  totalPayment: number;  // Новая сумма платежа
}
```

**Ответ:** `ScheduleItem`

**Что происходит:**
1. Пересчитываются `principalPart` и `interestPart` для нового платежа
2. Флаг `isManual` устанавливается в `true`
3. Сохраняется `originalTotalPayment`
4. Пересчитываются все последующие платежи в графике

**Пример:**
```typescript
// Изменить платёж на 50000 вместо расчётных 45000
await fetch(`/api/v1/credits/${creditId}/schedule/${scheduleItemId}`, {
  method: 'PATCH',
  body: JSON.stringify({ totalPayment: 50000 })
});
```

**UI рекомендации:**
- Показывать иконку "ручное изменение" если `isManual === true`
- При наведении показывать tooltip с `originalTotalPayment`
- Добавить кнопку "Сбросить к расчётному" (вызов regenerate)

---

## 4. Частично-досрочные платежи (ЧДП)

### Список ЧДП: `GET /api/v1/credits/:id/early-payments`

**Ответ:**
```typescript
interface EarlyPayment {
  id: string;
  creditId: string;
  paymentDate: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reductionType: 'reduce_payment' | 'reduce_term';
  notes?: string;
  createdAt: string;
}
```

### Создание ЧДП: `POST /api/v1/credits/:id/early-payments`

**Запрос:**
```typescript
interface CreateEarlyPaymentRequest {
  paymentDate: string;         // Дата внесения (YYYY-MM-DD)
  amount: number;              // Сумма ЧДП
  reductionType: string;       // 'reduce_payment' или 'reduce_term'
  notes?: string;
}
```

**Типы пересчёта:**
| Тип | Описание |
|-----|----------|
| `reduce_payment` | Уменьшить ежемесячный платёж, срок остаётся |
| `reduce_term` | Сократить срок кредита, платёж остаётся |

**Что происходит:**
1. Создаётся запись о ЧДП
2. Обновляется `currentBalance` кредита
3. Удаляются неоплаченные платежи из графика
4. Создаётся новый график с учётом нового остатка

**Пример:**
```typescript
// ЧДП на 500000 с уменьшением платежа
await fetch(`/api/v1/credits/${creditId}/early-payments`, {
  method: 'POST',
  body: JSON.stringify({
    paymentDate: "2024-06-15",
    amount: 500000,
    reductionType: "reduce_payment",
    notes: "Бонус за год"
  })
});
```

### Удаление ЧДП: `DELETE /api/v1/credits/:id/early-payments/:earlyPaymentId`

**Важно:** Удаление ЧДП НЕ откатывает график автоматически. После удаления нужно вызвать `regenerate`.

---

## 5. Пересчёт графика

### `POST /api/v1/credits/:id/schedule/regenerate`

Полностью пересчитывает график от текущего `currentBalance`.

**Когда использовать:**
- После удаления ЧДП
- Для сброса ручных изменений
- При изменении процентной ставки

---

## 6. Рекомендации по UI

### Форма создания кредита

```
┌─────────────────────────────────────────────┐
│ Создание кредита                            │
├─────────────────────────────────────────────┤
│ Название:        [Ипотека Сбербанк      ]   │
│ Начальная сумма: [5 000 000             ] ₽ │
│                                             │
│ ☑ Это существующий кредит                   │
│   ├ Текущий остаток: [4 200 000       ] ₽   │
│   └ Осталось месяцев: [180            ]     │
│                                             │
│ Ставка:          [10.5                ] %   │
│ День платежа:    [15                  ]     │
│ Дата начала:     [2024-01-15          ]     │
└─────────────────────────────────────────────┘
```

### График платежей

```
┌──────┬────────────┬──────────┬──────────┬──────────┬─────────┐
│ #    │ Дата       │ Платёж   │ Тело     │ %        │ Остаток │
├──────┼────────────┼──────────┼──────────┼──────────┼─────────┤
│ 1    │ 15.02.2024 │ 45 000 ✓ │ 8 500    │ 36 500   │ 4.19M   │
│ 2    │ 15.03.2024 │ 50 000 ✏️│ 13 574   │ 36 426   │ 4.18M   │ ← Изменён вручную
│ 3    │ 15.04.2024 │ 45 000   │ 8 680    │ 36 320   │ 4.17M   │
│ ...  │ ...        │ ...      │ ...      │ ...      │ ...     │
└──────┴────────────┴──────────┴──────────┴──────────┴─────────┘

✓ = оплачен    ✏️ = изменён вручную (было: 45 000)
```

### Форма ЧДП

```
┌─────────────────────────────────────────────┐
│ Частично-досрочное погашение                │
├─────────────────────────────────────────────┤
│ Сумма:    [500 000                      ] ₽ │
│ Дата:     [2024-06-15                   ]   │
│                                             │
│ Что уменьшить:                              │
│ ○ Ежемесячный платёж (срок не меняется)     │
│ ● Срок кредита (платёж не меняется)         │
│                                             │
│ Текущий остаток: 4 200 000 ₽                │
│ После ЧДП:       3 700 000 ₽                │
│                                             │
│ Комментарий: [Бонус за год              ]   │
│                                             │
│              [Отмена]  [Внести ЧДП]         │
└─────────────────────────────────────────────┘
```

---

## 7. TypeScript типы

```typescript
// Полный набор типов для фронтенда

interface Credit {
  id: string;
  name: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  paymentDay?: number;
  accountId?: string;
  accountName?: string;
  categoryId?: string;
  categoryName?: string;
  categoryCode?: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleItem {
  id: string;
  creditId: string;
  paymentNumber: number;
  dueDate: string;
  principalPart: number;
  interestPart: number;
  totalPayment: number;
  remainingBalance: number;
  isPaid: boolean;
  isManual: boolean;
  originalTotalPayment?: number;
}

interface EarlyPayment {
  id: string;
  creditId: string;
  paymentDate: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reductionType: 'reduce_payment' | 'reduce_term';
  notes?: string;
  createdAt: string;
}

interface CreditWithSchedule extends Credit {
  schedule: ScheduleItem[];
}

// Requests
interface CreateCreditRequest {
  name: string;
  principalAmount: number;
  currentBalance?: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  paymentDay?: number;
  accountId?: string;
  categoryId?: string;
  notes?: string;
}

interface UpdateScheduleItemRequest {
  totalPayment: number;
}

interface CreateEarlyPaymentRequest {
  paymentDate: string;
  amount: number;
  reductionType: 'reduce_payment' | 'reduce_term';
  notes?: string;
}
```

---

## 8. Список всех эндпоинтов

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/credits` | Список кредитов |
| POST | `/api/v1/credits` | Создать кредит |
| GET | `/api/v1/credits/summary` | Сводка по всем кредитам |
| GET | `/api/v1/credits/upcoming-payments` | Ближайшие платежи |
| GET | `/api/v1/credits/:id` | Получить кредит с графиком |
| PATCH | `/api/v1/credits/:id` | Обновить кредит |
| DELETE | `/api/v1/credits/:id` | Удалить кредит |
| GET | `/api/v1/credits/:id/schedule` | График платежей |
| PATCH | `/api/v1/credits/:id/schedule/:scheduleId` | **НОВОЕ:** Изменить платёж |
| POST | `/api/v1/credits/:id/schedule/regenerate` | Пересчитать график |
| GET | `/api/v1/credits/:id/payments` | История платежей |
| GET | `/api/v1/credits/:id/summary` | Сводка по кредиту |
| GET | `/api/v1/credits/:id/early-payments` | **НОВОЕ:** Список ЧДП |
| POST | `/api/v1/credits/:id/early-payments` | **НОВОЕ:** Создать ЧДП |
| DELETE | `/api/v1/credits/:id/early-payments/:id` | **НОВОЕ:** Удалить ЧДП |
