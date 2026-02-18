# 📚 Индекс документации проекта

## 🎯 Начните здесь

### Если вы хотите задеплоить на Timeweb Cloud Apps

**Начните с:** [START_HERE.md](./START_HERE.md)

Затем используйте:
1. [COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md) - для копирования команд
2. [TIMEWEB_QUICK_SETUP.md](./TIMEWEB_QUICK_SETUP.md) - для быстрой настройки
3. [TIMEWEB_VISUAL_GUIDE.md](./TIMEWEB_VISUAL_GUIDE.md) - для визуального гайда

### Если вы хотите задеплоить на VPS сервер

**Начните с:** [QUICK_DEPLOY_TIMEWEB.md](./QUICK_DEPLOY_TIMEWEB.md)

---

## 📖 Документация по деплою

### Timeweb Cloud Apps (автодеплой через GitHub)

| Файл | Описание | Время чтения |
|------|----------|--------------|
| [START_HERE.md](./START_HERE.md) | Ответ на вопрос о командах деплоя | 3 минуты |
| [COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md) | Готовые команды для копирования | 1 минута |
| [TIMEWEB_QUICK_SETUP.md](./TIMEWEB_QUICK_SETUP.md) | Быстрая настройка (только главное) | 2 минуты |
| [TIMEWEB_VISUAL_GUIDE.md](./TIMEWEB_VISUAL_GUIDE.md) | Визуальный гайд с примерами интерфейса | 7 минут |
| [TIMEWEB_CLOUD_APPS.md](./TIMEWEB_CLOUD_APPS.md) | Полная подробная инструкция | 15 минут |
| [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) | Итоги: что было сделано и как работает | 10 минут |

### Timeweb VPS (ручной деплой)

| Файл | Описание | Время чтения |
|------|----------|--------------|
| [QUICK_DEPLOY_TIMEWEB.md](./QUICK_DEPLOY_TIMEWEB.md) | Деплой на VPS с Nginx и PM2 | 10 минут |
| [TIMEWEB_DEPLOY_BACKEND_API.md](./TIMEWEB_DEPLOY_BACKEND_API.md) | Подробная настройка Backend API | 20 минут |
| [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md) | Общие инструкции по деплою | 10 минут |

---

## 🗄️ Документация по базе данных

### Миграции на Timeweb PostgreSQL

| Файл | Описание | Время чтения |
|------|----------|--------------|
| [timeweb-migrations/QUICK_START.md](./timeweb-migrations/QUICK_START.md) | Быстрый старт с БД | 5 минут |
| [timeweb-migrations/README.md](./timeweb-migrations/README.md) | Общая информация о миграциях | 7 минут |
| [timeweb-migrations/CHEATSHEET.md](./timeweb-migrations/CHEATSHEET.md) | Шпаргалка по SQL командам | 5 минут |
| [timeweb-migrations/CODE_EXAMPLES.md](./timeweb-migrations/CODE_EXAMPLES.md) | Примеры кода для работы с БД | 10 минут |
| [timeweb-migrations/ARCHITECTURE.md](./timeweb-migrations/ARCHITECTURE.md) | Архитектура базы данных | 15 минут |
| [timeweb-migrations/TROUBLESHOOTING.md](./timeweb-migrations/TROUBLESHOOTING.md) | Решение проблем с БД | 10 минут |
| [timeweb-migrations/FIX_YOUR_ERROR.md](./timeweb-migrations/FIX_YOUR_ERROR.md) | Исправление типичных ошибок | 5 минут |

### Скрипты миграций

| Файл | Описание |
|------|----------|
| [timeweb-migrations/01_create_auth_system.sql](./timeweb-migrations/01_create_auth_system.sql) | Система аутентификации |
| [timeweb-migrations/02_create_platform_schema.sql](./timeweb-migrations/02_create_platform_schema.sql) | Основная схема платформы |
| [timeweb-migrations/03_setup_rls_policies.sql](./timeweb-migrations/03_setup_rls_policies.sql) | Политики безопасности (RLS) |
| [timeweb-migrations/04_add_additional_features.sql](./timeweb-migrations/04_add_additional_features.sql) | Дополнительные возможности |
| [timeweb-migrations/add-telegram-bot.sql](./timeweb-migrations/add-telegram-bot.sql) | Настройка Telegram бота |

---

## 🏗️ Архитектура и миграции

| Файл | Описание | Время чтения |
|------|----------|--------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Архитектура всего приложения | 15 минут |
| [BACKEND_API_MIGRATION.md](./BACKEND_API_MIGRATION.md) | Миграция с Supabase на Node.js API | 20 минут |
| [MIGRATION_TO_TIMEWEB.md](./MIGRATION_TO_TIMEWEB.md) | Миграция на Timeweb | 15 минут |
| [NO_SUPABASE_CHANGES.md](./NO_SUPABASE_CHANGES.md) | Отказ от Supabase | 5 минут |

---

## ⚙️ Конфигурация и скрипты

| Файл | Описание |
|------|----------|
| [package.json](./package.json) | Зависимости и npm скрипты |
| [ecosystem.config.js](./ecosystem.config.js) | Конфигурация PM2 |
| [vite.config.ts](./vite.config.ts) | Конфигурация Vite |
| [nginx-config-example.conf](./nginx-config-example.conf) | Пример конфигурации Nginx |
| [deploy.sh](./deploy.sh) | Скрипт автоматического деплоя |
| [setup-timeweb-db.sh](./setup-timeweb-db.sh) | Скрипт настройки БД |

---

## 📱 Документация приложения

| Файл | Описание | Время чтения |
|------|----------|--------------|
| [README.md](./README.md) | Главный README проекта | 10 минут |

---

## 🎯 Быстрые ссылки по задачам

### "Мне нужно задеплоить приложение на Timeweb Cloud Apps"

1. [START_HERE.md](./START_HERE.md) - начните здесь
2. [COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md) - скопируйте команды
3. [TIMEWEB_QUICK_SETUP.md](./TIMEWEB_QUICK_SETUP.md) - следуйте инструкции

### "У меня только одно поле для команды в Timeweb"

1. [START_HERE.md](./START_HERE.md) - здесь есть ответ
2. Команда: `npm run start:production`

### "У меня два поля (Build и Start) в Timeweb"

1. Build Command: `npm install && npm run build`
2. Start Command: `npm start`
3. [COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md) - для деталей

### "Мне нужно настроить базу данных"

1. [timeweb-migrations/QUICK_START.md](./timeweb-migrations/QUICK_START.md)
2. [timeweb-migrations/CHEATSHEET.md](./timeweb-migrations/CHEATSHEET.md)

### "Что-то не работает после деплоя"

1. [TIMEWEB_VISUAL_GUIDE.md](./TIMEWEB_VISUAL_GUIDE.md) - раздел "Типичные проблемы"
2. [timeweb-migrations/TROUBLESHOOTING.md](./timeweb-migrations/TROUBLESHOOTING.md)
3. [timeweb-migrations/FIX_YOUR_ERROR.md](./timeweb-migrations/FIX_YOUR_ERROR.md)

### "Мне нужно задеплоить на VPS"

1. [QUICK_DEPLOY_TIMEWEB.md](./QUICK_DEPLOY_TIMEWEB.md)
2. [TIMEWEB_DEPLOY_BACKEND_API.md](./TIMEWEB_DEPLOY_BACKEND_API.md)

### "Мне нужны примеры кода для работы с БД"

1. [timeweb-migrations/CODE_EXAMPLES.md](./timeweb-migrations/CODE_EXAMPLES.md)
2. [timeweb-migrations/CHEATSHEET.md](./timeweb-migrations/CHEATSHEET.md)

### "Я хочу понять архитектуру проекта"

1. [ARCHITECTURE.md](./ARCHITECTURE.md)
2. [timeweb-migrations/ARCHITECTURE.md](./timeweb-migrations/ARCHITECTURE.md)
3. [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

---

## 📊 Статистика документации

- **Всего файлов документации:** 30+
- **Категории:** 4 (Деплой, База данных, Архитектура, Конфигурация)
- **Языки:** Русский (основной)
- **Уровни сложности:** Начальный, Средний, Продвинутый

---

## 🔍 Поиск по темам

### Деплой
- Cloud Apps: [START_HERE.md](./START_HERE.md), [TIMEWEB_CLOUD_APPS.md](./TIMEWEB_CLOUD_APPS.md)
- VPS: [QUICK_DEPLOY_TIMEWEB.md](./QUICK_DEPLOY_TIMEWEB.md)
- Команды: [COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md)

### База данных
- Быстрый старт: [timeweb-migrations/QUICK_START.md](./timeweb-migrations/QUICK_START.md)
- Миграции: папка [timeweb-migrations/](./timeweb-migrations/)
- Примеры: [timeweb-migrations/CODE_EXAMPLES.md](./timeweb-migrations/CODE_EXAMPLES.md)

### Настройка
- Переменные окружения: [COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md)
- Nginx: [nginx-config-example.conf](./nginx-config-example.conf)
- PM2: [ecosystem.config.js](./ecosystem.config.js)

### Проблемы
- Общие: [TIMEWEB_VISUAL_GUIDE.md](./TIMEWEB_VISUAL_GUIDE.md)
- База данных: [timeweb-migrations/TROUBLESHOOTING.md](./timeweb-migrations/TROUBLESHOOTING.md)
- Ошибки: [timeweb-migrations/FIX_YOUR_ERROR.md](./timeweb-migrations/FIX_YOUR_ERROR.md)

---

## 🆘 Нужна помощь?

1. **Найдите нужную тему** в разделе "Быстрые ссылки по задачам"
2. **Откройте соответствующий файл** документации
3. **Следуйте инструкциям** пошагово
4. **Если не помогло** - проверьте раздел troubleshooting

---

**Вся документация актуальна на 18.02.2026** ✅
