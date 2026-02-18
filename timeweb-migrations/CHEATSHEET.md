# Шпаргалка по Timeweb PostgreSQL

## 🚀 Быстрый старт

```bash
# 1. Применить миграции
cd timeweb-migrations && ./apply-all.sh

# 2. Создать тестовые данные
psql -h host -U user -d db -f test-setup.sql

# 3. Готово!
```

## 🔑 Основные команды SQL

### Создать пользователя
```sql
INSERT INTO users (telegram_id, first_name, last_name)
VALUES (123456789, 'Имя', 'Фамилия')
RETURNING id;
```

### Добавить роль
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid', 'super_admin'); -- или 'seller', 'student'
```

### Создать сессию (токен)
```sql
INSERT INTO auth_sessions (user_id, token, expires_at)
VALUES ('user-uuid', 'my-token-123', now() + interval '30 days')
RETURNING *;
```

### Аутентифицировать пользователя
```sql
SELECT authenticate_with_token('my-token-123');
SELECT current_user_id(); -- проверка
```

### Очистить старые сессии
```sql
SELECT cleanup_expired_sessions();
```

## 🔄 Замена Supabase → Timeweb

| Задача | Supabase | Timeweb |
|--------|----------|---------|
| Текущий пользователь | `auth.uid()` | `current_user_id()` |
| Вход | `supabase.auth.signIn()` | `INSERT auth_sessions` |
| Выход | `supabase.auth.signOut()` | `DELETE auth_sessions` |
| Запрос | `supabase.from('x').select()` | `pool.query('SELECT * FROM x')` |

## 💻 TypeScript код

### Подключение к БД
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.TIMEWEB_DB_HOST,
  database: process.env.TIMEWEB_DB_NAME,
  user: process.env.TIMEWEB_DB_USER,
  password: process.env.TIMEWEB_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});
```

### Запрос с аутентификацией
```typescript
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

### Создание пользователя
```typescript
async function getOrCreateUser(telegramId: number, userData: any) {
  const client = await pool.connect();
  try {
    // Проверить существует ли
    let result = await client.query(
      'SELECT id FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    // Создать нового
    result = await client.query(
      `INSERT INTO users (telegram_id, first_name, last_name)
       VALUES ($1, $2, $3) RETURNING id`,
      [telegramId, userData.firstName, userData.lastName]
    );

    const userId = result.rows[0].id;

    // Добавить роль
    await client.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [userId, 'student']
    );

    return userId;
  } finally {
    client.release();
  }
}
```

### Создание сессии
```typescript
import { randomBytes } from 'crypto';

async function createSession(userId: string, hours = 24) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  await pool.query(
    'INSERT INTO auth_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  return { token, expiresAt };
}
```

## 🌐 Express API

### Базовый сервер
```typescript
import express from 'express';

const app = express();
app.use(express.json());

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  req.token = token;
  next();
}

// Endpoint пример
app.get('/api/courses', requireAuth, async (req, res) => {
  try {
    const courses = await queryAsUser(
      req.token,
      'SELECT * FROM courses WHERE is_published = true'
    );
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.listen(3001);
```

## 🔍 Отладка

### Проверить RLS политики
```sql
-- Посмотреть политики
\dp table_name

-- Или
SELECT * FROM pg_policies WHERE tablename = 'table_name';
```

### Временно отключить RLS
```sql
-- ТОЛЬКО ДЛЯ ОТЛАДКИ!
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Тестируем...

-- ВКЛЮЧИТЬ ОБРАТНО!
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Посмотреть текущего пользователя
```sql
SELECT current_user_id();
SELECT current_user; -- системный пользователь PostgreSQL
```

### Проверить что сессия валидна
```sql
SELECT * FROM auth_sessions
WHERE token = 'your-token'
AND expires_at > now();
```

## 🛠️ Полезные команды psql

```bash
# Подключиться
psql -h host -U user -d database

# Внутри psql:
\dt              # список таблиц
\d table_name    # структура таблицы
\df              # список функций
\dp table_name   # RLS политики
\q               # выход
```

## ⚠️ Частые ошибки

### Ошибка: current_user_id() returns NULL
**Решение:** Вызвать `SELECT authenticate_with_token('token')` первым

### Ошибка: permission denied
**Решение:** Проверить что RLS политики настроены правильно

### Ошибка: too many connections
**Решение:** Использовать connection pool и всегда вызывать `client.release()`

### Ошибка: password authentication failed
**Решение:** Проверить переменные окружения в `.env`

## 📁 Структура файлов

```
project/
├── timeweb-migrations/
│   ├── 01_create_auth_system.sql      # Аутентификация
│   ├── 02_create_platform_schema.sql  # Основные таблицы
│   ├── 03_setup_rls_policies.sql      # RLS политики
│   ├── 04_add_additional_features.sql # Доп. возможности
│   ├── apply-all.sh                   # Применить всё
│   ├── test-setup.sql                 # Тестовые данные
│   ├── QUICK_START.md                 # Быстрый старт
│   └── ARCHITECTURE.md                # Архитектура
│
├── TIMEWEB_COMPLETE_GUIDE.md          # Полное руководство
├── TIMEWEB_INTEGRATION_GUIDE.md       # Интеграция с кодом
└── .env                               # Переменные окружения
```

## 🔐 Безопасность

### ✅ Правильно
- Всегда использовать параметризованные запросы
- Хранить токены в httpOnly cookies или localStorage
- Использовать HTTPS в production
- Регулярно очищать старые сессии
- Включать RLS на всех таблицах

### ❌ Неправильно
- Конкатенировать SQL: `query('SELECT * FROM users WHERE id = ' + userId)`
- Хранить токены в URL параметрах
- Отключать RLS в production
- Использовать слабые токены (короткие, предсказуемые)
- Не проверять истечение сессий

## 📊 Мониторинг

### Активные сессии
```sql
SELECT COUNT(*) as active_sessions
FROM auth_sessions
WHERE expires_at > now();
```

### Истёкшие сессии
```sql
SELECT COUNT(*) as expired_sessions
FROM auth_sessions
WHERE expires_at <= now();
```

### Пользователи по ролям
```sql
SELECT role, COUNT(*)
FROM user_roles
GROUP BY role;
```

### Количество курсов
```sql
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_published) as published
FROM courses;
```

## 🎯 Следующие шаги

1. ✅ Применить миграции
2. ✅ Создать первого пользователя
3. ✅ Настроить API сервер
4. ⏳ Интегрировать с frontend
5. ⏳ Добавить file storage
6. ⏳ Настроить production deploy

## 📚 Документация

- **Полное руководство:** [TIMEWEB_COMPLETE_GUIDE.md](../TIMEWEB_COMPLETE_GUIDE.md)
- **Интеграция:** [TIMEWEB_INTEGRATION_GUIDE.md](../TIMEWEB_INTEGRATION_GUIDE.md)
- **Архитектура:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Быстрый старт:** [QUICK_START.md](QUICK_START.md)
