# Добавлены зависимости для API сервера

## Что было сделано

### 1. Создан отдельный `package.json` для API

**Файл:** `api/package.json`

Содержит **только** зависимости для backend:
- `express` - веб-сервер
- `cors` - кросс-доменные запросы
- `pg` - PostgreSQL клиент
- `dotenv` - переменные окружения
- `jsonwebtoken` - JWT аутентификация
- `multer` - загрузка файлов

### 2. Обновлен скрипт деплоя

**Файл:** `deploy.sh`

Теперь:
1. Устанавливает зависимости API: `cd api && npm install --omit=dev`
2. Собирает frontend
3. Удаляет dev-зависимости frontend (экономия места)

### 3. Созданы инструкции

- **`api/README.md`** - как установить и запустить API
- **`MANUAL_API_SETUP.md`** - установка без терминала через FTP
- **`API_CHECKLIST.md`** - чеклист проверки API

## Почему это важно

**Проблема:** На продакшн сервере может быть установлен только frontend (статика), но не работает backend API.

**Причина:** Не были установлены npm пакеты в `api/node_modules/`

**Решение:** Теперь есть отдельный `package.json` в папке `api/` который можно установить независимо от frontend.

## Как использовать

### На сервере с терминалом:
```bash
cd api
npm install --omit=dev
cd ..
pm2 restart keykurs-api
```

### Без терминала (через FTP):
1. Локально: `cd api && npm install --omit=dev`
2. Заархивировать: `tar -czf api-deps.tar.gz node_modules`
3. Загрузить на сервер через FTP
4. Распаковать в `api/node_modules/`

### Через панель Timeweb Cloud Apps:
- Создать приложение Node.js
- Команда старта: `node api/index.js`
- Timeweb автоматически установит зависимости

## Проверка

```bash
# Проверить что зависимости установлены
ls api/node_modules/express
ls api/node_modules/pg

# Проверить что API работает
curl http://localhost:3000/health
```

## Размеры

- `api/node_modules/` весит ~45 MB
- Содержит 112 пакетов (включая транзитивные зависимости)
- Без dev-зависимостей (линтеры, тесты не нужны на продакшене)
