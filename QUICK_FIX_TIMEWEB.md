# БЫСТРОЕ ИСПРАВЛЕНИЕ - Подключение к БД Таймвеб

## Что было сделано

✅ Добавлен SSL сертификат в папку `certs/root.crt`
✅ Обновлен код подключения к БД для использования сертификата
✅ Создана документация по настройке

## Что нужно сделать СЕЙЧАС

### Шаг 1: Закоммитить изменения

```bash
git add .
git commit -m "Add SSL certificate for Timeweb PostgreSQL connection"
git push
```

### Шаг 2: Настроить переменные в App Platform

Зайдите в панель Таймвеб → App Platform → Ваше приложение → Настройки

**Убедитесь, что DATABASE_URL БЕЗ параметра sslmode:**

```
DATABASE_URL=postgresql://gen_user:FOXH),(g<:6DR!@a6e6285d9957acb308f354f9.twc1.net:5432/default_db
```

**НЕ ДОЛЖНО БЫТЬ** `?sslmode=verify-full` в конце!

### Шаг 3: Проверить команду запуска

В настройках App Platform должно быть:

**Команда сборки:**
```bash
npm install && npm run build
```

**Команда запуска (Start command):**
```bash
npm start
```

### Шаг 4: Передеплоить

После пуша в репозиторий App Platform автоматически задеплоит новую версию.

### Шаг 5: Проверить работу

После деплоя откройте:

1. https://keykurs.ru/health - должен вернуть `{"status":"ok",...}`
2. https://keykurs.ru/api/diagnostics - интерактивная страница диагностики
3. https://keykurs.ru/api/db-check - проверка подключения к БД

## Что изменилось в коде

### api/index.js

```javascript
// БЫЛО:
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

// СТАЛО:
let sslConfig = false;
if (process.env.NODE_ENV === 'production') {
  try {
    const certPath = join(__dirname, '..', 'certs', 'root.crt');
    const ca = readFileSync(certPath, 'utf-8');
    sslConfig = {
      rejectUnauthorized: true,
      ca: ca
    };
    console.log('✅ SSL certificate loaded successfully');
  } catch (error) {
    console.warn('⚠️ SSL certificate not found, using sslmode=require');
    sslConfig = { rejectUnauthorized: false };
  }
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});
```

## Проверка логов

После деплоя в логах App Platform вы должны увидеть:

```
✅ SSL certificate loaded successfully
✅ Database connected successfully
🚀 Server running on port 3000
📊 Health check: http://localhost:3000/health
🌍 Environment: production
```

## Если не работает

### Проблема: "SSL certificate not found"

**Причина**: Папка `certs/` не попала в деплой

**Решение**:
1. Убедитесь, что папка `certs/` закоммичена в git
2. Проверьте, что `.gitignore` не исключает папку `certs/`
3. Сделайте push и передеплойте

### Проблема: "Connection refused"

**Причина**: DATABASE_URL неправильный

**Решение**:
1. Проверьте правильность пароля
2. Проверьте доступность хоста `a6e6285d9957acb308f354f9.twc1.net`
3. Проверьте, что порт 5432 доступен

### Проблема: "no pg_hba.conf entry"

**Причина**: Неправильный пароль или база недоступна

**Решение**:
1. Зайдите в панель Таймвеб → Базы данных
2. Проверьте статус БД (должна быть запущена)
3. Проверьте пароль в разделе "Подключение"

## Следующий шаг - Миграции

После успешного подключения к БД нужно применить миграции:

1. Откройте панель Таймвеб → Базы данных → Ваша БД
2. Нажмите "SQL редактор"
3. Примените файлы из папки `timeweb-migrations/` по порядку:
   - `01_create_auth_system.sql`
   - `02_create_platform_schema.sql`
   - `03_setup_rls_policies.sql`
   - `04_add_additional_features.sql`

После этого сайт будет полностью работоспособен!

---

**ВАЖНО**: Эти изменения уже сделаны локально. Просто закоммитьте и запушьте!
