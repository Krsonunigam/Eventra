require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Set timezone to IST
process.env.TZ = 'Asia/Kolkata';

const app = express();

// ── Trust proxy (Render/Railway sit behind a load balancer) ─────────────────
app.set('trust proxy', 1);

// ── Increase request/response timeouts for large face uploads ────────────────
app.use((req, res, next) => {
  req.setTimeout(300_000);  // 5 min
  res.setTimeout(300_000);
  next();
});

// ── CORS ─────────────────────────────────────────────────────────────────────
// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'https://eventra-jet.vercel.app',
  process.env.CLIENT_URL
].map(o => o?.replace(/\/$/, '')).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    const cleanOrigin = origin.replace(/\/$/, '');

    // 2. Allow exact matches
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // 3. Allow any .onrender.com subdomain (very common for Render deployments)
    if (cleanOrigin.endsWith('.onrender.com')) {
      return callback(null, true);
    }

    console.warn(`⚠️ [CORS] Blocked origin: ${origin}`);
    callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with', 'Accept'],
  exposedHeaders: ['set-cookie']
}));

// Handle pre-flight for every route
app.options('*', cors());

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,       // React handles its own CSP
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
}));

// ── gzip compression (skip for multipart/form-data) ─────────────────────────
app.use(compression({
  filter: (req, res) => {
    if (req.headers['content-type']?.includes('multipart/form-data')) return false;
    return compression.filter(req, res);
  },
  level: 6   // balanced speed/size
}));

// ── Rate limiting (production only) ──────────────────────────────────────────
if (process.env.NODE_ENV !== 'development') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 min
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
  });
  app.use(limiter);
}

// ── Body parsers (large limit only for face/upload routes) ───────────────────
app.use('/api/face', express.json({ limit: '60mb' }));
app.use('/api/face', express.urlencoded({ extended: true, limit: '60mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── MongoDB connection ────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,          // enable indexes in production too
      maxPoolSize: 10,          // connection pool
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 60_000,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

connectDB();

// Clean up any bad index on nfcCards.cardId (legacy issue)
mongoose.connection.once('open', async () => {
  try {
    const col = mongoose.connection.db.collection('users');
    const indexes = await col.indexes();
    for (const idx of indexes) {
      if (idx.name?.includes('nfcCards.cardId')) {
        await col.dropIndex(idx.name);
        console.log('🧹 Dropped legacy nfcCards.cardId index');
      }
    }
  } catch (_) { /* non-fatal */ }
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',             require('./routes/auth'));
app.use('/api/users',            require('./routes/users'));
app.use('/api/events',           require('./routes/events'));
app.use('/api/attendance',       require('./routes/attendance'));
app.use('/api/payments',         require('./routes/paymentRoutes'));
app.use('/api/bookings',         require('./routes/bookings'));
app.use('/api/admin',            require('./routes/admin'));
app.use('/api/admin/subscription', require('./routes/adminSubscription'));
app.use('/api/admin/reports',    require('./routes/adminReports'));
app.use('/api/analytics',        require('./routes/analytics'));
app.use('/api/chatbot',          require('./routes/chatbot'));
app.use('/api/chatbot/analytics', require('./routes/chatbotAnalytics'));
app.use('/api/notifications',    require('./routes/notifications'));
app.use('/api/face',             require('./routes/face'));
app.use('/api/pure-face',        require('./routes/pureNodeFace'));
app.use('/api/email',            require('./routes/emailVerification'));
app.use('/api/upload',           require('./routes/upload'));
app.use('/api/certificates',     require('./routes/certificates'));
app.use('/api/contact',          require('./routes/contact'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Eventra API is running', version: '2.0.0' });
});

// ── Static files (only if client build exists) ───────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'client/build');
  app.use(express.static(buildPath));
  // SPA fallback — every non-API route serves index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(buildPath, 'index.html'));
    }
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('🔴 Unhandled error:', err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Max 5MB per image.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ success: false, message: 'Too many files. Max 25 allowed.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
