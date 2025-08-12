const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { z } = require('zod');
const { customAlphabet } = require('nanoid');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 4000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Init DB
const dbPath = path.join(dataDir, 'sprites.db');
const db = new Database(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS sprites (
    id TEXT PRIMARY KEY,
    scientific_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    attribution TEXT,
    submitter TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS votes (
    sprite_id TEXT NOT NULL,
    voter_id TEXT NOT NULL,
    value INTEGER NOT NULL CHECK (value IN (-1, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (sprite_id, voter_id),
    FOREIGN KEY (sprite_id) REFERENCES sprites(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_sprites_scientific_name ON sprites(scientific_name);
`);

const insertSpriteStmt = db.prepare(
  `INSERT INTO sprites (id, scientific_name, image_url, attribution, submitter) VALUES (@id, @scientific_name, @image_url, @attribution, @submitter)`
);

const listSpritesStmt = db.prepare(
  `SELECT s.*, IFNULL(SUM(v.value), 0) AS score, COUNT(v.value) AS votes
   FROM sprites s
   LEFT JOIN votes v ON v.sprite_id = s.id
   WHERE s.scientific_name = ?
   GROUP BY s.id
   ORDER BY score DESC, s.created_at DESC
   LIMIT 50`
);

const getTopSpriteStmt = db.prepare(
  `SELECT s.*, IFNULL(SUM(v.value), 0) AS score, COUNT(v.value) AS votes
   FROM sprites s
   LEFT JOIN votes v ON v.sprite_id = s.id
   WHERE s.scientific_name = ?
   GROUP BY s.id
   ORDER BY score DESC, s.created_at DESC
   LIMIT 1`
);

const upsertVoteStmt = db.prepare(
  `INSERT INTO votes (sprite_id, voter_id, value) VALUES (?, ?, ?)
   ON CONFLICT(sprite_id, voter_id) DO UPDATE SET value = excluded.value`
);

const findSpriteByIdStmt = db.prepare(`SELECT * FROM sprites WHERE id = ?`);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

// Middleware to ensure a voter id cookie
app.use((req, res, next) => {
  if (!req.cookies.voterId) {
    const voterId = nanoid();
    res.cookie('voterId', voterId, { httpOnly: false, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 365 });
    req.cookies.voterId = voterId;
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Schema validators
const submitSchema = z.object({
  scientificName: z.string().min(1).max(200),
  imageUrl: z.string().url().max(2000),
  attribution: z.string().max(500).optional(),
  submitter: z.string().max(100).optional()
});

const voteSchema = z.object({
  vote: z.enum(['up', 'down'])
});

app.get('/api/sprites', (req, res) => {
  const scientificName = (req.query.scientificName || '').toString().trim();
  if (!scientificName) return res.status(400).json({ error: 'scientificName is required' });
  const rows = listSpritesStmt.all(scientificName);
  res.json(rows);
});

app.get('/api/sprites/top', (req, res) => {
  const scientificName = (req.query.scientificName || '').toString().trim();
  if (!scientificName) return res.status(400).json({ error: 'scientificName is required' });
  const row = getTopSpriteStmt.get(scientificName);
  if (!row) return res.status(404).json({ error: 'No submissions yet' });
  res.json(row);
});

app.post('/api/sprites', (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const { scientificName, imageUrl, attribution, submitter } = parsed.data;
  const id = nanoid();
  try {
    insertSpriteStmt.run({ id, scientific_name: scientificName, image_url: imageUrl, attribution: attribution || null, submitter: submitter || null });
    const created = findSpriteByIdStmt.get(id);
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

app.post('/api/sprites/:id/vote', (req, res) => {
  const parsed = voteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const spriteId = req.params.id;
  const voterId = req.cookies.voterId || 'anon';
  const value = parsed.data.vote === 'up' ? 1 : -1;

  const sprite = findSpriteByIdStmt.get(spriteId);
  if (!sprite) return res.status(404).json({ error: 'Sprite not found' });

  try {
    upsertVoteStmt.run(spriteId, voterId, value);
    // Return updated score
    const updated = db.prepare(`
      SELECT s.*, IFNULL(SUM(v.value), 0) AS score, COUNT(v.value) AS votes
      FROM sprites s LEFT JOIN votes v ON v.sprite_id = s.id
      WHERE s.id = ? GROUP BY s.id
    `).get(spriteId);
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

app.listen(PORT, () => {
  console.log(`Sprite curation API running on http://localhost:${PORT}`);
});