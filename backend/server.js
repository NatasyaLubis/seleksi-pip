require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const path = require('path');
const { asyncLocalStorage, initializeDemoDatabase, initializeLiveDatabase } = require('./models/storage');
const { JWT_SECRET, extractToken, authenticateToken } = require('./middleware/auth');
const { ValidationError } = require('./utils/errors');

const authRoutes = require('./routes/authRoutes');
const criteriaRoutes = require('./routes/criteriaRoutes');
const decisionMakerRoutes = require('./routes/decisionMakerRoutes');
const studentRoutes = require('./routes/studentRoutes');
const calculationRoutes = require('./routes/calculationRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Security Middleware: Helmet headers (customized to allow cross-origin assets)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false
}));

// CORS Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

// Body Parsers with safe payload limits
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize both databases (Demo and Live) safely on startup
initializeDemoDatabase();
initializeLiveDatabase();

// Mode router middleware: demo vs live
// Priority: 1. Verified JWT Claim (cannot be spoofed) -> 2. Client header/query (for unauthenticated auth/login/health)
app.use((req, res, next) => {
  let tokenMode = null;
  const token = extractToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.mode) {
        tokenMode = decoded.mode;
      }
    } catch (e) {
      // Invalid/expired tokens handled downstream in authenticateToken
    }
  }

  const rawMode = tokenMode || req.headers['x-system-mode'] || (req.query && req.query.system_mode) || 'live';
  const mode = String(rawMode).toLowerCase() === 'demo' ? 'demo' : 'live';

  req.systemMode = mode;

  asyncLocalStorage.run({ mode }, () => {
    next();
  });
});

// Root & API status endpoint (Public)
app.get(['/', '/api'], (req, res) => {
  res.json({
    status: 'online',
    message: 'Backend API Sistem Pendukung Keputusan Seleksi PIP berjalan dengan baik.',
    security: 'JWT Protected & Helmet Hardened',
    system: 'Multi-Expert BWM & WASPAS Engine',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      criteria: '/api/criteria',
      decision_makers: '/api/decision-makers',
      students: '/api/students',
      calculation: '/api/calculation/status'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (Public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    security: 'JWT Protected & Helmet Hardened',
    system: 'SPK PIP - Multi-Expert BWM & WASPAS Engine',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes: Public vs Authenticated
app.use('/api/auth', authRoutes);
app.use('/api/criteria', authenticateToken, criteriaRoutes);
app.use('/api/decision-makers', authenticateToken, decisionMakerRoutes);
app.use('/api/students', authenticateToken, studentRoutes);
app.use('/api/calculation', authenticateToken, calculationRoutes);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof ValidationError || err.statusCode === 400 || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message || 'Data yang dikirimkan tidak valid.'
    });
  }

  console.error('[UNHANDLED SERVER ERROR]', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? (err.message || 'Terjadi kesalahan internal pada server.')
      : 'Terjadi kesalahan internal pada server. Silakan hubungi administrator.'
  });
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  SPK Bantuan PIP Server running on port ${PORT}`);
  console.log(`  Security: Helmet Enabled, JWT Auth Enforced`);
  console.log(`  API Base URL: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[FATAL ERROR] Port ${PORT} sudah digunakan oleh aplikasi lain.`);
    console.error(`Silakan periksa aplikasi lain yang berjalan di port ${PORT}, atau gunakan port lain via environment variable PORT.\n`);
  } else {
    console.error('[FATAL SERVER ERROR]', err);
  }
  process.exit(1);
});

module.exports = app;
