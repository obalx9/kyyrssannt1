# 📌 Быстрая справка: Backend API на Timeweb

## ⚡ TL;DR (Самое важное)

**Структура проекта:**
- `/backend-api` ← это папка деплоится на Timeweb Cloud Apps
- `/src` ← это фронтенд (отдельный деплой)

**Быстро скопируйте в Timeweb:**

| Поле | Значение |
|------|----------|
| Окружение | Node.js 24 |
| Фреймворк | Express |
| Команда сборки | `npm install` |
| Команда запуска | `pm2 start --no-daemon index.js` |
| Путь проверки | `/health` |

**Переменные (5 штук):**
1. `DATABASE_URL` = строка из Timeweb БД
2. `JWT_SECRET` = генерируемое значение 32+ символа
3. `NODE_ENV` = `production`
4. `PORT` = `3000`
5. `ALLOWED_ORIGINS` = домены вашего фронтенда

---

## 📝 Пошагово за 5 минут

### 1. Подготовка DATABASE_URL

```bash
# Идите в Timeweb → Облачные БД → PostgreSQL → ваша база
# Скопируйте Connection String
# Вставьте в переменную DATABASE_URL

Пример:
postgresql://user:password@pg.timeweb.ru:5432/dbname
```

### 2. Генерируем JWT_SECRET

**Вариант 1 (Linux/Mac):**
```bash
openssl rand -hex 32
# Скопируйте результат в JWT_SECRET
```

**Вариант 2 (Windows):**
```powershell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```

**Вариант 3 (онлайн):**
Просто откройте https://www.random.org/strings/ и создайте 64-символьную строку

### 3. Заходим в Timeweb Cloud Apps

```
https://timeweb.cloud/
↓
Облачные приложения → Создать приложение
```

### 4. Заполняем форму

- **Окружение:** Node.js
- **Фреймворк:** Express
- **Версия:** 24
- **GitHub:** obalx9/kyyrssannt
- **Ветка:** main

### 5. Команды

**Сборка:**
```
npm install
```

**Запуск:**
```
pm2 start --no-daemon index.js
```

**Проверка здоровья:**
```
/health
```

### 6. Переменные окружения (нажимаем [+] 5 раз)

```
DATABASE_URL    = postgresql://...      (из Timeweb БД)
JWT_SECRET      = a3f8c9e2d1b4f7a5...   (сгенерировано)
NODE_ENV        = production
PORT            = 3000
ALLOWED_ORIGINS = https://your-site.com (ваш фронт домен)
```

### 7. Развернуть!

Нажимаем большую кнопку "Развернуть" → Ждём 2-5 минут → Готово!

---

## ✅ Проверка после деплоя

```bash
# Здоровье сервера (должно быть 200 OK)
curl https://your-backend.timeweb.app/health

# Диагностика БД (открыть в браузере красивая страница)
https://your-backend.timeweb.app/api/diagnostics

# Проверка переменных
curl https://your-backend.timeweb.app/api/env-check

# Список таблиц БД
curl https://your-backend.timeweb.app/api/db-tables
```

---

## 🔑 Переменные: Что где взять

| Переменная | Где взять | Пример |
|-----------|-----------|---------|
| DATABASE_URL | Timeweb → БД → Connection String | `postgresql://user:pass@pg.timeweb.ru:5432/db` |
| JWT_SECRET | Генерируйте сами (`openssl rand -hex 32`) | `a3f8c9e2d1b4f7a5c8e9d2b3f4a5c6e7` |
| NODE_ENV | Пишите "production" | `production` |
| PORT | Пишите "3000" | `3000` |
| ALLOWED_ORIGINS | Домены вашего фронтенда | `https://kursat.com` |

---

## 🛠️ API Endpoints

### Без аутентификации:
- `GET /health` → проверка живо ли приложение
- `GET /api/diagnostics` → красивая страница с диагностикой
- `GET /api/env-check` → проверка переменных
- `GET /api/db-check` → проверка БД
- `GET /api/db-tables` → список таблиц

### С JWT токеном (заголовок: `Authorization: Bearer TOKEN`):
- `POST /api/telegram-auth` → вход через Telegram
- `GET /api/user` → профиль
- `GET /api/courses` → список курсов
- `POST /api/courses` → создать курс
- `POST /api/sellers` → зарегистрироваться продавцом
- И еще 20+ эндпоинтов...

---

## ⚠️ Частые ошибки

| Ошибка | Решение |
|-------|---------|
| `Cannot connect to database` | Проверьте DATABASE_URL правильный |
| `CORS error` | Добавьте домен фронтенда в ALLOWED_ORIGINS |
| `Port already in use` | PORT не тот, используйте 3000 |
| `Application keeps restarting` | Проверьте логи на ошибки |
| `502 Bad Gateway` | Дождитесь пока приложение полностью стартует |

---

## 🔗 Связь между фронтом и бэком

```
ФРОНТЕНД (React, Vite)
├─ Деплоится на: https://my-app.timeweb.app
├─ В .env: VITE_API_URL=https://backend-api.timeweb.app
└─ Запросы идут к: https://backend-api.timeweb.app/api/...

BACKEND (Express, Node.js)
├─ Деплоится на: https://backend-api.timeweb.app
├─ Слушает запросы с фронта
└─ ALLOWED_ORIGINS должен содержать https://my-app.timeweb.app
```

---

## 📱 Интеграция с фронтенд-приложением

Если у вас отдельный фронтенд проект на Timeweb:

```javascript
// На фронтенде (.env)
VITE_API_URL=https://backend-api.timeweb.app

// На фронтенде (код)
const response = await fetch(
  `${import.meta.env.VITE_API_URL}/api/courses`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**На бэкенде (.env переменные):**
```
ALLOWED_ORIGINS=https://my-app.timeweb.app,http://localhost:5173
```

---

## 🚀 После успешного деплоя

1. Бэк работает → все green ✅
2. Фронт может запрашивать данные → CORS настроен ✅
3. БД подключена → запросы идут → данные сохраняются ✅
4. Telegram авторизация работает → JWT токены выдаются ✅

Остальное следует из этого! 🎉

---

## 📞 Что делать если не работает

**Шаг 1: Проверить диагностику**
```
https://your-backend.timeweb.app/api/diagnostics
```
Откройте в браузере - красивая страница покажет что не так

**Шаг 2: Проверить логи**
```
Timeweb → Ваше приложение → Логи → Скопировать всё
```

**Шаг 3: Проверить переменные**
```
https://your-backend.timeweb.app/api/env-check
```

**Шаг 4: Если всё ещё не работает**
- Проверьте DATABASE_URL (он точно правильный?)
- Проверьте JWT_SECRET (он уникален?)
- Проверьте ALLOWED_ORIGINS (содержит ли домен фронта?)

---

## 💾 Файлы проекта

```
backend-api/
├── index.js               ← Главное приложение
├── package.json          ← Зависимости
├── package-lock.json     ← Версии
├── .env.example          ← Шаблон переменных
└── README.md             ← Документация
```

---

## 🔄 Как обновить API на Timeweb

1. Делаете изменения в `/backend-api`
2. Коммитите в ветку `main`
3. Пушите на GitHub
4. Timeweb автоматически переделоит! (максимум 2 минуты)

Всё! Не нужно ничего вручную!

---

## 📚 Дополнительно

**Структура приложения:**
- Фронтенд + Backend в одном репо
- Backend деплоится отдельным приложением на Timeweb
- Фронтенд - отдельное приложение (если есть)
- Общаются через HTTP API + CORS

**Безопасность:**
- JWT токены на 7 дней
- Пароли хешируются
- CORS защита
- RLS на уровне БД

**Производительность:**
- PM2 управляет процессом
- Автоматический рестарт если упадёт
- Логирование ошибок
- Мониторинг здоровья

---

Готово! У вас есть всё что нужно! 🚀
