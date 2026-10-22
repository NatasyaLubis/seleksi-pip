const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { readDatabase, asyncLocalStorage, initializeDemoDatabase, initializeLiveDatabase } = require('./models/storage');

const authRoutes = require('./routes/authRoutes');
const criteriaRoutes = require('./routes/criteriaRoutes');
const decisionMakerRoutes = require('./routes/decisionMakerRoutes');
const studentRoutes = require('./routes/studentRoutes');
const calculationRoutes = require('./routes/calculationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware: Helmet headers (customized to allow cross-origin images like Kemdikbud logo)
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

// Initialize both databases (Demo and Live) on startup
initializeDemoDatabase();
initializeLiveDatabase();

// Mode router middleware: demo vs live
app.use((req, res, next) => {
  const rawMode = req.headers['x-system-mode'] || (req.query && req.query.system_mode) || 'live';
  const mode = rawMode.toLowerCase() === 'demo' ? 'demo' : 'live';
  asyncLocalStorage.run({ mode }, () => {
    next();
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/criteria', criteriaRoutes);
app.use('/api/decision-makers', decisionMakerRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/calculation', calculationRoutes);

// Root & API status endpoint
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    security: 'JWT Protected & Helmet Hardened',
    system: 'SPK PIP - Multi-Expert BWM & WASPAS Engine',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  SPK Bantuan PIP Server running on port ${PORT}`);
  console.log(`  Security: Helmet Enabled, JWT Auth Ready`);
  console.log(`  API Base URL: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});
