Что изменилось на бэкенде
Баланс счетов теперь хранится в поле current_balance и обновляется автоматически при каждой операции. Это значит:
Баланс доступен мгновенно — не нужно ждать вычислений
Изменилась структура ответа GET /accounts
Новая структура ответа GET /api/v1/accounts

interface Account {
  id: string;
  name: string;
  accountTypeId: string;
  typeCode: string;
  typeName: string;
  currency: string;
  bankName: string | null;
  icon: string | null;
  color: string | null;
  isArchived: boolean;
  currentBalance: number;  // ← НОВОЕ ПОЛЕ (вместо balance)
  createdAt: string;
  updatedAt: string;
}

interface AccountsResponse {
  data: Account[];
  total: number;
  totalBalance: number;
}
Что нужно изменить на фронте
1. Переименовать поле баланса
Было:

// Если раньше использовалось поле balance
account.balance
Стало:

// Теперь поле называется currentBalance
account.currentBalance
2. Обновить типы (TypeScript)

// types/account.ts
export interface Account {
  id: string;
  name: string;
  accountTypeId: string;
  typeCode: string;
  typeName: string;
  currency: string;
  bankName: string | null;
  icon: string | null;
  color: string | null;
  isArchived: boolean;
  currentBalance: number;  // ← Изменить с balance на currentBalance
  createdAt: string;
  updatedAt: string;
}
3. Обновить компонент списка счетов

// Пример для React
function AccountsList({ accounts }: { accounts: Account[] }) {
  return (
    <div>
      {accounts.map(account => (
        <div key={account.id} className="account-card">
          <span className="account-name">{account.name}</span>
          <span className="account-balance">
            {account.currentBalance.toLocaleString('ru-RU')} {account.currency}
          </span>
        </div>
      ))}
    </div>
  );
}
4. Удалить старые поля (если использовались)
Следующие поля больше не возвращаются в списке счетов:
totalIncomes
totalExpenses
totalAdjustments
totalTransfersIn
totalTransfersOut
balance (заменено на currentBalance)
Если эти поля использовались на фронте, нужно их убрать или получать отдельным запросом.
Пример полного компонента

import { useEffect, useState } from 'react';

interface Account {
  id: string;
  name: string;
  typeName: string;
  currency: string;
  currentBalance: number;
  icon: string | null;
  color: string | null;
}

interface AccountsResponse {
  data: Account[];
  total: number;
  totalBalance: number;
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    fetch('/api/v1/accounts')
      .then(res => res.json())
      .then((data: AccountsResponse) => {
        setAccounts(data.data);
        setTotalBalance(data.totalBalance);
      });
  }, []);

  return (
    <div>
      <h1>Счета</h1>
      <div className="total">
        Общий баланс: {totalBalance.toLocaleString('ru-RU')} ₽
      </div>
      
      <div className="accounts-grid">
        {accounts.map(account => (
          <div 
            key={account.id} 
            className="account-card"
            style={{ borderColor: account.color || '#ccc' }}
          >
            {account.icon && <span className="icon">{account.icon}</span>}
            <div className="name">{account.name}</div>
            <div className="type">{account.typeName}</div>
            <div className="balance">
              {account.currentBalance.toLocaleString('ru-RU')} {account.currency}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
Важно
Баланс обновляется автоматически при:
Создании/удалении расхода
Создании/удалении дохода
Создании/удалении перевода
Создании/удалении корректировки баланса
Фронтенду достаточно перезапросить GET /accounts после любой из этих операций, чтобы получить актуальный баланс.