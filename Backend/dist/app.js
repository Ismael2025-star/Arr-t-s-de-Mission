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
const typeorm_config_js_1 = require("./typeorm.config.js");
const entities_js_1 = require("./src/entities/entities.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
typeorm_config_js_1.AppDataSource.initialize()
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
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path_1.default.extname(file.originalname)),
});
const upload = (0, multer_1.default)({ storage });
function authenticate(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Unauthorized' });
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err)
            return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
}
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const userRepo = typeorm_config_js_1.AppDataSource.getRepository(entities_js_1.User);
    const user = await userRepo.findOneBy({ username });
    if (!user || !bcryptjs_1.default.compareSync(password, user.password))
        return res.status(401).json({ message: 'Invalid credentials' });
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, role: user.role });
});
app.get('/api/users', authenticate, async (req, res) => {
    if (req.user.role !== 'admin')
        return res.status(403).json({ message: 'Forbidden' });
    const userRepo = typeorm_config_js_1.AppDataSource.getRepository(entities_js_1.User);
    const users = await userRepo.find({ select: ['id', 'username', 'role', 'active'] });
    res.json(users);
});
app.put('/api/users/:id', authenticate, async (req, res) => {
    if (req.user.role !== 'admin')
        return res.status(403).json({ message: 'Forbidden' });
    const { active, role } = req.body;
    const userRepo = typeorm_config_js_1.AppDataSource.getRepository(entities_js_1.User);
    await userRepo.update(req.params.id, { active, role });
    res.json({ success: true });
});
app.post('/api/missions', upload.single('file'), async (req, res) => {
    try {
        const { title, start, end, location, amount, financier, personnes } = req.body;
        const personnesArr = JSON.parse(personnes);
        const filePath = req.file ? req.file.filename : null;
        const missionRepo = typeorm_config_js_1.AppDataSource.getRepository(entities_js_1.Mission);
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
});
app.get('/api/missions', authenticate, async (req, res) => {
    const missionRepo = typeorm_config_js_1.AppDataSource.getRepository(entities_js_1.Mission);
    const missions = await missionRepo.find();
    res.json(missions.map(m => ({ ...m, fileUrl: m.file ? `/api/files/${m.file}` : null })));
});
app.get('/api/missions/pending', authenticate, async (req, res) => {
    if (req.user.role !== 'ministre')
        return res.status(403).json({ message: 'Forbidden' });
    const missionRepo = typeorm_config_js_1.AppDataSource.getRepository(entities_js_1.Mission);
    const missions = await missionRepo.findBy({ status: 'pending_ministre' });
    res.json(missions.map(m => ({ ...m, fileUrl: m.file ? `/api/files/${m.file}` : null })));
});
app.post('/api/missions/:id/approve', authenticate, async (req, res) => {
    if (req.user.role !== 'ministre')
        return res.status(403).json({ message: 'Forbidden' });
    const missionRepo = typeorm_config_js_1.AppDataSource.getRepository(entities_js_1.Mission);
    await missionRepo.update(req.params.id, { status: 'approved' });
    res.json({ success: true });
});
app.post('/api/missions/:id/reject', authenticate, async (req, res) => {
    if (req.user.role !== 'ministre')
        return res.status(403).json({ message: 'Forbidden' });
    const missionRepo = typeorm_config_js_1.AppDataSource.getRepository(entities_js_1.Mission);
    await missionRepo.update(req.params.id, { status: 'rejected' });
    res.json({ success: true });
});
app.get('/api/files/:filename', authenticate, (req, res) => {
    const file = path_1.default.join(uploadDir, req.params.filename);
    if (!fs_1.default.existsSync(file))
        return res.status(404).end();
    res.sendFile(file);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
