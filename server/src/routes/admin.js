import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { UPLOADS_DIR } from '../resumePdf.js';

const router = Router();
router.use(requireAdmin);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    if (req.query.type === 'resume') {
      return cb(null, 'Miguel_Andrei_Abad_Resume.pdf');
    }
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    cb(null, `${Date.now()}-${safeName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only PNG, JPG, WEBP, SVG, and PDF files are allowed'));
    }
    cb(null, true);
  }
});

// PUT /api/admin/profile
router.put('/profile', (req, res) => {
  try {
    const { full_name, tagline, location, email, phone, linkedin_url, summary, summary_secondary } = req.body || {};
    const existing = db.prepare('SELECT id FROM profile LIMIT 1').get();
    if (!existing) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    db.prepare(`
      UPDATE profile
      SET full_name = COALESCE(?, full_name),
          tagline = COALESCE(?, tagline),
          location = COALESCE(?, location),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          linkedin_url = COALESCE(?, linkedin_url),
          summary = COALESCE(?, summary),
          summary_secondary = COALESCE(?, summary_secondary)
      WHERE id = ?
    `).run(full_name, tagline, location, email, phone, linkedin_url, summary, summary_secondary, existing.id);

    const updated = db.prepare('SELECT * FROM profile WHERE id = ?').get(existing.id);
    res.json({ profile: updated });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/admin/projects
router.post('/projects', (req, res) => {
  try {
    const { slug, title, status, category, filter_tags, overview, technologies, bullets, diagram_type, media_url, zone_coords, sort_order } = req.body || {};
    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }
    const finalSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36).slice(-4);

    const info = db.prepare(`
      INSERT INTO projects (slug, title, status, category, filter_tags, overview, technologies_json, bullets_json, diagram_type, media_url, zone_coords_json, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalSlug,
      title,
      status || 'Engineering Project',
      category,
      filter_tags || 'hardware software',
      overview || '',
      JSON.stringify(Array.isArray(technologies) ? technologies : []),
      JSON.stringify(Array.isArray(bullets) ? bullets : []),
      diagram_type || 'custom',
      media_url || '',
      JSON.stringify(zone_coords || { zone: 'east-lab', x: 52, y: 6, z: 0 }),
      Number(sort_order) || 10
    );

    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ project: created });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/admin/projects/:id
router.put('/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { title, status, category, filter_tags, overview, technologies, bullets, diagram_type, media_url, zone_coords, sort_order } = req.body || {};

    db.prepare(`
      UPDATE projects
      SET title = ?,
          status = ?,
          category = ?,
          filter_tags = ?,
          overview = ?,
          technologies_json = ?,
          bullets_json = ?,
          diagram_type = ?,
          media_url = ?,
          zone_coords_json = ?,
          sort_order = ?
      WHERE id = ?
    `).run(
      title ?? existing.title,
      status ?? existing.status,
      category ?? existing.category,
      filter_tags ?? existing.filter_tags,
      overview ?? existing.overview,
      technologies ? JSON.stringify(technologies) : existing.technologies_json,
      bullets ? JSON.stringify(bullets) : existing.bullets_json,
      diagram_type ?? existing.diagram_type,
      media_url ?? existing.media_url,
      zone_coords ? JSON.stringify(zone_coords) : existing.zone_coords_json,
      sort_order !== undefined ? Number(sort_order) : existing.sort_order,
      id
    );

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json({ project: updated });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/admin/projects/:id
router.delete('/projects/:id', (req, res) => {
  const info = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ success: true });
});

// POST /api/admin/upload
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = req.query.type === 'resume'
    ? '/Miguel_Andrei_Abad_Resume.pdf'
    : `/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, url, filename: req.file.filename });
});

// GET /api/admin/messages
router.get('/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
  res.json({ messages });
});

// PATCH /api/admin/messages/:id
router.patch('/messages/:id', (req, res) => {
  const { is_approved, is_public_guestbook } = req.body || {};
  const existing = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Message not found' });
  }
  db.prepare(`
    UPDATE messages
    SET is_approved = ?, is_public_guestbook = ?
    WHERE id = ?
  `).run(
    is_approved !== undefined ? (is_approved ? 1 : 0) : existing.is_approved,
    is_public_guestbook !== undefined ? (is_public_guestbook ? 1 : 0) : existing.is_public_guestbook,
    req.params.id
  );
  res.json({ success: true });
});

// DELETE /api/admin/messages/:id
router.delete('/messages/:id', (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/admin/analytics
router.get('/analytics', (req, res) => {
  const byZone = db.prepare(`
    SELECT zone_visited, COUNT(*) as visits, ROUND(AVG(duration_ms)) as avg_duration_ms, COUNT(DISTINCT session_id) as unique_sessions
    FROM analytics_events
    GROUP BY zone_visited
    ORDER BY visits DESC
  `).all();
  const totalEvents = db.prepare('SELECT COUNT(*) as total FROM analytics_events').get().total;
  const recent = db.prepare('SELECT * FROM analytics_events ORDER BY id DESC LIMIT 20').all();
  res.json({ totalEvents, byZone, recent });
});

export default router;
