1. Создание кредита

POST /api/v1/credits
{
  "name": "Ипотека Сбербанк",
  "principalAmount": 3000000,
  "interestRate": 12.5,
  "termMonths": 240,
  "startDate": "2024-01-15",
  "paymentDay": 15,
  "accountId": "uuid-карты-сбербанка",    // счёт списания
  "categoryId": "uuid-категории-кредиты"   // для planned_expenses
}
Результат:
Создаётся запись в credits
Автоматически рассчитывается и сохраняется график в credit_schedule (240 платежей)
2. Генерация planned_expenses для бюджета

POST /api/v1/budgets/:id/generate-credit-payments
Что происходит:
Находит все активные кредиты с category_id
Берёт платежи из credit_schedule за месяц бюджета
Создаёт planned_expense для каждого платежа:

planned_expenses:
┌─────────────────────────────────────────────────────┐
│ name: "Ипотека Сбербанк - платёж #24"               │
│ planned_amount: 30000                               │
│ category_id: uuid-категории-кредиты                 │
│ notes: "Тело: 8500 + Проценты: 21500"               │
│ status: pending                                     │
└─────────────────────────────────────────────────────┘
3. Подтверждение платежа (основной flow)

POST /api/v1/planned-expenses/:id/confirm-with-expense
{
  // accountId можно не указывать — возьмётся из кредита
  // date можно не указывать — возьмётся planned_date или сегодня
}
Что происходит:

┌─────────────────────────────────────────────────────────────────┐
│                     confirm-with-expense                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. Получить planned_expense                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Создать expense                                              │
│    - category_id: из planned_expense                            │
│    - amount: planned_amount (30000)                             │
│    - account_id: из запроса ИЛИ из кредита (автоматически)      │
│    - date: из запроса ИЛИ planned_date ИЛИ сегодня              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Подтвердить planned_expense                                  │
│    - status: confirmed                                          │
│    - actual_expense_id: uuid созданного expense                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Это кредитный платёж? (по имени "... - платёж #N")           │
│    ДА → Создать credit_payment                                  │
│         - credit_id, schedule_id                                │
│         - expense_id: uuid созданного expense                   │
│         - principal_paid: 8500                                  │
│         - interest_paid: 21500                                  │
│         - total_paid: 30000                                     │
└─────────────────────────────────────────────────────────────────┘
4. Результат в базе данных
После подтверждения платежа создаются связанные записи:

expenses:                          credit_payments:
┌──────────────────────────┐      ┌──────────────────────────────┐
│ id: expense-uuid         │◄────►│ expense_id: expense-uuid     │
│ category_id: кредиты     │      │ credit_id: credit-uuid       │
│ amount: 30000            │      │ schedule_id: schedule-uuid   │
│ account_id: карта-сбер   │      │ principal_paid: 8500         │
│ date: 2024-01-15         │      │ interest_paid: 21500         │
└──────────────────────────┘      │ total_paid: 30000            │
         ▲                        │ status: completed            │
         │                        └──────────────────────────────┘
         │                                    ▲
planned_expenses:                             │
┌──────────────────────────┐                  │
│ id: pe-uuid              │                  │
│ actual_expense_id: ──────┼──────────────────┘
│ status: confirmed        │      credit_schedule:
│ name: "Ипотека - #24"    │      ┌──────────────────────────────┐
└──────────────────────────┘      │ id: schedule-uuid            │
                                  │ payment_number: 24           │
                                  │ principal_part: 8500         │
                                  │ interest_part: 21500         │
                                  │ remaining_balance: 2850000   │
                                  └──────────────────────────────┘
5. Где что учитывается
Сущность	Назначение	Сумма
expenses	Общий учёт расходов за период	30000 (полный платёж)
credit_payments	Детализация по кредиту	Тело: 8500, Проценты: 21500
credit_schedule	Остаток долга	2850000 после платежа
planned_expenses	Планирование бюджета	Ожидалось 30000, факт 30000
6. Сводки и отчёты
По кредиту:

GET /api/v1/credits/:id/summary

{
  "originalPrincipal": 3000000,
  "remainingPrincipal": 2850000,
  "totalPrincipalPaid": 150000,
  "totalInterestPaid": 420000,
  "totalPaid": 570000,
  "paymentsMade": 19,
  "paymentsRemaining": 221
}
По бюджету:
expenses за период покажут все расходы, включая кредитные платежи
planned_expenses покажут план vs факт
В категории "Кредиты" будет видна общая сумма платежей