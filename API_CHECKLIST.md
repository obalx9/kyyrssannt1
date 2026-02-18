# Чеклист проверки API на сервере

## ✅ Что должно быть установлено

### 1. Файлы на сервере
- [ ] `api/index.js` - главный файл API
- [ ] `api/package.json` - описание зависимостей
- [ ] `api/node_modules/` - папка с установленными пакетами
- [ ] `.env` - файл с переменными окружения (в корне)
- [ ] `ecosystem.config.js` - конфигурация PM2

### 2. Зависимости в `api/node_modules/`
- [ ] `express/` - веб-сервер
- [ ] `pg/` - PostgreSQL клиент
- [ ] `cors/` - CORS middleware
- [ ] `dotenv/` - переменные окружения
- [ ] `jsonwebtoken/` - JWT токены
- [ ] `multer/` - загрузка файлов

### 3. Проверка через браузер

```
https://keykurs.ru/health
```

**Если работает:** вернет JSON с `status: "ok"`

**Если НЕ работает:**
- API не запущен
- Зависимости не установлены
- Nginx неправильно настроен

## 🔧 Как установить зависимости

### Способ 1: Автоматически (если есть доступ)
```bash
cd api
npm install --omit=dev
```

### Способ 2: Через FTP (без терминала)

1. **На локальном компьютере:**
   ```bash
   cd api
   npm install --omit=dev
   tar -czf api-deps.tar.gz node_modules
   ```

2. **Загрузить на сервер:**
   - Подключиться через FTP/SFTP
   - Загрузить `api-deps.tar.gz` в папку `api/`
   - Распаковать на сервере

3. **Проверить размер:**
   - `api/node_modules/` должна весить ~40-50 MB

### Способ 3: Через панель Timeweb Cloud Apps

1. Создать новое приложение (Node.js)
2. Указать команду: `node api/index.js`
3. Timeweb сам установит зависимости

## 🐛 Диагностика проблем

### Ошибка: "Cannot find module 'express'"
**Причина:** не установлены зависимости в `api/node_modules/`

**Решение:**
```bash
cd api
npm install --omit=dev
```

### Ошибка: "Connection refused PostgreSQL"
**Причина:** неправильный `DATABASE_URL` в `.env`

**Решение:** проверить `.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/dbname?sslmode=require
```

### Ошибка: 502 Bad Gateway
**Причина:** PM2 не запущен или API упал

**Решение:**
```bash
pm2 restart keykurs-api
pm2 logs keykurs-api --lines 50
```

## 📊 Размеры файлов

| Компонент | Размер |
|-----------|--------|
| `api/index.js` | ~50 KB |
| `api/node_modules/` | ~45 MB |
| `build/` (frontend) | ~2 MB |
| `.env` | <1 KB |

## 🚀 После установки

1. Перезапустить PM2:
   ```bash
   pm2 restart keykurs-api
   ```

2. Проверить статус:
   ```bash
   pm2 status
   pm2 logs keykurs-api --lines 20
   ```

3. Проверить в браузере:
   ```
   https://keykurs.ru/health
   ```

Должно вернуть:
```json
{
  "status": "ok",
  "timestamp": "2026-02-18T...",
  "database": {
    "connected": true,
    "ssl": true
  }
}
```
