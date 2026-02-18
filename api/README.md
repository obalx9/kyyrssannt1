# Kursat API - Backend

Это API сервер для платформы Kursat.

## Быстрый старт на продакшн сервере

```bash
# 1. Перейти в директорию api
cd api

# 2. Установить зависимости (только production)
npm install --omit=dev

# 3. Проверить что .env файл на месте (в корне проекта)
ls -la ../.env

# 4. Запустить через PM2 (из корня проекта)
cd ..
pm2 start ecosystem.config.js
```

## Зависимости

- **express** - веб-сервер
- **cors** - кросс-доменные запросы
- **dotenv** - переменные окружения
- **pg** - PostgreSQL клиент
- **jsonwebtoken** - JWT токены
- **multer** - загрузка файлов

## Проверка работы

```bash
curl http://localhost:3000/health
```

Должно вернуть:
```json
{
  "status": "ok",
  "database": { "connected": true }
}
```

## Логи

```bash
pm2 logs keykurs-api --lines 100
```
