import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server';

import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import contractorRoutes from './routes/contractor.js';
import notificationRoutes from './routes/notifications.js';
import seedRoutes from './routes/seed.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/contractor', contractorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

let mongod = null;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fixmycity';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    return;
  } catch (error) {
    console.log('Local MongoDB not available, starting in-memory MongoDB...');
  }

  try {
    mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    await mongoose.connect(memUri);
    console.log('In-memory MongoDB connected');
  } catch (error) {
    console.error('Failed to start in-memory MongoDB:', error);
    process.exit(1);
  }
};

export const startServer = async () => {
  await connectDB();
  return app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

process.on('SIGINT', async () => {
  if (mongod) {
    await mongod.stop();
  }
  await mongoose.connection.close();
  process.exit(0);
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
