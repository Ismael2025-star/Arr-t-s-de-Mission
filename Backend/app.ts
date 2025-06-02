import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import type { RequestHandler } from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from './typeorm.config';
import { User, Mission } from './src/entities';

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
  destination: (_req: Express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

const authenticate: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: number; role: string };
    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const login: RequestHandler = async (req, res) => {
  const { username, password } = req.body;
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOneBy({ username });
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );

  res.json({ token, role: user.role });
};

const getUsers: RequestHandler = async (req, res) => {
  if ((req as AuthRequest).user?.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ select: ['id', 'username', 'role', 'active'] });
  res.json(users);
};

const updateUser: RequestHandler = async (req, res) => {
  if ((req as AuthRequest).user?.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const { active, role } = req.body;
  const userRepo = AppDataSource.getRepository(User);
  await userRepo.update(req.params.id, { active, role });
  res.json({ success: true });
};

const createMission: RequestHandler = async (req, res) => {
  try {
    const { title, start, end, location, amount, financier, personnes } = req.body;
    const personnesArr = JSON.parse(personnes);
    const filePath = (req as any).file ? (req as any).file.filename : null;
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
    } as Partial<Mission>);

    await missionRepo.save(mission);
    res.json({ id: mission.id });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const getMissions: RequestHandler = async (_req, res) => {
  const missionRepo = AppDataSource.getRepository(Mission);
  const missions = await missionRepo.find();
  res.json(missions.map(m => ({ ...m, fileUrl: m.file ? `/api/files/${m.file}` : null })));
};

const getPendingMissions: RequestHandler = async (req, res) => {
  if ((req as AuthRequest).user?.role !== 'ministre') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const missionRepo = AppDataSource.getRepository(Mission);
  const missions = await missionRepo.findBy({ status: 'pending_ministre' });
  res.json(missions.map(m => ({ ...m, fileUrl: m.file ? `/api/files/${m.file}` : null })));
};

const approveMission: RequestHandler = async (req, res) => {
  if ((req as AuthRequest).user?.role !== 'ministre') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const missionRepo = AppDataSource.getRepository(Mission);
  await missionRepo.update(req.params.id, { status: 'approved' });
  res.json({ success: true });
};

const rejectMission: RequestHandler = async (req, res) => {
  if ((req as AuthRequest).user?.role !== 'ministre') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const missionRepo = AppDataSource.getRepository(Mission);
  await missionRepo.update(req.params.id, { status: 'rejected' });
  res.json({ success: true });
};

const getFile: RequestHandler = (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ message: 'File not found' });
    return;
  }
  res.sendFile(filePath);
};

// Routes
app.post('/api/login', login);
app.get('/api/users', authenticate, getUsers);
app.put('/api/users/:id', authenticate, updateUser);
app.post('/api/missions', upload.single('file'), createMission);
app.get('/api/missions', authenticate, getMissions);
app.get('/api/missions/pending', authenticate, getPendingMissions);
app.post('/api/missions/:id/approve', authenticate, approveMission);
app.post('/api/missions/:id/reject', authenticate, rejectMission);
app.get('/api/files/:filename', authenticate, getFile);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
