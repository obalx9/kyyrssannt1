# ⚡ Быстрый ответ на ваш вопрос

## Вопрос
> "Как указать команды npm install && npm run build и node api/index.js если там только одна строка при деплое?"

---

## Ответ

### Если у вас **ДВА поля** в Timeweb Cloud Apps:

#### Build Command (Команда сборки):
```
npm install && npm run build
```

#### Start Command (Команда запуска):
```
npm start
```

---

### Если у вас **ОДНО поле** в Timeweb Cloud Apps:

#### Start Command (Команда запуска):
```
npm run start:production
```

**Что делает эта команда?**
1. Выполняет `npm run build` (собирает React с помощью Vite)
2. Выполняет `npm start` (запускает Node.js сервер)

---

## Что было сделано

✅ **Vite перемещён в dependencies**
- Теперь Vite доступен в production окружении
- Команда `npm run build` будет работать на сервере Timeweb

✅ **Добавлен скрипт start:production**
- Объединяет сборку и запуск в одну команду
- Используется когда в интерфейсе только одно поле

✅ **Проект готов к деплою**
- Всё протестировано локально
- Документация создана
- Можно деплоить прямо сейчас

---

## Следующие шаги

### 1. Закоммитьте изменения
```bash
git add .
git commit -m "Configure for Timeweb Cloud Apps"
git push origin main
```

### 2. Создайте приложение в Timeweb Cloud Apps
- Подключите GitHub репозиторий
- Укажите команду из раздела выше (в зависимости от количества полей)

### 3. Добавьте переменные окружения
```
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://ваш_url
JWT_SECRET=сгенерируйте_64_символа
ALLOWED_ORIGINS=https://ваш-домен.ru
```

### 4. Запустите деплой
Нажмите "Deploy" - готово!

---

## Подробная документация

- **[START_HERE.md](./START_HERE.md)** - Полная инструкция с объяснениями
- **[COMMANDS_CHEATSHEET.md](./COMMANDS_CHEATSHEET.md)** - Все команды для копирования
- **[TIMEWEB_VISUAL_GUIDE.md](./TIMEWEB_VISUAL_GUIDE.md)** - Визуальные примеры интерфейса
- **[DOCS_INDEX.md](./DOCS_INDEX.md)** - Полный индекс всей документации

---

**Готово! Теперь у вас есть всё для успешного деплоя.** 🚀
