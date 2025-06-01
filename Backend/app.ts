import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from './typeorm.config.js';
import { User, Mission } from './src/entities/entities.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage });

function authenticate(req: any, res: any, next: any) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  });
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOneBy({ username });
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
  res.json({ token, role: user.role });
});

app.get('/api/users', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ select: ['id', 'username', 'role', 'active'] });
  res.json(users);
});

app.put('/api/users/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { active, role } = req.body;
  const userRepo = AppDataSource.getRepository(User);
  await userRepo.update(req.params.id, { active, role });
  res.json({ success: true });
});

app.post('/api/missions', upload.single('file'), async (req, res) => {
  try {
    const { title, start, end, location, amount, financier, personnes } = req.body;
    const personnesArr = JSON.parse(personnes);
    const filePath = req.file ? req.file.filename : null;
    const missionRepo = AppDataSource.getRepository(Mission);
    const mission = missionRepo.create({
      title,
      start,
      end,
      location,
      amount,
      financier,
      personnes: personnesArr,
      file: filePath,
      status: 'pending_ministre',
    });
    await missionRepo.save(mission);
    res.json({ id: mission.id });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/missions', authenticate, async (req, res) => {
  const missionRepo = AppDataSource.getRepository(Mission);
  const missions = await missionRepo.find();
  res.json(missions.map(m => ({ ...m, fileUrl: m.file ? `/api/files/${m.file}` : null })));
});

app.get('/api/missions/pending', authenticate, async (req, res) => {
  if (req.user.role !== 'ministre') return res.status(403).json({ message: 'Forbidden' });
  const missionRepo = AppDataSource.getRepository(Mission);
  const missions = await missionRepo.findBy({ status: 'pending_ministre' });
  res.json(missions.map(m => ({ ...m, fileUrl: m.file ? `/api/files/${m.file}` : null })));
});

app.post('/api/missions/:id/approve', authenticate, async (req, res) => {
  if (req.user.role !== 'ministre') return res.status(403).json({ message: 'Forbidden' });
  const missionRepo = AppDataSource.getRepository(Mission);
  await missionRepo.update(req.params.id, { status: 'approved' });
  res.json({ success: true });
});
app.post('/api/missions/:id/reject', authenticate, async (req, res) => {
  if (req.user.role !== 'ministre') return res.status(403).json({ message: 'Forbidden' });
  const missionRepo = AppDataSource.getRepository(Mission);
  await missionRepo.update(req.params.id, { status: 'rejected' });
  res.json({ success: true });
});

app.get('/api/files/:filename', authenticate, (req, res) => {
  const file = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(file)) return res.status(404).end();
  res.sendFile(file);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
