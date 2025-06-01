require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const knex = require('knex');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database setup (PostgreSQL via Knex) ---
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: 'localhost',
    user: 'postgres',
    password: 'postgres',
    database: 'arretes_mission',
  },
});

// --- Multer setup for file uploads ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage });

// --- Middleware for authentication (JWT) ---
function authenticate(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  });
}

// --- API Endpoints ---
// User login (for demo, no registration)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db('users').where({ username }).first();
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
  res.json({ token, role: user.role });
});

// Get all users (admin only)
app.get('/api/users', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const users = await db('users').select('id', 'username', 'role', 'active');
  res.json(users);
});

// Update user (activate/deactivate/edit)
app.put('/api/users/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { active, role } = req.body;
  await db('users').where({ id: req.params.id }).update({ active, role });
  res.json({ success: true });
});

// --- Mission Order Submission (Secrétaire) ---
app.post('/api/missions', upload.single('file'), async (req, res) => {
  try {
    const { title, start, end, location, amount, financier, personnes } = req.body;
    const personnesArr = JSON.parse(personnes);
    const filePath = req.file ? req.file.filename : null;
    const [id] = await db('missions').insert({
      title, start, end, location, amount, financier, personnes: JSON.stringify(personnesArr), file: filePath, status: "pending_ministre"
    }).returning('id');
    res.json({ id });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- Get all missions (Autorité) ---
app.get('/api/missions', authenticate, async (req, res) => {
  const missions = await db('missions').select('*');
  res.json(missions.map(m => ({ ...m, fileUrl: m.file ? `/api/files/${m.file}` : null })));
});

// --- Get pending missions (Ministre) ---
app.get('/api/missions/pending', authenticate, async (req, res) => {
  if (req.user.role !== 'ministre') return res.status(403).json({ message: 'Forbidden' });
  const missions = await db('missions').where({ status: 'pending_ministre' });
  res.json(missions.map(m => ({ ...m, fileUrl: m.file ? `/api/files/${m.file}` : null })));
});

// --- Approve/Reject mission (Ministre) ---
app.post('/api/missions/:id/approve', authenticate, async (req, res) => {
  if (req.user.role !== 'ministre') return res.status(403).json({ message: 'Forbidden' });
  await db('missions').where({ id: req.params.id }).update({ status: 'approved' });
  res.json({ success: true });
});
app.post('/api/missions/:id/reject', authenticate, async (req, res) => {
  if (req.user.role !== 'ministre') return res.status(403).json({ message: 'Forbidden' });
  await db('missions').where({ id: req.params.id }).update({ status: 'rejected' });
  res.json({ success: true });
});

// --- Serve uploaded files securely ---
app.get('/api/files/:filename', authenticate, (req, res) => {
  const file = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(file)) return res.status(404).end();
  res.sendFile(file);
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
