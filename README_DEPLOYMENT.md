# 🎯 Руководство по деплою KeyKurs Platform на Таймвеб

## 🚨 ВАЖНО: ПРОБЛЕМА С БД РЕШЕНА!

SSL сертификат для подключения к PostgreSQL добавлен и настроен.

---

## 📖 Навигация по документации

### 🚀 Быстрый старт
- **[НАЧНИ_ОТСЮДА.md](./НАЧНИ_ОТСЮДА.md)** ← **НАЧНИ ЗДЕСЬ!**
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Полный чеклист деплоя

### 🔧 Техническая документация
- **[QUICK_FIX_TIMEWEB.md](./QUICK_FIX_TIMEWEB.md)** - Что было исправлено
- **[TIMEWEB_SSL_SETUP.md](./TIMEWEB_SSL_SETUP.md)** - Настройка SSL подключения
- **[TIMEWEB_CLOUD_APPS.md](./TIMEWEB_CLOUD_APPS.md)** - Работа с App Platform

### 📁 База данных
- **[timeweb-migrations/](./timeweb-migrations/)** - SQL миграции для PostgreSQL
- **[TIMEWEB_DATABASE_SETUP.md](./TIMEWEB_DATABASE_SETUP.md)** - Настройка БД

### 🏗️ Архитектура
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Архитектура проекта
- **[BACKEND_API_MIGRATION.md](./BACKEND_API_MIGRATION.md)** - Миграция API

---

## ⚡ Быстрый путь к деплою

### 1. Закоммитить и запушить
```bash
git add .
git commit -m "Fix: Add SSL certificate for Timeweb PostgreSQL"
git push
```

### 2. Проверить DATABASE_URL в панели Таймвеб

**Должно быть БЕЗ `?sslmode=verify-full`:**
```
DATABASE_URL=postgresql://gen_user:PASSWORD@a6e6285d9957acb308f354f9.twc1.net:5432/default_db
```

### 3. Дождаться автодеплоя

### 4. Проверить работу
- `https://keykurs.ru/health` → `{"status":"ok"}`
- `https://keykurs.ru/api/diagnostics` → Интерактивная страница

### 5. Применить миграции
Через панель Таймвеб → Базы данных → SQL редактор:
1. `01_create_auth_system.sql`
2. `02_create_platform_schema.sql`
3. `03_setup_rls_policies.sql`
4. `04_add_additional_features.sql`

---

## �� Что было изменено

### Добавлено
- ✅ `certs/root.crt` - SSL сертификат для PostgreSQL
- ✅ `certs/README.md` - Описание сертификата
- ✅ Логика загрузки SSL сертификата в `api/index.js`
- ✅ Подробная документация по деплою

### Изменено
- ✅ `api/index.js` - Добавлена поддержка SSL с сертификатом
- ✅ Импорты для работы с файловой системой

### Документация
- ✅ `НАЧНИ_ОТСЮДА.md` - Краткая инструкция
- ✅ `DEPLOYMENT_CHECKLIST.md` - Полный чеклист
- ✅ `QUICK_FIX_TIMEWEB.md` - Описание исправления
- ✅ `TIMEWEB_SSL_SETUP.md` - Техническая документация
- ✅ `.env.example` - Пример переменных окружения

---

## 🔍 Проверка работы

### Эндпоинты для проверки

| Эндпоинт | Назначение | Ожидаемый результат |
|----------|------------|---------------------|
| `/health` | Проверка работы сервера | `{"status":"ok"}` |
| `/api/db-check` | Проверка подключения к БД | JSON с информацией о БД |
| `/api/db-tables` | Список таблиц в БД | JSON со списком таблиц |
| `/api/env-check` | Проверка переменных окружения | JSON со статусом переменных |
| `/api/diagnostics` | Интерактивная диагностика | HTML страница с кнопками проверки |

### Ожидаемые логи

После успешного деплоя в логах должно быть:

```
✅ SSL certificate loaded successfully
✅ Database connected successfully
🚀 Server running on port 3000
📊 Health check: http://localhost:3000/health
🌍 Environment: production
```

---

## 🆘 Устранение проблем

### Проблема: "SSL certificate not found"

**Причина:** Папка `certs/` не попала в деплой

**Решение:**
```bash
git add certs/
git commit -m "Add SSL certificate"
git push
```

### Проблема: "Connection refused"

**Причина:** Неправильный DATABASE_URL

**Решение:**
1. Проверьте пароль в DATABASE_URL
2. Проверьте статус БД в панели Таймвеб
3. Убедитесь, что БД запущена

### Проблема: "no pg_hba.conf entry"

**Причина:** Неправильные учетные данные

**Решение:** Скопируйте DATABASE_URL из панели Таймвеб заново

### Проблема: Таблиц нет (tablesCount: 0)

**Причина:** Миграции не применены

**Решение:** Примените SQL миграции через SQL редактор Таймвеб

---

## 📊 Структура проекта

```
project/
├── api/
│   └── index.js                    ← Backend API (Express + PostgreSQL)
├── src/                            ← Frontend (React + TypeScript)
├── certs/
│   ├── root.crt                    ← SSL сертификат
│   └── README.md
├── timeweb-migrations/             ← SQL миграции
│   ├── 01_create_auth_system.sql
│   ├── 02_create_platform_schema.sql
│   ├── 03_setup_rls_policies.sql
│   └── 04_add_additional_features.sql
├── .env                            ← Переменные окружения (не в git)
├── .env.example                    ← Пример переменных
├── package.json                    ← Зависимости
├── vite.config.ts                  ← Конфигурация сборки
├── НАЧНИ_ОТСЮДА.md                ← 🚀 НАЧНИ ЗДЕСЬ!
├── DEPLOYMENT_CHECKLIST.md        ← Полный чеклист
├── QUICK_FIX_TIMEWEB.md           ← Что было исправлено
└── TIMEWEB_SSL_SETUP.md           ← Техническая документация
```

---

## 🔐 Безопасность

### Что НЕ нужно коммитить в git:
- `.env` (файл с паролями)
- `node_modules/`
- `build/` (генерируется автоматически)

### Что можно коммитить:
- `certs/root.crt` (публичный сертификат)
- `.env.example` (без реальных паролей)
- Все исходники и документация

---

## 📞 Поддержка

Если после выполнения всех шагов что-то не работает:

1. Откройте `/api/diagnostics` на вашем сайте
2. Нажмите "Запустить полную проверку"
3. Проверьте логи в панели App Platform
4. Сделайте скриншоты ошибок

---

## ✅ Чеклист готовности к деплою

- [ ] Код закоммичен и запушен на GitHub
- [ ] DATABASE_URL без `?sslmode=verify-full` в App Platform
- [ ] Переменные окружения настроены в App Platform
- [ ] Команда сборки: `npm install && npm run build`
- [ ] Команда запуска: `npm start`
- [ ] Автодеплой завершен успешно
- [ ] `/health` возвращает `{"status":"ok"}`
- [ ] `/api/db-check` показывает успешное подключение
- [ ] SQL миграции применены
- [ ] `/api/db-tables` показывает все таблицы
- [ ] Сайт открывается и показывает форму входа

---

**Версия**: 2.0
**Дата обновления**: 2026-02-18
**Статус**: Готово к деплою ✅
