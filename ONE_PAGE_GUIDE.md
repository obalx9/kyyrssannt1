# 🚀 Деплой на Таймвеб - Одна страница

## ✅ ЧТО ГОТОВО

- SSL сертификат добавлен в `certs/root.crt`
- Код обновлен для работы с PostgreSQL через SSL
- Проект собирается без ошибок

---

## 🎯 ЧТО НУЖНО СДЕЛАТЬ (3 ШАГА)

### 1️⃣ Запушить код

```bash
git add .
git commit -m "Fix: Add SSL for Timeweb PostgreSQL"
git push
```

### 2️⃣ Исправить DATABASE_URL на Таймвеб

Панель Таймвеб → App Platform → keykurs.ru → Настройки → Переменные

**УБРАТЬ** `?sslmode=verify-full` из конца DATABASE_URL:

```
# БЫЛО (неправильно):
DATABASE_URL=postgresql://gen_user:FOXH),(g<:6DR!@a6e6285d9957acb308f354f9.twc1.net:5432/default_db?sslmode=verify-full

# ДОЛЖНО БЫТЬ (правильно):
DATABASE_URL=postgresql://gen_user:FOXH),(g<:6DR!@a6e6285d9957acb308f354f9.twc1.net:5432/default_db
```

### 3️⃣ Проверить после автодеплоя

Открыть в браузере:
- `https://keykurs.ru/health` → должно быть `{"status":"ok"}`
- `https://keykurs.ru/api/diagnostics` → нажать "Проверить подключение"

---

## 📋 МИГРАЦИИ (ПОСЛЕ УСПЕШНОГО ДЕПЛОЯ)

Панель Таймвеб → Базы данных → default_db → SQL редактор

Применить **по порядку**:
1. `timeweb-migrations/01_create_auth_system.sql`
2. `timeweb-migrations/02_create_platform_schema.sql`
3. `timeweb-migrations/03_setup_rls_policies.sql`
4. `timeweb-migrations/04_add_additional_features.sql`

Для каждого файла:
- Открыть на компьютере
- Скопировать весь текст
- Вставить в SQL редактор
- Нажать "Выполнить"

---

## 🎉 ГОТОВО

После миграций сайт `https://keykurs.ru` должен открываться с формой входа через Telegram.

---

## 🆘 ЕСЛИ НЕ РАБОТАЕТ

### Проблема: Сайт не открывается (502)

**Проверить:**
- Логи в панели App Platform
- Команда запуска должна быть `npm start`
- PORT=3000 в переменных окружения

### Проблема: БД не подключается

**Проверить:**
- DATABASE_URL правильный (без `?sslmode=verify-full`)
- Пароль правильный
- БД запущена в панели Таймвеб

### Проблема: SSL certificate not found

**Решение:**
```bash
git add certs/
git commit -m "Add SSL cert"
git push
```

---

## 📊 ЧТО ИЗМЕНИЛОСЬ В КОДЕ

### api/index.js (строки 8-9, 70-88)

**Добавлено:**
```javascript
import { readFileSync } from 'fs';

// ...

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

### Добавлены файлы:
- `certs/root.crt` - SSL сертификат
- `certs/README.md` - Описание
- Документация по деплою

---

## 📞 КОНТАКТЫ

Если после всех шагов не работает:
1. Откройте `/api/diagnostics` на сайте
2. Нажмите "Запустить полную проверку"
3. Сделайте скриншот и покажите мне

---

**Всё! Просто выполните 3 шага выше ↑**
