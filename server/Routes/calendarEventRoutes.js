import express from 'express';
import {
  getEvents, getEventById, createEvent,
  updateEvent, deleteEvent,
} from '../Controllers/calendarEvent.js';
import { protect } from '../Middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;