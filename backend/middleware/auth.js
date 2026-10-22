const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pip_kemendikdasmen_secure_key_2026_super_secret';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

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
    next();
  });
}

// Optional Auth (attaches user if valid token present, doesn't block)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
      next();
    });
  } else {
    next();
  }
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  optionalAuth
};
