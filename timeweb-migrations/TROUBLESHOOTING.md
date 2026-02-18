# Решение проблем при миграции на Timeweb

## Ошибка: "violates foreign key constraint user_roles_user_id_fkey"

### Описание проблемы

```
ERROR: insert or update on table "user_roles" violates foreign key constraint "user_roles_user_id_fkey"
DETAIL: Key (user_id)=(xxx) is not present in table "users".
```

Эта ошибка возникает, когда вы пытаетесь добавить роль пользователю, который ещё не существует в таблице `users`.

### Причина

В PostgreSQL есть **foreign key constraints** (ограничения внешних ключей), которые гарантируют целостность данных:

```sql
-- Таблица user_roles требует чтобы user_id существовал в таблице users
CREATE TABLE user_roles (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE
);
```

Это означает что **сначала** должна быть запись в `users`, **затем** можно создавать запись в `user_roles`.

### Решение

Я уже исправил скрипт `test-setup.sql`. Теперь он:

1. ✅ Сначала удаляет старые тестовые данные (если есть)
2. ✅ Создаёт пользователя в таблице `users`
3. ✅ Только потом создаёт роль в таблице `user_roles`
4. ✅ Использует `ON CONFLICT` для безопасности

### Как применить исправление

#### Вариант 1: Применить заново весь test-setup.sql

```bash
cd timeweb-migrations

# Применить обновлённый скрипт
psql -h ваш-хост -U ваш-юзер -d ваша-бд -f test-setup.sql
```

#### Вариант 2: Очистить и применить заново

```bash
cd timeweb-migrations

# 1. Очистить тестовые данные
psql -h ваш-хост -U ваш-юзер -d ваша-бд << EOF
DELETE FROM auth_sessions WHERE user_id IN (
  SELECT id FROM users WHERE telegram_id IN (999999999, 888888888, 777777777)
);
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM users WHERE telegram_id IN (999999999, 888888888, 777777777)
);
DELETE FROM sellers WHERE user_id IN (
  SELECT id FROM users WHERE telegram_id IN (999999999, 888888888, 777777777)
);
DELETE FROM users WHERE telegram_id IN (999999999, 888888888, 777777777);
EOF

# 2. Применить исправленный скрипт
psql -h ваш-хост -U ваш-юзер -d ваша-бд -f test-setup.sql
```

#### Вариант 3: Создать пользователя вручную (для понимания)

```sql
-- Шаг 1: Создать пользователя
INSERT INTO users (telegram_id, first_name, last_name)
VALUES (123456789, 'Иван', 'Иванов')
RETURNING id;
-- Скопируйте UUID, который вернётся

-- Шаг 2: Добавить роль (замените UUID на тот что получили)
INSERT INTO user_roles (user_id, role)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'super_admin');

-- Шаг 3: Создать сессию
INSERT INTO auth_sessions (user_id, token, expires_at)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'my-test-token', now() + interval '1 day');
```

---

## Другие частые ошибки

### Ошибка: "relation users does not exist"

**Причина:** Миграции не были применены или применены не в том порядке.

**Решение:**
```bash
cd timeweb-migrations
./apply-all.sh
```

### Ошибка: "current transaction is aborted"

**Причина:** Предыдущая команда в транзакции завершилась с ошибкой.

**Решение:** Закройте текущее подключение и откройте новое:
```sql
\q  -- выйти из psql
psql -h ... -U ... -d ...  -- подключиться заново
```

### Ошибка: "password authentication failed"

**Причина:** Неверные данные подключения в `.env` файле.

**Решение:**
1. Проверьте файл `.env`:
```bash
cat ../.env
```

2. Убедитесь что переменные правильные:
```env
TIMEWEB_DB_HOST=c12345.hosted-by-timeweb.com
TIMEWEB_DB_PORT=5432
TIMEWEB_DB_NAME=db123456
TIMEWEB_DB_USER=user123456
TIMEWEB_DB_PASSWORD=ваш_настоящий_пароль
```

3. Протестируйте подключение:
```bash
psql -h $TIMEWEB_DB_HOST -U $TIMEWEB_DB_USER -d $TIMEWEB_DB_NAME -c "SELECT version();"
```

---

## Проверка что всё работает

После исправления ошибки, проверьте что всё работает:

```bash
# Применить test-setup.sql
psql -h ваш-хост -U ваш-юзер -d ваша-бд -f test-setup.sql

# Скопируйте токен из вывода, например:
# Token: test-admin-token-abc123xyz

# Протестируйте аутентификацию
psql -h ваш-хост -U ваш-юзер -d ваша-бд << EOF
SELECT authenticate_with_token('test-admin-token-abc123xyz');
SELECT current_user_id();
SELECT * FROM users;
EOF
```

Если всё работает, вы увидите:
- UUID пользователя от `authenticate_with_token()`
- Тот же UUID от `current_user_id()`
- Список пользователей (должно быть 3)

---

## Полная переустановка (если всё сломалось)

Если нужно начать с чистого листа:

```bash
cd timeweb-migrations

# 1. Удалить все таблицы
psql -h ваш-хост -U ваш-юзер -d ваша-бд << EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
EOF

# 2. Применить все миграции заново
./apply-all.sh

# 3. Создать тестовые данные
psql -h ваш-хост -U ваш-юзер -d ваша-бд -f test-setup.sql
```

⚠️ **ВНИМАНИЕ:** Эта команда удалит ВСЕ данные из базы! Используйте только для тестовых баз!

---

## Нужна дополнительная помощь?

См. также:
- **[CHEATSHEET.md](CHEATSHEET.md)** - Быстрые команды
- **[QUICK_START.md](QUICK_START.md)** - Пошаговая инструкция
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Как всё устроено
