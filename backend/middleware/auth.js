require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pip_kemendikdasmen_secure_key_2026_super_secret_fallback';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[SECURITY WARNING] JWT_SECRET belum dikonfigurasi di file environment .env! Menggunakan secret fallback.');
}

/**
 * Extracts JWT token from request headers or query parameter
 * @param {Object} req 
 * @returns {string|null}
 */
function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Akses ditolak: Token autentikasi tidak ditemukan. Silakan login terlebih dahulu.' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Akses ditolak: Sesi telah kedaluwarsa atau token tidak valid.' 
      });
    }
    req.user = user;
    if (user && user.mode) {
      req.systemMode = user.mode;
    }
    next();
  });
}

// Optional Auth (attaches user if valid token present, doesn't block)
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
        if (user && user.mode) {
          req.systemMode = user.mode;
        }
      }
      next();
    });
  } else {
    next();
  }
}

module.exports = {
  JWT_SECRET,
  extractToken,
  authenticateToken,
  optionalAuth
};
