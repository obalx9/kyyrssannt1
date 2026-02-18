# Миграции для Timeweb PostgreSQL

Полный набор SQL миграций для переноса Supabase проекта на обычный PostgreSQL в Timeweb.

## 🎯 Что это?

Это адаптированная версия вашей базы данных, которая работает **без Supabase** - только на чистом PostgreSQL.

### Основные отличия

| Supabase | Timeweb PostgreSQL |
|----------|-------------------|
| Схема `auth.users` | Таблица `users` |
| Функция `auth.uid()` | Функция `current_user_id()` |
| Встроенная аутентификация | Таблица `auth_sessions` |
| Edge Functions | Обычный API сервер |
| Storage API | Отдельное хранилище |
| Realtime | WebSockets/SSE |

## 📁 Файлы миграций

Применяйте в строгом порядке:

1. **01_create_auth_system.sql** - Система аутентификации
   - Таблица `auth_sessions`
   - Функции `current_user_id()`, `authenticate_with_token()`

2. **02_create_platform_schema.sql** - Основная схема
   - Таблицы: `users`, `sellers`, `courses`, `enrollments` и т.д.
   - Вспомогательные функции

3. **03_setup_rls_policies.sql** - Row Level Security
   - Политики безопасности для всех таблиц

4. **04_add_additional_features.sql** - Дополнительно
   - Telegram боты, посты, темы, закреплённые посты

## 🚀 Быстрый старт

### Шаг 1: Настройте переменные окружения

Добавьте в `.env` (на уровень выше этой папки):

```env
TIMEWEB_DB_HOST=your-host.timeweb.cloud
TIMEWEB_DB_PORT=5432
TIMEWEB_DB_NAME=your_database
TIMEWEB_DB_USER=your_username
TIMEWEB_DB_PASSWORD=your_password
```

### Шаг 2: Примените миграции

```bash
./apply-all.sh
```

Или вручную:

```bash
psql -h host -U user -d db -f 01_create_auth_system.sql
psql -h host -U user -d db -f 02_create_platform_schema.sql
psql -h host -U user -d db -f 03_setup_rls_policies.sql
psql -h host -U user -d db -f 04_add_additional_features.sql
```

### Шаг 3: Создайте тестовые данные

```bash
psql -h host -U user -d db -f test-setup.sql
```

### Шаг 4: Проверьте работу

```sql
-- Подключитесь к БД
psql -h your-host -U your-user -d your-db

-- Аутентифицируйтесь (используйте токен из test-setup.sql)
SELECT authenticate_with_token('test-admin-token-xxx');

-- Проверьте текущего пользователя
SELECT current_user_id();

-- Должен вернуть UUID администратора
```

## 📚 Документация

### Основные руководства

- **[QUICK_START.md](QUICK_START.md)** - Быстрое начало работы
- **[CHEATSHEET.md](CHEATSHEET.md)** - Шпаргалка с командами
- **[CODE_EXAMPLES.md](CODE_EXAMPLES.md)** - Примеры кода
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Архитектура системы

### Полные гайды

- **[TIMEWEB_COMPLETE_GUIDE.md](../TIMEWEB_COMPLETE_GUIDE.md)** - Полное руководство
- **[TIMEWEB_INTEGRATION_GUIDE.md](../TIMEWEB_INTEGRATION_GUIDE.md)** - Интеграция с приложением

## 🔧 Что входит в миграции?

### Таблицы пользователей
- `users` - Все пользователи платформы
- `user_roles` - Роли (super_admin, seller, student)
- `auth_sessions` - Активные сессии

### Таблицы продавцов
- `sellers` - Профили продавцов
- `telegram_bots` - Конфигурация Telegram ботов

### Таблицы курсов
- `courses` - Каталог курсов
- `course_modules` - Модули/разделы
- `course_lessons` - Уроки
- `lesson_content` - Контент уроков

### Таблицы студентов
- `course_enrollments` - Доступ к курсам
- `pending_enrollments` - Ожидающие подтверждения
- `lesson_progress` - Прогресс обучения

### Таблицы контента
- `course_posts` - Посты в курсах
- `course_post_media` - Медиа файлы
- `student_pinned_posts` - Закреплённые посты
- `telegram_import_sessions` - Импорт из Telegram

### Функции безопасности
- `current_user_id()` - Получить текущего пользователя
- `authenticate_with_token()` - Аутентифицировать по токену
- `is_super_admin()` - Проверить роль админа
- `is_seller()` - Проверить роль продавца
- `get_seller_id()` - Получить ID продавца

## 🔐 Безопасность

Все таблицы защищены Row Level Security (RLS):

- ✅ Пользователи видят только свои данные
- ✅ Продавцы управляют только своими курсами
- ✅ Студенты видят только зачисленные курсы
- ✅ Админы имеют полный доступ

## 💡 Примеры использования

### SQL

```sql
-- Аутентификация
SELECT authenticate_with_token('your-token');

-- Создать курс (от имени продавца)
INSERT INTO courses (seller_id, title, description)
VALUES (
  (SELECT id FROM sellers WHERE user_id = current_user_id()),
  'My Course',
  'Description'
);

-- Просмотр своих курсов
SELECT * FROM courses;
-- RLS автоматически фильтрует только ваши курсы
```

### TypeScript

```typescript
import { pool } from './db';

// Запрос с аутентификацией
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

// Использование
const courses = await queryAsUser(
  userToken,
  'SELECT * FROM courses WHERE is_published = true'
);
```

## ⚠️ Важные замечания

### 1. Всегда устанавливайте пользователя

```sql
-- ВАЖНО: Вызывайте ДО любого запроса
SELECT authenticate_with_token('your-token');

-- Теперь можно делать запросы
SELECT * FROM courses;
```

### 2. Используйте connection pooling

```typescript
// Правильно ✅
const client = await pool.connect();
try {
  // работа
} finally {
  client.release(); // ОБЯЗАТЕЛЬНО!
}

// Неправильно ❌
const client = new Client();
await client.connect();
// работа
await client.end(); // Каждый раз новое подключение!
```

### 3. Не отключайте RLS в production

```sql
-- ТОЛЬКО ДЛЯ ОТЛАДКИ
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- ОБЯЗАТЕЛЬНО ВКЛЮЧИТЕ ОБРАТНО
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
```

## 🐛 Решение проблем

### Ошибка: "permission denied to create role"

**Решение:** Обратитесь в поддержку Timeweb для создания ролей.

Или измените `TO authenticated` на `TO your_db_user` в политиках.

### Ошибка: "current_user_id() returns NULL"

**Решение:** Вызовите `authenticate_with_token()` перед запросами.

### Ошибка: "too many connections"

**Решение:** Используйте connection pool и всегда вызывайте `client.release()`.

### Ошибка: RLS блокирует запросы

**Решение:** Убедитесь что:
1. Вызван `authenticate_with_token()`
2. Токен валиден и не истёк
3. У пользователя есть нужная роль

## 🧪 Тестирование

После применения миграций:

```bash
# Создать тестовые данные
psql -h host -U user -d db -f test-setup.sql

# Скопируйте токен из вывода и используйте:
psql -h host -U user -d db

# В psql:
SELECT authenticate_with_token('test-admin-token-xxx');
SELECT current_user_id();
SELECT * FROM users;
```

## 📊 Статистика БД

Проверить что всё создалось:

```sql
-- Количество таблиц
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Количество функций
SELECT COUNT(*) FROM pg_proc
WHERE pronamespace = 'public'::regnamespace;

-- Количество RLS политик
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
GROUP BY tablename;
```

## 🔄 Следующие шаги

1. ✅ Применить миграции
2. ✅ Создать первого пользователя
3. ⏳ Настроить API сервер (см. [CODE_EXAMPLES.md](CODE_EXAMPLES.md))
4. ⏳ Интегрировать с frontend
5. ⏳ Настроить file storage
6. ⏳ Добавить мониторинг
7. ⏳ Настроить автоматические бэкапы

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте [CHEATSHEET.md](CHEATSHEET.md) для быстрых решений
2. Изучите [ARCHITECTURE.md](ARCHITECTURE.md) для понимания системы
3. Посмотрите [CODE_EXAMPLES.md](CODE_EXAMPLES.md) для примеров
4. Прочитайте полное руководство [TIMEWEB_COMPLETE_GUIDE.md](../TIMEWEB_COMPLETE_GUIDE.md)

## 📝 Лицензия

Эти миграции созданы для вашего проекта и могут свободно использоваться и модифицироваться.

---

**Готовы начать?** → Запустите `./apply-all.sh` 🚀
