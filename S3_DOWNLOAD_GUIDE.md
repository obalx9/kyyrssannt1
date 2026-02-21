# Скачивание медиа из Telegram в S3

## Обзор

Реализована функциональность для скачивания медиа файлов из Telegram и сохранения их в S3 хранилище. Это улучшает производительность и снижает зависимость от Telegram API.

## База данных

### Новые столбцы в `course_posts`

Нужно применить миграцию `15_add_s3_columns_to_course_posts.sql`:

```sql
ALTER TABLE course_posts ADD COLUMN s3_key text;      -- S3 object key
ALTER TABLE course_posts ADD COLUMN s3_url text;      -- Public S3 URL
```

## Backend API

### Новый ендпоинт

**POST** `/api/telegram/download-to-s3`

Скачивает медиа файл из Telegram и сохраняет в S3.

#### Параметры (JSON body)

```json
{
  "fileId": "string (Telegram file_id)",
  "postId": "string (course_post id)",
  "filename": "string (имя файла)",
  "contentType": "string (MIME type, опционально)"
}
```

#### Заголовки

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

#### Успешный ответ (200)

```json
{
  "success": true,
  "s3Url": "https://s3.endpoint.com/bucket/media/...",
  "s3Key": "media/123456-filename.jpg",
  "fileSize": 102400
}
```

#### Ошибки

- `401` - Missing or invalid authorization token
- `400` - Missing required parameters
- `403` - Not authorized to download media for this post
- `404` - Post not found
- `500` - Server error during download

## Frontend

### Использование в компонентах

```typescript
import { apiClient } from '@/lib/api';

// Скачать медиа в S3
const handleDownloadToS3 = async (postId: string, fileId: string, filename: string) => {
  try {
    const result = await apiClient.downloadTelegramMediaToS3(
      postId,
      fileId,
      filename,
      'image/jpeg' // Content-Type (опционально)
    );

    console.log('Download successful:', result.s3Url);
    // Обновить UI с новым S3 URL
  } catch (error) {
    console.error('Download failed:', error);
  }
};
```

### Использование медиа

```typescript
// Если есть S3 URL - использовать его (быстрее)
const mediaUrl = post.s3_url ||
  apiClient.buildTelegramFileUrl(post.telegram_file_id, courseId);

// В компоненте
<img src={mediaUrl} alt="post media" />
```

## Сценарии использования

### 1. Массовое скачивание при просмотре курса

Когда пользователь открывает курс, можно асинхронно скачивать старые медиа файлы в S3:

```typescript
const downloadMissingMedia = async (posts: CoursePost[]) => {
  for (const post of posts) {
    if (post.telegram_file_id && !post.s3_url && post.media_type !== 'text') {
      try {
        await apiClient.downloadTelegramMediaToS3(
          post.id,
          post.telegram_file_id,
          post.file_name || `media-${post.id}`,
          post.mime_type || 'application/octet-stream'
        );
      } catch (error) {
        console.error(`Failed to download media for post ${post.id}:`, error);
        // Продолжить, even if download fails
      }
    }
  }
};
```

### 2. Скачивание при импорте

Можно автоматически скачивать медиа после импорта из Telegram:

```typescript
const autoDownloadImportedMedia = async (postId: string, post: CoursePost) => {
  if (post.telegram_file_id && !post.s3_url) {
    await apiClient.downloadTelegramMediaToS3(
      postId,
      post.telegram_file_id,
      post.file_name || `imported-${postId}`,
      post.mime_type
    );
  }
};
```

## Переменные окружения

Убедитесь, что в `.env` установлены:

```
S3_ENDPOINT=https://s3.example.com
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=ru-1
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
JWT_SECRET=your-jwt-secret
```

## Особенности

- **Асинхронное скачивание** - не блокирует импорт
- **Проверка прав доступа** - только продавец курса может скачивать медиа
- **Обработка больших файлов** - поддержка файлов до 20МБ
- **Fallback механизм** - если скачивание не удалось, используется оригинальный Telegram URL
- **Кэширование** - загруженные файлы доступны прямо с S3

## Логирование

Все операции логируются в console:

```
[ERROR] Telegram to S3 download error: ...
[INFO] Media downloaded to S3: s3://bucket/media/123456-file.jpg
```

## Производительность

- **Telegram API** - зависит от скорости интернета и нагрузки Telegram
- **S3 хранилище** - быстрое прямое скачивание от пользователей
- **CDN** - если S3 endpoint имеет CDN, медиа будет кэширован глобально
