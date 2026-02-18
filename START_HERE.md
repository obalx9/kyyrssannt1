# 🚀 Начните отсюда - Деплой на Timeweb Cloud Apps

## Ответ на ваш вопрос

> "Как указать команды npm install && npm run build и node api/index.js если там только одна строка при деплое?"

### Ответ: Зависит от интерфейса Timeweb

Timeweb Cloud Apps может иметь **два варианта** интерфейса:

---

## ✅ Вариант 1: Два поля (Build Command + Start Command)

Если вы видите **два отдельных поля**:

```
Build Command:  npm install && npm run build
Start Command:  npm start
```

**Это лучший вариант!** Разделение сборки и запуска.

---

## ✅ Вариант 2: Одно поле (только Start Command)

Если вы видите **только одно поле**:

```
Start Command:  npm run start:production
```

**Это тоже работает!** Команда `start:production` автоматически выполнит сборку и запуск.

---

## Что было сделано

1. **Vite перемещён в dependencies**
   - Раньше: `devDependencies` → Vite не устанавливался на проде
   - Теперь: `dependencies` → Vite доступен для сборки

2. **Добавлен скрипт start:production**
   - Выполняет `npm run build` и затем `npm start`
   - Используется когда есть только одно поле для команды

3. **Проект пересобран**
   - Папка `build/` содержит новую сборку без Supabase
   - Готов к деплою на Timeweb

---

## Следующие шаги

### Шаг 1: Закоммитьте изменения

```bash
git add .
git commit -m "Configure for Timeweb Cloud Apps deployment"
git push origin main
```

### Шаг 2: Создайте приложение в Timeweb

1. Войдите в панель Timeweb Cloud
2. Перейдите в "Cloud Apps" или "Приложения"
3. Нажмите "Создать приложение"
4. Подключите GitHub репозиторий

### Шаг 3: Настройте команды

**Если два поля:**
- Build: `npm install && npm run build`
- Start: `npm start`

**Если одно поле:**
- Start: `npm run start:production`

### Шаг 4: Добавьте переменные окружения

```
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...ваш_url...
JWT_SECRET=...генерируем_командой_ниже...
ALLOWED_ORIGINS=https://yoursite.ru
```

Сгенерируйте JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Шаг 5: Запустите деплой

Нажмите "Deploy" или "Создать" - Timeweb автоматически развернёт приложение!

---

## 📚 Документация

Мы создали несколько инструкций для вас:

1. **[COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md)** - Готовые команды для копирования
2. **[TIMEWEB_QUICK_SETUP.md](./TIMEWEB_QUICK_SETUP.md)** - Краткая настройка (2 минуты)
3. **[TIMEWEB_VISUAL_GUIDE.md](./TIMEWEB_VISUAL_GUIDE.md)** - Визуальный гайд с примерами
4. **[TIMEWEB_CLOUD_APPS.md](./TIMEWEB_CLOUD_APPS.md)** - Полная подробная инструкция

---

## ⚡ Быстрый старт (прямо сейчас!)

```bash
# 1. Закоммитьте изменения
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Сгенерируйте JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Идите в Timeweb Cloud Apps и создайте приложение
# 4. Используйте команды из шпаргалки выше
# 5. Готово!
```

---

## ✅ Что уже готово

- ✅ Vite в dependencies
- ✅ Скрипт start:production создан
- ✅ Проект собран и протестирован
- ✅ Документация подготовлена
- ✅ Готово к деплою!

---

## ❓ Частые вопросы

### В Timeweb есть поле "Install Command"?

Это поле для команды установки зависимостей. Обычно по умолчанию `npm install`.
- Если есть - оставьте `npm install`
- Build Command: `npm run build`
- Start Command: `npm start`

### Что делать если деплой падает с ошибкой "vite not found"?

Убедитесь что:
1. Изменения закоммичены и запушены
2. В package.json `vite` находится в `dependencies`
3. Timeweb установил зависимости (проверьте логи)

### Как посмотреть логи?

В панели Timeweb найдите раздел "Logs" или "Логи" для вашего приложения.

---

## 🆘 Нужна помощь?

1. **Проверьте логи** в панели Timeweb
2. **Откройте одну из инструкций** выше
3. **Проверьте переменные окружения** - все ли указаны?

---

**Удачи с деплоем! Теперь у вас есть всё необходимое.** 🎉
