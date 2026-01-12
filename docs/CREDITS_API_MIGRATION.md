# Миграция API кредитов v2

Этот документ описывает изменения в API кредитов, которые нужно учесть на фронтенде.

---

## Что изменилось

### 1. Новые поля в `CreateCreditRequest`

| Поле | Тип | Описание |
|------|-----|----------|
| `endDate` | `string?` | Дата последнего платежа (YYYY-MM-DD). Приоритет над `termMonths` |
| `monthlyPayment` | `number?` | Текущий платёж от банка. Если указан — используется вместо расчётного аннуитета |

**Было:**
```typescript
interface CreateCreditRequest {
  name: string;
  principalAmount: number;
  currentBalance?: number;
  interestRate: number;
  termMonths: number;        // Обязательное
  startDate: string;
  paymentDay?: number;
  accountId?: string;
  categoryId?: string;
  notes?: string;
}
```

**Стало:**
```typescript
interface CreateCreditRequest {
  name: string;
  principalAmount: number;
  currentBalance?: number;
  interestRate: number;
  termMonths?: number;       // Теперь опциональное (если указан endDate)
  endDate?: string;          // НОВОЕ
  monthlyPayment?: number;   // НОВОЕ
  startDate: string;
  paymentDay?: number;
  accountId?: string;
  categoryId?: string;
  notes?: string;
}
```

---

### 2. Новые поля в `Credit` (ответ API)

| Поле | Тип | Описание |
|------|-----|----------|
| `endDate` | `string?` | Дата последнего платежа |
| `monthlyPayment` | `number?` | Платёж от банка (если был указан при создании) |

**Было:**
```typescript
interface Credit {
  id: string;
  name: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  paymentDay?: number;
  // ...остальные поля
}
```

**Стало:**
```typescript
interface Credit {
  id: string;
  name: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  endDate?: string;          // НОВОЕ
  monthlyPayment?: number;   // НОВОЕ
  paymentDay?: number;
  // ...остальные поля
}
```

---

### 3. Новые поля в `UpdateCreditRequest`

| Поле | Тип | Описание |
|------|-----|----------|
| `endDate` | `string?` | Обновить дату последнего платежа |
| `monthlyPayment` | `number?` | Обновить платёж от банка |

---

## Изменения в форме создания кредита

### Было
```
┌─────────────────────────────────────────────┐
│ Название:        [                      ]   │
│ Начальная сумма: [                      ] ₽ │
│ Текущий остаток: [                      ] ₽ │
│ Ставка:          [                      ] % │
│ Срок (месяцев):  [                      ]   │  <-- Обязательное поле
│ День платежа:    [                      ]   │
│ Дата начала:     [                      ]   │
└─────────────────────────────────────────────┘
```

### Стало
```
┌─────────────────────────────────────────────────────┐
│ Название:           [Ипотека Сбербанк          ]    │
│ Начальная сумма:    [10 202 610.95             ] ₽  │
│ Текущий остаток:    [7 230 725.69              ] ₽  │
│ Ставка:             [8.8                       ] %  │
│                                                     │
│ Срок кредита (один из вариантов):                   │
│ ○ Указать месяцев:  [                          ]    │
│ ● Указать дату последнего платежа: [2044-12-09 ]    │  <-- НОВОЕ
│                                                     │
│ Платёж от банка:    [65 440.93                 ] ₽  │  <-- НОВОЕ (опционально)
│ ⓘ Укажите, если у кредита были ЧДП                  │
│                                                     │
│ День платежа:       [9                         ]    │
│ Дата начала:        [2025-01-12                ]    │
└─────────────────────────────────────────────────────┘
```

---

## Логика валидации на фронте

### Создание кредита

```typescript
// Обязательно: либо termMonths, либо endDate
if (!termMonths && !endDate) {
  showError("Укажите срок в месяцах или дату последнего платежа");
}

// endDate имеет приоритет над termMonths
const payload: CreateCreditRequest = {
  name,
  principalAmount,
  currentBalance,  // Если не указан — бэкенд использует principalAmount
  interestRate,
  startDate,
  // Если указан endDate — termMonths можно не передавать
  ...(endDate ? { endDate } : { termMonths }),
  // Если пользователь указал платёж от банка
  ...(monthlyPayment ? { monthlyPayment } : {}),
};
```

---

## Когда указывать `monthlyPayment`

**Указывать обязательно**, если:
- У кредита были частично-досрочные платежи (ЧДП) в банке
- Банк пересчитал график после ЧДП
- Рассчитанный аннуитет отличается от реального платежа

**Не нужно указывать**, если:
- Новый кредит без истории ЧДП
- Хотите, чтобы система рассчитала аннуитет автоматически

### Пример проблемы без `monthlyPayment`

Ипотека с историей ЧДП:
- Остаток: 7 230 725.69 ₽
- Ставка: 8.8%
- Осталось: 239 месяцев

**Расчётный аннуитет:** 59 692.78 ₽
**Реальный платёж в банке:** 65 440.93 ₽

Разница возникает из-за того, что банк учитывает историю ЧДП при пересчёте графика.

---

## Изменения в UI списка кредитов

Если `monthlyPayment` указан, показывать его вместо рассчитанного:

```typescript
// В карточке кредита
const displayPayment = credit.monthlyPayment ?? calculatedAnnuity;

// Можно добавить индикатор
{credit.monthlyPayment && (
  <Tooltip content="Платёж указан вручную (от банка)">
    <Badge variant="outline">Банк</Badge>
  </Tooltip>
)}
```

---

## Чек-лист для фронтенда

- [ ] Добавить поле `endDate` в форму создания кредита (date picker)
- [ ] Добавить поле `monthlyPayment` в форму (опционально)
- [ ] Сделать `termMonths` опциональным (если указан `endDate`)
- [ ] Добавить radio/toggle: "Указать месяцев" / "Указать дату окончания"
- [ ] Обновить TypeScript типы `Credit` и `CreateCreditRequest`
- [ ] Добавить поля `endDate` и `monthlyPayment` в форму редактирования
- [ ] В списке кредитов отображать `monthlyPayment` если он есть
- [ ] Добавить подсказку про ЧДП рядом с полем `monthlyPayment`

---

## Пример запроса создания существующей ипотеки

```typescript
const response = await fetch('/api/v1/credits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Ипотека Сбербанк",
    principalAmount: 10202610.95,
    currentBalance: 7230725.69,
    interestRate: 8.8,
    endDate: "2044-12-09",      // Вместо termMonths
    monthlyPayment: 65440.93,   // Реальный платёж от банка
    startDate: "2025-01-12",
    paymentDay: 9
  })
});
```
