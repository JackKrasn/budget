# API изменения: Баланс счетов

## Обзор

Добавлена возможность устанавливать баланс счетов при создании, редактировании и через отдельный эндпоинт синхронизации.

---

## 1. Счета (Accounts)

### POST /accounts — Создание счёта

**Новое поле:** `initialBalance`

```typescript
interface CreateAccountRequest {
  name: string;
  accountTypeId: string;
  currency?: string;        // по умолчанию "RUB"
  bankName?: string;
  icon?: string;
  color?: string;
  initialBalance?: number;  // НОВОЕ: начальный баланс
}
```

**Пример запроса:**
```json
{
  "name": "Сбербанк",
  "accountTypeId": "uuid-типа-счёта",
  "currency": "RUB",
  "bankName": "Сбербанк",
  "initialBalance": 50000
}
```

**Поведение:**
- Если `initialBalance` указан и не равен 0, создаётся `balance_adjustment` с причиной "Начальный баланс"
- Баланс сразу отражается в расчётах

---

### PATCH /accounts/:id — Редактирование счёта

**Новое поле:** `currentBalance`

```typescript
interface UpdateAccountRequest {
  name?: string;
  accountTypeId?: string;
  currency?: string;
  bankName?: string;
  icon?: string;
  color?: string;
  isArchived?: boolean;
  currentBalance?: number;  // НОВОЕ: установить текущий баланс
}
```

**Пример запроса:**
```json
{
  "currentBalance": 45000
}
```

**Поведение:**
- Вычисляется разница между указанным и текущим расчётным балансом
- Если разница не равна 0, создаётся `balance_adjustment` с причиной "Корректировка баланса"

---

## 2. Корректировки баланса (Balance Adjustments)

### POST /balance-adjustments/set-balance — Установить баланс

**Новый эндпоинт** для синхронизации баланса с данными из банка.

```typescript
interface SetBalanceRequest {
  accountId: string;
  currentBalance: number;  // целевой баланс из приложения банка
  reason?: string;         // по умолчанию "Корректировка баланса"
  date?: string;           // формат YYYY-MM-DD, по умолчанию сегодня
}
```

**Пример запроса:**
```json
{
  "accountId": "uuid-счёта",
  "currentBalance": 45000,
  "reason": "Синхронизация с банком",
  "date": "2026-01-13"
}
```

**Ответ:** `BalanceAdjustment` (созданная корректировка)

```json
{
  "id": "uuid",
  "accountId": "uuid-счёта",
  "amount": -2500,
  "reason": "Синхронизация с банком",
  "date": "2026-01-13",
  "createdAt": "2026-01-13T10:00:00Z"
}
```

**Поведение:**
- Получает текущий расчётный баланс счёта
- Вычисляет разницу: `amount = currentBalance - расчётныйБаланс`
- Создаёт корректировку на эту разницу
- Если разница = 0, возвращает ошибку 400

---

### POST /balance-adjustments — Создать корректировку (без изменений)

Для ручного ввода разницы:

```typescript
interface CreateAdjustmentRequest {
  accountId: string;
  amount: number;   // положительное = добавить, отрицательное = списать
  reason: string;
  date: string;     // YYYY-MM-DD
}
```

---

### GET /balance-adjustments — Список корректировок

**Query параметры:**
- `accountId` — фильтр по счёту
- `from` — дата начала (YYYY-MM-DD)
- `to` — дата окончания (YYYY-MM-DD)

---

## 3. Рекомендации для фронтенда

### Форма создания счёта

```
┌─────────────────────────────────────┐
│ Название:         [Сбербанк      ]  │
│ Тип:              [Дебетовая ▼   ]  │
│ Валюта:           [RUB ▼         ]  │
│ Банк:             [Сбербанк      ]  │
│ Начальный баланс: [50 000      ₽]  │  ← НОВОЕ
│                                     │
│              [Создать]              │
└─────────────────────────────────────┘
```

### Страница счёта

```
┌─────────────────────────────────────┐
│ Сбербанк                            │
│ Баланс: 47 500 ₽                    │
│                                     │
│ [Редактировать] [Синхронизировать]  │  ← НОВОЕ
└─────────────────────────────────────┘
```

### Модалка синхронизации баланса

```
┌─────────────────────────────────────┐
│ Синхронизация баланса               │
│                                     │
│ Текущий расчётный: 47 500 ₽         │
│                                     │
│ Баланс в банке: [45 000         ₽]  │
│ Причина:        [Пропущенные расх]  │
│ Дата:           [2026-01-13      ]  │
│                                     │
│ Будет создана корректировка: -2500₽ │
│                                     │
│        [Отмена]  [Применить]        │
└─────────────────────────────────────┘
```

---

## 4. Чеклист

- [ ] Добавить поле `initialBalance` в форму создания счёта
- [ ] Добавить поле `currentBalance` в форму редактирования счёта
- [ ] Добавить кнопку "Синхронизировать баланс" на странице счёта
- [ ] Создать модалку для `POST /balance-adjustments/set-balance`
- [ ] Показывать превью корректировки перед сохранением
- [ ] Отображать историю корректировок на странице счёта

---

## 5. TypeScript типы

```typescript
// Создание счёта
interface CreateAccountRequest {
  name: string;
  accountTypeId: string;
  currency?: string;
  bankName?: string;
  icon?: string;
  color?: string;
  initialBalance?: number;
}

// Редактирование счёта
interface UpdateAccountRequest {
  name?: string;
  accountTypeId?: string;
  currency?: string;
  bankName?: string;
  icon?: string;
  color?: string;
  isArchived?: boolean;
  currentBalance?: number;
}

// Установка баланса
interface SetBalanceRequest {
  accountId: string;
  currentBalance: number;
  reason?: string;
  date?: string;
}

// Корректировка (ответ)
interface BalanceAdjustment {
  id: string;
  accountId: string;
  amount: number;
  reason: string;
  date: string;
  createdAt: string;
}
```
