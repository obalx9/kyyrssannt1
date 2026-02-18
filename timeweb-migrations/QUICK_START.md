# Быстрый старт с Timeweb PostgreSQL

> **Столкнулись с ошибками?** См. [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Шаг 1: Применить миграции

```bash
# 1. Добавьте переменные в .env
cat >> ../.env << EOF
TIMEWEB_DB_HOST=your-host.timeweb.cloud
TIMEWEB_DB_PORT=5432
TIMEWEB_DB_NAME=your_database
TIMEWEB_DB_USER=your_username
TIMEWEB_DB_PASSWORD=your_password
EOF

# 2. Примените миграции
./apply-all.sh
```

## Шаг 2: Создать первого администратора

```sql
-- Подключитесь к БД
psql -h your-host -U your-user -d your-db

-- Создайте пользователя
INSERT INTO users (telegram_id, first_name, last_name)
VALUES (123456789, 'Admin', 'User')
RETURNING id;

-- Скопируйте полученный ID и добавьте роль super_admin
INSERT INTO user_roles (user_id, role)
VALUES ('полученный-uuid', 'super_admin');
```

## Шаг 3: Протестировать подключение

```sql
-- Создайте сессию для администратора
INSERT INTO auth_sessions (user_id, token, expires_at)
VALUES (
  'uuid-администратора',
  'test-token-123',
  now() + interval '1 day'
)
RETURNING *;

-- Установите пользователя
SELECT authenticate_with_token('test-token-123');

-- Проверьте что current_user_id() работает
SELECT current_user_id();
-- Должен вернуть UUID администратора

-- Проверьте что RLS работает
SELECT * FROM users;
-- Должен показать только вашего пользователя
```

## Шаг 4: Интегрировать с приложением

См. [TIMEWEB_INTEGRATION_GUIDE.md](../TIMEWEB_INTEGRATION_GUIDE.md) для подробной инструкции.

Минимальный пример:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.TIMEWEB_DB_HOST,
  database: process.env.TIMEWEB_DB_NAME,
  user: process.env.TIMEWEB_DB_USER,
  password: process.env.TIMEWEB_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

// Выполнить запрос от имени пользователя
async function queryAsUser(token: string, sql: string, params?: any[]) {
  const client = await pool.connect();
  try {
    await client.query('SELECT authenticate_with_token($1)', [token]);
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}
```

## Готово!

Теперь ваша БД готова к использованию. Основные отличия от Supabase:

1. ✅ Нет схемы `auth` - используйте `auth_sessions`
2. ✅ Нет `auth.uid()` - используйте `current_user_id()`
3. ✅ Нужно вызывать `authenticate_with_token()` перед запросами
4. ✅ RLS работает так же, как в Supabase

## Полезные команды

```sql
-- Посмотреть все таблицы
\dt

-- Посмотреть структуру таблицы
\d users

-- Посмотреть все сессии
SELECT * FROM auth_sessions;

-- Очистить истёкшие сессии
SELECT cleanup_expired_sessions();

-- Посмотреть текущего пользователя
SELECT current_user_id();

-- Временно отключить RLS (только для отладки!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Включить обратно
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```
