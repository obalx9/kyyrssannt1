#!/bin/bash

echo "🚀 Запуск API сервера..."

cd /tmp/cc-agent/63617554/project

export DATABASE_URL="postgresql://gen_user:Global!16@a6e6285d9957acb308f354f9.twc1.net:5432/default_db?sslmode=require"
export JWT_SECRET="a7f2c8e9b1d4f6a3c5e7b9d2f4a6c8e1b3d5f7a9c2e4b6d8f1a3c5e7b9d2f4a6c8e1b3d5f7a9c2e4b6d8f1a3c5e7b9d2f4a6"
export PORT=3000
export NODE_ENV=production
export ALLOWED_ORIGINS="https://keykurs.ru,https://www.keykurs.ru"

node api/index.js 2>&1 &

API_PID=$!

echo "✅ API запущен (PID: $API_PID)"
echo ""

sleep 3

echo "🔍 Проверка health endpoint..."
curl -s http://localhost:3000/health | python3 -m json.tool
echo ""

echo "🔍 Проверка подключения к БД..."
curl -s http://localhost:3000/api/db-check
echo ""

kill $API_PID 2>/dev/null
wait $API_PID 2>/dev/null

echo "✅ Готово"
