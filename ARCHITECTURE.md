# Архитектура проекта Kursat

## Обзор

Kursat - это образовательная платформа для продажи онлайн курсов с авторизацией через Telegram. Проект использует следующий стек:

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend API**: Node.js + Express
- **Database**: PostgreSQL (Timeweb)
- **Auth**: JWT токены через Telegram Login Widget

## Структура проекта

```
kursat/
├── src/                      # Frontend React приложение
│   ├── components/          # React компоненты
│   ├── contexts/            # React контексты (Auth, Theme, Language)
│   ├── pages/               # Страницы приложения
│   ├── lib/                 # Утилиты и клиенты
│   │   ├── api.ts          # API клиент для работы с Backend
│   │   └── supabase.ts     # Типы (больше не используется для запросов)
│   ├── locales/            # Переводы (русский/английский)
│   └── utils/              # Вспомогательные функции
│
├── server/                  # Backend API сервер
│   ├── index.js            # Главный файл Express сервера
│   ├── package.json        # Зависимости сервера
│   ├── .env                # Конфигурация (не коммитить!)
│   └── README.md           # Документация API
│
├── timeweb-migrations/     # SQL миграции для PostgreSQL
│   ├── 01_create_auth_system.sql
│   ├── 02_create_platform_schema.sql
│   ├── 03_setup_rls_policies.sql
│   └── ...
│
├── dist/                    # Собранный frontend (после npm run build)
└── public/                  # Статические файлы
```

## Архитектура системы

```
┌─────────────────┐
│   Пользователь  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────┐
│         Nginx (Reverse Proxy)       │
│  - keykurs.ru                       │
│  - Статические файлы (/)            │
│  - Проксирование API (/api/*)       │
└──────────┬──────────────────────────┘
           │
     ┌─────┴──────┐
     │            │
     ▼            ▼
┌─────────┐  ┌────────────────────┐
│ React   │  │  Node.js Express   │
│ SPA     │  │  API Server        │
│ (dist/) │  │  (localhost:3000)  │
└─────────┘  └──────────┬─────────┘
                        │
                        │ pg (PostgreSQL driver)
                        │
                        ▼
             ┌────────────────────┐
             │  Timeweb PostgreSQL│
             │  b6440478...       │
             │  Port: 5432        │
             └────────────────────┘
```

## Поток аутентификации

```
┌──────────┐                    ┌──────────────┐
│ Browser  │                    │  Telegram    │
│          │                    │  Login Widget│
└─────┬────┘                    └──────┬───────┘
      │                                │
      │ 1. Load Telegram Widget        │
      ├───────────────────────────────►│
      │                                │
      │ 2. User clicks "Login"         │
      ├───────────────────────────────►│
      │                                │
      │ 3. Telegram auth callback      │
      │◄───────────────────────────────┤
      │                                │
      ▼                                │
┌──────────────────┐                   │
│  POST /api/      │                   │
│  telegram-auth   │                   │
└────────┬─────────┘                   │
         │                             │
         ▼                             │
┌─────────────────────┐                │
│  Backend:           │                │
│  1. Verify data     │                │
│  2. Create/update   │                │
│     user in DB      │                │
│  3. Generate JWT    │                │
└────────┬────────────┘                │
         │                             │
         ▼                             │
┌──────────────────┐                   │
│  Return JWT      │                   │
│  token to client │                   │
└────────┬─────────┘                   │
         │                             │
         ▼                             │
┌──────────────────┐                   │
│ Store token in   │                   │
│ localStorage     │                   │
└──────────────────┘                   │
```

## База данных

### Основные таблицы:

1. **users** - Пользователи системы
   - id (UUID)
   - telegram_id (bigint, unique)
   - telegram_username
   - first_name, last_name
   - photo_url
   - created_at, updated_at

2. **user_roles** - Роли пользователей
   - id (UUID)
   - user_id (FK -> users)
   - role (enum: super_admin, seller, student)

3. **sellers** - Продавцы курсов
   - id (UUID)
   - user_id (FK -> users)
   - business_name
   - description
   - is_approved

4. **courses** - Курсы
   - id (UUID)
   - seller_id (FK -> sellers)
   - title, description
   - thumbnail_url
   - is_published
   - theme_config (JSONB)
   - watermark_text

5. **course_posts** - Посты/уроки курса
   - id (UUID)
   - course_id (FK -> courses)
   - title, content
   - post_type (video, text, image, etc.)
   - order_index
   - is_pinned

6. **course_post_media** - Медиа файлы постов
   - id (UUID)
   - post_id (FK -> course_posts)
   - media_type (video, image, voice, document)
   - file_id (Telegram file_id)
   - file_path
   - media_group_id

7. **course_enrollments** - Записи студентов на курсы
   - id (UUID)
   - course_id (FK -> courses)
   - student_id (FK -> users)
   - granted_by (FK -> users)
   - enrolled_at
   - expires_at

8. **student_pinned_posts** - Закрепленные посты студентов
   - id (UUID)
   - student_id (FK -> users)
   - post_id (FK -> course_posts)

9. **telegram_bots** - Настройки Telegram ботов
   - id (UUID)
   - bot_token
   - bot_username
   - seller_id (FK -> sellers)

## API Endpoints

### Публичные:
- `GET /health` - Проверка работы сервера
- `GET /api/telegram-bot` - Получить имя бота для виджета
- `POST /api/telegram-auth` - Авторизация через Telegram

### Защищенные (требуется JWT):
- `GET /api/user` - Получить данные текущего пользователя
- `GET /api/courses` - Список всех курсов
- `GET /api/courses/:id` - Детали конкретного курса

## Frontend компоненты

### Контексты:
- **AuthContext** - Управление аутентификацией
- **ThemeContext** - Темы (светлая/темная)
- **LanguageContext** - Мультиязычность (ru/en)

### Основные страницы:
- **LoginPage** - Вход через Telegram
- **HomePage** - Главная с лентой курсов
- **CourseView** - Просмотр курса
- **CourseEdit** - Редактирование курса (для продавцов)
- **AdminDashboard** - Панель супер-админа
- **SellerDashboard** - Панель продавца
- **StudentDashboard** - Панель студента

## Безопасность

### JWT токены:
- Генерируются на сервере при успешной авторизации
- Хранятся в localStorage
- Срок действия: 7 дней
- Включают: userId, telegramId

### Защита API:
- Middleware `authenticateToken` проверяет JWT
- CORS настроен на разрешенные домены
- Rate limiting (рекомендуется добавить)

### База данных:
- Все пароли и секреты в переменных окружения
- SSL соединение с PostgreSQL
- Подготовленные запросы (защита от SQL injection)

## Переменные окружения

### Frontend (.env):
```env
VITE_API_URL=http://localhost:3000
```

### Frontend Production (.env.production):
```env
VITE_API_URL=https://keykurs.ru
```

### Backend (server/.env):
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
ALLOWED_ORIGINS=https://keykurs.ru
```

## Деплой

См. подробные инструкции:
- `QUICK_DEPLOY.md` - Быстрый старт
- `TIMEWEB_DEPLOYMENT_GUIDE.md` - Полное руководство

## Мониторинг и логи

- **PM2**: Управление процессом Node.js
- **PM2 Logs**: `pm2 logs kursat-api`
- **Nginx Logs**: `/var/log/nginx/error.log`
- **PostgreSQL Logs**: Через Timeweb панель управления

## Масштабирование

### Горизонтальное:
- Можно запустить несколько инстансов API сервера
- Использовать PM2 cluster mode: `pm2 start index.js -i max`
- Nginx будет балансировать нагрузку

### Вертикальное:
- Увеличить ресурсы сервера
- Оптимизировать запросы к БД
- Добавить Redis для кеширования

## Будущие улучшения

1. Redis для кеширования и сессий
2. Очередь задач (Bull/BullMQ)
3. WebSocket для real-time обновлений
4. CDN для статических файлов
5. Elasticsearch для поиска
6. Prometheus + Grafana для мониторинга
7. Unit и E2E тесты
8. CI/CD pipeline
