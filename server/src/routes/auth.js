import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signAdminToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signAdminToken({ id: user.id, username: user.username });
  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ success: true, username: user.username });
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ authenticated: true, username: req.admin.username });
});

export default router;
