# 📋 Шпаргалка команд для Timeweb Cloud Apps

## Копируйте и вставляйте команды ниже

---

## Если в Timeweb есть ДВА поля

### Поле "Build Command" (Команда сборки):
```
npm install && npm run build
```

### Поле "Start Command" (Команда запуска):
```
npm start
```

---

## Если в Timeweb есть ОДНО поле

### Поле "Start Command" (Команда запуска):
```
npm run start:production
```

---

## Переменные окружения (Environment Variables)

### PORT
```
3000
```

### NODE_ENV
```
production
```

### DATABASE_URL
Замените на ваш реальный URL базы данных:
```
postgresql://gen_user:ВАШ_ПАРОЛЬ@ВАШ_ХОСТ.twc1.net:5432/default_db?sslmode=verify-full
```

### JWT_SECRET
Сгенерируйте командой (в терминале):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Скопируйте результат и вставьте в переменную окружения.

### ALLOWED_ORIGINS
Замените на ваш домен:
```
https://yoursite.ru,https://www.yoursite.ru
```

---

## Перед деплоем выполните локально

### 1. Установите зависимости
```bash
npm install
```

### 2. Соберите проект
```bash
npm run build
```

### 3. Закоммитьте изменения
```bash
git add .
git commit -m "Ready for Timeweb deployment"
git push origin main
```

---

## После деплоя проверьте

### Health check (замените URL)
```bash
curl https://your-app.timeweb.cloud/health
```

### Telegram bot info
```bash
curl https://your-app.timeweb.cloud/api/telegram-bot
```

---

## Обновление приложения

```bash
git add .
git commit -m "Update app"
git push origin main
```

Timeweb автоматически обновит приложение!

---

## Полезные ссылки

- **Быстрая настройка:** [TIMEWEB_QUICK_SETUP.md](./TIMEWEB_QUICK_SETUP.md)
- **Подробная инструкция:** [TIMEWEB_CLOUD_APPS.md](./TIMEWEB_CLOUD_APPS.md)
- **Визуальный гайд:** [TIMEWEB_VISUAL_GUIDE.md](./TIMEWEB_VISUAL_GUIDE.md)
