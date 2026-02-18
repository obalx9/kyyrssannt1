#!/bin/bash

set -e

echo "=========================================="
echo "Автоматическая настройка базы данных Timeweb"
echo "=========================================="
echo ""

# Проверка наличия переменных окружения
if [ -f .env ]; then
    echo "✓ Найден файл .env"
    export $(grep -v '^#' .env | grep TIMEWEB_ | xargs)
else
    echo "✗ Файл .env не найден!"
    echo "Текущая директория: $(pwd)"
    echo "Содержимое директории:"
    ls -la
    exit 1
fi

# Проверка обязательных переменных
if [ -z "$TIMEWEB_DB_HOST" ] || [ -z "$TIMEWEB_DB_NAME" ] || [ -z "$TIMEWEB_DB_USER" ] || [ -z "$TIMEWEB_DB_PASSWORD" ]; then
    echo "✗ Не все переменные базы данных установлены в .env"
    echo "Необходимы: TIMEWEB_DB_HOST, TIMEWEB_DB_NAME, TIMEWEB_DB_USER, TIMEWEB_DB_PASSWORD"
    echo ""
    echo "Найденные переменные:"
    echo "  TIMEWEB_DB_HOST: $TIMEWEB_DB_HOST"
    echo "  TIMEWEB_DB_NAME: $TIMEWEB_DB_NAME"
    echo "  TIMEWEB_DB_USER: $TIMEWEB_DB_USER"
    echo "  TIMEWEB_DB_PASSWORD: $(if [ -n "$TIMEWEB_DB_PASSWORD" ]; then echo "[установлен]"; else echo "[НЕ установлен]"; fi)"
    exit 1
fi

echo "Параметры подключения:"
echo "  Хост: $TIMEWEB_DB_HOST"
echo "  База: $TIMEWEB_DB_NAME"
echo "  Пользователь: $TIMEWEB_DB_USER"
echo ""

# Скачивание SSL сертификата
echo "Шаг 1: Настройка SSL сертификата..."
mkdir -p ~/.postgresql
if [ ! -f ~/.postgresql/root.crt ]; then
    # Пробуем скачать сертификат, но не критично если не получится
    if curl -f -o ~/.postgresql/root.crt https://gu-st.timeweb.com/docs-content/images/root.crt 2>/dev/null; then
        echo "✓ SSL сертификат скачан"
    else
        echo "⚠ Не удалось скачать SSL сертификат, будет использоваться sslmode=require"
    fi
else
    echo "✓ SSL сертификат уже существует"
fi
echo ""

# Создание временного файла с объединенными миграциями
echo "Шаг 2: Подготовка миграций..."
MIGRATION_FILE=$(mktemp)

cat > "$MIGRATION_FILE" << 'EOF'
-- ========================================
-- Автоматическая миграция базы данных
-- Создано: $(date)
-- ========================================

BEGIN;

-- Отключаем RLS временно для создания структуры
SET session_replication_role = 'replica';

EOF

# Добавляем все миграции по порядку
for migration in supabase/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "-- Миграция: $(basename $migration)" >> "$MIGRATION_FILE"
        cat "$migration" >> "$MIGRATION_FILE"
        echo "" >> "$MIGRATION_FILE"
        echo "" >> "$MIGRATION_FILE"
    fi
done

cat >> "$MIGRATION_FILE" << 'EOF'

-- Включаем RLS обратно
SET session_replication_role = 'origin';

COMMIT;

-- Вывод статистики
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

EOF

echo "✓ Миграции подготовлены"
echo ""

# Определяем режим SSL
if [ -f ~/.postgresql/root.crt ]; then
    SSL_MODE="sslmode=verify-full"
else
    SSL_MODE="sslmode=require"
fi

# Тестовое подключение
echo "Шаг 3: Проверка подключения к базе данных..."
if PGPASSWORD="$TIMEWEB_DB_PASSWORD" psql \
    "host=$TIMEWEB_DB_HOST port=5432 dbname=$TIMEWEB_DB_NAME user=$TIMEWEB_DB_USER $SSL_MODE" \
    -c "SELECT version();" > /dev/null 2>&1; then
    echo "✓ Подключение успешно"
else
    echo "✗ Не удалось подключиться к базе данных"
    echo "Проверьте параметры подключения в .env"
    rm "$MIGRATION_FILE"
    exit 1
fi
echo ""

# Применение миграций
echo "Шаг 4: Применение миграций..."
echo "Это может занять несколько минут..."
echo ""

if PGPASSWORD="$TIMEWEB_DB_PASSWORD" psql \
    "host=$TIMEWEB_DB_HOST port=5432 dbname=$TIMEWEB_DB_NAME user=$TIMEWEB_DB_USER $SSL_MODE" \
    -f "$MIGRATION_FILE"; then
    echo ""
    echo "✓ Миграции успешно применены"
else
    echo ""
    echo "✗ Ошибка при применении миграций"
    rm "$MIGRATION_FILE"
    exit 1
fi

# Очистка
rm "$MIGRATION_FILE"

echo ""
echo "=========================================="
echo "✓ База данных успешно настроена!"
echo "=========================================="
echo ""
echo "Следующие шаги:"
echo "1. Проверьте, что все таблицы созданы"
echo "2. Настройте Supabase Edge Functions (если нужно)"
echo "3. Обновите строку подключения в приложении"
echo ""
echo "Для проверки таблиц выполните:"
echo "PGPASSWORD=\"\$TIMEWEB_DB_PASSWORD\" psql \"host=\$TIMEWEB_DB_HOST port=5432 dbname=\$TIMEWEB_DB_NAME user=\$TIMEWEB_DB_USER sslmode=verify-full\" -c \"\\dt\""
echo ""
