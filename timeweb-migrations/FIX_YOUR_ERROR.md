# Как исправить вашу ошибку

## Что произошло?

Вы получили ошибку:
```
ERROR: insert or update on table "user_roles" violates foreign key constraint "user_roles_user_id_fkey"
DETAIL: Key (user_id)=(4860f71c-ad1d-49d3-af82-d769220e9135) is not present in table "users".
```

## Почему это произошло?

Скрипт `test-setup.sql` пытался создать роль для пользователя, которого не было в таблице `users`.

## Решение за 2 команды

### Команда 1: Очистить сломанные данные

```bash
cd timeweb-migrations

psql -h ваш-хост -U ваш-юзер -d ваша-бд << 'EOF'
-- Удалить тестовые данные если они есть
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
```

### Команда 2: Применить исправленный скрипт

```bash
psql -h ваш-хост -U ваш-юзер -d ваша-бд -f test-setup.sql
```

Готово! Теперь должно работать.

## Что было исправлено?

В файле `test-setup.sql`:

1. ✅ Добавлена очистка старых данных перед созданием новых
2. ✅ Добавлен `ON CONFLICT DO NOTHING` для безопасного создания
3. ✅ Добавлены проверки существования перед добавлением связанных записей

## Проверка что всё работает

После применения скрипта вы должны увидеть:

```
✓ Test admin created!
User ID: <uuid>
Token: test-admin-token-<random>

✓ Test seller created!
User ID: <uuid>
Seller ID: <uuid>
Token: test-seller-token-<random>

✓ Test student created!
User ID: <uuid>
Token: test-student-token-<random>

📊 Database Statistics:
  Tables created: 16+
  Users: 3
  Roles: 3
  Sellers: 1
  Active sessions: 3

✅ Setup complete! You can now test the system.
```

Скопируйте один из токенов и протестируйте:

```bash
psql -h ваш-хост -U ваш-юзер -d ваша-бд << EOF
SELECT authenticate_with_token('test-admin-token-xxx');
SELECT current_user_id();
SELECT * FROM users;
EOF
```

## Всё ещё не работает?

См. полный гайд по troubleshooting: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
