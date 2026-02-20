import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir, readFile } from 'fs/promises';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const uploadsDir = join(__dirname, 'uploads');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

mkdir(uploadsDir, { recursive: true }).catch(console.error);

app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const courseId = req.body.courseId;
    const lessonId = req.body.lessonId;
    const destPath = lessonId
      ? join(uploadsDir, courseId, lessonId)
      : join(uploadsDir, courseId);

    mkdir(destPath, { recursive: true })
      .then(() => cb(null, destPath))
      .catch(err => cb(err, null));
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

let sslConfig = false;
if (process.env.NODE_ENV === 'production') {
  sslConfig = { rejectUnauthorized: false };
  console.log('✅ SSL enabled with rejectUnauthorized: false');
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

let dbConnectionStatus = { connected: false, error: null, lastCheck: null };

async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW(), version(), current_database()');
    dbConnectionStatus = {
      connected: true,
      error: null,
      lastCheck: new Date().toISOString(),
      serverTime: result.rows[0].now,
      version: result.rows[0].version,
      database: result.rows[0].current_database
    };
    console.log('✅ Database connected successfully');
    return dbConnectionStatus;
  } catch (error) {
    dbConnectionStatus = {
      connected: false,
      error: error.message,
      lastCheck: new Date().toISOString()
    };
    console.error('❌ Database connection failed:', error.message);
    return dbConnectionStatus;
  }
}

checkDatabaseConnection();

function verifyTelegramAuth(data, botToken) {
  const { hash, ...userData } = data;

  const dataCheckString = Object.keys(userData)
    .sort()
    .map(key => `${key}=${userData[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return hmac === hash;
}

function generateJWT(userId, telegramId) {
  return jwt.sign(
    { userId, telegramId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as server_time, version() as pg_version, current_database() as database_name');
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    res.json({
      status: 'connected',
      connection: 'ok',
      database: result.rows[0].database_name,
      serverTime: result.rows[0].server_time,
      postgresVersion: result.rows[0].pg_version,
      tablesCount: parseInt(tablesResult.rows[0].table_count),
      message: 'База данных подключена успешно'
    });
  } catch (error) {
    console.error('Database check error:', error);
    res.status(500).json({
      status: 'error',
      connection: 'failed',
      error: error.message,
      code: error.code,
      message: 'Ошибка подключения к базе данных',
      hint: 'Проверьте DATABASE_URL в файле .env'
    });
  }
});

app.get('/api/db-tables', async (req, res) => {
  try {
    const tablesResult = await pool.query(`
      SELECT
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = [];
    for (const table of tablesResult.rows) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        tables.push({
          name: table.table_name,
          columns: parseInt(table.column_count),
          rows: parseInt(countResult.rows[0].count)
        });
      } catch (err) {
        tables.push({
          name: table.table_name,
          columns: parseInt(table.column_count),
          rows: 'error',
          error: err.message
        });
      }
    }

    res.json({
      status: 'success',
      totalTables: tables.length,
      tables: tables,
      message: 'Структура базы данных получена'
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      message: 'Ошибка при получении структуры БД'
    });
  }
});

app.get('/api/env-check', (req, res) => {
  const envStatus = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DATABASE_URL_preview: process.env.DATABASE_URL ?
      process.env.DATABASE_URL.substring(0, 20) + '...' : 'не установлен',
    JWT_SECRET: !!process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV || 'не установлен',
    PORT: process.env.PORT || 3000,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'не установлен'
  };

  const allRequired = envStatus.DATABASE_URL && envStatus.JWT_SECRET;

  res.json({
    status: allRequired ? 'ok' : 'warning',
    environment: envStatus,
    message: allRequired ?
      'Все необходимые переменные окружения установлены' :
      'Некоторые переменные окружения не установлены'
  });
});

app.get('/api/diagnostics', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Диагностика подключения к БД</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .section {
      margin-bottom: 25px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .section h2 {
      color: #333;
      margin-bottom: 15px;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s;
      margin-right: 10px;
      margin-bottom: 10px;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .result {
      margin-top: 15px;
      padding: 15px;
      background: white;
      border-radius: 6px;
      border: 1px solid #ddd;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 400px;
      overflow-y: auto;
    }
    .success { color: #28a745; font-weight: bold; }
    .error { color: #dc3545; font-weight: bold; }
    .warning { color: #ffc107; font-weight: bold; }
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .hidden { display: none; }
    .emoji { font-size: 20px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f1f3f5;
      font-weight: 600;
      color: #495057;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-error { background: #f8d7da; color: #721c24; }
    .badge-info { background: #d1ecf1; color: #0c5460; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Диагностика подключения к PostgreSQL</h1>
    <p class="subtitle">Проверка связи между сайтом и базой данных на Таймвеб</p>

    <div class="section">
      <h2><span class="emoji">🔌</span> Проверка подключения к БД</h2>
      <button onclick="checkDB()">Проверить подключение</button>
      <div id="db-result" class="result hidden"></div>
    </div>

    <div class="section">
      <h2><span class="emoji">📋</span> Структура таблиц</h2>
      <button onclick="checkTables()">Показать таблицы</button>
      <div id="tables-result" class="result hidden"></div>
    </div>

    <div class="section">
      <h2><span class="emoji">⚙️</span> Переменные окружения</h2>
      <button onclick="checkEnv()">Проверить конфигурацию</button>
      <div id="env-result" class="result hidden"></div>
    </div>

    <div class="section">
      <h2><span class="emoji">🚀</span> Полная диагностика</h2>
      <button onclick="runFullDiagnostics()">Запустить полную проверку</button>
      <div id="full-result" class="result hidden"></div>
    </div>
  </div>

  <script>
    async function checkDB() {
      const resultDiv = document.getElementById('db-result');
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = '<div class="spinner"></div> Проверка подключения...';

      try {
        const response = await fetch('/api/db-check');
        const data = await response.json();

        if (data.status === 'connected') {
          resultDiv.innerHTML = \`<div class="success">✅ УСПЕШНО ПОДКЛЮЧЕНО</div>

База данных: \${data.database}
Версия PostgreSQL: \${data.postgresVersion}
Время сервера: \${data.serverTime}
Количество таблиц: \${data.tablesCount}

\${data.message}\`;
        } else {
          resultDiv.innerHTML = \`<div class="error">❌ ОШИБКА ПОДКЛЮЧЕНИЯ</div>

Ошибка: \${data.error}
Код ошибки: \${data.code || 'N/A'}

\${data.message}
\${data.hint || ''}\`;
        }
      } catch (error) {
        resultDiv.innerHTML = \`<div class="error">❌ ОШИБКА ЗАПРОСА</div>

Не удалось выполнить запрос к серверу.
Ошибка: \${error.message}

Возможные причины:
- Сервер API не запущен
- Неверный URL сервера
- Проблемы с сетью\`;
      }
    }

    async function checkTables() {
      const resultDiv = document.getElementById('tables-result');
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = '<div class="spinner"></div> Загрузка структуры БД...';

      try {
        const response = await fetch('/api/db-tables');
        const data = await response.json();

        if (data.status === 'success') {
          let tableHtml = \`<div class="success">✅ Найдено таблиц: \${data.totalTables}</div>\n\n\`;

          if (data.tables.length > 0) {
            tableHtml += '<table><tr><th>Таблица</th><th>Колонок</th><th>Строк</th></tr>';
            data.tables.forEach(table => {
              tableHtml += \`<tr><td>\${table.name}</td><td>\${table.columns}</td><td>\${table.rows}</td></tr>\`;
            });
            tableHtml += '</table>';
          } else {
            tableHtml += \`<div class="warning">⚠️ ТАБЛИЦ НЕ НАЙДЕНО</div>

Это означает, что миграции не были применены.
Пожалуйста, примените SQL миграции из папки timeweb-migrations через панель управления Таймвеб.\`;
          }

          resultDiv.innerHTML = tableHtml;
        } else {
          resultDiv.innerHTML = \`<div class="error">❌ ОШИБКА</div>\n\n\${data.error}\`;
        }
      } catch (error) {
        resultDiv.innerHTML = \`<div class="error">❌ ОШИБКА ЗАПРОСА</div>\n\n\${error.message}\`;
      }
    }

    async function checkEnv() {
      const resultDiv = document.getElementById('env-result');
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = '<div class="spinner"></div> Проверка конфигурации...';

      try {
        const response = await fetch('/api/env-check');
        const data = await response.json();

        const statusClass = data.status === 'ok' ? 'success' : 'warning';
        const statusEmoji = data.status === 'ok' ? '✅' : '⚠️';

        let html = \`<div class="\${statusClass}">\${statusEmoji} \${data.message}</div>\n\n\`;
        html += 'Переменные окружения:\n\n';
        html += \`DATABASE_URL: \${data.environment.DATABASE_URL ? '✅ установлен' : '❌ не установлен'}\n\`;
        html += \`  Превью: \${data.environment.DATABASE_URL_preview}\n\n\`;
        html += \`JWT_SECRET: \${data.environment.JWT_SECRET ? '✅ установлен' : '❌ не установлен'}\n\`;
        html += \`NODE_ENV: \${data.environment.NODE_ENV}\n\`;
        html += \`PORT: \${data.environment.PORT}\n\`;
        html += \`ALLOWED_ORIGINS: \${data.environment.ALLOWED_ORIGINS}\n\`;

        resultDiv.innerHTML = html;
      } catch (error) {
        resultDiv.innerHTML = \`<div class="error">❌ ОШИБКА ЗАПРОСА</div>\n\n\${error.message}\`;
      }
    }

    async function runFullDiagnostics() {
      const resultDiv = document.getElementById('full-result');
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = '<div class="spinner"></div> Выполнение полной диагностики...';

      let report = '═══════════════════════════════════════\n';
      report += '   ПОЛНАЯ ДИАГНОСТИКА СИСТЕМЫ\n';
      report += '═══════════════════════════════════════\n\n';

      try {
        report += '1️⃣ Проверка переменных окружения...\n';
        const envResponse = await fetch('/api/env-check');
        const envData = await envResponse.json();
        report += envData.status === 'ok' ? '   ✅ OK\n\n' : '   ⚠️ Предупреждение\n\n';

        report += '2️⃣ Проверка подключения к БД...\n';
        const dbResponse = await fetch('/api/db-check');
        const dbData = await dbResponse.json();
        if (dbData.status === 'connected') {
          report += '   ✅ Подключение успешно\n';
          report += \`   База: \${dbData.database}\n\`;
          report += \`   Таблиц: \${dbData.tablesCount}\n\n\`;
        } else {
          report += '   ❌ Ошибка подключения\n';
          report += \`   Ошибка: \${dbData.error}\n\n\`;
        }

        report += '3️⃣ Проверка структуры таблиц...\n';
        const tablesResponse = await fetch('/api/db-tables');
        const tablesData = await tablesResponse.json();
        if (tablesData.status === 'success') {
          report += \`   ✅ Найдено таблиц: \${tablesData.totalTables}\n\n\`;

          if (tablesData.totalTables === 0) {
            report += '   ⚠️ ВНИМАНИЕ: Таблиц не найдено!\n';
            report += '   Необходимо применить миграции.\n\n';
          } else {
            report += '   Основные таблицы:\n';
            const mainTables = ['users', 'courses', 'sellers', 'students', 'telegram_bots'];
            mainTables.forEach(tableName => {
              const table = tablesData.tables.find(t => t.name === tableName);
              if (table) {
                report += \`   ✅ \${tableName} (\${table.rows} записей)\n\`;
              } else {
                report += \`   ❌ \${tableName} - не найдена\n\`;
              }
            });
            report += '\n';
          }
        } else {
          report += '   ❌ Ошибка получения таблиц\n\n';
        }

        report += '═══════════════════════════════════════\n';

        if (dbData.status === 'connected' && tablesData.totalTables > 0) {
          report += '✅ СИСТЕМА ГОТОВА К РАБОТЕ\n';
        } else if (dbData.status === 'connected' && tablesData.totalTables === 0) {
          report += '⚠️ ТРЕБУЕТСЯ ПРИМЕНИТЬ МИГРАЦИИ\n';
          report += '\nИнструкция:\n';
          report += '1. Войдите в панель Таймвеб\n';
          report += '2. Откройте раздел "Базы данных"\n';
          report += '3. Выберите вашу БД PostgreSQL\n';
          report += '4. Откройте SQL редактор\n';
          report += '5. Примените файлы из папки timeweb-migrations:\n';
          report += '   - 01_create_auth_system.sql\n';
          report += '   - 02_create_platform_schema.sql\n';
          report += '   - 03_setup_rls_policies.sql\n';
          report += '   - 04_add_additional_features.sql\n';
        } else {
          report += '❌ ТРЕБУЕТСЯ НАСТРОЙКА\n';
          report += '\nПроверьте:\n';
          report += '1. DATABASE_URL в файле .env\n';
          report += '2. Доступность БД PostgreSQL\n';
          report += '3. Правильность учетных данных\n';
        }

        resultDiv.innerHTML = report;
      } catch (error) {
        resultDiv.innerHTML = \`<div class="error">❌ ОШИБКА</div>\n\n\${error.message}\`;
      }
    }
  </script>
</body>
</html>
  `;

  res.send(html);
});

app.get('/api/telegram-bot', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT bot_username, bot_token, channel_id FROM telegram_bots ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.json({ bot_username: null });
    }

    res.json({ bot_username: result.rows[0].bot_username });
  } catch (error) {
    console.error('Error fetching bot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/telegram-bot/webhook-info', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT bot_token FROM telegram_bots ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not configured' });
    }

    const botToken = result.rows[0].bot_token;
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error('Error fetching webhook info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/telegram-auth', async (req, res) => {
  try {
    const telegramData = req.body;

    const botResult = await pool.query(
      'SELECT bot_token FROM telegram_bots ORDER BY created_at DESC LIMIT 1'
    );

    if (botResult.rows.length === 0) {
      return res.status(500).json({ error: 'Bot not configured' });
    }

    const botToken = botResult.rows[0].bot_token;

    if (!verifyTelegramAuth(telegramData, botToken)) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        `INSERT INTO users (telegram_id, telegram_username, first_name, last_name, photo_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (telegram_id)
         DO UPDATE SET
           telegram_username = EXCLUDED.telegram_username,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           photo_url = EXCLUDED.photo_url
         RETURNING id, telegram_id, telegram_username, first_name, last_name, photo_url`,
        [
          telegramData.id,
          telegramData.username || null,
          telegramData.first_name,
          telegramData.last_name || null,
          telegramData.photo_url || null,
        ]
      );

      const user = userResult.rows[0];

      const roleCheck = await client.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [user.id]
      );

      if (roleCheck.rows.length === 0) {
        await client.query(
          'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
          [user.id, 'student']
        );
      }

      const rolesResult = await client.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [user.id]
      );

      await client.query('COMMIT');

      const token = generateJWT(user.id, user.telegram_id);

      res.json({
        token,
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          telegram_username: user.telegram_username,
          first_name: user.first_name,
          last_name: user.last_name,
          photo_url: user.photo_url,
          roles: rolesResult.rows.map(r => r.role),
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in telegram auth:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT id, telegram_id, telegram_username, first_name, last_name, photo_url
       FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rolesResult = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [req.user.userId]
    );

    const user = userResult.rows[0];

    res.json({
      id: user.id,
      telegram_id: user.telegram_id,
      telegram_username: user.telegram_username,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url,
      roles: rolesResult.rows.map(r => r.role),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, s.business_name as seller_name
       FROM courses c
       JOIN sellers s ON c.seller_id = s.id
       WHERE c.is_published = true
       ORDER BY c.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;

    const courseResult = await pool.query(
      `SELECT c.*, s.business_name as seller_name
       FROM courses c
       JOIN sellers s ON c.seller_id = s.id
       WHERE c.id = $1`,
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(courseResult.rows[0]);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/courses', authenticateToken, async (req, res) => {
  try {
    const { title, description, price, is_published, telegram_group_id, theme_config, watermark_text } = req.body;

    const sellerResult = await pool.query(
      'SELECT id FROM sellers WHERE user_id = $1',
      [req.user.userId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(403).json({ error: 'User is not a seller' });
    }

    const result = await pool.query(
      `INSERT INTO courses (seller_id, title, description, price, is_published, telegram_group_id, theme_config, watermark_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [sellerResult.rows[0].id, title, description, price, is_published || false, telegram_group_id, theme_config || {}, watermark_text]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, price, is_published, telegram_group_id, theme_config, watermark_text } = req.body;

    const sellerResult = await pool.query(
      'SELECT id FROM sellers WHERE user_id = $1',
      [req.user.userId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(403).json({ error: 'User is not a seller' });
    }

    const result = await pool.query(
      `UPDATE courses
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           is_published = COALESCE($4, is_published),
           telegram_group_id = COALESCE($5, telegram_group_id),
           theme_config = COALESCE($6, theme_config),
           watermark_text = COALESCE($7, watermark_text),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND seller_id = $9
       RETURNING *`,
      [title, description, price, is_published, telegram_group_id, theme_config, watermark_text, courseId, sellerResult.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;

    const sellerResult = await pool.query(
      'SELECT id FROM sellers WHERE user_id = $1',
      [req.user.userId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(403).json({ error: 'User is not a seller' });
    }

    const result = await pool.query(
      'DELETE FROM courses WHERE id = $1 AND seller_id = $2 RETURNING id',
      [courseId, sellerResult.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found or unauthorized' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/courses/:id/posts', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const { limit = 50, offset = 0 } = req.query;

    const enrollmentCheck = await pool.query(
      `SELECT ce.id FROM course_enrollments ce
       WHERE ce.course_id = $1 AND ce.student_id IN (
         SELECT id FROM students WHERE user_id = $2
       )`,
      [courseId, req.user.userId]
    );

    const sellerCheck = await pool.query(
      `SELECT c.id FROM courses c
       JOIN sellers s ON c.seller_id = s.id
       WHERE c.id = $1 AND s.user_id = $2`,
      [courseId, req.user.userId]
    );

    if (enrollmentCheck.rows.length === 0 && sellerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not enrolled or not course owner' });
    }

    const result = await pool.query(
      `SELECT cp.*,
              (SELECT json_agg(json_build_object(
                'id', cpm.id,
                'media_type', cpm.media_type,
                'file_path', cpm.file_path,
                'telegram_file_id', cpm.telegram_file_id,
                'thumbnail_path', cpm.thumbnail_path,
                'file_size', cpm.file_size,
                'mime_type', cpm.mime_type,
                'duration', cpm.duration,
                'width', cpm.width,
                'height', cpm.height,
                'caption', cpm.caption,
                'display_order', cpm.display_order
              ) ORDER BY cpm.display_order)
               FROM course_post_media cpm
               WHERE cpm.post_id = cp.id) as media
       FROM course_posts cp
       WHERE cp.course_id = $1
       ORDER BY cp.created_at DESC
       LIMIT $2 OFFSET $3`,
      [courseId, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/courses/:id/posts', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const { text_content, media_group_id, media } = req.body;

    const sellerResult = await pool.query(
      `SELECT s.id FROM sellers s
       JOIN courses c ON c.seller_id = s.id
       WHERE c.id = $1 AND s.user_id = $2`,
      [courseId, req.user.userId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to post to this course' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const postResult = await client.query(
        `INSERT INTO course_posts (course_id, text_content, media_group_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [courseId, text_content, media_group_id]
      );

      const post = postResult.rows[0];

      if (media && media.length > 0) {
        for (let i = 0; i < media.length; i++) {
          const m = media[i];
          await client.query(
            `INSERT INTO course_post_media
             (post_id, media_type, file_path, telegram_file_id, thumbnail_path, file_size, mime_type, duration, width, height, caption, display_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [post.id, m.media_type, m.file_path, m.telegram_file_id, m.thumbnail_path, m.file_size, m.mime_type, m.duration, m.width, m.height, m.caption, i]
          );
        }
      }

      await client.query('COMMIT');

      const fullPostResult = await pool.query(
        `SELECT cp.*,
                (SELECT json_agg(json_build_object(
                  'id', cpm.id,
                  'media_type', cpm.media_type,
                  'file_path', cpm.file_path,
                  'telegram_file_id', cpm.telegram_file_id,
                  'thumbnail_path', cpm.thumbnail_path,
                  'file_size', cpm.file_size,
                  'mime_type', cpm.mime_type,
                  'duration', cpm.duration,
                  'width', cpm.width,
                  'height', cpm.height,
                  'caption', cpm.caption,
                  'display_order', cpm.display_order
                ) ORDER BY cpm.display_order)
                 FROM course_post_media cpm
                 WHERE cpm.post_id = cp.id) as media
         FROM course_posts cp
         WHERE cp.id = $1`,
        [post.id]
      );

      res.json(fullPostResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;

    const postCheck = await pool.query(
      `SELECT cp.id FROM course_posts cp
       JOIN courses c ON cp.course_id = c.id
       JOIN sellers s ON c.seller_id = s.id
       WHERE cp.id = $1 AND s.user_id = $2`,
      [postId, req.user.userId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await pool.query('DELETE FROM course_posts WHERE id = $1', [postId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const roleCheck = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 AND role = $2',
      [req.user.userId, 'super_admin']
    );
    if (roleCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [usersResult, sellersResult, coursesResult, pendingResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM sellers WHERE is_approved = true'),
      pool.query('SELECT COUNT(*) as count FROM courses'),
      pool.query('SELECT COUNT(*) as count FROM sellers WHERE is_approved = false'),
    ]);

    res.json({
      totalUsers: parseInt(usersResult.rows[0].count),
      totalSellers: parseInt(sellersResult.rows[0].count),
      totalCourses: parseInt(coursesResult.rows[0].count),
      pendingSellers: parseInt(pendingResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/sellers/pending', authenticateToken, async (req, res) => {
  try {
    const roleCheck = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 AND role = $2',
      [req.user.userId, 'super_admin']
    );
    if (roleCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT s.id, s.business_name, s.description, s.is_approved,
              u.first_name, u.last_name, u.telegram_username
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       WHERE s.is_approved = false
       ORDER BY s.created_at ASC`
    );

    const sellers = result.rows.map(row => ({
      id: row.id,
      business_name: row.business_name,
      description: row.description,
      is_approved: row.is_approved,
      user: {
        first_name: row.first_name,
        last_name: row.last_name,
        telegram_username: row.telegram_username,
      },
    }));

    res.json(sellers);
  } catch (error) {
    console.error('Error fetching pending sellers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/admin/sellers/:id/approve', authenticateToken, async (req, res) => {
  try {
    const roleCheck = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 AND role = $2',
      [req.user.userId, 'super_admin']
    );
    if (roleCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'UPDATE sellers SET is_approved = true WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error approving seller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/sellers/:id', authenticateToken, async (req, res) => {
  try {
    const roleCheck = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 AND role = $2',
      [req.user.userId, 'super_admin']
    );
    if (roleCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const sellerResult = await pool.query(
      'SELECT user_id FROM sellers WHERE id = $1',
      [req.params.id]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const sellerId = req.params.id;
    const userId = sellerResult.rows[0].user_id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM sellers WHERE id = $1', [sellerId]);
      await client.query(
        "DELETE FROM user_roles WHERE user_id = $1 AND role = 'seller'",
        [userId]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting seller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sellers/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sellers WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching seller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sellers', authenticateToken, async (req, res) => {
  try {
    const { business_name, description, contact_email, telegram_channel } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO sellers (user_id, business_name, description, contact_email, telegram_channel)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user.userId, business_name, description, contact_email, telegram_channel]
      );

      await client.query(
        `INSERT INTO user_roles (user_id, role)
         VALUES ($1, 'seller')
         ON CONFLICT (user_id, role) DO NOTHING`,
        [req.user.userId]
      );

      await client.query('COMMIT');

      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating seller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sellers/me/courses', authenticateToken, async (req, res) => {
  try {
    const sellerResult = await pool.query(
      'SELECT id FROM sellers WHERE user_id = $1',
      [req.user.userId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(403).json({ error: 'User is not a seller' });
    }

    const result = await pool.query(
      `SELECT c.*, COUNT(ce.id) as enrollment_count
       FROM courses c
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id
       WHERE c.seller_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [sellerResult.rows[0].id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching seller courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/students/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM students WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      const insertResult = await pool.query(
        'INSERT INTO students (user_id) VALUES ($1) RETURNING *',
        [req.user.userId]
      );
      return res.json(insertResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/students/me/enrollments', authenticateToken, async (req, res) => {
  try {
    const studentResult = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [req.user.userId]
    );

    if (studentResult.rows.length === 0) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT c.*, s.business_name as seller_name, ce.enrolled_at
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       JOIN sellers s ON c.seller_id = s.id
       WHERE ce.student_id = $1
       ORDER BY ce.enrolled_at DESC`,
      [studentResult.rows[0].id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/courses/:id/students', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;

    const sellerCheck = await pool.query(
      `SELECT c.id FROM courses c
       JOIN sellers s ON c.seller_id = s.id
       WHERE c.id = $1 AND s.user_id = $2`,
      [courseId, req.user.userId]
    );

    if (sellerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      `SELECT s.id, u.telegram_username, u.first_name, u.last_name, ce.enrolled_at
       FROM course_enrollments ce
       JOIN students s ON ce.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE ce.course_id = $1
       ORDER BY ce.enrolled_at DESC`,
      [courseId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching course students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/courses/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const { student_id } = req.body;

    const studentResult = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [req.user.userId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(403).json({ error: 'User is not a student' });
    }

    const finalStudentId = student_id || studentResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO course_enrollments (course_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (course_id, student_id) DO NOTHING
       RETURNING *`,
      [courseId, finalStudentId]
    );

    res.json({ success: true, enrollment: result.rows[0] });
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/enrollments/:courseId/:studentId', authenticateToken, async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    const sellerCheck = await pool.query(
      `SELECT c.id FROM courses c
       JOIN sellers s ON c.seller_id = s.id
       WHERE c.id = $1 AND s.user_id = $2`,
      [courseId, req.user.userId]
    );

    if (sellerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query(
      'DELETE FROM course_enrollments WHERE course_id = $1 AND student_id = $2',
      [courseId, studentId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing enrollment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/students/me/pinned-posts', authenticateToken, async (req, res) => {
  try {
    const { course_id } = req.query;

    const studentResult = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [req.user.userId]
    );

    if (studentResult.rows.length === 0) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT spp.*, cp.text_content, cp.created_at as post_created_at
       FROM student_pinned_posts spp
       JOIN course_posts cp ON spp.post_id = cp.id
       WHERE spp.student_id = $1 AND cp.course_id = $2
       ORDER BY spp.pinned_at DESC`,
      [studentResult.rows[0].id, course_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pinned posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/students/me/pinned-posts', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.body;

    const studentResult = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [req.user.userId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(403).json({ error: 'User is not a student' });
    }

    const result = await pool.query(
      `INSERT INTO student_pinned_posts (student_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, post_id) DO NOTHING
       RETURNING *`,
      [studentResult.rows[0].id, post_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error pinning post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/students/me/pinned-posts/:postId', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.postId;

    const studentResult = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [req.user.userId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(403).json({ error: 'User is not a student' });
    }

    await pool.query(
      'DELETE FROM student_pinned_posts WHERE student_id = $1 AND post_id = $2',
      [studentResult.rows[0].id, postId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error unpinning post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/courses/:courseId/telegram-bot', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query(
      `SELECT id, bot_token, bot_username, webhook_secret, is_active, created_at
       FROM telegram_bots
       WHERE course_id = $1
       LIMIT 1`,
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching telegram bot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/courses/:courseId/telegram-bot', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { bot_token, bot_username, is_active } = req.body;

    const sellerCheck = await pool.query(
      `SELECT s.id FROM sellers s
       JOIN courses c ON c.seller_id = s.id
       WHERE c.id = $1 AND s.user_id = $2`,
      [courseId, req.user.userId]
    );

    if (sellerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      `INSERT INTO telegram_bots (course_id, bot_token, bot_username, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, bot_token, bot_username, webhook_secret, is_active, created_at`,
      [courseId, bot_token, bot_username, is_active]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating telegram bot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/courses/:courseId/telegram-bot', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { bot_token, bot_username, is_active } = req.body;

    const sellerCheck = await pool.query(
      `SELECT s.id FROM sellers s
       JOIN courses c ON c.seller_id = s.id
       WHERE c.id = $1 AND s.user_id = $2`,
      [courseId, req.user.userId]
    );

    if (sellerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      `UPDATE telegram_bots
       SET bot_token = $1, bot_username = $2, is_active = $3
       WHERE course_id = $4
       RETURNING id, bot_token, bot_username, webhook_secret, is_active, created_at`,
      [bot_token, bot_username, is_active, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating telegram bot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/courses/:courseId/telegram-bot', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const sellerCheck = await pool.query(
      `SELECT s.id FROM sellers s
       JOIN courses c ON c.seller_id = s.id
       WHERE c.id = $1 AND s.user_id = $2`,
      [courseId, req.user.userId]
    );

    if (sellerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query(
      'UPDATE telegram_bots SET is_active = false WHERE course_id = $1',
      [courseId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deactivating telegram bot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/telegram-bots', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, bot_username, course_id, created_at
       FROM telegram_bots
       WHERE created_by IN (SELECT id FROM sellers WHERE user_id = $1)
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching telegram bots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/telegram-bots', authenticateToken, async (req, res) => {
  try {
    const { bot_username, bot_token, course_id } = req.body;

    const sellerResult = await pool.query(
      'SELECT id FROM sellers WHERE user_id = $1',
      [req.user.userId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(403).json({ error: 'User is not a seller' });
    }

    const result = await pool.query(
      `INSERT INTO telegram_bots (bot_username, bot_token, course_id, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, bot_username, course_id, created_at`,
      [bot_username, bot_token, course_id, sellerResult.rows[0].id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating telegram bot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { courseId, lessonId } = req.body;
    const relativePath = lessonId
      ? `${courseId}/${lessonId}/${req.file.filename}`
      : `${courseId}/${req.file.filename}`;

    res.json({
      filePath: relativePath,
      fileSize: req.file.size,
      fileName: req.file.originalname
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/telegram/webhook/:secret', async (req, res) => {
  try {
    const { secret } = req.params;
    const update = req.body;

    console.log('[Webhook] Received update:', JSON.stringify(update, null, 2));

    const botResult = await pool.query(
      'SELECT * FROM telegram_bots WHERE webhook_secret = $1 AND is_active = true LIMIT 1',
      [secret]
    );

    if (botResult.rows.length === 0) {
      console.log('[Webhook] Invalid secret or inactive bot');
      return res.status(403).json({ error: 'Invalid webhook secret' });
    }

    const bot = botResult.rows[0];
    const courseId = bot.course_id;

    if (!update.message && !update.channel_post) {
      console.log('[Webhook] No message or channel_post in update');
      return res.json({ ok: true });
    }

    const message = update.message || update.channel_post;

    if (!message.chat || message.chat.id.toString() !== bot.channel_id) {
      console.log('[Webhook] Message not from configured channel:', message.chat?.id, 'expected:', bot.channel_id);
      return res.json({ ok: true });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const mediaGroupId = message.media_group_id;

      if (mediaGroupId) {
        await client.query(
          `INSERT INTO telegram_media_group_buffer
           (course_id, media_group_id, telegram_message_id, media_data, caption, message_date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            courseId,
            mediaGroupId,
            message.message_id,
            JSON.stringify(message),
            message.caption || null,
            new Date(message.date * 1000)
          ]
        );

        const bufferCheck = await client.query(
          `SELECT COUNT(*) as count FROM telegram_media_group_buffer
           WHERE course_id = $1 AND media_group_id = $2 AND received_at > NOW() - INTERVAL '3 seconds'`,
          [courseId, mediaGroupId]
        );

        if (parseInt(bufferCheck.rows[0].count) < 2) {
          await client.query('COMMIT');
          console.log('[Webhook] Buffered media group item, waiting for more...');
          return res.json({ ok: true });
        }

        const bufferedMessages = await client.query(
          `SELECT * FROM telegram_media_group_buffer
           WHERE course_id = $1 AND media_group_id = $2
           ORDER BY telegram_message_id`,
          [courseId, mediaGroupId]
        );

        const firstMessage = JSON.parse(bufferedMessages.rows[0].media_data);
        const caption = bufferedMessages.rows[0].caption || '';

        const postResult = await client.query(
          `INSERT INTO course_posts
           (course_id, source_type, title, text_content, media_type, telegram_message_id, media_group_id, media_count, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            courseId,
            'telegram',
            '',
            caption,
            'media_group',
            firstMessage.message_id,
            mediaGroupId,
            bufferedMessages.rows.length,
            new Date(firstMessage.date * 1000)
          ]
        );

        const postId = postResult.rows[0].id;

        for (let i = 0; i < bufferedMessages.rows.length; i++) {
          const buffered = JSON.parse(bufferedMessages.rows[i].media_data);
          let mediaType = null;
          let fileId = null;
          let thumbnailFileId = null;
          let width = null;
          let height = null;
          let duration = null;
          let fileSize = null;
          let fileName = null;
          let mimeType = null;

          if (buffered.photo) {
            mediaType = 'photo';
            const photo = buffered.photo[buffered.photo.length - 1];
            fileId = photo.file_id;
            width = photo.width;
            height = photo.height;
            fileSize = photo.file_size;
          } else if (buffered.video) {
            mediaType = 'video';
            fileId = buffered.video.file_id;
            thumbnailFileId = buffered.video.thumbnail?.file_id;
            width = buffered.video.width;
            height = buffered.video.height;
            duration = buffered.video.duration;
            fileSize = buffered.video.file_size;
            mimeType = buffered.video.mime_type;
            fileName = buffered.video.file_name;
          } else if (buffered.document) {
            mediaType = 'document';
            fileId = buffered.document.file_id;
            thumbnailFileId = buffered.document.thumbnail?.file_id;
            fileSize = buffered.document.file_size;
            mimeType = buffered.document.mime_type;
            fileName = buffered.document.file_name;
          }

          if (mediaType && fileId) {
            await client.query(
              `INSERT INTO course_post_media
               (post_id, media_type, telegram_file_id, telegram_thumbnail_file_id,
                file_name, file_size, mime_type, width, height, duration, order_index)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [postId, mediaType, fileId, thumbnailFileId, fileName, fileSize, mimeType, width, height, duration, i]
            );
          }
        }

        await client.query(
          'DELETE FROM telegram_media_group_buffer WHERE course_id = $1 AND media_group_id = $2',
          [courseId, mediaGroupId]
        );

        console.log('[Webhook] Created media group post:', postId);
      } else {
        let mediaType = 'text';
        let fileId = null;
        let thumbnailFileId = null;
        let width = null;
        let height = null;
        let duration = null;
        let fileSize = null;
        let fileName = null;
        let mimeType = null;
        const textContent = message.text || message.caption || '';

        if (message.photo) {
          mediaType = 'photo';
          const photo = message.photo[message.photo.length - 1];
          fileId = photo.file_id;
          width = photo.width;
          height = photo.height;
          fileSize = photo.file_size;
        } else if (message.video) {
          mediaType = 'video';
          fileId = message.video.file_id;
          thumbnailFileId = message.video.thumbnail?.file_id;
          width = message.video.width;
          height = message.video.height;
          duration = message.video.duration;
          fileSize = message.video.file_size;
          mimeType = message.video.mime_type;
          fileName = message.video.file_name;
        } else if (message.document) {
          mediaType = 'document';
          fileId = message.document.file_id;
          thumbnailFileId = message.document.thumbnail?.file_id;
          fileSize = message.document.file_size;
          mimeType = message.document.mime_type;
          fileName = message.document.file_name;
        } else if (message.audio) {
          mediaType = 'audio';
          fileId = message.audio.file_id;
          duration = message.audio.duration;
          fileSize = message.audio.file_size;
          mimeType = message.audio.mime_type;
          fileName = message.audio.file_name;
        } else if (message.voice) {
          mediaType = 'voice';
          fileId = message.voice.file_id;
          duration = message.voice.duration;
          fileSize = message.voice.file_size;
          mimeType = message.voice.mime_type;
        } else if (message.animation) {
          mediaType = 'animation';
          fileId = message.animation.file_id;
          thumbnailFileId = message.animation.thumbnail?.file_id;
          width = message.animation.width;
          height = message.animation.height;
          duration = message.animation.duration;
          fileSize = message.animation.file_size;
          mimeType = message.animation.mime_type;
          fileName = message.animation.file_name;
        }

        const postResult = await client.query(
          `INSERT INTO course_posts
           (course_id, source_type, title, text_content, media_type, telegram_file_id,
            telegram_thumbnail_file_id, telegram_message_id, file_name, file_size, mime_type,
            telegram_media_width, telegram_media_height, telegram_media_duration, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id`,
          [
            courseId,
            'telegram',
            '',
            textContent,
            mediaType,
            fileId,
            thumbnailFileId,
            message.message_id,
            fileName,
            fileSize,
            mimeType,
            width,
            height,
            duration,
            new Date(message.date * 1000)
          ]
        );

        console.log('[Webhook] Created single post:', postResult.rows[0].id);
      }

      await client.query(
        'UPDATE telegram_bots SET last_sync_at = NOW() WHERE id = $1',
        [bot.id]
      );

      await client.query('COMMIT');
      res.json({ ok: true });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Webhook] Error processing update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const buildPath = join(__dirname, '..', 'build');

  app.use(express.static(buildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(join(buildPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
