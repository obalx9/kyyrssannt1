# 📚 Backend API Деплой на Timeweb - Индекс документации

Вся информация для деплоя backend-api на Timeweb Cloud Apps собрана здесь.

---

## 🎯 Быстрый старт (5 минут)

Если вы спешите:

1. **Прочитайте:** [`BACKEND_QUICK_REFERENCE.md`](BACKEND_QUICK_REFERENCE.md)
   - TL;DR все основные команды
   - Копируемые значения
   - Быстрая проверка

2. **Скопируйте готовые значения** из [`BACKEND_DEPLOY_COPY_PASTE.txt`](BACKEND_DEPLOY_COPY_PASTE.txt)
   - Команда сборки
   - Команда запуска
   - Путь проверки
   - Готовый список переменных

3. **Развернуть в панели Timeweb:**
   - Окружение: Node.js 24
   - Фреймворк: Express
   - Заполнить команды и переменные (из файла выше)
   - Нажать "Развернуть"

4. **Проверить:** `https://your-api.timeweb.app/health`

Готово! ✅

---

## 📖 Полное руководство

### 1. **BACKEND_TIMEWEB_VISUAL.md** 📸
   Для тех кто хочет визуальную инструкцию:
   - Скриншоты всех полей в панели
   - Пошаговые картинки
   - Где что искать в Timeweb
   - Типичные проблемы и их решения

   **Читать если:** Вы никогда не деплоили на Timeweb

### 2. **BACKEND_DEPLOY_COPY_PASTE.txt** 📋
   Готовые значения для копирования:
   - Команда сборки: `npm install`
   - Команда запуска: `pm2 start --no-daemon index.js`
   - Путь проверки: `/health`
   - Шаблон переменных окружения

   **Используйте:** Для копирования в панель Timeweb

### 3. **TIMEWEB_BACKEND_DEPLOY_SETTINGS.md** ⚙️
   Детальное описание всех параметров:
   - Что означает каждое поле
   - Как получить DATABASE_URL
   - Как генерировать JWT_SECRET
   - Какие переменные обязательны

   **Читать если:** Нужно понять ЧТО и ПОЧЕМУ

### 4. **BACKEND_QUICK_REFERENCE.md** ⚡
   Шпаргалка на одной странице:
   - TL;DR версия
   - Таблица со всеми командами
   - Быстрые ссылки
   - Проверка после деплоя
   - API endpoints

   **Читать если:** Уже знаете что делать, нужна шпаргалка

### 5. **BACKEND_FAQ.md** 🤔
   Ответы на часто задаваемые вопросы:
   - Какую версию Node.js?
   - Как получить DATABASE_URL?
   - Что если приложение упадёт?
   - Как обновить код?
   - Что делать если не работает?

   **Читать если:** У вас есть конкретный вопрос

### 6. **.env.timeweb.example** 🔐
   Шаблон переменных окружения:
   - Готовый формат всех переменных
   - Комментарии как заполнять
   - Примеры значений
   - Инструкция по использованию

   **Используйте:** Как справочник при заполнении переменных

---

## 📊 Структура проекта

```
project/ (корень репозитория)
├── backend-api/                    ← ДЕПЛОИТСЯ НА TIMEWEB
│   ├── index.js                    ← Главное приложение
│   ├── package.json                ← Зависимости
│   ├── package-lock.json           ← Версии пакетов
│   ├── .env.example                ← Шаблон переменных
│   └── README.md                   ← Документация API
│
├── src/                            ← Фронтенд (React, отдельный деплой)
│   ├── components/
│   ├── pages/
│   └── ...
│
├── BACKEND_API_DEPLOY_INDEX.md     ← ВЫ ЗДЕСЬ (индекс)
├── BACKEND_QUICK_REFERENCE.md      ← Быстрая справка
├── BACKEND_DEPLOY_COPY_PASTE.txt   ← Готовые значения
├── BACKEND_FAQ.md                  ← Вопросы и ответы
├── BACKEND_TIMEWEB_VISUAL.md       ← С картинками
├── TIMEWEB_BACKEND_DEPLOY_SETTINGS.md ← Подробно
└── .env.timeweb.example            ← Шаблон переменных
```

---

## 🚀 Пошаговый процесс деплоя

### Этап 1: Подготовка (5 минут)

```
Шаг 1: Откройте BACKEND_QUICK_REFERENCE.md
Шаг 2: Получите DATABASE_URL из Timeweb БД
Шаг 3: Сгенерируйте JWT_SECRET (openssl rand -hex 32)
Шаг 4: Подготовьте домены для ALLOWED_ORIGINS
```

### Этап 2: Создание приложения в Timeweb (3 минуты)

```
Шаг 1: https://timeweb.cloud/
Шаг 2: Облачные приложения → Создать приложение
Шаг 3: Выбрать Node.js 24
Шаг 4: Выбрать Express
Шаг 5: Подключить GitHub (obalx9/kyyrssannt, ветка main)
```

### Этап 3: Заполнение формы (5 минут)

```
Используйте: BACKEND_DEPLOY_COPY_PASTE.txt

Командия сборки:        npm install
Команда запуска:        pm2 start --no-daemon index.js
Путь проверки состояния: /health
```

### Этап 4: Переменные окружения (5 минут)

```
Используйте: .env.timeweb.example

Добавить 5 переменных:
1. DATABASE_URL = ...
2. JWT_SECRET = ...
3. NODE_ENV = production
4. PORT = 3000
5. ALLOWED_ORIGINS = ...
```

### Этап 5: Развертывание и проверка (5 минут)

```
Шаг 1: Нажать кнопку "Развернуть"
Шаг 2: Ждать 2-5 минут (смотрите логи)
Шаг 3: Проверить: https://your-api.timeweb.app/health
Шаг 4: Открыть диагностику: https://your-api.timeweb.app/api/diagnostics
```

**Итого: 23-28 минут на весь процесс** (включая время ожидания деплоя)

---

## ✅ Чеклист перед деплоем

### Подготовка
- [ ] Проверил структуру `/backend-api` (есть index.js, package.json)
- [ ] Убедился что это ветка `main` и актуальная версия
- [ ] Получил DATABASE_URL из Timeweb БД
- [ ] Сгенерировал JWT_SECRET (криптостойкий)
- [ ] Знаю домены своего фронтенда для ALLOWED_ORIGINS

### В панели Timeweb
- [ ] Выбрал Node.js 24
- [ ] Выбрал Express
- [ ] Подключил GitHub репозиторий
- [ ] Выбрал ветку main
- [ ] Вставил команду сборки: `npm install`
- [ ] Вставил команду запуска: `pm2 start --no-daemon index.js`
- [ ] Вставил путь проверки: `/health`
- [ ] Добавил все 5 переменных окружения
- [ ] Проверил что все переменные заполнены правильно
- [ ] Нажал кнопку "Развернуть"

### После деплоя
- [ ] Приложение стартовало (смотрю статус в логах)
- [ ] Проверил здоровье: `https://your-api/health`
- [ ] Открыл диагностику: `https://your-api/api/diagnostics`
- [ ] Проверил подключение к БД: `https://your-api/api/db-check`
- [ ] Все зелёный (no errors)

---

## 🔗 Связь с фронтенд-приложением

Если у вас отдельное фронтенд приложение на Timeweb:

### На фронтенде (.env)
```
VITE_API_URL=https://backend-api.timeweb.app
```

### На фронтенде (код)
```javascript
const response = await fetch(
  `${import.meta.env.VITE_API_URL}/api/courses`,
  {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }
);
```

### На бэкенде (переменная)
```
ALLOWED_ORIGINS=https://frontend.timeweb.app,http://localhost:5173
```

Всё! Фронт может запрашивать данные от бэка! ✅

---

## 🧪 Тестирование API

### Проверка здоровья
```bash
curl https://your-api.timeweb.app/health
# Должно вернуть: {"status":"ok","timestamp":"..."}
```

### Проверка конфигурации
```bash
curl https://your-api.timeweb.app/api/env-check
# Показывает какие переменные установлены
```

### Проверка БД
```bash
curl https://your-api.timeweb.app/api/db-check
# Показывает подключена ли база
```

### Диагностика (в браузере)
```
https://your-api.timeweb.app/api/diagnostics
# Красивая HTML страница с полной диагностикой
```

---

## 🐛 Если что-то не работает

### Шаг 1: Проверьте диагностику
```
https://your-api.timeweb.app/api/diagnostics
Откройте в браузере - там вся информация!
```

### Шаг 2: Проверьте логи
```
Timeweb панель → Ваше приложение → Логи
Копируйте всё и ищите красные ошибки
```

### Шаг 3: Проверьте переменные
```
https://your-api.timeweb.app/api/env-check
Убедитесь что все переменные установлены
```

### Шаг 4: Прочитайте FAQ
```
BACKEND_FAQ.md
Там ответы на все популярные проблемы
```

### Шаг 5: Обновите информацию
```
Может вы забыли что-то:
- DATABASE_URL неправильный?
- JWT_SECRET не задан?
- ALLOWED_ORIGINS не содержит ваш домен?
```

---

## 📞 Файлы документации (в порядке приоритета)

| Когда читать | Файл | Время |
|---|---|---|
| **Спешу!** | BACKEND_QUICK_REFERENCE.md | 2 мин |
| **Нужны готовые значения** | BACKEND_DEPLOY_COPY_PASTE.txt | 1 мин |
| **Вижу панель впервые** | BACKEND_TIMEWEB_VISUAL.md | 10 мин |
| **Нужны объяснения** | TIMEWEB_BACKEND_DEPLOY_SETTINGS.md | 15 мин |
| **Есть вопрос** | BACKEND_FAQ.md | найти ответ |
| **Заполняю переменные** | .env.timeweb.example | справочник |

---

## 🎓 Что должно получиться

### После успешного деплоя:

```
✅ Backend API работает на:
   https://your-api.timeweb.app

✅ Доступны все эндпоинты:
   /health
   /api/diagnostics
   /api/env-check
   /api/db-check
   /api/db-tables
   /api/telegram-auth
   /api/courses
   /api/users
   ... и остальное

✅ БД подключена и работает
✅ Переменные окружения установлены
✅ CORS настроен правильно
✅ Фронтенд может запрашивать данные
✅ Telegram авторизация работает
```

---

## 📝 Дополнительные ссылки

- **Timeweb документация:** https://docs.timeweb.cloud/
- **Node.js документация:** https://nodejs.org/docs/
- **Express документация:** https://expressjs.com/
- **PostgreSQL документация:** https://www.postgresql.org/docs/
- **JWT документация:** https://jwt.io/

---

## 🚀 Успехов!

Если вы прочитали всё - вы готовы к деплою!

Начните с [`BACKEND_QUICK_REFERENCE.md`](BACKEND_QUICK_REFERENCE.md) → копируйте значения → развертывайте → проверяйте! ✨

**Вопросы?** → [`BACKEND_FAQ.md`](BACKEND_FAQ.md)

**Проблемы?** → [`BACKEND_TIMEWEB_VISUAL.md`](BACKEND_TIMEWEB_VISUAL.md) (с картинками)

**Детали?** → [`TIMEWEB_BACKEND_DEPLOY_SETTINGS.md`](TIMEWEB_BACKEND_DEPLOY_SETTINGS.md)

Вы это сможете! 💪
