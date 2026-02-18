# Backend API Migration Guide

## Overview

Проект полностью переведен на использование Backend API (api/index.js) вместо прямых вызовов к Supabase из фронтенда.

## Architecture

```
Frontend (React) → Backend API (Express.js) → PostgreSQL (Timeweb)
```

## Configuration

### Environment Variables

#### Development (.env)
```bash
# Backend API URL for frontend
VITE_API_URL=http://localhost:3000

# Backend API Configuration
PORT=3000
NODE_ENV=development

# Timeweb PostgreSQL
DATABASE_URL=postgresql://gen_user:password@host:5432/default_db?sslmode=verify-full

# JWT Secret
JWT_SECRET=your-secret-key

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

#### Production (.env.production)
```bash
VITE_API_URL=https://yourdomain.com
```

## API Endpoints

### Authentication
- `GET /health` - Health check
- `GET /api/telegram-bot` - Get bot username (public)
- `POST /api/telegram-auth` - Telegram authentication
- `GET /api/user` - Get current user (authenticated)

### Courses
- `GET /api/courses` - List all published courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (seller only)
- `PUT /api/courses/:id` - Update course (seller only)
- `DELETE /api/courses/:id` - Delete course (seller only)

### Posts
- `GET /api/courses/:id/posts` - Get course posts (enrolled/owner)
- `POST /api/courses/:id/posts` - Create post (seller only)
- `DELETE /api/posts/:id` - Delete post (seller only)

### Sellers
- `GET /api/sellers/me` - Get seller profile
- `POST /api/sellers` - Create seller profile
- `GET /api/sellers/me/courses` - Get seller's courses

### Students
- `GET /api/students/me` - Get student profile
- `GET /api/students/me/enrollments` - Get student enrollments
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/:id/students` - Get course students (seller only)
- `DELETE /api/enrollments/:courseId/:studentId` - Remove enrollment (seller only)

### Pinned Posts
- `GET /api/students/me/pinned-posts?course_id=X` - Get pinned posts
- `POST /api/students/me/pinned-posts` - Pin post
- `DELETE /api/students/me/pinned-posts/:postId` - Unpin post

### Telegram Bots
- `GET /api/telegram-bots` - Get user's bots (seller only)
- `POST /api/telegram-bots` - Create/configure bot (seller only)

## Frontend Integration

### Using ApiClient

```typescript
import { apiClient } from '../lib/api';

// Authentication
const data = await apiClient.telegramAuth(telegramData);

// Get user
const user = await apiClient.getUser();

// Get courses
const courses = await apiClient.getCourses();

// Create course
const course = await apiClient.createCourse({
  title: 'My Course',
  description: 'Description',
  price: 1000,
  is_published: true
});

// Get course posts
const posts = await apiClient.getCoursePosts(courseId);

// Create post
const post = await apiClient.createCoursePost(courseId, {
  text_content: 'Hello',
  media: [...]
});
```

## Security

### JWT Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

Token is automatically managed by ApiClient:
- Stored in localStorage as 'auth_token'
- Automatically included in all requests
- Cleared on logout

### CORS

Backend API только принимает запросы от разрешенных доменов (ALLOWED_ORIGINS).

### Database Access

- Frontend НЕ имеет прямого доступа к базе данных
- Все запросы проходят через Backend API
- Backend API проверяет права доступа для каждого запроса

## Running the Application

### Development

1. Start Backend API:
```bash
npm run start
```

2. Start Frontend (in another terminal):
```bash
npm run dev
```

### Production

Backend API serves both API endpoints and static frontend files.

1. Build frontend:
```bash
npm run build
```

2. Start server:
```bash
NODE_ENV=production npm run start
```

## Migration Checklist

- [x] Backend API endpoints created
- [x] ApiClient extended with all methods
- [x] AuthContext uses Backend API
- [x] TelegramLogin uses Backend API
- [x] Environment variables configured
- [ ] All components migrated from Supabase to ApiClient
- [ ] File upload/download through Backend API
- [ ] Testing completed

## Next Steps

1. Migrate remaining components that use Supabase directly
2. Implement file upload/download endpoints in Backend API
3. Add error handling and loading states
4. Add request caching where appropriate
5. Add rate limiting for API endpoints
6. Add logging and monitoring

## Benefits

1. **Security**: No direct database access from frontend
2. **Control**: Full control over data access and validation
3. **Flexibility**: Easy to add business logic and custom endpoints
4. **Scalability**: Easy to add caching, rate limiting, etc.
5. **Independence**: Not tied to Supabase-specific features
