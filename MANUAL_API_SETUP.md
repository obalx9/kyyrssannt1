# Ручная установка API на сервере Timeweb

Если у вас нет доступа к терминалу и нужно установить зависимости через панель управления Timeweb.

## Проблема

На сервере может работать только frontend (статика), но не работает API потому что:
- Не установлены npm пакеты для backend
- PM2 не может запустить `api/index.js` без зависимостей

## Решение через панель Timeweb

### Вариант 1: Загрузить node_modules для API

1. **Локально на вашем компьютере:**
   ```bash
   cd api
   npm install --omit=dev
   zip -r api-node-modules.zip node_modules
   ```

2. **Загрузить через FTP/SFTP:**
   - Подключиться к серверу через FileZilla/WinSCP
   - Загрузить `api-node-modules.zip` в папку `/api/`
   - Распаковать архив на сервере

3. **Проверить структуру:**
   ```
   /home/username/keykurs.ru/
   ├── api/
   │   ├── index.js
   │   ├── package.json
   │   └── node_modules/     ← должна быть эта папка
   │       ├── express/
   │       ├── pg/
   │       ├── cors/
   │       └── ...
   ├── build/
   ├── .env
   └── ecosystem.config.js
   ```

### Вариант 2: Использовать Cloud Apps в Timeweb

Timeweb Cloud Apps автоматически устанавливает зависимости:

1. Зайти в панель Timeweb
2. Создать новое приложение Cloud Apps (Node.js)
3. Указать команду старта: `node api/index.js`
4. Timeweb автоматически запустит `npm install`

### Вариант 3: Запросить SSH доступ

Написать в поддержку Timeweb с просьбой:
- Предоставить SSH доступ к серверу
- Или попросить техподдержку выполнить команды:
  ```bash
  cd /home/username/keykurs.ru/api
  npm install --omit=dev
  ```

## Проверка что API работает

После установки зависимостей:

1. **Перезапустить PM2:**
   - Через панель управления Timeweb → Cloud Apps → Restart

2. **Проверить через браузер:**
   ```
   https://keykurs.ru/health
   ```

   Должно вернуть:
   ```json
   {
     "status": "ok",
     "database": { "connected": true }
   }
   ```

## Список файлов которые нужны на сервере

```
api/
├── index.js                 (главный файл API)
├── package.json            (описание зависимостей)
└── node_modules/           (установленные пакеты)
    ├── express/
    ├── pg/
    ├── cors/
    ├── dotenv/
    ├── jsonwebtoken/
    └── multer/
```

## Минимальные требования

- **Node.js**: 18.x или выше
- **npm**: 9.x или выше
- **Память**: минимум 512 MB для PM2
- **Диск**: ~50 MB для node_modules API
