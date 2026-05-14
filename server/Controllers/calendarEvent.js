import asyncHandler from 'express-async-handler';
import CalendarEvent from '../Models/CalendarEvent.js';

// GET /events?month=YYYY-MM  or  ?from=date&to=date
export const getEvents = asyncHandler(async (req, res) => {
  const { month, from, to } = req.query;
  const query = {};

  if (month) {
    // e.g. month=2025-06
    const [year, m] = month.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59);
    query.date = { $gte: start, $lte: end };
  } else if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const events = await CalendarEvent.find(query)
    .populate('caseRef', 'caseName clientFullName')
    .sort({ date: 1 })
    .lean();
  res.json(events);
});

// GET /events/:id
export const getEventById = asyncHandler(async (req, res) => {
  const ev = await CalendarEvent.findById(req.params.id)
    .populate('caseRef', 'caseName clientFullName')
    .lean();
  if (!ev) { res.status(404); throw new Error('Événement introuvable'); }
  res.json(ev);
});

// POST /events
export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, date, endDate, type, caseRef, color } = req.body;
  if (!title || !date) { res.status(400); throw new Error('Titre et date requis'); }
  const ev = await CalendarEvent.create({ title, description, date, endDate, type, caseRef, color });
  res.status(201).json(ev);
});

// PUT /events/:id
export const updateEvent = asyncHandler(async (req, res) => {
  const ev = await CalendarEvent.findById(req.params.id);
  if (!ev) { res.status(404); throw new Error('Événement introuvable'); }
  const fields = ['title', 'description', 'date', 'endDate', 'type', 'caseRef', 'color'];
  fields.forEach((f) => { if (req.body[f] !== undefined) ev[f] = req.body[f]; });
  const updated = await ev.save();
  res.json(updated);
});

// DELETE /events/:id
export const deleteEvent = asyncHandler(async (req, res) => {
  const ev = await CalendarEvent.findById(req.params.id);
  if (!ev) { res.status(404); throw new Error('Événement introuvable'); }
  await CalendarEvent.deleteOne({ _id: req.params.id });
  res.json({ message: 'Événement supprimé' });
});