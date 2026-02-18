# Миграция на Timeweb (без Supabase)

Проект успешно мигрирован с Supabase на собственный бэкенд с PostgreSQL в Timeweb.

## Что было изменено

### 1. Удалена зависимость от Supabase
- Удален пакет `@supabase/supabase-js`
- Удалены все Supabase migrations (папка `supabase/`)
- Удалены Cloudflare Workers для проксирования Supabase

### 2. Обновлен фронтенд
- Все компоненты переписаны для работы с REST API
- `src/lib/supabase.ts` теперь только экспортирует типы
- Типы вынесены в `src/lib/types.ts`
- Аутентификация работает через JWT токены в localStorage
- Все запросы к базе данных идут через `apiClient` (`src/lib/api.ts`)

### 3. Обновлен бэкенд
- Добавлен multer для загрузки файлов
- Создан endpoint `/api/upload` для загрузки медиа
- Файлы хранятся в папке `uploads/` на сервере
- Файлы доступны через `/uploads/` URL

### 4. Что работает
- Telegram авторизация
- Управление курсами
- Публикация постов
- Загрузка медиа файлов
- Управление студентами
- Закрепленные посты
- Все настройки тем и кастомизация

## Настройка на Timeweb

### 1. Переменные окружения (.env)
```bash
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=ваш-секретный-ключ
ALLOWED_ORIGINS=https://keykurs.ru,https://www.keykurs.ru
```

### 2. Деплой
```bash
# Собрать проект
npm run build

# Запустить сервер
npm start
```

### 3. Настройка nginx
```nginx
location /uploads/ {
    alias /path/to/project/uploads/;
}

location /api/ {
    proxy_pass http://localhost:3000;
}

location / {
    root /path/to/project/build;
    try_files $uri /index.html;
}
```

## API Endpoints

Все endpoints остались теми же, что и раньше:
- `POST /api/telegram-auth` - авторизация через Telegram
- `GET /api/user` - получить данные пользователя
- `GET /api/courses` - список курсов
- `POST /api/courses` - создать курс
- `POST /api/upload` - загрузить файл (новый!)
- И все остальные endpoints из `api/index.js`

## Что нужно знать

1. **Загрузка файлов**: Теперь файлы загружаются на ваш сервер в папку `uploads/`
2. **База данных**: Используется PostgreSQL из Timeweb, схема из `timeweb-migrations/`
3. **Без Supabase Storage**: Все медиа теперь хранится локально
4. **Без Supabase Realtime**: Используется polling вместо WebSocket

## Преимущества

- Полный контроль над данными
- Нет зависимости от внешних сервисов
- Все работает на вашем сервере Timeweb
- Нет лимитов Supabase
- Упрощенная архитектура
