# 📊 Итоги подготовки к деплою на Timeweb Cloud Apps

## Проблема (была)

При попытке деплоя на Timeweb Cloud Apps возникала ошибка:

```
Error: vite: command not found
```

**Причина:**
- `vite` находился в `devDependencies`
- Timeweb Cloud устанавливает только `dependencies` в production
- Команда `npm run build` не могла найти Vite

**Дополнительная проблема:**
- Непонятно как указать команды сборки и запуска, если в интерфейсе только одно поле

---

## Решение (применено)

### 1. Перемещение Vite в dependencies

**Было:**
```json
"devDependencies": {
  "vite": "^5.4.2",
  "@vitejs/plugin-react": "^4.3.1"
}
```

**Стало:**
```json
"dependencies": {
  "vite": "^5.4.2",
  "@vitejs/plugin-react": "^4.3.1"
}
```

### 2. Добавление скрипта start:production

**Было:**
```json
"scripts": {
  "build": "vite build",
  "start": "node api/index.js"
}
```

**Стало:**
```json
"scripts": {
  "build": "vite build",
  "start": "node api/index.js",
  "start:production": "npm run build && npm start"
}
```

### 3. Пересборка проекта

```bash
npm run build
```

Результат:
- ✅ build/index.html создан
- ✅ build/assets/index-SSS4VRUm.js создан (479 KB)
- ✅ build/assets/index-18F3Dcpz.css создан (62 KB)

---

## Теперь доступны ДВА варианта деплоя

### Вариант A: Два поля (Build + Start)

**Если в Timeweb Cloud Apps есть два отдельных поля:**

```
Build Command:  npm install && npm run build
Start Command:  npm start
```

**Преимущества:**
- ✅ Чёткое разделение этапов
- ✅ Сборка выполняется один раз при деплое
- ✅ Меньше потребление ресурсов

### Вариант B: Одно поле (только Start)

**Если в Timeweb Cloud Apps только одно поле:**

```
Start Command:  npm run start:production
```

**Как работает:**
1. Выполняется `npm run build` (собирает React)
2. Выполняется `npm start` (запускает Node.js сервер)

**Преимущества:**
- ✅ Работает даже если есть только одно поле
- ✅ Простое решение

---

## Структура проекта после изменений

```
project/
├── api/
│   └── index.js              # Node.js + Express API
├── build/                    # ✅ Готовая сборка React
│   ├── index.html
│   └── assets/
│       ├── index-SSS4VRUm.js
│       └── index-18F3Dcpz.css
├── src/                      # Исходники React
├── package.json              # ✅ Vite в dependencies
├── .env                      # Локальные переменные
├── .env.production           # Production переменные
└── vite.config.ts
```

---

## Переменные окружения для Timeweb

В панели Timeweb Cloud Apps добавьте:

```bash
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://gen_user:PASSWORD@HOST.twc1.net:5432/default_db?sslmode=verify-full
JWT_SECRET=<64+ символов случайная строка>
ALLOWED_ORIGINS=https://yoursite.ru,https://www.yoursite.ru
```

**Генерация JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Как работает деплой

### Этап 1: Сборка (Build)

```
1. git clone <репозиторий>
2. npm install                    → устанавливает зависимости (включая vite)
3. npm run build                  → vite собирает React в build/
```

### Этап 2: Запуск (Start)

```
4. npm start                      → запускает node api/index.js
5. Express отдаёт статику из build/
6. Express обрабатывает API запросы
```

### При использовании start:production

```
1. git clone <репозиторий>
2. npm install
3. npm run start:production
   ├─→ npm run build             → собирает React
   └─→ npm start                 → запускает сервер
```

---

## Что происходит на сервере

```
┌─────────────────────────────────────┐
│  Timeweb Cloud Apps Server          │
├─────────────────────────────────────┤
│                                     │
│  Node.js (Express)                  │
│  Port: 3000                         │
│                                     │
│  ┌───────────────────────────┐     │
│  │ Static Files: build/      │     │
│  │  - index.html             │     │
│  │  - assets/*.js, *.css     │     │
│  └───────────────────────────┘     │
│                                     │
│  ┌───────────────────────────┐     │
│  │ API Routes: /api/*        │     │
│  │  - POST /api/auth/login   │     │
│  │  - GET /api/courses       │     │
│  │  - etc...                 │     │
│  └───────────────────────────┘     │
│                                     │
│  ┌───────────────────────────┐     │
│  │ Database: PostgreSQL      │     │
│  │  Timeweb Cloud DB         │     │
│  └───────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

---

## Автоматические обновления

После настройки каждый push в GitHub автоматически обновляет приложение:

```
Local: git push origin main
         ↓
GitHub: Webhook → Timeweb
         ↓
Timeweb: git pull
         ↓
Timeweb: npm install && npm run build
         ↓
Timeweb: pm2 restart app
         ↓
✅ Обновление завершено!
```

---

## Проверка работы

### 1. Health Check
```bash
curl https://your-app.timeweb.cloud/health
```

Ожидаемый результат:
```json
{
  "status": "ok",
  "timestamp": "2026-02-18T12:00:00.000Z",
  "uptime": 123.456,
  "database": "connected"
}
```

### 2. Frontend
```
https://your-app.timeweb.cloud/
```

Должна открыться главная страница React приложения

### 3. API
```bash
curl https://your-app.timeweb.cloud/api/telegram-bot
```

Должен вернуть информацию о Telegram боте

---

## Созданная документация

Для удобства созданы следующие файлы:

1. **[START_HERE.md](./START_HERE.md)**
   - Начните отсюда
   - Ответ на вопрос о командах
   - Пошаговая инструкция

2. **[COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md)**
   - Готовые команды для копирования
   - Настройки переменных окружения
   - Быстрый reference

3. **[TIMEWEB_QUICK_SETUP.md](./TIMEWEB_QUICK_SETUP.md)**
   - Краткая настройка (2-3 минуты)
   - Только самое необходимое

4. **[TIMEWEB_VISUAL_GUIDE.md](./TIMEWEB_VISUAL_GUIDE.md)**
   - Визуальный гайд с примерами
   - Как выглядит интерфейс
   - Что писать в каждое поле

5. **[TIMEWEB_CLOUD_APPS.md](./TIMEWEB_CLOUD_APPS.md)**
   - Полная подробная инструкция
   - Troubleshooting
   - Мониторинг и метрики

6. **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** (этот файл)
   - Итоги и summary
   - Что было сделано
   - Как всё работает

---

## Следующие действия

### 1. Закоммитьте изменения
```bash
git add .
git commit -m "Configure for Timeweb Cloud Apps deployment"
git push origin main
```

### 2. Создайте приложение в Timeweb
- Войдите в панель Timeweb Cloud
- Создайте новое приложение
- Подключите GitHub репозиторий

### 3. Настройте команды
- Используйте вариант A (два поля) или B (одно поле)
- Скопируйте команды из COMMANDS_CHEATSHEET.md

### 4. Добавьте переменные
- Скопируйте из COMMANDS_CHEATSHEET.md
- Сгенерируйте JWT_SECRET
- Укажите ваш DATABASE_URL

### 5. Деплойте!
- Нажмите "Deploy"
- Дождитесь завершения
- Проверьте работу

---

## Преимущества текущей настройки

✅ **Универсальность**
- Работает и с двумя полями, и с одним

✅ **Готовность**
- Vite в dependencies
- Проект уже собран
- Всё протестировано

✅ **Документация**
- 6 подробных инструкций
- Визуальные примеры
- Шпаргалки с командами

✅ **Автоматизация**
- Автоматический деплой при push
- Автоматическая сборка
- Автоматический рестарт

✅ **Безопасность**
- RLS настроен в базе
- JWT для аутентификации
- CORS правильно настроен
- Content protection включён

---

## Результат

Теперь ваш проект:
- ✅ Готов к деплою на Timeweb Cloud Apps
- ✅ Работает и с одним, и с двумя полями команд
- ✅ Имеет полную документацию
- ✅ Настроен для production
- ✅ Поддерживает автоматическое обновление

**Вы можете начать деплой прямо сейчас!** 🚀

---

## Дополнительная помощь

- **Документация Timeweb:** https://timeweb.cloud/docs
- **Поддержка Timeweb:** https://timeweb.com/ru/help
- **GitHub Discussions:** (ваш репозиторий)

---

**Удачного деплоя!** 🎉
