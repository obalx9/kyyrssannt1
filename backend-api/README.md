# Backend API Server

Отдельный Node.js Express сервер для работы с PostgreSQL.

## Структура

```
backend-api/
├── index.js          # Основной файл API
├── package.json      # Зависимости
├── .env.example      # Пример переменных окружения
├── uploads/          # Папка для загруженных файлов
└── README.md         # Этот файл
```

## Установка

```bash
cd backend-api
npm install
```

## Конфигурация

1. Создать `.env`:
```bash
cp .env.example .env
```

2. Заполнить переменные:
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@a6e6285d9957acb308f354f9.twc1.net:5432/default_db?sslmode=require
JWT_SECRET=your_secret_key
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

## Запуск

### Локально (разработка)
```bash
cd backend-api
npm start
```

### На Timeweb Apps
1. Создать Apps → Backend → Node.js
2. Загрузить папку `backend-api/`
3. Добавить переменные `.env` в настройках Apps
4. Привязать домен

## API Endpoints

- `GET /health` - Проверка статуса
- `GET /api/db-check` - Проверка БД
- `GET /api/db-tables` - Список таблиц
- `POST /api/courses` - Создать курс
- `GET /api/courses/:id` - Получить курс
- `POST /api/telegram-auth` - Аутентификация Telegram

## Порты

- **Локально:** `http://localhost:3000`
- **Production:** Зависит от Timeweb (например, `https://api.yourdomain.com`)
