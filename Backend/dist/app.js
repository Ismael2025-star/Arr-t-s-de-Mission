"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const typeorm_config_1 = require("./typeorm.config");
const entities_1 = require("./src/entities");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
typeorm_config_1.AppDataSource.initialize()
    .then(() => {
    console.log('Data Source has been initialized!');
})
    .catch((err) => {
    console.error('Error during Data Source initialization', err);
});
const uploadDir = path_1.default.join(__dirname, 'uploads');
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir);
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage });
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
const login = async (req, res) => {
    const { username, password } = req.body;
    const userRepo = typeorm_config_1.AppDataSource.getRepository(entities_1.User);
    const user = await userRepo.findOneBy({ username });
    if (!user || !bcryptjs_1.default.compareSync(password, user.password)) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, role: user.role });
};
const getUsers = async (req, res) => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    const userRepo = typeorm_config_1.AppDataSource.getRepository(entities_1.User);
    const users = await userRepo.find({ select: ['id', 'username', 'role', 'active'] });
    res.json(users);
};
const updateUser = async (req, res) => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    const { active, role } = req.body;
    const userRepo = typeorm_config_1.AppDataSource.getRepository(entities_1.User);
    await userRepo.update(req.params.id, { active, role });
    res.json({ success: true });
};
const createMission = async (req, res) => {
    try {
        const { title, start, end, location, amount, financier, personnes } = req.body;
        const personnesArr = JSON.parse(personnes);
        const filePath = req.file ? req.file.filename : null;
        const missionRepo = typeorm_config_1.AppDataSource.getRepository(entities_1.Mission);
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
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};
const getMissions = async (_req, res) => {
    const missionRepo = typeorm_config_1.AppDataSource.getRepository(entities_1.Mission);
    const missions = await missionRepo.find();
    res.json(missions.map(m => ({ ...m, fileUrl: m.file ? `/api/files/${m.file}` : null })));
};
const getPendingMissions = async (req, res) => {
    if (req.user?.role !== 'ministre') {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    const missionRepo = typeorm_config_1.AppDataSource.getRepository(entities_1.Mission);
    const missions = await missionRepo.findBy({ status: 'pending_ministre' });
    res.json(missions.map(m => ({ ...m, fileUrl: m.file ? `/api/files/${m.file}` : null })));
};
const approveMission = async (req, res) => {
    if (req.user?.role !== 'ministre') {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    const missionRepo = typeorm_config_1.AppDataSource.getRepository(entities_1.Mission);
    await missionRepo.update(req.params.id, { status: 'approved' });
    res.json({ success: true });
};
const rejectMission = async (req, res) => {
    if (req.user?.role !== 'ministre') {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    const missionRepo = typeorm_config_1.AppDataSource.getRepository(entities_1.Mission);
    await missionRepo.update(req.params.id, { status: 'rejected' });
    res.json({ success: true });
};
const getFile = (req, res) => {
    const filePath = path_1.default.join(uploadDir, req.params.filename);
    if (!fs_1.default.existsSync(filePath)) {
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
