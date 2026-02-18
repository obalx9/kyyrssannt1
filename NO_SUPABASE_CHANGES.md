# Изменения: Переход с Supabase на Timeweb PostgreSQL

## Что было сделано

Проект полностью переработан для работы без Supabase. Теперь используется:
- Собственный Express.js бэкенд
- PostgreSQL база данных на Timeweb
- Локальное хранение файлов вместо Supabase Storage
- JWT аутентификация вместо Supabase Auth

## Основные изменения

### Фронтенд
- ✅ Удален `@supabase/supabase-js` из зависимостей
- ✅ Все компоненты переписаны для работы с REST API
- ✅ Убраны все вызовы `supabase.from()`, `supabase.storage`, `supabase.auth`
- ✅ Добавлен `apiClient` для всех запросов к бэкенду
- ✅ Realtime подписки заменены на polling

### Бэкенд
- ✅ Добавлен multer для загрузки файлов
- ✅ Создан endpoint `/api/upload` для загрузки медиа
- ✅ Все данные хранятся в PostgreSQL на Timeweb
- ✅ Файлы хранятся локально в папке `uploads/`

### Удалено
- ❌ `supabase/` - все миграции Supabase
- ❌ `cloudflare-workers/` - проксирование Supabase API
- ❌ Зависимость от Supabase сервисов

## Как это работает сейчас

### Аутентификация
```typescript
// Раньше (Supabase)
const { data } = await supabase.auth.signInWithOAuth(...)

// Сейчас (Custom API)
const { token } = await apiClient.telegramAuth(telegramData)
localStorage.setItem('auth_token', token)
```

### Запросы к БД
```typescript
// Раньше (Supabase)
const { data } = await supabase
  .from('courses')
  .select('*')

// Сейчас (Custom API)
const data = await apiClient.getCourses()
```

### Загрузка файлов
```typescript
// Раньше (Supabase Storage)
await supabase.storage
  .from('course-media')
  .upload(path, file)

// Сейчас (Custom Upload)
const formData = new FormData()
formData.append('file', file)
const result = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
  headers: { Authorization: `Bearer ${token}` }
})
```

## Преимущества

1. **Независимость** - нет зависимости от внешних сервисов
2. **Контроль** - полный контроль над данными и файлами
3. **Нет лимитов** - нет лимитов Supabase Free tier
4. **Стоимость** - экономия на Supabase подписке
5. **Простота** - более простая архитектура

## Недостатки

1. **Realtime** - нет WebSocket, используется polling (обновление каждые 10 сек)
2. **Storage** - нужно самим управлять файлами
3. **Backup** - нужно настроить свои backups

## Миграция существующих данных

Если у вас были данные в Supabase:

1. Экспортируйте данные из Supabase
2. Примените миграции из `timeweb-migrations/`
3. Импортируйте данные в PostgreSQL на Timeweb
4. Скачайте файлы из Supabase Storage в папку `uploads/`

## Дальнейшие шаги

1. Прочитайте `DEPLOY_INSTRUCTIONS.md`
2. Настройте переменные окружения
3. Запустите миграции базы данных
4. Соберите и задеплойте проект
5. Настройте nginx
6. Получите SSL сертификат

## Поддержка

Все работает так же, как раньше, просто без Supabase. Если что-то не работает, проверьте:
- Логи бэкенда: `pm2 logs keykurs`
- Консоль браузера
- Nginx логи: `/var/log/nginx/error.log`
