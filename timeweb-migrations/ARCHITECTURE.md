# Архитектура адаптированной системы

## Обзор

```
┌─────────────────────────────────────────────────────────────┐
│                      Supabase (Было)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │───▶│   Supabase   │───▶│  PostgreSQL  │  │
│  │  React App   │    │     API      │    │   + auth.*   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                               │
│         │           ┌────────┴────────┐                     │
│         │           │                 │                      │
│         └──────▶  Storage      Edge Functions               │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                              ↓ Миграция

┌─────────────────────────────────────────────────────────────┐
│                   Timeweb PostgreSQL (Стало)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │───▶│   Node.js    │───▶│  PostgreSQL  │  │
│  │  React App   │    │  API Server  │    │  (Timeweb)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │            ┌───────┴────┐    │
│         │                    │            │ Custom     │    │
│         └────────────────────┴───────────▶│ Auth via   │    │
│                                            │ Sessions   │    │
│                                            └────────────┘    │
│                                                               │
│  Storage & Realtime: Нужно реализовать отдельно             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Ключевые изменения

### 1. Система аутентификации

#### Было (Supabase)
```typescript
// Встроенная аутентификация
const { user } = await supabase.auth.signIn({ email, password });
const { data } = await supabase.from('courses').select('*');
// RLS работает автоматически
```

#### Стало (Timeweb)
```typescript
// Кастомная система с токенами
const token = await createSession(userId);
localStorage.setItem('auth_token', token);

// Установка пользователя для каждого запроса
const client = await pool.connect();
await client.query('SELECT authenticate_with_token($1)', [token]);
const result = await client.query('SELECT * FROM courses');
client.release();
```

### 2. Схема базы данных

#### Было (Supabase)
```
Схемы:
├── auth (управляется Supabase)
│   ├── users
│   ├── sessions
│   └── refresh_tokens
│
└── public (ваши данные)
    ├── courses
    ├── enrollments
    └── ...

Функции:
├── auth.uid() → текущий пользователь
└── auth.jwt() → JWT токен
```

#### Стало (Timeweb)
```
Схемы:
└── public (все данные)
    ├── users (перенесено из auth.users)
    ├── auth_sessions (кастомная таблица)
    ├── courses
    ├── enrollments
    └── ...

Функции:
├── current_user_id() → текущий пользователь
├── authenticate_with_token(token) → установить пользователя
└── is_super_admin(user_id) → проверить роль
```

## Структура таблиц

### Основные таблицы

```sql
-- Пользователи (аналог auth.users)
users
├── id (uuid, PK)
├── telegram_id (bigint, unique)
├── telegram_username (text)
├── first_name (text)
├── last_name (text)
├── photo_url (text)
└── created_at (timestamptz)

-- Сессии (аналог auth.sessions)
auth_sessions
├── id (uuid, PK)
├── user_id (uuid, FK → users.id)
├── token (text, unique)
├── expires_at (timestamptz)
└── created_at (timestamptz)

-- Роли пользователей
user_roles
├── id (uuid, PK)
├── user_id (uuid, FK → users.id)
├── role (text: super_admin|seller|student)
└── created_at (timestamptz)
```

### Бизнес-таблицы

```sql
sellers
├── id (uuid, PK)
├── user_id (uuid, FK → users.id)
├── business_name (text)
├── description (text)
├── is_approved (boolean)
└── created_at (timestamptz)

courses
├── id (uuid, PK)
├── seller_id (uuid, FK → sellers.id)
├── title (text)
├── description (text)
├── thumbnail_url (text)
├── is_published (boolean)
├── display_settings (jsonb)
├── theme_config (jsonb)
├── watermark_text (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)

course_enrollments
├── id (uuid, PK)
├── course_id (uuid, FK → courses.id)
├── student_id (uuid, FK → users.id)
├── granted_by (uuid, FK → users.id)
├── enrolled_at (timestamptz)
└── expires_at (timestamptz)
```

## Поток аутентификации

### Supabase (было)

```
1. Frontend
   ↓ supabase.auth.signIn()
2. Supabase Auth
   ↓ создаёт JWT токен
3. Supabase API
   ↓ auth.uid() автоматически
4. PostgreSQL
   ↓ RLS применяется автоматически
5. Результат → Frontend
```

### Timeweb (стало)

```
1. Frontend
   ↓ POST /api/login
2. Node.js API
   ↓ проверяет credentials
   ↓ INSERT INTO auth_sessions
3. Frontend получает токен
   ↓ сохраняет в localStorage
4. Frontend
   ↓ GET /api/courses (Bearer token)
5. Node.js API
   ↓ SELECT authenticate_with_token(token)
   ↓ SELECT * FROM courses
6. PostgreSQL
   ↓ RLS применяется на основе current_user_id()
7. Результат → Frontend
```

## RLS (Row Level Security)

### Принцип работы

```sql
-- Политика (одинакова для Supabase и Timeweb)
CREATE POLICY "Sellers can view own courses"
  ON courses FOR SELECT
  USING (
    seller_id = get_seller_id(current_user_id())
    -- Было: seller_id = get_seller_id(auth.uid())
  );
```

### Как устанавливается current_user_id()

```typescript
// Каждое подключение должно вызвать:
await client.query(
  'SELECT authenticate_with_token($1)',
  [userToken]
);

// Эта функция делает:
// 1. Проверяет токен в auth_sessions
// 2. Если валидный, устанавливает:
//    SET LOCAL app.current_user_id = 'user-uuid'
// 3. current_user_id() читает эту переменную
```

## Сравнение функций

| Задача | Supabase | Timeweb PostgreSQL |
|--------|----------|-------------------|
| Получить текущего пользователя | `auth.uid()` | `current_user_id()` |
| Проверить JWT | `auth.jwt()` | Не доступно |
| Проверить email | `auth.email()` | Не доступно |
| Создать пользователя | `supabase.auth.signUp()` | `INSERT INTO users` |
| Войти | `supabase.auth.signIn()` | `INSERT INTO auth_sessions` |
| Выйти | `supabase.auth.signOut()` | `DELETE FROM auth_sessions` |
| Обновить токен | Автоматически | Вручную |

## Примеры миграции кода

### Пример 1: Получение курсов

**Было (Supabase):**
```typescript
const { data: courses } = await supabase
  .from('courses')
  .select('*')
  .eq('is_published', true);
```

**Стало (Timeweb):**
```typescript
const token = localStorage.getItem('auth_token');
const response = await fetch('/api/courses', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const courses = await response.json();

// На сервере:
const client = await pool.connect();
await client.query('SELECT authenticate_with_token($1)', [token]);
const result = await client.query(
  'SELECT * FROM courses WHERE is_published = true'
);
client.release();
```

### Пример 2: Создание курса

**Было (Supabase):**
```typescript
const { data: course } = await supabase
  .from('courses')
  .insert({
    seller_id: mySellerIdFromRelation,
    title,
    description
  })
  .select()
  .single();
```

**Стало (Timeweb):**
```typescript
const token = localStorage.getItem('auth_token');
const response = await fetch('/api/courses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ title, description })
});
const course = await response.json();

// На сервере:
const client = await pool.connect();
await client.query('SELECT authenticate_with_token($1)', [token]);
const result = await client.query(
  `INSERT INTO courses (seller_id, title, description)
   VALUES (
     (SELECT id FROM sellers WHERE user_id = current_user_id()),
     $1, $2
   )
   RETURNING *`,
  [title, description]
);
client.release();
```

## Что нужно реализовать отдельно

### 1. File Storage
Supabase Storage → нужна альтернатива:
- AWS S3
- Cloudflare R2
- Timeweb Object Storage (если есть)
- Локальная файловая система

### 2. Realtime
Supabase Realtime → нужна альтернатива:
- WebSockets (Socket.io)
- Server-Sent Events (SSE)
- Polling

### 3. Edge Functions
Supabase Edge Functions → обычный API сервер:
- Express.js
- Fastify
- Nest.js

## Диаграмма безопасности

```
┌─────────────────────────────────────────────────┐
│               Frontend (React)                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  localStorage: { auth_token: "xxx" }            │
│                                                  │
└────────────────┬────────────────────────────────┘
                 │ Bearer xxx
                 ↓
┌─────────────────────────────────────────────────┐
│              Node.js API Server                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Проверить токен ────────────────┐           │
│  2. Установить пользователя         │           │
│  3. Выполнить запрос                │           │
│                                      ↓           │
└──────────────────────────────────────┬──────────┘
                                       │
                                       ↓
┌─────────────────────────────────────────────────┐
│           PostgreSQL (Timeweb)                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  auth_sessions ←────┐                           │
│  ├─ token           │ Проверка                  │
│  ├─ user_id         │                           │
│  └─ expires_at      │                           │
│                     │                           │
│  Session variable:  │                           │
│  app.current_user_id = "uuid" ←─────┘          │
│                                                  │
│  RLS Policies:                                   │
│  ├─ Используют current_user_id()                │
│  ├─ Проверяют права доступа                     │
│  └─ Фильтруют результаты                        │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Производительность

### Connection Pooling

**Важно:** Используйте пул подключений для эффективности

```typescript
// Правильно
const pool = new Pool({ max: 20 });
const client = await pool.connect();
try {
  // работа с БД
} finally {
  client.release(); // вернуть в пул
}

// Неправильно
const client = new Client();
await client.connect();
// работа с БД
await client.end(); // каждый раз новое подключение!
```

### Кэширование сессий

Опционально: кэшируйте валидные сессии в Redis:

```typescript
// Проверка токена
const userId = await redis.get(`session:${token}`);
if (userId) {
  // Токен валиден, используем из кэша
  await client.query('SELECT set_session_user($1)', [userId]);
} else {
  // Токен не в кэше, проверяем в БД
  const userId = await authenticateWithToken(client, token);
  if (userId) {
    await redis.setex(`session:${token}`, 3600, userId);
  }
}
```

## Заключение

Основные отличия:
1. ✅ Аутентификация вручную через `auth_sessions`
2. ✅ Нужен промежуточный API сервер
3. ✅ RLS работает так же, но через `current_user_id()`
4. ✅ Storage, Realtime, Functions - нужны отдельные решения
5. ✅ Больше контроля, но больше ответственности

Преимущества:
- Полный контроль над логикой
- Независимость от Supabase
- Меньшая стоимость (только PostgreSQL)

Недостатки:
- Больше кода для поддержки
- Нужен собственный API сервер
- Нужны решения для Storage/Realtime
