# Деплой через Timeweb Cloud Apps (GitHub Integration)

## Что такое Timeweb Cloud Apps?

Timeweb Cloud Apps - это платформа для автоматического деплоя Node.js приложений из GitHub (аналог Heroku/Vercel).

---

## 🎯 Быстрая настройка

### Вариант 1: ДВА ПОЛЯ (Build + Start команды)

Если в панели Timeweb есть два отдельных поля:

**Команда сборки (Build Command):**
```
npm install && npm run build
```

**Команда запуска (Start Command):**
```
npm start
```

### Вариант 2: ОДНО ПОЛЕ (только Start команда)

Если есть только одно поле для команды запуска:

**Команда запуска:**
```
npm run start:production
```

Эта команда автоматически:
1. Собирает проект (`npm run build`)
2. Запускает сервер (`npm start`)

---

## 📋 Пошаговая инструкция

### Шаг 1: Подготовка проекта

Vite и @vitejs/plugin-react уже перемещены в `dependencies`, поэтому проект готов к деплою!

**Проверьте:**
```bash
# Локально пересоберите проект
npm install
npm run build

# Убедитесь что build/ создан
ls -la build/
```

### Шаг 2: Закоммитьте изменения

```bash
git add .
git commit -m "Prepare for Timeweb Cloud Apps deployment"
git push origin main
```

### Шаг 3: Создайте приложение в Timeweb Cloud Apps

1. Войдите в панель Timeweb
2. Перейдите в раздел **"Cloud Apps"** или **"Приложения"**
3. Нажмите **"Создать приложение"**
4. Выберите **"Из репозитория GitHub"**

### Шаг 4: Подключите GitHub репозиторий

1. Авторизуйтесь в GitHub
2. Выберите ваш репозиторий
3. Выберите ветку (обычно `main` или `master`)
4. Укажите корневую директорию: `/` (или оставьте пустым)

### Шаг 5: Настройте команды сборки и запуска

**Если есть ДВА поля:**

| Поле | Значение |
|------|----------|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

**Если есть ОДНО поле:**

| Поле | Значение |
|------|----------|
| Start Command | `npm run start:production` |

### Шаг 6: Настройте переменные окружения

В разделе **"Environment Variables"** или **"Переменные окружения"** добавьте:

```bash
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://gen_user:TazKqF%3Ed5pF1%7DL@b6440478fef8a38d815bdb5e.twc1.net:5432/default_db?sslmode=verify-full
JWT_SECRET=your-super-secure-secret-key-at-least-64-characters-long-random-string
ALLOWED_ORIGINS=https://your-domain.ru,https://www.your-domain.ru
```

**ВАЖНО:**
- Замените `DATABASE_URL` на ваш реальный URL базы данных Timeweb
- Замените `JWT_SECRET` на случайную строку минимум 64 символа
- Замените `ALLOWED_ORIGINS` на ваш реальный домен

**Как сгенерировать JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Шаг 7: Запустите деплой

1. Нажмите **"Создать"** или **"Deploy"**
2. Timeweb начнет автоматический деплой:
   - Клонирует репозиторий
   - Установит зависимости
   - Соберет проект
   - Запустит сервер

### Шаг 8: Проверьте работу

После успешного деплоя:

1. Откройте URL вашего приложения (будет предоставлен Timeweb)
2. Проверьте health endpoint: `https://your-app.timeweb.cloud/health`
3. Проверьте работу приложения: `https://your-app.timeweb.cloud/`

---

## 🔄 Автоматическое обновление

Timeweb Cloud Apps автоматически обновляет приложение при каждом push в GitHub:

```bash
# Внесите изменения
git add .
git commit -m "Update feature"
git push origin main

# Timeweb автоматически:
# 1. Обнаружит изменения
# 2. Пересоберет проект
# 3. Перезапустит сервер
```

---

## ⚙️ Настройка домена

### Добавление собственного домена

1. В панели Timeweb перейдите в настройки приложения
2. Найдите раздел **"Domains"** или **"Домены"**
3. Добавьте ваш домен: `keykurs.ru`
4. Добавьте также `www.keykurs.ru`

### Настройка DNS

В панели управления доменом добавьте DNS записи:

**Для корневого домена (`keykurs.ru`):**
```
Type: A
Name: @
Value: [IP адрес предоставленный Timeweb]
```

**Для www (`www.keykurs.ru`):**
```
Type: CNAME
Name: www
Value: [домен предоставленный Timeweb, например your-app.timeweb.cloud]
```

### SSL сертификат

Timeweb автоматически получит SSL сертификат от Let's Encrypt для вашего домена!

---

## 🐛 Troubleshooting

### Ошибка: "vite: not found"

**Проблема:** Vite не найден при сборке

**Решение:** Убедитесь что `vite` и `@vitejs/plugin-react` в `dependencies` (не в `devDependencies`)

Мы уже это исправили! Проверьте `package.json`:
```json
"dependencies": {
  ...
  "vite": "^5.4.2",
  "@vitejs/plugin-react": "^4.3.1"
}
```

### Ошибка: "Missing Supabase environment variables"

**Проблема:** Старая сборка требует Supabase переменные

**Решение:** Пересоберите проект локально и закоммитьте новую сборку:

```bash
npm run build
git add build/
git commit -m "Update build without Supabase"
git push
```

### Ошибка: "CORS policy"

**Проблема:** Фронтенд не может обратиться к API

**Решение:** Проверьте переменную `ALLOWED_ORIGINS`:

```bash
ALLOWED_ORIGINS=https://keykurs.ru,https://www.keykurs.ru
```

Убедитесь что указаны ВСЕ домены (с https://)

### Ошибка: "Database connection failed"

**Проблема:** Не удается подключиться к базе данных

**Решение:**
1. Проверьте `DATABASE_URL` в переменных окружения
2. Убедитесь что база данных доступна из интернета
3. Проверьте что пароль правильно закодирован (используйте URL encoding)

Пример правильного URL:
```
postgresql://gen_user:TazKqF%3Ed5pF1%7DL@b6440478fef8a38d815bdb5e.twc1.net:5432/default_db?sslmode=verify-full
```

### Приложение не запускается

**Проверьте логи:**
1. В панели Timeweb найдите раздел **"Logs"** или **"Логи"**
2. Посмотрите последние ошибки
3. Исправьте проблему и сделайте новый push

**Частые причины:**
- Отсутствуют переменные окружения
- Неправильный `DATABASE_URL`
- Отсутствует папка `build/` в репозитории

---

## 📊 Мониторинг

### Просмотр логов

В панели Timeweb:
1. Откройте ваше приложение
2. Перейдите в раздел **"Logs"**
3. Выберите временной диапазон

### Метрики производительности

Timeweb показывает:
- CPU usage
- Memory usage
- Network traffic
- Response time

### Проверка здоровья приложения

```bash
# Health check endpoint
curl https://your-app.timeweb.cloud/health

# Должен вернуть:
{
  "status": "ok",
  "timestamp": "2026-02-18T10:00:00.000Z",
  "uptime": 123.456,
  "database": "connected"
}
```

---

## 💰 Тарифы и ограничения

### Бесплатный тариф
- ⚠️ Может иметь ограничения по CPU/RAM
- ⚠️ Может засыпать при отсутствии трафика

### Платные тарифы
- ✅ Гарантированные ресурсы
- ✅ Всегда активен (no sleep)
- ✅ Автомасштабирование
- ✅ Приоритетная поддержка

---

## 🎉 Готово!

После выполнения всех шагов ваше приложение:
- ✅ Автоматически деплоится при каждом push
- ✅ Работает на производительном сервере
- ✅ Имеет SSL сертификат
- ✅ Подключено к базе данных Timeweb
- ✅ Доступно по вашему домену

---

## 📚 Дополнительные ресурсы

- [Документация Timeweb Cloud](https://timeweb.cloud/docs)
- [Поддержка Timeweb](https://timeweb.com/ru/help)
- [GitHub Integration Guide](https://timeweb.cloud/docs/apps/github)

---

## 🆘 Нужна помощь?

Если что-то не работает:
1. Проверьте логи в панели Timeweb
2. Убедитесь что все переменные окружения настроены
3. Проверьте что база данных доступна
4. Обратитесь в поддержку Timeweb

**Удачного деплоя! 🚀**
