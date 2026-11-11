import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import 'dotenv/config';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultSections } from './server/default-sections.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const production = process.env.NODE_ENV === 'production';
const username = process.env.ADMIN_USERNAME?.trim() ?? '';
const password = process.env.ADMIN_PASSWORD ?? '';
const databasePath = resolve(process.env.DATABASE_PATH ?? join(root, 'data', 'mfd-solutions.sqlite'));

if (username.length < 3) {
  throw new Error('Set ADMIN_USERNAME to a unique username of at least 3 characters.');
}
if (password.length < 16) {
  throw new Error('Set ADMIN_PASSWORD to a unique password of at least 16 characters.');
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
const adminPasswordHash = bcrypt.hashSync(password, 12);

mkdirSync(dirname(databasePath), { recursive: true });
const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');
database.exec(`
  CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    eyebrow TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'cards',
    content TEXT NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL,
    published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1))
  );
  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    username TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS admin_users (
    username TEXT PRIMARY KEY COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const sessionColumns = database.pragma('table_info(admin_sessions)');
if (!sessionColumns.some((column) => column.name === 'username')) {
  database.exec("ALTER TABLE admin_sessions ADD COLUMN username TEXT NOT NULL DEFAULT ''");
  database.prepare('UPDATE admin_sessions SET username = ? WHERE username = ?').run(username, '');
}

if (database.prepare('SELECT COUNT(*) AS count FROM sections').get().count === 0) {
  const insert = database.prepare(`
    INSERT INTO sections (id, title, eyebrow, description, kind, content, sort_order, published)
    VALUES (@id, @title, @eyebrow, @description, @kind, @content, @sortOrder, 1)
  `);
  const seed = database.transaction((sections) => {
    for (const section of sections) {
      insert.run({
        ...section,
        content: JSON.stringify(section.content),
        sortOrder: section.sortOrder
      });
    }
  });
  seed(defaultSections);
}

const aboutSection = database.prepare('SELECT content FROM sections WHERE id = ?').get('about');
if (aboutSection) {
  const aboutContent = JSON.parse(aboutSection.content);
  if (aboutContent.image === 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=85') {
    aboutContent.image = '/images/MF.jpg';
    database.prepare('UPDATE sections SET content = ? WHERE id = ?').run(JSON.stringify(aboutContent), 'about');
  }
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
  );
  next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' }
});
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please wait a few minutes and try again.' }
});

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const readCookie = (header, name) => {
  for (const part of (header ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return '';
};
const cookie = (value, maxAge) => {
  const secure = production ? '; Secure' : '';
  return `mfd_admin=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
};

function requireAdmin(req, res, next) {
  const token = readCookie(req.headers.cookie, 'mfd_admin');
  if (!token || token.length > 128) {
    return res.status(401).json({ error: 'Sign in to manage website content.' });
  }
  const session = database.prepare('SELECT username, expires_at FROM admin_sessions WHERE token_hash = ?').get(hashToken(token));
  if (!session || session.expires_at <= Date.now()) {
    if (session) database.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(hashToken(token));
    res.setHeader('Set-Cookie', cookie('', 0));
    return res.status(401).json({ error: 'Your admin session has expired. Please sign in again.' });
  }
  req.adminUsername = session.username;
  return next();
}

function requireOwner(req, res, next) {
  if (req.adminUsername !== username) {
    return res.status(403).json({ error: 'Only the primary administrator can manage dashboard users.' });
  }
  return next();
}

const sectionSelect = `
  SELECT id, title, eyebrow, description, kind, content, sort_order AS sortOrder, published
  FROM sections
`;
function parseSection(row) {
  return { ...row, content: JSON.parse(row.content), published: Boolean(row.published) };
}
function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function validateSection(body) {
  if (!isRecord(body)) return 'Section data must be an object.';
  if (typeof body.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.id) || body.id.length > 80) {
    return 'Section IDs must use lowercase letters, numbers, and hyphens.';
  }
  if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.length > 160) {
    return 'Section title is required and must be 160 characters or fewer.';
  }
  for (const field of ['eyebrow', 'description', 'kind']) {
    if (typeof body[field] !== 'string' || body[field].length > 5000) return `Section ${field} must be a string of 5000 characters or fewer.`;
  }
  if (!isRecord(body.content)) return 'Section content must be a JSON object.';
  if (JSON.stringify(body.content).length > 100_000) return 'Section content must be smaller than 100 KB.';
  if (!Number.isInteger(body.sortOrder) || body.sortOrder < 0 || body.sortOrder > 10_000) {
    return 'Section order must be a whole number between 0 and 10000.';
  }
  if (typeof body.published !== 'boolean') return 'Section visibility must be true or false.';
  return null;
}
function storeSection(section) {
  return {
    ...section,
    title: section.title.trim(),
    eyebrow: section.eyebrow.trim(),
    description: section.description.trim(),
    kind: section.kind.trim() || 'cards',
    content: JSON.stringify(section.content),
    published: Number(section.published)
  };
}
function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/sections', (_req, res) => {
  const rows = database.prepare(`${sectionSelect} WHERE published = 1 ORDER BY sort_order, id`).all();
  res.json(rows.map(parseSection));
});

app.post('/api/auth/login', loginLimiter, async (req, res, next) => {
  try {
    const submittedUser = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const submittedPassword = typeof req.body?.password === 'string' ? req.body.password : '';
    const isOwner = submittedUser.toLowerCase() === username.toLowerCase();
    const adminUser = isOwner ? null : database.prepare('SELECT username, password_hash AS passwordHash FROM admin_users WHERE username = ?').get(submittedUser.toLowerCase());
    const passwordHash = isOwner ? adminPasswordHash : adminUser?.passwordHash ?? adminPasswordHash;
    const passwordMatches = await bcrypt.compare(submittedPassword, passwordHash);
    if ((!isOwner && !adminUser) || !passwordMatches) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }
    const authenticatedUsername = isOwner ? username : adminUser.username;
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
    database.prepare('INSERT INTO admin_sessions (token_hash, expires_at, username) VALUES (?, ?, ?)').run(hashToken(token), expiresAt, authenticatedUsername);
    database.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(Date.now());
    res.setHeader('Set-Cookie', cookie(token, 12 * 60 * 60));
    return res.json({ username: authenticatedUsername, isOwner });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = readCookie(req.headers.cookie, 'mfd_admin');
  if (!token || token.length > 128) return res.json({ username: null, isOwner: false });
  const tokenHash = hashToken(token);
  const session = database.prepare('SELECT username, expires_at FROM admin_sessions WHERE token_hash = ?').get(tokenHash);
  if (!session || session.expires_at <= Date.now()) {
    if (session) database.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
    res.setHeader('Set-Cookie', cookie('', 0));
    return res.json({ username: null, isOwner: false });
  }
  return res.json({ username: session.username, isOwner: session.username === username });
});

app.post('/api/auth/logout', (req, res) => {
  const token = readCookie(req.headers.cookie, 'mfd_admin');
  if (token) database.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(hashToken(token));
  res.setHeader('Set-Cookie', cookie('', 0));
  res.status(204).end();
});

app.get('/api/admin/sections', requireAdmin, (_req, res) => {
  const rows = database.prepare(`${sectionSelect} ORDER BY sort_order, id`).all();
  res.json(rows.map(parseSection));
});

app.get('/api/admin/users', requireAdmin, requireOwner, (_req, res) => {
  const users = database.prepare('SELECT username, created_at AS createdAt FROM admin_users ORDER BY username COLLATE NOCASE').all();
  return res.json(users);
});

app.post('/api/admin/users', requireAdmin, requireOwner, async (req, res, next) => {
  const submittedUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const newPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  const normalizedUsername = submittedUsername.toLowerCase();
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(submittedUsername)) {
    return res.status(400).json({ error: 'Usernames must be 3–32 characters and contain only letters, numbers, dots, underscores, or hyphens.' });
  }
  if (normalizedUsername === username.toLowerCase()) {
    return res.status(400).json({ error: 'The primary administrator account cannot be added as another user.' });
  }
  const passwordBytes = Buffer.byteLength(newPassword, 'utf8');
  if (passwordBytes < 16 || passwordBytes > 72) {
    return res.status(400).json({ error: 'Passwords must be between 16 and 72 bytes.' });
  }
  try {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    database.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(normalizedUsername, passwordHash);
    return res.status(201).json({ username: normalizedUsername });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'That username already has dashboard access.' });
    }
    return next(error);
  }
});

app.delete('/api/admin/users/:user', requireAdmin, requireOwner, (req, res) => {
  const targetUsername = req.params.user.toLowerCase();
  if (targetUsername === username.toLowerCase()) {
    return res.status(400).json({ error: 'The primary administrator account cannot be removed.' });
  }
  const removeUser = database.transaction(() => {
    const result = database.prepare('DELETE FROM admin_users WHERE username = ?').run(targetUsername);
    if (!result.changes) return false;
    database.prepare('DELETE FROM admin_sessions WHERE username = ?').run(targetUsername);
    return true;
  });
  if (!removeUser()) return res.status(404).json({ error: 'That dashboard user no longer exists.' });
  return res.status(204).end();
});

app.post('/api/admin/sections', requireAdmin, (req, res) => {
  const section = req.body;
  const validationError = validateSection(section);
  if (validationError) return res.status(400).json({ error: validationError });
  try {
    database.prepare(`
      INSERT INTO sections (id, title, eyebrow, description, kind, content, sort_order, published)
      VALUES (@id, @title, @eyebrow, @description, @kind, @content, @sortOrder, @published)
    `).run(storeSection(section));
    const saved = database.prepare(`${sectionSelect} WHERE id = ?`).get(section.id);
    return res.status(201).json(parseSection(saved));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'A section with that ID already exists. Choose a different ID.' });
    }
    throw error;
  }
});

app.put('/api/admin/sections/:id', requireAdmin, (req, res) => {
  const section = { ...req.body, id: req.params.id };
  const validationError = validateSection(section);
  if (validationError) return res.status(400).json({ error: validationError });
  const result = database.prepare(`
    UPDATE sections
    SET title = @title, eyebrow = @eyebrow, description = @description,
        kind = @kind, content = @content, sort_order = @sortOrder, published = @published
    WHERE id = @id
  `).run(storeSection(section));
  if (!result.changes) return res.status(404).json({ error: 'That section no longer exists.' });
  return res.json(parseSection(database.prepare(`${sectionSelect} WHERE id = ?`).get(req.params.id)));
});

app.delete('/api/admin/sections/:id', requireAdmin, (req, res) => {
  const result = database.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'That section no longer exists.' });
  return res.status(204).end();
});

app.post('/api/contact', formLimiter, (req, res) => {
  const { name, email, message } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 120) {
    return res.status(400).json({ error: 'Please enter a name between 2 and 120 characters.' });
  }
  if (!validEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (typeof message !== 'string' || message.trim().length < 10 || message.length > 5000) {
    return res.status(400).json({ error: 'Please enter a message between 10 and 5000 characters.' });
  }
  database.prepare('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)').run(name.trim(), email.trim(), message.trim());
  return res.status(201).json({ message: 'Thanks for your message. We’ll be in touch soon.' });
});

app.post('/api/newsletter', formLimiter, (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!validEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  database.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(email.toLowerCase());
  return res.status(201).json({ message: 'You’re on the list. Thanks for subscribing!' });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

if (production) {
  const browserDir = resolve(root, 'dist', 'mfd-cms', 'browser');
  app.use(express.static(browserDir, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api\/).*/, (_req, res, next) => {
    res.sendFile(join(browserDir, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
}

app.use((error, _req, res, _next) => {
  console.error('Request failed:', error);
  if (res.headersSent) return;
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

app.listen(port, () => {
  console.log(`MFD Solutions API listening on http://localhost:${port}`);
});
