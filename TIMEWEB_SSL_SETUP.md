# Настройка SSL подключения к PostgreSQL Таймвеб

## Проблема

При деплое на App Platform Таймвеб, приложение не может подключиться к базе данных PostgreSQL из-за отсутствия SSL сертификата.

## Решение

Код уже обновлен для работы с SSL сертификатом. Сертификат находится в папке `certs/root.crt`.

## Шаги для успешного деплоя

### 1. Проверьте DATABASE_URL

В панели App Platform убедитесь, что переменная `DATABASE_URL` настроена правильно:

```
DATABASE_URL=postgresql://gen_user:ВАШІ_ПАРОЛЬ@a6e6285d9957acb308f354f9.twc1.net:5432/default_db
```

**ВАЖНО**: Уберите `?sslmode=verify-full` из конца строки, если он там есть. SSL настраивается автоматически в коде.

### 2. Структура переменных окружения в App Platform

Убедитесь, что в панели App Platform → ваше приложение → Настройки → Переменные окружения есть:

```
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://gen_user:ВАШІ_ПАРОЛЬ@a6e6285d9957acb308f354f9.twc1.net:5432/default_db
JWT_SECRET=a7f2c8e9b1d4f6a3c5e7b9d2f4a6c8e1b3d5f7a9c2e4b6d8f1a3c5e7b9d2f4a6c8e1b3d5f7a9c2e4b6d8f1a3c5e7b9d2f4a6
ALLOWED_ORIGINS=https://keykurs.ru,https://www.keykurs.ru
VITE_API_URL=https://keykurs.ru
TELEGRAM_BOT_TOKEN=8485758380:AAG2AjJwRYpjqNX6qmHzFEEcUB5oyyA1e7o
TELEGRAM_BOT_USERNAME=mqmqmmqbot
```

### 3. Настройки сборки в App Platform

Убедитесь, что в панели App Platform настроено:

**Фреймворк**: React
**Версия окружения**: 24 (Node.js)
**Команда сборки**:
```bash
npm install && npm run build
```

**Команда запуска**:
```bash
npm start
```

### 4. Проверка работы после деплоя

После успешного деплоя проверьте:

1. **Health check**: `https://keykurs.ru/health`
   - Должен вернуть: `{"status":"ok","timestamp":"..."}`

2. **Диагностика БД**: `https://keykurs.ru/api/diagnostics`
   - Откроется интерактивная страница с кнопками проверки

3. **Проверка подключения**: `https://keykurs.ru/api/db-check`
   - Должен вернуть JSON с информацией о базе данных

4. **Проверка переменных**: `https://keykurs.ru/api/env-check`
   - Покажет статус всех переменных окружения

## Как работает SSL

1. При запуске в production режиме (`NODE_ENV=production`)
2. Код автоматически загружает сертификат из `certs/root.crt`
3. Использует его для безопасного подключения к PostgreSQL
4. Если сертификат не найден, включается режим `rejectUnauthorized: false`

## Логи

После деплоя в логах App Platform вы должны увидеть:

```
✅ SSL certificate loaded successfully
✅ Database connected successfully
🚀 Server running on port 3000
```

Если вы видите предупреждение:
```
⚠️ SSL certificate not found, using sslmode=require
```

Значит папка `certs/` не попала в деплой. Убедитесь, что:
- Папка `certs/` закоммичена в репозиторий
- Файл `certs/root.crt` присутствует
- В `.gitignore` нет исключения для папки `certs/`

## Устранение проблем

### Ошибка: "no pg_hba.conf entry"

**Решение**: Проверьте правильность пароля в DATABASE_URL

### Ошибка: "self signed certificate"

**Решение**: Убедитесь, что файл `certs/root.crt` содержит правильный сертификат

### Ошибка: "ECONNREFUSED"

**Решение**: Проверьте доступность базы данных и правильность хоста в DATABASE_URL

### База данных подключается, но таблиц нет

**Решение**: Примените SQL миграции из папки `timeweb-migrations/`:
1. Откройте панель Таймвеб → Базы данных
2. Выберите вашу БД PostgreSQL
3. Откройте SQL редактор
4. Примените файлы по порядку:
   - `01_create_auth_system.sql`
   - `02_create_platform_schema.sql`
   - `03_setup_rls_policies.sql`
   - `04_add_additional_features.sql`

## Контакты для поддержки

Если проблемы остаются, проверьте:
1. Логи в панели App Platform
2. Доступность БД PostgreSQL в панели Таймвеб
3. Правильность всех переменных окружения

---

**Версия**: 1.0
**Дата**: 2026-02-18
**Проект**: KeyKurs Platform
