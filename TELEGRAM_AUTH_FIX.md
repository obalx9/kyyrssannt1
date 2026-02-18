# Исправление авторизации через Telegram

## Что было исправлено

1. **Ошибка в SQL запросе** (`api/index.js:170`)
   - Убрана несуществующая колонка `updated_at` из запроса UPDATE
   - Теперь авторизация через Telegram работает корректно

2. **Добавлен Webhook endpoint** (`/api/telegram/webhook/:secret`)
   - Telegram бот теперь может получать сообщения из канала
   - Автоматическое создание постов в курсе

3. **Добавлен endpoint для проверки webhook** (`/api/telegram-bot/webhook-info`)
   - Можно проверить статус webhook

## Настройка Telegram Login Widget

Для работы кнопки "Войти через Telegram" нужно настроить домен в BotFather:

### Шаг 1: Откройте BotFather в Telegram

Найдите [@BotFather](https://t.me/BotFather) и отправьте команду:

```
/setdomain
```

### Шаг 2: Выберите вашего бота

Выберите бота `@mqmqmmqbot` из списка

### Шаг 3: Укажите домен

Введите ваш домен:

```
keykurs.ru
```

**Важно:** Домен должен быть **БЕЗ** `https://` и **БЕЗ** `/` в конце!

✅ Правильно: `keykurs.ru`
❌ Неправильно: `https://keykurs.ru` или `keykurs.ru/`

### Шаг 4: Перезапустите backend на сервере

```bash
ssh root@your-server-ip
cd /var/www/yourproject
pm2 restart keykurs-api
```

### Шаг 5: Проверьте работу

1. Откройте https://keykurs.ru
2. Нажмите кнопку "Войти через Telegram"
3. Должно открыться окно авторизации Telegram

## Проверка webhook

После перезапуска сервера проверьте webhook:

```bash
# На сервере
curl -X GET https://keykurs.ru/api/telegram-bot/webhook-info \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Ответ должен содержать:
```json
{
  "ok": true,
  "result": {
    "url": "https://keykurs.ru/api/telegram/webhook/...",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Тестирование

### 1. Тест авторизации

1. Откройте https://keykurs.ru в режиме инкогнито
2. Нажмите "Войти через Telegram"
3. Авторизуйтесь через Telegram
4. Вы должны быть перенаправлены на главную страницу

### 2. Тест Telegram бота

1. Отправьте текстовое сообщение в канал
2. Проверьте логи: `pm2 logs keykurs-api`
3. Должно появиться: `[Webhook] Received update:`
4. Откройте курс - новый пост должен появиться

### 3. Тест медиагруппы

1. Отправьте 2-3 фото/видео одним сообщением в канал
2. Проверьте курс - должен появиться один пост с медиагалереей

## Возможные проблемы

### Проблема: "Bot domain invalid"

**Решение:**
- Убедитесь, что в BotFather указан домен БЕЗ `https://`
- Домен должен быть ровно: `keykurs.ru`

### Проблема: "Failed to verify telegram data"

**Решение:**
- Проверьте, что bot_token правильный
- Убедитесь, что в базе данных есть запись в `telegram_bots`

### Проблема: Webhook не получает сообщения

**Решение:**

1. Проверьте webhook URL:
```bash
curl https://api.telegram.org/bot{BOT_TOKEN}/getWebhookInfo
```

2. Установите webhook заново через админ-панель:
   - Откройте настройки курса
   - Telegram Bot Configuration
   - Нажмите "Save"

3. Проверьте, что channel_id правильный:
```sql
SELECT * FROM telegram_bots;
```

Channel ID должен быть вида: `-1003542737204`

## Команды для деплоя

```bash
# 1. Подключиться к серверу
ssh root@your-server-ip

# 2. Перейти в директорию проекта
cd /var/www/yourproject

# 3. Получить обновления
git pull origin main

# 4. Установить зависимости (если нужно)
npm install --production

# 5. Собрать frontend
npm run build

# 6. Перезапустить backend
pm2 restart keykurs-api

# 7. Проверить логи
pm2 logs keykurs-api --lines 50

# 8. Проверить статус
pm2 status
```

## Логи для отладки

```bash
# Просмотр логов в реальном времени
pm2 logs keykurs-api

# Только ошибки
pm2 logs keykurs-api --err

# Последние 100 строк
pm2 logs keykurs-api --lines 100

# Очистить логи
pm2 flush
```

## Структура базы данных

### Таблица telegram_bots

```sql
SELECT id, bot_username, channel_id, webhook_secret, is_active
FROM telegram_bots;
```

### Таблица users

```sql
SELECT id, telegram_id, telegram_username, first_name, last_name
FROM users
ORDER BY created_at DESC
LIMIT 10;
```

### Таблица course_posts (новые посты из Telegram)

```sql
SELECT id, course_id, source_type, text_content, media_type, created_at
FROM course_posts
WHERE source_type = 'telegram'
ORDER BY created_at DESC
LIMIT 10;
```

## Итоговый чеклист

- [ ] Исправлен SQL запрос (убрана колонка updated_at)
- [ ] Backend перезапущен на сервере
- [ ] В BotFather настроен домен `/setdomain` → `keykurs.ru`
- [ ] Webhook установлен (через админ-панель)
- [ ] Авторизация через Telegram работает
- [ ] Сообщения из канала автоматически создают посты
- [ ] Логи не показывают ошибок
