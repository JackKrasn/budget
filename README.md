# Бюджет

Приложение для управления личными финансами.

## Технологии

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Desktop**: Tauri 2 (Rust)
- **State**: Zustand
- **Charts**: Recharts

## Требования

- Node.js 20+
- Rust (для desktop-приложения)

## Установка

```bash
# Клонирование репозитория
git clone <repo-url>
cd budget

# Установка зависимостей
npm install

# Установка Rust (если не установлен)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

## Запуск

### Веб-версия (браузер)

```bash
npm run dev
```

Откроется на http://localhost:5273

### Desktop-приложение (Tauri)

```bash
npm run tauri:dev
```

Запустит приложение как отдельное окно macOS.

## Сборка

### Веб-версия

```bash
npm run build
npm run preview  # Предпросмотр production-сборки
```

### Desktop-приложение

```bash
npm run tauri:build
```

Собранное приложение будет в `src-tauri/target/release/bundle/`:
- `macos/budget.app` — приложение для macOS
- `dmg/budget_<version>_aarch64.dmg` — установщик для macOS

### Установка на macOS

1. **Через .app**: Перетащи `budget.app` в папку `/Applications`
2. **Через .dmg**: Открой dmg файл и перетащи приложение в Applications

После установки можно запускать через Launchpad или Spotlight (Cmd+Space → "budget").

## Обновление версии

При выпуске новой версии нужно обновить версию в двух файлах:

1. `package.json`:
```json
"version": "1.1.0"
```

2. `src-tauri/tauri.conf.json`:
```json
"version": "1.1.0"
```

Затем пересобрать приложение:
```bash
npm run tauri:build
```

И заменить старое приложение в `/Applications` новым.

Текущая версия отображается внизу sidebar в приложении.

## Структура проекта

```
├── src/                    # Frontend код
│   ├── components/         # UI компоненты
│   ├── features/           # Фичи (expenses, budget, etc.)
│   ├── lib/                # Утилиты
│   ├── pages/              # Страницы
│   └── stores/             # Zustand stores
├── src-tauri/              # Tauri (Rust) код
│   ├── icons/              # Иконки приложения
│   └── tauri.conf.json     # Конфигурация Tauri
├── public/                 # Статические файлы
└── index.html              # HTML entry point
```

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev-сервера (порт 5273) |
| `npm run build` | Сборка для production |
| `npm run preview` | Предпросмотр сборки |
| `npm run lint` | Проверка ESLint |
| `npm run tauri:dev` | Запуск Tauri в dev-режиме |
| `npm run tauri:build` | Сборка Tauri приложения |
