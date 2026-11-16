import { Router } from 'express';
import db from '../db.js';
import { streamResumePdf } from '../resumePdf.js';

const router = Router();

// GET /api/portfolio — Complete hydrated portfolio payload
router.get('/portfolio', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profile LIMIT 1').get();
    const education = db.prepare('SELECT * FROM education').all().map((row) => ({
      ...row,
      coursework: JSON.parse(row.coursework_json || '[]')
    }));
    const skills = db.prepare('SELECT * FROM skills ORDER BY sort_order ASC').all().map((row) => ({
      ...row,
      items: JSON.parse(row.items_json || '[]')
    }));
    const projects = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC').all().map((row) => ({
      ...row,
      technologies: JSON.parse(row.technologies_json || '[]'),
      bullets: JSON.parse(row.bullets_json || '[]'),
      zone_coords: JSON.parse(row.zone_coords_json || '{}')
    }));
    const experiences = db.prepare('SELECT * FROM experiences').all().map((row) => ({
      ...row,
      bullets: JSON.parse(row.bullets_json || '[]'),
      artifacts: JSON.parse(row.artifacts_json || '[]')
    }));
    const references = db.prepare('SELECT * FROM "references"').all();

    res.json({
      profile,
      education,
      skills,
      projects,
      experiences,
      references
    });
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    res.status(500).json({ error: 'Failed to load portfolio data' });
  }
});

// GET /api/guestbook — Approved public sky-guestbook notes
router.get('/guestbook', (req, res) => {
  try {
    const notes = db.prepare(`
      SELECT id, sender_name, company, message, created_at
      FROM messages
      WHERE is_public_guestbook = 1 AND is_approved = 1
      ORDER BY id DESC
      LIMIT 30
    `).all();
    res.json({ notes });
  } catch (err) {
    console.error('Error fetching guestbook:', err);
    res.status(500).json({ error: 'Failed to load guestbook' });
  }
});

// POST /api/contact — Save recruiter inquiry or public guestbook note
router.post('/contact', (req, res) => {
  try {
    const { sender_name, sender_email, company, subject, message, is_public_guestbook } = req.body || {};

    if (!sender_name || !sender_name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!sender_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender_email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!message || message.trim().length < 3) {
      return res.status(400).json({ error: 'Message must be at least 3 characters' });
    }

    const isPublic = is_public_guestbook ? 1 : 0;
    const stmt = db.prepare(`
      INSERT INTO messages (sender_name, sender_email, company, subject, message, is_public_guestbook, is_approved)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    const info = stmt.run(
      sender_name.trim().slice(0, 120),
      sender_email.trim().slice(0, 160),
      (company || '').trim().slice(0, 120),
      (subject || (isPublic ? 'Sky-Guestbook Note' : 'Recruiter Inquiry')).trim().slice(0, 160),
      message.trim().slice(0, 2000),
      isPublic
    );

    res.status(201).json({
      success: true,
      id: info.lastInsertRowid,
      is_public_guestbook: Boolean(isPublic),
      confirmation: isPublic
        ? 'Your note is now live on the Central Plaza Sky-Guestbook!'
        : 'Your message has been delivered to Miguel Andrei B. Abad.'
    });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ error: 'Failed to submit message' });
  }
});

// POST /api/telemetry — Lightweight zone exploration beacon
router.post('/telemetry', (req, res) => {
  try {
    const { zone_visited, session_id, duration_ms } = req.body || {};
    if (!zone_visited || !session_id) {
      return res.status(400).json({ error: 'zone_visited and session_id are required' });
    }
    db.prepare(`
      INSERT INTO analytics_events (zone_visited, session_id, duration_ms)
      VALUES (?, ?, ?)
    `).run(
      String(zone_visited).slice(0, 80),
      String(session_id).slice(0, 80),
      Math.max(0, Math.min(3600000, Number(duration_ms) || 0))
    );
    res.status(202).json({ ok: true });
  } catch (err) {
    console.error('Error logging telemetry:', err);
    res.status(500).json({ error: 'Telemetry error' });
  }
});

// GET /api/resume/pdf — Live downloadable ATS PDF
router.get('/resume/pdf', (req, res) => {
  streamResumePdf(res);
});

export default router;
