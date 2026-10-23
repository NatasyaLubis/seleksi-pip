const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { readDatabase, writeDatabase } = require('../models/storage');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// Brute-force protection: max 10 login attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login gagal. Demi keamanan, silakan coba lagi dalam 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// POST /api/auth/login
router.post('/login', loginLimiter, (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username dan kata sandi wajib diisi.' 
      });
    }

    const db = readDatabase();
    const cleanUsername = String(username).trim().toLowerCase();
    const user = db.users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau kata sandi tidak sesuai.' 
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau kata sandi tidak sesuai.' 
      });
    }

    // Determine system mode from request body or fallback to live
    const requestedMode = (req.body && req.body.mode) ? String(req.body.mode).toLowerCase() : 'live';
    const targetMode = requestedMode === 'demo' ? 'demo' : 'live';

    // Generate JWT Token with mode claim
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      mode: targetMode
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      mode: targetMode,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        title: user.title,
        mode: targetMode
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Kesalahan otentikasi: ' + err.message });
  }
});

// GET /api/auth/me (Check session status)
router.get('/me', authenticateToken, (req, res) => {
  try {
    const db = readDatabase();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        title: user.title
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Kata sandi saat ini dan kata sandi baru harus diisi.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Kata sandi baru minimal harus 6 karakter.' });
    }

    const db = readDatabase();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Kata sandi saat ini salah.' });
    }

    user.password_hash = bcrypt.hashSync(newPassword, 10);
    writeDatabase(db);

    res.json({ success: true, message: 'Kata sandi berhasil diperbarui dengan aman.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/users (List all users - accessible by authenticated users)
router.get('/users', authenticateToken, (req, res) => {
  try {
    const db = readDatabase();
    const safeUsers = (db.users || []).map(u => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      role: u.role,
      title: u.title,
      created_at: u.created_at
    }));
    res.json({ success: true, data: safeUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/users (Create a new user)
router.post('/users', authenticateToken, (req, res) => {
  try {
    const { username, password, full_name, role, title } = req.body;
    if (!username || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Username, nama lengkap, dan kata sandi wajib diisi.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ success: false, message: 'Username minimal 3 karakter.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Kata sandi minimal 6 karakter.' });
    }

    const db = readDatabase();
    if (!db.users) db.users = [];

    if (db.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan. Silakan gunakan username lain.' });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      password_hash: bcrypt.hashSync(password, 10),
      full_name: full_name.trim(),
      role: role === 'pengambil_keputusan' ? 'pengambil_keputusan' : 'operator',
      title: title ? title.trim() : (role === 'pengambil_keputusan' ? 'Kepala Sekolah (Pengambil Keputusan)' : 'Operator PIP Sekolah'),
      created_at: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDatabase(db);

    res.json({
      success: true,
      message: 'Pengguna baru berhasil ditambahkan.',
      data: {
        id: newUser.id,
        username: newUser.username,
        full_name: newUser.full_name,
        role: newUser.role,
        title: newUser.title,
        created_at: newUser.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/users/:id (Update user info or reset password)
router.put('/users/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, title, password } = req.body;

    const db = readDatabase();
    const user = (db.users || []).find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    if (full_name) user.full_name = full_name.trim();
    if (role) user.role = role === 'pengambil_keputusan' ? 'pengambil_keputusan' : 'operator';
    if (title !== undefined) user.title = title.trim();

    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
      }
      user.password_hash = bcrypt.hashSync(password, 10);
    }

    writeDatabase(db);

    res.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui.',
      data: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        title: user.title,
        created_at: user.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/auth/users/:id (Delete user)
router.delete('/users/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    if (req.user && req.user.id === id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun yang sedang Anda gunakan.' });
    }

    const index = (db.users || []).findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const targetUser = db.users[index];
    const operatorCount = db.users.filter(u => u.role === 'operator').length;
    if (targetUser.role === 'operator' && operatorCount <= 1) {
      return res.status(400).json({ success: false, message: 'Sistem harus memiliki minimal satu akun Operator.' });
    }

    db.users.splice(index, 1);
    writeDatabase(db);

    res.json({ success: true, message: `Pengguna ${targetUser.username} berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
