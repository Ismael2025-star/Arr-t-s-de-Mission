import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
const result = config({ 
  path: join(__dirname, '.env'),
  debug: process.env.NODE_ENV === 'development'
});

if (result.error) {
  throw new Error(`Error loading .env file: ${result.error.message}`);
}

// Validate required environment variables
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

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
import { User, Mission, Financier, Participant } from './src/entities';

const app = express();

// Configure CORS
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error('Error creating uploads directory:', err);
  }
}

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
    console.log('Received request:', req.body);
    console.log('Received file:', req.file);

    const { title, start, end, location, amount, financier: financierData, personnes } = req.body;
    
    if (!title || !start || !end || !location || !amount || !financierData || !personnes) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }    // Parse the financier data with proper typing
    let financierName: string;
    let financierFunction: string;

    // Handle financier data from the form
    if (typeof financierData === 'string') {
      // If it's a string, expect format "name,function"
      [financierName, financierFunction] = financierData.split(',').map((s: string) => s.trim());
      if (!financierName || !financierFunction) {
        res.status(400).json({ 
          message: 'Invalid financier data. Both name and function are required in format "name,function"' 
        });
        return;
      }
    } else if (typeof financierData === 'object' && financierData !== null) {
      // If it's an object, expect {name: string, function: string}
      financierName = financierData.name;
      financierFunction = financierData.function;
      if (!financierName || !financierFunction) {
        res.status(400).json({ 
          message: 'Invalid financier data. Both name and function are required' 
        });
        return;
      }
    } else {
      res.status(400).json({ 
        message: 'Invalid financier data format' 
      });
      return;
    }
    
    // Create or find financier
    const financierRepo = AppDataSource.getRepository(Financier);
    let financier = await financierRepo.findOne({
      where: { name: financierName, function: financierFunction }
    });    if (!financier) {
      try {
        financier = financierRepo.create({
          name: financierName,
          function: financierFunction
        });
        await financier.save();
      } catch (error: any) {
        console.error('Error creating financier:', error);
        res.status(400).json({ 
          message: 'Error creating financier. Please ensure both name and function are provided.',
          error: error.message 
        });
        return;
      }
    }

    const personnesData = typeof personnes === 'string' ? JSON.parse(personnes) : personnes;
    const filePath = req.file?.filename;
    const missionRepo = AppDataSource.getRepository(Mission);
    const participantRepo = AppDataSource.getRepository(Participant);
    
    // Get the current user's ID from the request
    const userId = (req as AuthRequest).user?.id || 1; // Default to 1 for testing
    
    // Create the mission first
    const mission = missionRepo.create({
      title,
      start: new Date(start),
      end: new Date(end),
      location,
      amount: Number(amount),
      financierId: financier.id,
      createdById: userId,
      file: filePath,
      status: 'pending_ministre'
    });

    await missionRepo.save(mission);

    // Create participants
    const participantPromises = personnesData.map((p: any) => {
      const participant = participantRepo.create({
        name: p.nom,
        ministere: p.ministere,
        direction: p.direction,
        function: p.fonction,
        startDate: new Date(p.debut),
        endDate: new Date(p.fin),
        montantAllocated: Number(amount),
        missionId: mission.id
      });
      return participantRepo.save(participant);
    });

    await Promise.all(participantPromises);

    res.json({ id: mission.id });
  } catch (err: any) {
    console.error('Error creating mission:', err);
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
// Mission routes
app.post('/api/missions', upload.single('file'), (req, res, next) => {
  console.log('Processing file upload:', req.file); // Debug log
  createMission(req, res, next);
}).options('/api/missions', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).send();
});

app.get('/api/missions', authenticate, getMissions);
app.get('/api/missions/pending', authenticate, getPendingMissions);
app.post('/api/missions/:id/approve', authenticate, approveMission);
app.post('/api/missions/:id/reject', authenticate, rejectMission);
app.get('/api/files/:filename', authenticate, getFile);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
