import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './Routes/authRoutes.js';
import { errorHandler } from './Middleware/error.js';
import caseRoutes from './Routes/caseRoutes.js';
import eventRoutes from './Routes/calendarEventRoutes.js';
import logRoutes from './Routes/logsRoutes.js';
import { startReminderScheduler } from './Controllers/EmailReminder.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    startReminderScheduler(); // ← inside .then(), guaranteed DB is up
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1); // fail fast — don't run a broken server
  });

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/logs', logRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));