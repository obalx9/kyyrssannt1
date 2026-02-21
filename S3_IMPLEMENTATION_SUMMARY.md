# Реализация скачивания Telegram медиа в S3

## Что было добавлено

### 1. Backend S3 Service (`backend-api/s3Service.js`)

Новая функция `downloadTelegramFileToS3`:
- Получает файл ID из Telegram API
- Скачивает файл по прямому URL
- Загружает в S3 хранилище
- Возвращает публичный S3 URL и размер файла

```typescript
downloadTelegramFileToS3(fileId, botToken, filename, contentType)
// Returns: { key, url, fileSize }
```

### 2. Backend API Endpoint (`backend-api/index.js`)

Новый POST endpoint: `/api/telegram/download-to-s3`

**Требования:**
- Authorization Bearer token (JWT)
- Параметры: fileId, postId, filename, contentType

**Функциональность:**
- Проверка прав доступа (только продавец курса)
- Скачивание медиа из Telegram
- Сохранение в S3
- Обновление записи в БД столбцы `s3_key` и `s3_url`

### 3. Database Migration (`timeweb-migrations/15_add_s3_columns_to_course_posts.sql`)

Добавлены столбцы в таблицу `course_posts`:
- `s3_key` - ключ объекта в S3
- `s3_url` - публичный URL для прямого доступа

**Требует применения** через TimeWeb панель управления БД

### 4. Frontend API Client (`src/lib/api.ts`)

Новый метод:
```typescript
downloadTelegramMediaToS3(postId, fileId, filename, contentType)
```

Упрощает вызов API с автоматическим добавлением JWT токена.

### 5. UI Компонент (`src/components/MediaDownloadButton.tsx`)

Готовый компонент кнопки для скачивания медиа:
- Загрузка состояния с анимацией
- Визуальная обратная связь об успешной загрузке
- Обработка ошибок с callback
- Интеграция с API

**Использование:**
```tsx
<MediaDownloadButton
  postId={post.id}
  fileId={post.telegram_file_id}
  fileName={post.file_name}
  mimeType={post.mime_type}
  onSuccess={(s3Url) => console.log('Done:', s3Url)}
/>
```

### 6. Документация (`S3_DOWNLOAD_GUIDE.md`)

Полное руководство с примерами:
- API описание
- Примеры использования
- Сценарии интеграции
- Переменные окружения
- Обработка ошибок

## Поток данных

```
1. Пользователь нажимает "Download"
   ↓
2. Frontend вызывает /api/telegram/download-to-s3
   ↓
3. Backend проверяет права доступа
   ↓
4. Backend скачивает файл с Telegram API
   ↓
5. Backend загружает в S3
   ↓
6. Backend обновляет БД (s3_url, s3_key)
   ↓
7. Frontend получает S3 URL
   ↓
8. При следующем обращении используется S3 URL вместо Telegram
```

## Преимущества

✅ **Быстрее** - S3 часто ближе к пользователю, чем Telegram API
✅ **Надежнее** - не зависит от доступности Telegram
✅ **Масштабируется** - легко кэшировать через CDN
✅ **Прозрачно** - fallback на Telegram если S3 недоступен
✅ **Гибко** - скачивание по требованию, не обязательно

## Что нужно сделать

### ОБЯЗАТЕЛЬНО применить миграцию БД

```bash
# Подключитесь к TimeWeb БД и выполните:
psql -h your.host -U your_user -d your_db -f timeweb-migrations/15_add_s3_columns_to_course_posts.sql
```

Или через TimeWeb панель:
1. Перейти в SQL Editor
2. Скопировать содержимое файла `15_add_s3_columns_to_course_posts.sql`
3. Выполнить запрос

### ОБНОВИТЬ backend зависимости

```bash
cd backend-api
npm install
```

Добавлена: `@aws-sdk/s3-request-presigner@^3.500.0`

### Опционально: интегрировать компонент в UI

```tsx
import { MediaDownloadButton } from '@/components/MediaDownloadButton';

// В компоненте просмотра поста:
{post.telegram_file_id && !post.s3_url && (
  <MediaDownloadButton
    postId={post.id}
    fileId={post.telegram_file_id}
    fileName={post.file_name || 'media'}
    mimeType={post.mime_type}
  />
)}
```

## Проверка работоспособности

1. **Backend запущен** - `npm run start` в папке `backend-api/`
2. **Окружение** - все S3 переменные в `.env`
3. **Telegram Bot Token** - установлен в `TELEGRAM_BOT_TOKEN`
4. **JWT Secret** - установлен в `JWT_SECRET`

## Примеры использования

### Массовое скачивание при загрузке курса

```typescript
const loadCourseWithMediaDownload = async (courseId: string) => {
  const posts = await loadCoursePosts(courseId);

  // Асинхронно скачать медиа без блокировки UI
  posts.forEach(post => {
    if (post.telegram_file_id && !post.s3_url) {
      apiClient.downloadTelegramMediaToS3(
        post.id,
        post.telegram_file_id,
        post.file_name || `media-${post.id}`,
        post.mime_type
      ).catch(err => console.log('Auto-download failed:', err));
    }
  });

  return posts;
};
```

### Использование в компонентах

```typescript
const getMediaUrl = (post: CoursePost) => {
  // Приоритет: S3 → Telegram
  if (post.s3_url) return post.s3_url;
  return apiClient.buildTelegramFileUrl(post.telegram_file_id, courseId);
};

<video src={getMediaUrl(post)} controls />
```

## Хранение с Supabase

Если хотите использовать Supabase вместо S3:
- Замените `downloadTelegramFileToS3` на `downloadTelegramFileToSupabase`
- Используйте `supabase.storage.from('media').upload(path, file)`
- Получайте public URL через `supabase.storage.from('media').getPublicUrl(path)`

## Ограничения

- Максимальный размер файла: 20 МБ (ограничение Telegram)
- Скачивание может занять время (зависит от интернета)
- S3 должен быть доступен и настроен
- JWT токен должен быть действителен

## Безопасность

- ✅ Проверка JWT токена
- ✅ Проверка прав доступа (только продавец курса)
- ✅ Валидация параметров
- ✅ CORS защита на backend
- ✅ S3 ACL: public-read (файлы доступны всем, но загружены явно)

## Поддержка

Если возникают ошибки:
1. Проверьте логи backend: `node backend-api/index.js`
2. Убедитесь что TELEGRAM_BOT_TOKEN действителен
3. Проверьте S3 credentials и endpoint
4. Смотрите примеры в `S3_DOWNLOAD_GUIDE.md`
