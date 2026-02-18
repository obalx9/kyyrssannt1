# 🚀 Timeweb Cloud Apps - Быстрая настройка

## Сценарий 1: ДВА поля (Build + Start)

### Команда сборки:
```
npm install && npm run build
```

### Команда запуска:
```
npm start
```

---

## Сценарий 2: ОДНО поле (только Start)

### Команда запуска:
```
npm run start:production
```

---

## Переменные окружения (обязательно!)

```bash
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://gen_user:ТВОЙ_ПАРОЛЬ@b6440478fef8a38d815bdb5e.twc1.net:5432/default_db?sslmode=verify-full
JWT_SECRET=СГЕНЕРИРУЙ_СЛУЧАЙНУЮ_СТРОКУ_64_СИМВОЛА
ALLOWED_ORIGINS=https://твой-домен.ru,https://www.твой-домен.ru
```

### Как сгенерировать JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Что изменилось?

✅ `vite` и `@vitejs/plugin-react` перемещены в `dependencies`
✅ Добавлен скрипт `start:production` для одного поля
✅ Проект пересобран с новой конфигурацией

---

## Готово к деплою!

1. Закоммитьте изменения:
```bash
git add .
git commit -m "Ready for Timeweb Cloud Apps"
git push origin main
```

2. Создайте приложение в Timeweb Cloud Apps
3. Подключите GitHub репозиторий
4. Укажите команды (сценарий 1 или 2)
5. Добавьте переменные окружения
6. Нажмите "Deploy"

🎉 **Готово!** Приложение автоматически развернется!

---

## 📖 Полная документация

Смотрите [TIMEWEB_CLOUD_APPS.md](./TIMEWEB_CLOUD_APPS.md) для подробной инструкции.
