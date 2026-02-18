#!/bin/bash

echo "🚀 Начинаем деплой приложения на Timeweb..."

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода ошибок
error_exit() {
    echo -e "${RED}❌ Ошибка: $1${NC}" 1>&2
    exit 1
}

# Проверка, что скрипт запущен из правильной директории
if [ ! -f "package.json" ]; then
    error_exit "package.json не найден. Запустите скрипт из корня проекта."
fi

# Проверка наличия .env файла
if [ ! -f ".env" ]; then
    error_exit ".env файл не найден. Создайте его перед деплоем."
fi

echo -e "${YELLOW}⏸️  Остановка текущего приложения...${NC}"
pm2 stop keykurs-api 2>/dev/null || echo "Приложение не было запущено"

# Обновление кода из Git (если используется)
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 Получение последних изменений из Git...${NC}"
    git pull origin main || error_exit "Не удалось получить изменения из Git"
fi

# Установка зависимостей для API (backend)
echo -e "${YELLOW}📦 Установка зависимостей для API...${NC}"
cd api
npm install --omit=dev || error_exit "Не удалось установить зависимости API"
cd ..

# Установка зависимостей для сборки frontend
echo -e "${YELLOW}📦 Установка зависимостей для frontend...${NC}"
npm install || error_exit "Не удалось установить зависимости"

# Сборка frontend
echo -e "${YELLOW}🔨 Сборка frontend...${NC}"
npm run build || error_exit "Не удалось собрать frontend"

# Очистка dev зависимостей
echo -e "${YELLOW}🧹 Очистка dev зависимостей...${NC}"
rm -rf node_modules
echo "Frontend собран, dev зависимости удалены"

# Проверка наличия директории для логов
if [ ! -d "logs" ]; then
    echo -e "${YELLOW}📁 Создание директории для логов...${NC}"
    mkdir -p logs
fi

# Запуск приложения через PM2
echo -e "${YELLOW}🚀 Запуск приложения через PM2...${NC}"
pm2 start ecosystem.config.js || error_exit "Не удалось запустить приложение"

# Сохранение конфигурации PM2
pm2 save

# Ожидание запуска
sleep 3

# Проверка статуса
echo -e "${YELLOW}📊 Статус приложения:${NC}"
pm2 status

# Проверка health endpoint
echo -e "${YELLOW}🏥 Проверка health endpoint...${NC}"
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API работает!${NC}"
else
    echo -e "${RED}❌ Backend API не отвечает на health check${NC}"
    echo -e "${YELLOW}Проверьте логи: pm2 logs keykurs-api${NC}"
fi

# Перезапуск Nginx (опционально)
if command -v nginx &> /dev/null; then
    echo -e "${YELLOW}🔄 Перезапуск Nginx...${NC}"
    sudo systemctl reload nginx || echo "Не удалось перезапустить Nginx"
fi

echo -e "${GREEN}✅ Деплой завершен успешно!${NC}"
echo ""
echo "Полезные команды:"
echo "  pm2 status              - проверить статус"
echo "  pm2 logs keykurs-api    - посмотреть логи"
echo "  pm2 restart keykurs-api - перезапустить"
echo "  pm2 monit               - мониторинг в реальном времени"
