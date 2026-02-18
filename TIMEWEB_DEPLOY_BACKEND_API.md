# Деплой на Timeweb с Backend API

## Архитектура

```
Timeweb Cloud → Node.js Backend API → PostgreSQL Database
                      ↓
                Frontend (Static)
```

## Шаг 1: Подготовка проекта

### 1.1 Обновите .env.production

```bash
# Production API URL (ваш домен)
VITE_API_URL=https://keykurs.ru
```

### 1.2 Создайте файл конфигурации для production

Создайте `.env.server.production`:

```bash
# Production Backend Configuration
PORT=3000
NODE_ENV=production

# Timeweb PostgreSQL
DATABASE_URL=postgresql://gen_user:TazKqF%3Ed5pF1%7DL@b6440478fef8a38d815bdb5e.twc1.net:5432/default_db?sslmode=verify-full

# JWT Secret (ИСПОЛЬЗУЙТЕ СВОЙ!)
JWT_SECRET=YOUR_SECURE_RANDOM_STRING_HERE

# CORS - разрешенные домены
ALLOWED_ORIGINS=https://keykurs.ru,https://www.keykurs.ru
```

## Шаг 2: Сборка проекта

### 2.1 Локальная сборка

```bash
# Установить зависимости
npm install

# Собрать frontend
npm run build

# Проверить сборку
ls -la build/
```

### 2.2 Структура после сборки

```
project/
├── build/              # Frontend статика
│   ├── index.html
│   └── assets/
├── api/
│   └── index.js       # Backend API
├── package.json
└── node_modules/
```

## Шаг 3: Настройка Timeweb Cloud

### 3.1 Создайте Node.js приложение

1. Войдите в панель Timeweb Cloud
2. Перейдите в "Cloud Servers" → "Создать сервер"
3. Выберите:
   - OS: Ubuntu 22.04
   - Node.js: 18.x или выше
   - Минимум: 1 CPU, 1 GB RAM

### 3.2 Подключитесь к серверу

```bash
ssh root@your-server-ip
```

### 3.3 Установите зависимости

```bash
# Обновить систему
apt update && apt upgrade -y

# Установить Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверить версии
node --version  # должно быть >= 18.0.0
npm --version

# Установить PM2 для управления процессом
npm install -g pm2
```

## Шаг 4: Деплой кода

### 4.1 Вариант A: Через Git (рекомендуется)

```bash
# На сервере
cd /var/www
git clone https://github.com/yourusername/yourproject.git
cd yourproject

# Установить зависимости
npm install --production

# Собрать frontend
npm run build
```

### 4.2 Вариант B: Через SCP/FTP

```bash
# С локальной машины
# Сначала соберите проект локально
npm run build

# Затем загрузите на сервер
scp -r build/ api/ package.json package-lock.json root@your-server-ip:/var/www/yourproject/

# На сервере
cd /var/www/yourproject
npm install --production
```

## Шаг 5: Настройка переменных окружения

### 5.1 Создайте .env на сервере

```bash
cd /var/www/yourproject
nano .env
```

Вставьте:

```bash
PORT=3000
NODE_ENV=production

# Timeweb PostgreSQL
DATABASE_URL=postgresql://gen_user:TazKqF%3Ed5pF1%7DL@b6440478fef8a38d815bdb5e.twc1.net:5432/default_db?sslmode=verify-full

# JWT Secret - СГЕНЕРИРУЙТЕ НОВЫЙ!
JWT_SECRET=$(openssl rand -hex 64)

# CORS
ALLOWED_ORIGINS=https://keykurs.ru,https://www.keykurs.ru
```

### 5.2 Сгенерируйте JWT Secret

```bash
# На сервере
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Скопируйте результат в JWT_SECRET в .env

## Шаг 6: Настройка Nginx (прокси)

### 6.1 Установите Nginx

```bash
apt install -y nginx
```

### 6.2 Создайте конфигурацию

```bash
nano /etc/nginx/sites-available/keykurs.ru
```

Вставьте:

```nginx
server {
    listen 80;
    server_name keykurs.ru www.keykurs.ru;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API requests
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend static files
    location / {
        root /var/www/yourproject/build;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Специальная обработка для assets
    location /assets/ {
        root /var/www/yourproject/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.3 Активируйте конфигурацию

```bash
# Создать симлинк
ln -s /etc/nginx/sites-available/keykurs.ru /etc/nginx/sites-enabled/

# Проверить конфигурацию
nginx -t

# Перезапустить Nginx
systemctl restart nginx
```

## Шаг 7: Запуск Backend API с PM2

### 7.1 Создайте ecosystem.config.js

```bash
cd /var/www/yourproject
nano ecosystem.config.js
```

Вставьте:

```javascript
module.exports = {
  apps: [{
    name: 'keykurs-api',
    script: './api/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/api-error.log',
    out_file: './logs/api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
};
```

### 7.2 Создайте директорию для логов

```bash
mkdir -p logs
```

### 7.3 Запустите приложение

```bash
# Запустить
pm2 start ecosystem.config.js

# Проверить статус
pm2 status

# Посмотреть логи
pm2 logs keykurs-api

# Настроить автозапуск при перезагрузке
pm2 startup
pm2 save
```

## Шаг 8: Настройка SSL (Let's Encrypt)

```bash
# Установить Certbot
apt install -y certbot python3-certbot-nginx

# Получить сертификат
certbot --nginx -d keykurs.ru -d www.keykurs.ru

# Автообновление сертификата
certbot renew --dry-run
```

## Шаг 9: Проверка работы

### 9.1 Проверьте Backend API

```bash
# Health check
curl http://localhost:3000/health

# Telegram bot info (должен вернуть bot_username)
curl http://localhost:3000/api/telegram-bot
```

### 9.2 Проверьте через браузер

```
https://keykurs.ru/health
https://keykurs.ru/api/telegram-bot
https://keykurs.ru/
```

## Шаг 10: Обновление приложения

### 10.1 Скрипт для обновления

Создайте `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Деплой приложения..."

# Остановить PM2
pm2 stop keykurs-api

# Получить последний код
git pull origin main

# Установить зависимости
npm install --production

# Собрать frontend
npm run build

# Запустить PM2
pm2 start ecosystem.config.js

# Проверить статус
pm2 status

echo "✅ Деплой завершен!"
```

Сделайте исполняемым:

```bash
chmod +x deploy.sh
```

### 10.2 Автоматический деплой (опционально)

Создайте webhook для автоматического деплоя при push в Git:

```bash
nano /var/www/yourproject/webhook.js
```

## Мониторинг и обслуживание

### Полезные команды PM2

```bash
# Статус
pm2 status

# Логи
pm2 logs keykurs-api
pm2 logs keykurs-api --lines 100

# Рестарт
pm2 restart keykurs-api

# Остановка
pm2 stop keykurs-api

# Удаление
pm2 delete keykurs-api

# Мониторинг в реальном времени
pm2 monit
```

### Проверка базы данных

```bash
# Подключиться к PostgreSQL
psql "postgresql://gen_user:TazKqF%3Ed5pF1%7DL@b6440478fef8a38d815bdb5e.twc1.net:5432/default_db?sslmode=verify-full"

# Проверить таблицы
\dt

# Выход
\q
```

### Логи Nginx

```bash
# Access log
tail -f /var/log/nginx/access.log

# Error log
tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Проблема: Backend не запускается

```bash
# Проверить логи
pm2 logs keykurs-api --err

# Проверить .env файл
cat .env

# Проверить подключение к БД
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()', (err, res) => { console.log(err || res.rows); pool.end(); })"
```

### Проблема: CORS ошибки

Убедитесь, что ALLOWED_ORIGINS в .env содержит ваш домен:

```bash
ALLOWED_ORIGINS=https://keykurs.ru,https://www.keykurs.ru
```

### Проблема: 502 Bad Gateway

```bash
# Проверить, запущен ли Backend
pm2 status

# Проверить порт
netstat -tulpn | grep 3000

# Перезапустить
pm2 restart keykurs-api
```

## Резервное копирование

### База данных

```bash
# Создать бэкап
pg_dump "postgresql://gen_user:TazKqF%3Ed5pF1%7DL@b6440478fef8a38d815bdb5e.twc1.net:5432/default_db?sslmode=verify-full" > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить
psql "postgresql://..." < backup_20260218_120000.sql
```

### Автоматический бэкап (cron)

```bash
crontab -e
```

Добавьте:

```bash
# Бэкап БД каждый день в 3:00
0 3 * * * pg_dump "postgresql://..." > /var/backups/db_$(date +\%Y\%m\%d).sql
```

## Чеклист деплоя

- [ ] Node.js 18+ установлен
- [ ] PM2 установлен и настроен
- [ ] Nginx установлен и настроен
- [ ] SSL сертификат получен
- [ ] .env файл создан с правильными параметрами
- [ ] JWT_SECRET сгенерирован
- [ ] База данных доступна
- [ ] Backend API запущен через PM2
- [ ] Frontend собран и доступен
- [ ] /health endpoint работает
- [ ] /api/telegram-bot возвращает данные
- [ ] CORS настроен правильно
- [ ] Логи PM2 не показывают ошибок

## Итоговая структура на сервере

```
/var/www/yourproject/
├── api/
│   └── index.js           # Backend API
├── build/                 # Frontend статика
│   ├── index.html
│   └── assets/
├── logs/                  # Логи PM2
│   ├── api-error.log
│   └── api-out.log
├── node_modules/
├── .env                   # Production environment
├── ecosystem.config.js    # PM2 config
├── package.json
└── deploy.sh             # Скрипт деплоя
```

## Команды для быстрого старта

```bash
# 1. Подключиться к серверу
ssh root@your-server-ip

# 2. Клонировать проект
cd /var/www
git clone https://github.com/yourusername/yourproject.git
cd yourproject

# 3. Установить зависимости
npm install --production

# 4. Собрать frontend
npm run build

# 5. Создать .env
nano .env
# (вставить конфигурацию)

# 6. Запустить через PM2
pm2 start ecosystem.config.js
pm2 save

# 7. Настроить Nginx
nano /etc/nginx/sites-available/keykurs.ru
# (вставить конфигурацию)
ln -s /etc/nginx/sites-available/keykurs.ru /etc/nginx/sites-enabled/
systemctl restart nginx

# 8. Получить SSL
certbot --nginx -d keykurs.ru -d www.keykurs.ru

# 9. Проверить
curl https://keykurs.ru/health
```

Готово! Приложение работает на Timeweb.
