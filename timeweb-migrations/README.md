# Timeweb PostgreSQL Migrations

> ⚠️ **Если у вас ошибка `violates foreign key constraint`** - откройте [FIX_YOUR_ERROR.md](FIX_YOUR_ERROR.md)

Эти миграции адаптированы для работы с обычным PostgreSQL на Timeweb без Supabase Auth.

## Основные отличия от Supabase

1. **Нет схемы `auth`** - вместо неё используется таблица `auth_sessions`
2. **Замена `auth.uid()`** - используется функция `current_user_id()`
3. **Упрощённая аутентификация** - управление сессиями через приложение

## Порядок применения миграций

Выполните SQL файлы в следующем порядке:

```bash
# 1. Система аутентификации
psql -h your-host -U your-user -d your-db -f 01_create_auth_system.sql

# 2. Основная схема платформы
psql -h your-host -U your-user -d your-db -f 02_create_platform_schema.sql

# 3. Политики безопасности (RLS)
psql -h your-host -U your-user -d your-db -f 03_setup_rls_policies.sql

# 4. Дополнительные возможности (опционально)
psql -h your-host -U your-user -d your-db -f 04_add_additional_features.sql
```

## Как работает аутентификация

### В приложении (Node.js/TypeScript)

```typescript
// При входе пользователя
const token = generateJWT(userId); // Генерируем JWT
await client.query(
  'INSERT INTO auth_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
  [userId, token, expiresAt]
);

// При каждом запросе
await client.query('SELECT authenticate_with_token($1)', [token]);
// Теперь current_user_id() вернёт userId
```

### В SQL запросах

После вызова `authenticate_with_token()`, все RLS политики будут работать автоматически:

```sql
-- Этот запрос увидит только курсы текущего пользователя
SELECT * FROM courses;
```

## Важные замечания

1. **RLS работает только после установки пользователя**
   - Нужно вызывать `authenticate_with_token()` для каждого подключения

2. **Очистка сессий**
   - Периодически вызывайте `SELECT cleanup_expired_sessions()`

3. **Пулы подключений**
   - При использовании пулов, устанавливайте пользователя для каждого запроса

## Тестирование

```sql
-- 1. Создать тестового пользователя
INSERT INTO users (telegram_id, first_name)
VALUES (123456789, 'Test User')
RETURNING id;

-- 2. Создать сессию
INSERT INTO auth_sessions (user_id, token, expires_at)
VALUES ('user-uuid-here', 'test-token', now() + interval '1 day');

-- 3. Установить текущего пользователя
SELECT authenticate_with_token('test-token');

-- 4. Проверить что current_user_id() работает
SELECT current_user_id();
```

## Миграция с Supabase

Если вы переносите данные с Supabase:

1. Экспортируйте данные из Supabase (без таблиц `auth.*`)
2. Создайте записи в `auth_sessions` для каждого пользователя
3. Импортируйте остальные данные

## Проблемы и решения

### Ошибка: "permission denied to create role"

**Решение:** Обратитесь в поддержку Timeweb для создания ролей `anon`, `authenticated`, `service_role`.

Или измените политики, заменив:
- `TO authenticated` → `TO your_db_user`
- `TO anon` → `TO your_db_user`

### Ошибка: "current_user_id() returns NULL"

**Решение:** Убедитесь что вызвали `authenticate_with_token()` перед запросами.

### RLS блокирует все запросы

**Решение:** Временно отключите RLS для отладки:
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

Не забудьте включить обратно после отладки!

---

## Дополнительная помощь

- **[FIX_YOUR_ERROR.md](FIX_YOUR_ERROR.md)** - Быстрое решение ошибки foreign key constraint
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Полный гайд по устранению проблем
- **[QUICK_START.md](QUICK_START.md)** - Быстрый старт за 3 шага
- **[CHEATSHEET.md](CHEATSHEET.md)** - Шпаргалка с командами
- **[CODE_EXAMPLES.md](CODE_EXAMPLES.md)** - Готовые примеры кода
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Подробное описание архитектуры
