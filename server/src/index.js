import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { seedDatabase } from './seed.js';
import { streamResumePdf, UPLOADS_DIR } from './resumePdf.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize schema and seed database if empty
seedDatabase();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Serve uploaded project media / diagrams
app.use('/uploads', express.static(UPLOADS_DIR));

// Direct downloadable resume PDF endpoint
app.get('/Miguel_Andrei_Abad_Resume.pdf', (req, res) => {
  streamResumePdf(res);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'miguel-abad-3d-portfolio' });
});

// API Routes
app.use('/api', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Production static client serving (after `npm run build`)
const clientDistDir = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(clientDistDir, 'admin.html'));
  });
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Portfolio API server running on http://localhost:${PORT}`);
});
