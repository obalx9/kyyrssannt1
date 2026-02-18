# Быстрый деплой на Timeweb - БЕЗ Supabase

⚠️ **ВАЖНО:** Проект полностью мигрирован с Supabase. Теперь используется только PostgreSQL на Timeweb.

## 1️⃣ Подготовка на локальной машине

```bash
# ОБЯЗАТЕЛЬНО соберите проект локально!
npm run build

# Убедитесь, что build/ создан
ls -la build/

# Закоммитьте build/ в git
git add build/
git commit -m "Add production build"
git push
```

**Почему это важно?**
В production среде на Timeweb устанавливаются только `dependencies` (без `devDependencies`). Vite находится в `devDependencies`, поэтому его нет в production. Решение - собрать проект локально и закоммитить папку `build/`.

## 2️⃣ На сервере Timeweb

### Подключение

```bash
ssh root@your-server-ip
```

### Установка Node.js и PM2

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PM2
npm install -g pm2

# Nginx
apt install -y nginx
```

### Клонирование проекта

```bash
cd /var/www
git clone https://github.com/yourusername/yourproject.git keykurs
cd keykurs
```

### Установка зависимостей

```bash
npm install --production
npm run build
```

### Создание .env файла

```bash
nano .env
```

Вставьте:

```bash
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://gen_user:TazKqF%3Ed5pF1%7DL@b6440478fef8a38d815bdb5e.twc1.net:5432/default_db?sslmode=verify-full
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ALLOWED_ORIGINS=https://keykurs.ru,https://www.keykurs.ru
```

### Запуск через PM2

```bash
# Создать директорию для логов
mkdir -p logs

# Запустить
pm2 start ecosystem.config.js

# Автозапуск
pm2 startup
pm2 save

# Проверка
pm2 status
pm2 logs keykurs-api
```

## 3️⃣ Настройка Nginx

```bash
nano /etc/nginx/sites-available/keykurs.ru
```

Скопируйте из `nginx-config-example.conf`

```bash
# Активировать
ln -s /etc/nginx/sites-available/keykurs.ru /etc/nginx/sites-enabled/

# Проверить
nginx -t

# Запустить
systemctl restart nginx
```

## 4️⃣ SSL сертификат

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d keykurs.ru -d www.keykurs.ru
```

## 5️⃣ Проверка

```bash
# Local health check
curl http://localhost:3000/health

# External check
curl https://keykurs.ru/health
curl https://keykurs.ru/api/telegram-bot
```

## 6️⃣ Обновление приложения

```bash
cd /var/www/keykurs
./deploy.sh
```

## Готово!

Приложение доступно по адресу: https://keykurs.ru

## Полезные команды

```bash
# PM2
pm2 status
pm2 logs keykurs-api
pm2 restart keykurs-api
pm2 monit

# Nginx
systemctl status nginx
systemctl reload nginx
tail -f /var/log/nginx/keykurs_error.log

# База данных
psql "$DATABASE_URL"
```
