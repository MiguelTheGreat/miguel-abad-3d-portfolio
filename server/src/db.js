import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDbPath = path.resolve(__dirname, '../data/portfolio.db');
const dbPath = process.env.DB_PATH
  ? path.resolve(path.resolve(__dirname, '../..'), process.env.DB_PATH)
  : defaultDbPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      location TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      linkedin_url TEXT NOT NULL,
      summary TEXT NOT NULL,
      summary_secondary TEXT DEFAULT '',
      resume_pdf_url TEXT NOT NULL DEFAULT '/Miguel_Andrei_Abad_Resume.pdf'
    );

    CREATE TABLE IF NOT EXISTS education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institution TEXT NOT NULL,
      degree TEXT NOT NULL,
      period TEXT NOT NULL,
      honors TEXT NOT NULL,
      coursework_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      items_json TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      category TEXT NOT NULL,
      filter_tags TEXT NOT NULL DEFAULT '',
      overview TEXT NOT NULL DEFAULT '',
      technologies_json TEXT NOT NULL,
      bullets_json TEXT NOT NULL,
      diagram_type TEXT NOT NULL DEFAULT 'custom',
      media_url TEXT DEFAULT '',
      zone_coords_json TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization TEXT NOT NULL,
      role TEXT NOT NULL,
      period TEXT NOT NULL,
      bullets_json TEXT NOT NULL,
      artifacts_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "references" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      organization TEXT NOT NULL,
      email TEXT NOT NULL,
      relationship TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_name TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      company TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      message TEXT NOT NULL,
      is_public_guestbook INTEGER NOT NULL DEFAULT 0,
      is_approved INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone_visited TEXT NOT NULL,
      session_id TEXT NOT NULL,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export default db;
