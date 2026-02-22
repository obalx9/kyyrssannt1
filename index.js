import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';
import { uploadToS3, deleteFromS3, getS3PublicUrl, downloadTelegramFileToS3 } from './s3Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const uploadsDir = join(__dirname, 'uploads');
const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:5173'];

console.log('[INIT] Starting Kursat Backend API');
console.log('[INIT] Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('[CORS] Request origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('[CORS] Origin NOT allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

mkdir(uploadsDir, { recursive: true }).catch(console.error);
app.use('/uploads', express.static(uploadsDir));

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

let sslConfig = false;
if (process.env.NODE_ENV === 'production') {
  sslConfig = { rejectUnauthorized: false };
  console.log('✅ SSL enabled');
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
      database: result.rows[0].current_database
    };
    console.log('✅ Database connected');
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

function verifyJWT(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

async function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyJWT(token, process.env.JWT_SECRET || 'your-secret-key');

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = decoded;
  next();
}

app.get('/api/health', async (req, res) => {
  const status = await checkDatabaseConnection();
  res.json({
    status: status.connected ? 'healthy' : 'unhealthy',
    database: status,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT id, email FROM auth.users WHERE email = $1 AND password_hash = crypt($2, password_hash)',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'INSERT INTO auth.users (email, password_hash, name) VALUES ($1, crypt($2, gen_salt(\'bf\')), $3) RETURNING id, email',
      [email, password, name || email]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, description, author_id, created_at, updated_at
      FROM courses
      ORDER BY created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM courses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

app.post('/api/courses', authenticateRequest, async (req, res) => {
  try {
    const { title, description } = req.body;
    const authorId = req.user.id;

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const result = await pool.query(
      'INSERT INTO courses (title, description, author_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description || '', authorId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

app.post('/api/upload', authenticateRequest, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const fileUrl = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);

    res.json({ url: fileUrl, fileName });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: dbConnectionStatus,
  });
});

app.get('/api/telegram-config', async (req, res) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    const apiUrl = process.env.VITE_API_URL;

    if (!botToken || !botUsername) {
      return res.status(500).json({ error: 'Telegram bot configuration missing' });
    }

    res.json({
      botToken,
      botUsername,
      apiUrl,
      webhookUrl: `${apiUrl}/api/telegram/webhook`,
    });
  } catch (error) {
    console.error('Telegram config error:', error);
    res.status(500).json({ error: 'Failed to fetch telegram config' });
  }
});

app.post('/api/telegram/webhook', express.json(), async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: 'No message' });
    }

    console.log('[TELEGRAM] Webhook received:', {
      chatId: message.chat?.id,
      userId: message.from?.id,
      text: message.text,
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.get('/api/courses/:id/telegram-config', authenticateRequest, async (req, res) => {
  try {
    const { id: courseId } = req.params;

    const courseResult = await pool.query(
      'SELECT id, title, author_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];

    if (course.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const botConfig = await pool.query(
      'SELECT bot_token, bot_username, webhook_url FROM telegram_bots WHERE course_id = $1 AND is_active = true',
      [courseId]
    );

    if (botConfig.rows.length === 0) {
      return res.status(404).json({ error: 'No telegram bot configured for this course' });
    }

    res.json({
      courseId,
      courseTitle: course.title,
      ...botConfig.rows[0],
    });
  } catch (error) {
    console.error('Get telegram config error:', error);
    res.status(500).json({ error: 'Failed to fetch telegram config' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
