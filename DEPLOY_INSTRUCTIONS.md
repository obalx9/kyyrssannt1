# Инструкция по деплою на Timeweb

## Быстрый старт

1. **Загрузите проект на сервер**
```bash
git clone <ваш-репозиторий>
cd project
npm install
```

2. **Настройте .env файл**
```bash
nano .env
```

Добавьте:
```
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/keykurs
JWT_SECRET=ваш-очень-секретный-ключ-минимум-32-символа
ALLOWED_ORIGINS=https://keykurs.ru,https://www.keykurs.ru
```

3. **Создайте базу данных**
```bash
cd timeweb-migrations
chmod +x apply-all.sh
./apply-all.sh
```

4. **Соберите проект**
```bash
npm run build
```

5. **Запустите сервер**
```bash
npm start
```

## Настройка PM2 (рекомендуется)

```bash
# Установить PM2
npm install -g pm2

# Запустить приложение
pm2 start npm --name "keykurs" -- start

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Просмотр логов
pm2 logs keykurs

# Перезапуск
pm2 restart keykurs
```

## Настройка Nginx

Создайте файл `/etc/nginx/sites-available/keykurs.ru`:

```nginx
server {
    listen 80;
    server_name keykurs.ru www.keykurs.ru;

    # Загруженные файлы
    location /uploads/ {
        alias /home/user/project/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Статика фронтенда
    location / {
        root /home/user/project/build;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public";
    }
}
```

Активируйте конфиг:
```bash
sudo ln -s /etc/nginx/sites-available/keykurs.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL сертификат (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d keykurs.ru -d www.keykurs.ru
```

## Проверка работоспособности

1. Откройте https://keykurs.ru
2. Должна открыться главная страница
3. Попробуйте войти через Telegram
4. Создайте курс (если вы seller)

## Обновление приложения

```bash
cd /home/user/project
git pull
npm install
npm run build
pm2 restart keykurs
```

## Backup базы данных

```bash
# Создать backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Восстановить backup
psql $DATABASE_URL < backup_20260218.sql
```

## Troubleshooting

### Белый экран
- Проверьте `console.log` в браузере
- Убедитесь что `npm run build` прошёл успешно
- Проверьте что nginx отдаёт правильные файлы

### Ошибки API
- Проверьте `pm2 logs keykurs`
- Убедитесь что DATABASE_URL правильный
- Проверьте что база данных доступна

### Не работает загрузка файлов
- Проверьте права на папку `uploads/`: `chmod 755 uploads/`
- Убедитесь что в nginx правильный путь к `uploads/`
