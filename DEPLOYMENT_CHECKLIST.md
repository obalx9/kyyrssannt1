# Чеклист деплоя на Таймвеб App Platform

## ✅ Что уже сделано

- [x] Добавлен SSL сертификат в `certs/root.crt`
- [x] Обновлен код подключения к PostgreSQL с поддержкой SSL
- [x] Создана документация по настройке
- [x] Проект успешно собирается (`npm run build`)

## 📋 Что нужно сделать ВАМ

### 1. Закоммитить и запушить изменения

```bash
git add .
git commit -m "Fix: Add SSL certificate for Timeweb PostgreSQL connection"
git push origin main
```

### 2. Проверить настройки App Platform

Зайдите в панель Таймвеб → App Platform → keykurs.ru → Настройки

#### Переменные окружения:

Убедитесь, что DATABASE_URL выглядит так (БЕЗ `?sslmode=verify-full`):

```
DATABASE_URL=postgresql://gen_user:FOXH),(g<:6DR!@a6e6285d9957acb308f354f9.twc1.net:5432/default_db
```

Полный список переменных:

```
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://gen_user:FOXH),(g<:6DR!@a6e6285d9957acb308f354f9.twc1.net:5432/default_db
JWT_SECRET=a7f2c8e9b1d4f6a3c5e7b9d2f4a6c8e1b3d5f7a9c2e4b6d8f1a3c5e7b9d2f4a6c8e1b3d5f7a9c2e4b6d8f1a3c5e7b9d2f4a6
ALLOWED_ORIGINS=https://keykurs.ru,https://www.keykurs.ru
VITE_API_URL=https://keykurs.ru
TELEGRAM_BOT_TOKEN=8485758380:AAG2AjJwRYpjqNX6qmHzFEEcUB5oyyA1e7o
TELEGRAM_BOT_USERNAME=mqmqmmqbot
```

#### Настройки сборки:

- **Фреймворк**: React
- **Версия окружения**: 24
- **Команда сборки**: `npm install && npm run build`
- **Ветка**: main

### 3. Дождаться автодеплоя

После пуша App Platform автоматически начнет деплой. Следите за статусом в панели.

### 4. Проверить работу

После успешного деплоя:

#### Проверка 1: Health Check
```
https://keykurs.ru/health
```
**Ожидаемый результат:**
```json
{"status":"ok","timestamp":"2026-02-18T..."}
```

#### Проверка 2: Диагностика
```
https://keykurs.ru/api/diagnostics
```
**Ожидаемый результат:** Интерактивная HTML страница с кнопками проверки

#### Проверка 3: Подключение к БД
```
https://keykurs.ru/api/db-check
```
**Ожидаемый результат:**
```json
{
  "status": "connected",
  "connection": "ok",
  "database": "default_db",
  "serverTime": "...",
  "postgresVersion": "...",
  "tablesCount": 0,
  "message": "База данных подключена успешно"
}
```

**ВАЖНО:** `tablesCount: 0` - это нормально! Это значит, что нужно применить миграции (следующий шаг).

#### Проверка 4: Переменные окружения
```
https://keykurs.ru/api/env-check
```
**Ожидаемый результат:** Все переменные должны быть установлены

### 5. Применить SQL миграции

**Только после успешного подключения к БД!**

1. Откройте панель Таймвеб → Базы данных
2. Выберите вашу БД PostgreSQL (`default_db`)
3. Нажмите "SQL редактор"
4. Примените файлы из папки `timeweb-migrations/` **СТРОГО ПО ПОРЯДКУ**:

```
01_create_auth_system.sql       ← Сначала
02_create_platform_schema.sql   ← Потом
03_setup_rls_policies.sql       ← Затем
04_add_additional_features.sql  ← В конце
```

Для каждого файла:
- Откройте файл на вашем компьютере
- Скопируйте содержимое
- Вставьте в SQL редактор Таймвеб
- Нажмите "Выполнить"
- Дождитесь сообщения "Запрос выполнен успешно"

### 6. Финальная проверка

После применения миграций снова проверьте:

```
https://keykurs.ru/api/db-check
```

Теперь должно быть:
```json
{
  "tablesCount": 15  // или больше - это нормально!
}
```

Также проверьте структуру таблиц:
```
https://keykurs.ru/api/db-tables
```

Должны быть видны таблицы:
- users
- sellers
- students
- courses
- course_posts
- course_enrollments
- telegram_bots
- и другие...

### 7. Проверить сам сайт

Откройте:
```
https://keykurs.ru
```

Должна открыться главная страница с логином через Telegram.

## 🚨 Возможные проблемы и решения

### Проблема: "SSL certificate not found"

**В логах видите:** `⚠️ SSL certificate not found, using sslmode=require`

**Решение:**
1. Проверьте, что папка `certs/` есть в репозитории
2. Убедитесь, что `.gitignore` не исключает `certs/`
3. Сделайте `git push --force` если нужно

### Проблема: "Connection refused"

**Решение:**
1. Проверьте DATABASE_URL (особенно пароль)
2. Проверьте статус БД в панели Таймвеб
3. Убедитесь, что БД запущена

### Проблема: "no pg_hba.conf entry"

**Решение:**
1. Неправильный пароль в DATABASE_URL
2. Скопируйте DATABASE_URL из панели Таймвеб заново

### Проблема: Сайт не открывается (502/504)

**Решение:**
1. Проверьте логи в панели App Platform
2. Убедитесь, что команда запуска правильная: `npm start`
3. Проверьте, что PORT=3000 в переменных окружения

## 📊 Проверка логов

В панели App Platform → Логи должно быть:

```
✅ SSL certificate loaded successfully
✅ Database connected successfully
🚀 Server running on port 3000
📊 Health check: http://localhost:3000/health
🌍 Environment: production
```

## 📞 Нужна помощь?

Если после всех шагов что-то не работает:

1. Проверьте логи в App Platform
2. Откройте `/api/diagnostics` и нажмите "Полная диагностика"
3. Сделайте скриншот ошибки и пришлите мне

---

**Версия документа**: 1.0
**Дата**: 2026-02-18
**Статус**: Готово к деплою ✅
