# Примеры кода для интеграции

Готовые примеры кода для интеграции Timeweb PostgreSQL в ваше приложение.

## 1. Базовая настройка

### `server/db.ts` - Подключение к БД

```typescript
import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.TIMEWEB_DB_HOST,
  port: parseInt(process.env.TIMEWEB_DB_PORT || '5432'),
  database: process.env.TIMEWEB_DB_NAME,
  user: process.env.TIMEWEB_DB_USER,
  password: process.env.TIMEWEB_DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Максимум подключений
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Проверка подключения при старте
pool.on('connect', () => {
  console.log('✓ Connected to Timeweb PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function queryAsUser<T = any>(
  token: string,
  sql: string,
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    // Установить текущего пользователя
    const authResult = await client.query(
      'SELECT authenticate_with_token($1) as user_id',
      [token]
    );

    if (!authResult.rows[0]?.user_id) {
      throw new Error('Invalid or expired token');
    }

    // Выполнить запрос с RLS
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function querySystem<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows;
}
```

## 2. Система аутентификации

### `server/auth.ts` - Аутентификация

```typescript
import { randomBytes } from 'crypto';
import { pool, querySystem } from './db';

export interface User {
  id: string;
  telegramId: number;
  telegramUsername?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
}

export class Auth {
  /**
   * Получить или создать пользователя по Telegram ID
   */
  static async getOrCreateUser(
    telegramId: number,
    userData: {
      username?: string;
      firstName?: string;
      lastName?: string;
      photoUrl?: string;
    }
  ): Promise<User> {
    const client = await pool.connect();
    try {
      // Проверить существование
      let result = await client.query(
        'SELECT * FROM users WHERE telegram_id = $1',
        [telegramId]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Создать нового пользователя
      result = await client.query(
        `INSERT INTO users (telegram_id, telegram_username, first_name, last_name, photo_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          telegramId,
          userData.username,
          userData.firstName,
          userData.lastName,
          userData.photoUrl
        ]
      );

      const user = result.rows[0];

      // Добавить роль student по умолчанию
      await client.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user.id, 'student']
      );

      return user;
    } finally {
      client.release();
    }
  }

  /**
   * Создать новую сессию
   */
  static async createSession(
    userId: string,
    durationHours: number = 24 * 7
  ): Promise<Session> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    await querySystem(
      'INSERT INTO auth_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );

    return { userId, token, expiresAt };
  }

  /**
   * Проверить валидность токена
   */
  static async validateToken(token: string): Promise<string | null> {
    const result = await querySystem(
      `SELECT user_id FROM auth_sessions
       WHERE token = $1 AND expires_at > now()`,
      [token]
    );

    return result[0]?.user_id || null;
  }

  /**
   * Удалить сессию (logout)
   */
  static async deleteSession(token: string): Promise<void> {
    await querySystem('DELETE FROM auth_sessions WHERE token = $1', [token]);
  }

  /**
   * Удалить все сессии пользователя
   */
  static async deleteAllUserSessions(userId: string): Promise<void> {
    await querySystem('DELETE FROM auth_sessions WHERE user_id = $1', [userId]);
  }

  /**
   * Очистить истёкшие сессии
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await querySystem(
      'DELETE FROM auth_sessions WHERE expires_at < now() RETURNING *'
    );
    return result.length;
  }

  /**
   * Получить роли пользователя
   */
  static async getUserRoles(userId: string): Promise<string[]> {
    const result = await querySystem(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [userId]
    );
    return result.map((r: any) => r.role);
  }

  /**
   * Проверить роль пользователя
   */
  static async hasRole(userId: string, role: string): Promise<boolean> {
    const result = await querySystem(
      'SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2',
      [userId, role]
    );
    return result.length > 0;
  }
}
```

## 3. Express API Server

### `server/index.ts` - Основной сервер

```typescript
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Auth } from './auth';
import { queryAsUser, querySystem } from './db';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Расширяем Request тип
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      token?: string;
    }
  }
}

// Auth middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = await Auth.validateToken(token);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = userId;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Role check middleware
function requireRole(role: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasRole = await Auth.hasRole(req.userId, role);
      if (!hasRole) {
        return res.status(403).json({ error: `Requires ${role} role` });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
}

// ============================================
// AUTH ROUTES
// ============================================

// Telegram auth callback
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { id, username, first_name, last_name, photo_url } = req.body;

    // Получить или создать пользователя
    const user = await Auth.getOrCreateUser(id, {
      username,
      firstName: first_name,
      lastName: last_name,
      photoUrl: photo_url
    });

    // Создать сессию
    const session = await Auth.createSession(user.id);

    res.json({
      user,
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    console.error('Telegram auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Logout
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    await Auth.deleteSession(req.token!);
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const users = await queryAsUser(
      req.token!,
      'SELECT * FROM users WHERE id = $1',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roles = await Auth.getUserRoles(req.userId!);

    res.json({
      user: users[0],
      roles
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ============================================
// COURSE ROUTES
// ============================================

// Get all published courses
app.get('/api/courses', requireAuth, async (req, res) => {
  try {
    const courses = await queryAsUser(
      req.token!,
      'SELECT * FROM courses WHERE is_published = true ORDER BY created_at DESC'
    );
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by ID
app.get('/api/courses/:id', requireAuth, async (req, res) => {
  try {
    const courses = await queryAsUser(
      req.token!,
      'SELECT * FROM courses WHERE id = $1',
      [req.params.id]
    );

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(courses[0]);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create course (sellers only)
app.post('/api/courses', requireAuth, requireRole('seller'), async (req, res) => {
  try {
    const { title, description, thumbnail_url } = req.body;

    const courses = await queryAsUser(
      req.token!,
      `INSERT INTO courses (seller_id, title, description, thumbnail_url)
       VALUES (
         (SELECT id FROM sellers WHERE user_id = current_user_id()),
         $1, $2, $3
       )
       RETURNING *`,
      [title, description, thumbnail_url]
    );

    res.status(201).json(courses[0]);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course (sellers only)
app.put('/api/courses/:id', requireAuth, requireRole('seller'), async (req, res) => {
  try {
    const { title, description, thumbnail_url, is_published } = req.body;

    const courses = await queryAsUser(
      req.token!,
      `UPDATE courses
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           thumbnail_url = COALESCE($3, thumbnail_url),
           is_published = COALESCE($4, is_published),
           updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [title, description, thumbnail_url, is_published, req.params.id]
    );

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    res.json(courses[0]);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course (sellers only)
app.delete('/api/courses/:id', requireAuth, requireRole('seller'), async (req, res) => {
  try {
    const result = await queryAsUser(
      req.token!,
      'DELETE FROM courses WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// ============================================
// ENROLLMENT ROUTES
// ============================================

// Get user enrollments
app.get('/api/enrollments', requireAuth, async (req, res) => {
  try {
    const enrollments = await queryAsUser(
      req.token!,
      `SELECT e.*, c.title, c.description, c.thumbnail_url
       FROM course_enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = current_user_id()
       ORDER BY e.enrolled_at DESC`
    );
    res.json(enrollments);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Enroll student in course (sellers only)
app.post('/api/courses/:courseId/enrollments', requireAuth, requireRole('seller'), async (req, res) => {
  try {
    const { student_id, expires_at } = req.body;

    const enrollments = await queryAsUser(
      req.token!,
      `INSERT INTO course_enrollments (course_id, student_id, granted_by, expires_at)
       VALUES ($1, $2, current_user_id(), $3)
       ON CONFLICT (course_id, student_id) DO UPDATE
       SET expires_at = EXCLUDED.expires_at
       RETURNING *`,
      [req.params.courseId, student_id, expires_at]
    );

    res.status(201).json(enrollments[0]);
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  // Cleanup expired sessions every hour
  setInterval(async () => {
    try {
      const deleted = await Auth.cleanupExpiredSessions();
      if (deleted > 0) {
        console.log(`🧹 Cleaned up ${deleted} expired sessions`);
      }
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }, 60 * 60 * 1000);
});
```

## 4. Frontend интеграция

### `src/lib/api.ts` - API клиент

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }
  return response.json();
}

// Auth
export async function loginWithTelegram(telegramUser: any) {
  const response = await fetch(`${API_URL}/auth/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(telegramUser)
  });

  const data = await handleResponse<{ user: any; token: string }>(response);
  localStorage.setItem('auth_token', data.token);
  return data;
}

export async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } finally {
    localStorage.removeItem('auth_token');
  }
}

export async function getCurrentUser() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
}

// Courses
export async function fetchCourses() {
  const response = await fetch(`${API_URL}/courses`, {
    headers: getAuthHeaders()
  });
  return handleResponse<any[]>(response);
}

export async function fetchCourse(id: string) {
  const response = await fetch(`${API_URL}/courses/${id}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
}

export async function createCourse(data: {
  title: string;
  description: string;
  thumbnail_url?: string;
}) {
  const response = await fetch(`${API_URL}/courses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(response);
}

export async function updateCourse(id: string, data: any) {
  const response = await fetch(`${API_URL}/courses/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(response);
}

export async function deleteCourse(id: string) {
  const response = await fetch(`${API_URL}/courses/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
}
```

## 5. Примеры использования

### React компонент с курсами

```typescript
import { useEffect, useState } from 'react';
import { fetchCourses, createCourse } from './lib/api';

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      const data = await fetchCourses();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      await createCourse({
        title: 'New Course',
        description: 'Course description'
      });
      loadCourses(); // Reload
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleCreate}>Create Course</button>
      {courses.map((course: any) => (
        <div key={course.id}>
          <h3>{course.title}</h3>
          <p>{course.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## 6. package.json зависимости

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.20",
    "@types/pg": "^8.10.7",
    "@types/cors": "^2.8.15",
    "@types/node": "^20.9.0",
    "tsx": "^4.6.0",
    "typescript": "^5.2.2"
  },
  "scripts": {
    "dev": "tsx watch server/index.ts",
    "build": "tsc",
    "start": "node dist/server/index.js"
  }
}
```

## 7. Готово!

Теперь у вас есть:
- ✅ Полная система аутентификации
- ✅ REST API для всех операций
- ✅ Frontend клиент
- ✅ RLS работает автоматически

Запуск:

```bash
# Backend
npm run dev

# Frontend (отдельный терминал)
npm run dev
```
