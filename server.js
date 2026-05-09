require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const paymentRoutes = require("./routes/paymentRoutes");

// Set timezone to IST
process.env.TZ = 'Asia/Kolkata';




const app = express();

// Increase server timeout for large requests
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

// CORS configuration - Localhost only
app.use(cors({
  origin: [
    'http://127.0.0.1:3000',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

// Security middleware
// Trust the proxy (e.g., CRA dev server) so rate limiter can read X-Forwarded-For safely
app.set('trust proxy', 1);
// Configure Helmet for development
if (process.env.NODE_ENV === 'development') {
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP in development
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
  }));
} else {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  }));
}
app.use(compression());

// Rate limiting - Disabled for development
if (process.env.NODE_ENV !== 'development') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);
} else {
  
}


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: false
})
.then(() => {})
.catch(err => {});

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Body parsing middleware - Increased limits for face data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection
mongoose.connection.once("open", async () => {
  try {
    const collection = mongoose.connection.db.collection("users");

    const indexes = await collection.indexes();

    for (let index of indexes) {
      if (index.name.includes("nfcCards.cardId")) {
        await collection.dropIndex(index.name);
      }
    }

    
  } catch (err) {
    
  }
});
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/attendance', require('./routes/attendance'));
app.use("/api/payments", paymentRoutes);
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/subscription', require('./routes/adminSubscription'));
app.use('/api/admin/reports', require('./routes/adminReports'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/chatbot/analytics', require('./routes/chatbotAnalytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/face', require('./routes/face'));
app.use('/api/pure-face', require('./routes/pureNodeFace'));
app.use('/api/email', require('./routes/emailVerification'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/certificates', require('./routes/certificates'));


if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
const HOST = '127.0.0.1'; // Force localhost only

app.listen(PORT, HOST, () => {
  
});
