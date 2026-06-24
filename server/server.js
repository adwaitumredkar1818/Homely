require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { setIo } = require('./utils/notifier');
const { authenticateToken } = require('./middleware/auth');

const rateLimiter = require('./middleware/rateLimiter');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configure Socket.io instance for notifier and app context
setIo(io);
app.set('socketio', io);

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Configure Rate Limiters
const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again in 15 minutes.'
});

const authLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many login or registration attempts. Please try again in 1 minute.'
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Apply Rate Limiters
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Socket connection handler
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined room user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

// Upload routes
app.post('/api/upload', authenticateToken, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const urls = req.files.map(file => `http://localhost:5000/uploads/${file.filename}`);
    res.json({ success: true, urls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

app.post('/api/upload/single', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ success: true, url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Import and mount routers
const authRouter = require('./routes/auth');
const roomsRouter = require('./routes/rooms');
const messesRouter = require('./routes/messes');
const bookingsRouter = require('./routes/bookings');
const messagesRouter = require('./routes/messages');
const wishlistRouter = require('./routes/wishlist');
const maintenanceRouter = require('./routes/maintenance');
const notificationsRouter = require('./routes/notifications');
const userRouter = require('./routes/user');
const roommatesRouter = require('./routes/roommates');
const analyticsRouter = require('./routes/analytics');

app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/messes', messesRouter);
app.use('/api', bookingsRouter); // handles /bookings and /host/reservations
app.use('/api/messages', messagesRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/user', userRouter);
app.use('/api/roommates', roommatesRouter);
app.use('/api/analytics', analyticsRouter);

// Base route
app.get('/', (req, res) => {
  res.send('Homely API Server is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
