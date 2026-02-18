# KeyKurs (EduPlatform) - Multi-Tenant Online Learning Platform

Secure marketplace for online courses with advanced content protection and Telegram authentication.

## 🚨 ВАЖНО: Настройка базы данных Таймвеб

**SSL сертификат для PostgreSQL добавлен и настроен!**

### 🚀 Быстрый старт деплоя

1. **[ONE_PAGE_GUIDE.md](./ONE_PAGE_GUIDE.md)** ← Всё на одной странице (начни здесь!)
2. **[НАЧНИ_ОТСЮДА.md](./НАЧНИ_ОТСЮДА.md)** ← Русская версия
3. **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** ← Полный чеклист

### 📚 Документация по деплою

- **[README_DEPLOYMENT.md](./README_DEPLOYMENT.md)** - Полное руководство
- **[VISUAL_DEPLOY_GUIDE.md](./VISUAL_DEPLOY_GUIDE.md)** - Визуальные схемы
- **[MANUAL_API_SETUP.md](./MANUAL_API_SETUP.md)** - 🔧 Установка API без терминала
- **[QUICK_FIX_TIMEWEB.md](./QUICK_FIX_TIMEWEB.md)** - Что было исправлено
- **[TIMEWEB_SSL_SETUP.md](./TIMEWEB_SSL_SETUP.md)** - Техническая документация SSL

📚 **[Полный индекс документации](./DOCS_INDEX.md)** - Навигация по всей документации проекта

---

## Features

### User Roles

1. **Super Admin** - Platform owner with full control
   - Approve/reject seller applications
   - View platform statistics
   - Monitor all users, sellers, and courses

2. **Sellers** - Course creators
   - Create and manage courses
   - Add course modules and lessons
   - Grant access to students
   - Track student enrollment

3. **Students** - Course consumers
   - Access enrolled courses
   - Protected video player with watermarks
   - Track learning progress

### Security Features

- Telegram authentication for secure login
- Row Level Security (RLS) for database access
- Dynamic watermarks with user identification
- Right-click and keyboard shortcut protection
- DevTools detection
- Screen recording detection
- Content protection warnings

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL) or Timeweb PostgreSQL
- **Authentication**: Telegram Login Widget + Custom Auth
- **Storage**: Supabase Storage / Custom Storage
- **Serverless**: Supabase Edge Functions / Node.js API

## 🚀 Deployment Options

### Option 1: Timeweb Cloud Apps (GitHub Auto-Deploy) ⚡ Рекомендуется

Автоматический деплой через GitHub с автообновлением при каждом push:

**Если есть ДВА поля (Build + Start):**
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**Если ОДНО поле (только Start):**
- Start Command: `npm run start:production`

#### Документация:
- 🎯 **[START_HERE.md](./START_HERE.md)** - Начните отсюда! Ответ на вопрос о командах
- 📋 **[COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md)** - Готовые команды для копирования
- ⚡ **[TIMEWEB_QUICK_SETUP.md](./TIMEWEB_QUICK_SETUP.md)** - Настройка за 2 минуты
- 🖼️ **[TIMEWEB_VISUAL_GUIDE.md](./TIMEWEB_VISUAL_GUIDE.md)** - Визуальный гайд с примерами
- 📖 **[TIMEWEB_CLOUD_APPS.md](./TIMEWEB_CLOUD_APPS.md)** - Полная подробная инструкция
- 📊 **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Итоги и summary

### Option 2: Timeweb VPS (Manual Deploy)

Деплой на виртуальный сервер с Nginx и PM2:

📖 **Инструкция:** [QUICK_DEPLOY_TIMEWEB.md](./QUICK_DEPLOY_TIMEWEB.md)

---

## 🔄 Timeweb PostgreSQL Migration

**Новое!** Теперь проект может работать с обычным PostgreSQL в Timeweb (без Supabase).

### Быстрый старт с Timeweb

```bash
# 1. Настройте переменные окружения
cd timeweb-migrations
nano ../.env  # Добавьте TIMEWEB_DB_* переменные

# 2. Примените миграции
./apply-all.sh

# 3. Создайте тестовые данные
psql -h host -U user -d db -f test-setup.sql
```

### Документация

- 📘 **[Полное руководство](TIMEWEB_COMPLETE_GUIDE.md)** - Пошаговая инструкция
- 🚀 **[Быстрый старт](timeweb-migrations/QUICK_START.md)** - Начало за 5 минут
- 📋 **[Шпаргалка](timeweb-migrations/CHEATSHEET.md)** - Команды и примеры
- 💻 **[Примеры кода](timeweb-migrations/CODE_EXAMPLES.md)** - Готовый код
- 🏗️ **[Архитектура](timeweb-migrations/ARCHITECTURE.md)** - Как это работает

### Основные отличия

| Supabase | Timeweb PostgreSQL |
|----------|-------------------|
| `supabase.auth.signIn()` | Кастомная аутентификация |
| `auth.uid()` в SQL | `current_user_id()` |
| Edge Functions | Node.js API сервер |
| Storage API | Отдельное хранилище |
| Встроенный Realtime | WebSockets/SSE |

## Setup Instructions

### 1. Create Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the **Bot Token** (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Send `/setdomain` command to BotFather
6. Select your bot
7. Enter your domain (e.g., `yourdomain.com`)

### 2. Configure Environment Variables

Your `.env` file should already contain Supabase credentials. Add the Telegram bot token:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### 3. Update Telegram Widget

Edit `src/components/TelegramLogin.tsx` and replace `YOUR_BOT_USERNAME` with your actual bot username:

```typescript
script.setAttribute('data-telegram-login', 'your_bot_username');
```

### 4. Create Super Admin Account

After your first login via Telegram, manually add super admin role:

1. Login to Supabase Dashboard
2. Go to Table Editor → `user_roles`
3. Add new row:
   - `user_id`: Your user ID from `users` table
   - `role`: `super_admin`

### 5. Install and Run

```bash
npm install
npm run dev
```

## Database Schema

### Tables

- `users` - All platform users (synced with Telegram)
- `user_roles` - User role assignments
- `sellers` - Extended seller profiles
- `courses` - Course information
- `course_modules` - Course sections
- `course_lessons` - Individual lessons
- `lesson_content` - Lesson content (video/text/files)
- `course_enrollments` - Student access management
- `lesson_progress` - Student learning progress

## Usage Guide

### For Super Admin

1. Login with Telegram
2. Review pending seller applications in Admin Dashboard
3. Approve or reject applications
4. Monitor platform statistics

### For Sellers

1. Register as seller from login page
2. Wait for admin approval
3. Create courses from Seller Dashboard
4. Add modules and lessons to courses
5. Grant access to students by their Telegram ID

### For Students

1. Login with Telegram
2. Access courses granted by sellers
3. Watch protected video content
4. Track your learning progress

## Content Protection

The platform implements multiple layers of content protection:

1. **Dynamic Watermarks**: User identification overlaid on all content
2. **Video Watermarks**: Moving watermarks on video players
3. **Basic Protection**: Disabled right-click, screenshot shortcuts
4. **Detection**: DevTools and screen recording detection
5. **Legal Notice**: Terms acceptance on login

**Important**: While these measures significantly deter piracy, no web-based solution can provide 100% protection. For maximum security, consider developing a native mobile app.

## Architecture Highlights

- **Multi-tenant**: Each seller operates independently
- **Secure by default**: RLS policies on all tables
- **Scalable**: Built on Supabase infrastructure
- **Mobile-first**: Responsive design for all devices
- **Real-time**: Optional real-time subscriptions

## Future Enhancements

- Telegram Mini App integration
- Course completion certificates
- Payment integration
- Analytics dashboard
- Email notifications
- Course reviews and ratings
- Advanced DRM protection

## Support

For issues or questions, contact the platform administrator.
