import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

console.log('🔍 Проверка подключения к базе данных...\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

async function testDatabase() {
  try {
    // Тест 1: Проверка подключения
    console.log('\n1️⃣ Проверка подключения...');
    const timeResult = await pool.query('SELECT NOW() as now, version() as version');
    console.log('   ✅ Подключение успешно!');
    console.log('   📅 Время сервера:', timeResult.rows[0].now);
    console.log('   🗄️  PostgreSQL:', timeResult.rows[0].version.split(' ').slice(0, 2).join(' '));

    // Тест 2: Список таблиц
    console.log('\n2️⃣ Проверка таблиц...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  Таблицы не найдены! Нужно выполнить миграции.');
    } else {
      console.log(`   ✅ Найдено таблиц: ${tablesResult.rows.length}`);
      tablesResult.rows.forEach(row => {
        console.log(`      - ${row.table_name}`);
      });
    }

    // Тест 3: Проверка ключевых таблиц
    console.log('\n3️⃣ Проверка структуры...');
    const requiredTables = [
      'users',
      'sellers',
      'students',
      'courses',
      'posts',
      'enrollments',
      'telegram_bots'
    ];

    const existingTables = tablesResult.rows.map(r => r.table_name);
    let missingTables = [];

    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ✅ ${table} (записей: ${countResult.rows[0].count})`);
      } else {
        console.log(`   ❌ ${table} - не найдена`);
        missingTables.push(table);
      }
    }

    // Итоги
    console.log('\n' + '='.repeat(60));
    if (missingTables.length === 0 && existingTables.length > 0) {
      console.log('✅ База данных настроена правильно!');
      console.log('🚀 Приложение готово к работе.');
    } else if (existingTables.length === 0) {
      console.log('⚠️  База данных пуста!');
      console.log('📝 Выполните миграции:');
      console.log('   cd timeweb-migrations && bash apply-all.sh');
    } else if (missingTables.length > 0) {
      console.log('⚠️  Не хватает таблиц:', missingTables.join(', '));
      console.log('📝 Выполните миграции:');
      console.log('   cd timeweb-migrations && bash apply-all.sh');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 База данных не доступна:');
      console.log('   - Проверьте DATABASE_URL в .env файле');
      console.log('   - Убедитесь что база данных запущена');
      console.log('   - Для локальной разработки запустите PostgreSQL');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Неверный хост базы данных:');
      console.log('   - Проверьте DATABASE_URL в .env файле');
    } else if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Неверный пароль:');
      console.log('   - Проверьте DATABASE_URL в .env файле');
    }
  } finally {
    await pool.end();
  }
}

testDatabase();
