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
    startReminderScheduler();
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });

// Router with /realbackenddms prefix
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Backend Works');
});

router.get('/test', (req, res) => {
  res.send('Test OK');
});

router.use('/api/auth', authRoutes);
router.use('/api/cases', caseRoutes);
router.use('/api/events', eventRoutes);
router.use('/api/logs', logRoutes);
router.use(errorHandler);

app.use('/realbackenddms', router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));