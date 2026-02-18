# Деплой Backend API на Timeweb Cloud Apps

## Готовые параметры для заполнения

### Окружение
- **Node.js** (уже выбрано)
- **Фреймворк**: Express (уже выбрано)
- **Версия окружения**: 24

### Команда сборки
```bash
npm install
```

### Зависимости
```
npm install
```

### Команда запуска
```bash
node index.js
```

### Путь проверки состояния
```
/health
```

### Переменные окружения (добавить все)

| Переменная | Значение | Описание |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Строка подключения к БД PostgreSQL на Timeweb |
| `JWT_SECRET` | `генерировать-уникальное-значение` | Секретный ключ для подписи JWT токенов |
| `NODE_ENV` | `production` | Окружение приложения |
| `PORT` | `3000` | Порт приложения |
| `ALLOWED_ORIGINS` | `https://ваш-домен.com` | Домены для CORS (разделить запятой если много) |

### Ветка
```
main
```

---

## Инструкция по настройке переменных окружения

### 1. DATABASE_URL
Получите из панели Timeweb в разделе "Базы данных" → ваша БД PostgreSQL:

Формат:
```
postgresql://пользователь:пароль@хост:5432/база_данных
```

Пример:
```
postgresql://postgres:password123@pg.timeweb.ru:5432/my_database
```

### 2. JWT_SECRET
Сгенерируйте криптостойкий секрет:

**На Linux/Mac:**
```bash
openssl rand -hex 32
```

**На Windows PowerShell:**
```powershell
[System.Convert]::ToBase64String((Get-Random -Count 32 -InputObject (0..255)))
```

Пример (32 символа):
```
a3f8c9e2d1b4f7a5c8e9d2b3f4a5c6e7
```

### 3. ALLOWED_ORIGINS
Добавьте все домены, с которых будет работать фронтенд:

Для одного домена:
```
https://kursat.com
```

Для нескольких доменов:
```
https://kursat.com,https://app.kursat.com,http://localhost:5173
```

---

## Шаги деплоя

### 1. Подготовка
- Убедитесь, что папка `backend-api` находится в корне репозитория
- В этой папке должны быть `package.json`, `index.js` и остальные файлы

### 2. В панели Timeweb Cloud Apps
1. Создайте новое приложение → Node.js
2. Подключите ваш GitHub репозиторий
3. Выберите ветку `main`
4. Заполните поля как указано выше
5. Добавьте переменные окружения
6. Нажмите "Развернуть"

### 3. После успешного деплоя
1. Проверьте доступность API: `https://ваш-api-url.timeweb.app/health`
2. Проверьте диагностику БД: `https://ваш-api-url.timeweb.app/api/diagnostics`
3. Проверьте конфигурацию: `https://ваш-api-url.timeweb.app/api/env-check`

---

## Что делает API

### Основные эндпоинты

**Публичные:**
- `GET /health` - проверка здоровья сервера
- `GET /api/diagnostics` - полная диагностика (HTML страница)
- `GET /api/env-check` - проверка переменных окружения
- `GET /api/db-check` - проверка БД
- `GET /api/db-tables` - список таблиц БД

**Требуют аутентификацию (Authorization: Bearer JWT_TOKEN):**
- `POST /api/telegram-auth` - аутентификация через Telegram
- `GET /api/user` - получить профиль текущего пользователя
- `GET /api/courses` - получить список курсов
- `POST /api/courses` - создать новый курс
- `POST /api/courses/:id/posts` - добавить пост в курс
- `POST /api/sellers` - зарегистрироваться как продавец
- `POST /api/courses/:id/enroll` - записать студента на курс

**Webhook:**
- `POST /api/telegram/webhook/:secret` - прием постов от Telegram бота

---

## Важно!

### Структура проекта в репозитории
```
project/
├── backend-api/          ← это папка деплоится на Cloud Apps
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   └── README.md
├── src/                  ← фронтенд (деплоится отдельно)
├── public/
├── index.html
└── ...
```

### Если у вас уже есть фронтенд на Timeweb
- Фронтенд деплоится отдельным приложением (Node.js, Vite build)
- Backend API деплоится как второе приложение
- Они общаются через API + CORS
- В фронтенде настройте `ALLOWED_ORIGINS` на URL бэкенда

---

## Проверка после деплоя

```bash
# Проверить здоровье сервера
curl https://ваш-api-url.timeweb.app/health

# Проверить переменные окружения
curl https://ваш-api-url.timeweb.app/api/env-check

# Проверить подключение к БД
curl https://ваш-api-url.timeweb.app/api/db-check

# Посмотреть структуру таблиц
curl https://ваш-api-url.timeweb.app/api/db-tables
```

---

## Поддержка и отладка

Если возникнут проблемы:

1. **Проверьте логи** в панели Cloud Apps
2. **Откройте диагностику**: `https://ваш-api-url.timeweb.app/api/diagnostics`
3. **Проверьте переменные окружения** в настройках приложения
4. **Убедитесь, что БД доступна** с сервера

---

## Примечания

- Команда запуска использует PM2 в режиме `--no-daemon` (нужно для контейнеров)
- Приложение автоматически перезагружается при обновлениях в `main` ветке
- Логи доступны в панели Timeweb Cloud Apps
- Max memory по умолчанию - смотрите настройки вашего тарифа
