import asyncHandler from 'express-async-handler';
import CalendarEvent from '../Models/CalendarEvent.js';
import Case from '../Models/Case.js';
import { logAction } from '../Middleware/logger.js';

export const getEvents = asyncHandler(async (req, res) => {
  const { month, from, to } = req.query;

  // ── Build date range ──────────────────────────────────────────────
  let rangeStart, rangeEnd;
  if (month) {
    const [year, m] = month.split('-').map(Number);
    rangeStart = new Date(year, m - 1, 1);
    rangeEnd   = new Date(year, m, 0, 23, 59, 59);
  } else if (from || to) {
    rangeStart = from ? new Date(from) : new Date('2000-01-01');
    rangeEnd   = to   ? new Date(new Date(to).setHours(23, 59, 59, 999)) : new Date('2100-01-01');
  }

  // ── Fetch real CalendarEvents ─────────────────────────────────────
  const query = {};
  if (rangeStart && rangeEnd) query.date = { $gte: rangeStart, $lte: rangeEnd };

  const realEvents = await CalendarEvent.find(query)
    .populate('caseRef', 'caseName clientFullName')
    .sort({ date: 1 })
    .lean();

  // ── Fetch case dates and synthesize virtual events ────────────────
  const caseQuery = {};
  if (rangeStart && rangeEnd) {
    caseQuery.$or = [
      { nextHearing: { $gte: rangeStart, $lte: rangeEnd } },
      { startDate:   { $gte: rangeStart, $lte: rangeEnd } },
      { endDate:     { $gte: rangeStart, $lte: rangeEnd } },
    ];
  }

  const cases = await Case.find(caseQuery)
    .select('caseName clientFullName nextHearing startDate endDate status')
    .lean();

  // Map each relevant date field to a virtual event object
  const VIRTUAL_TYPE_MAP = {
    nextHearing: { type: 'audience', label: 'Audience' },
    startDate:   { type: 'autre',    label: 'Ouverture' },
    endDate:     { type: 'délai',    label: 'Clôture'   },
  };

  const caseEvents = [];
  for (const c of cases) {
    for (const [field, { type, label }] of Object.entries(VIRTUAL_TYPE_MAP)) {
      const date = c[field];
      if (!date) continue;
      const d = new Date(date);
      if (rangeStart && rangeEnd && (d < rangeStart || d > rangeEnd)) continue;

      caseEvents.push({
        _id:         `case-${c._id}-${field}`,   // stable synthetic ID
        title:       `${label} — ${c.caseName}`,
        description: `Client : ${c.clientFullName}`,
        date:        d,
        endDate:     null,
        type,
        color:       '#6b7280',
        caseRef:     { _id: c._id, caseName: c.caseName, clientFullName: c.clientFullName },
        isVirtual:   true,                        // flag so frontend can style differently
        caseStatus:  c.status,
      });
    }
  }

  // ── Merge, deduplicate by caseRef+field, sort ─────────────────────
  // Remove real events that are already manually linked to the same case+date
  // to avoid doubles when the user created an event from a case manually.
  const linkedCaseIds = new Set(
    realEvents
      .filter(ev => ev.caseRef)
      .map(ev => `${ev.caseRef._id}-${new Date(ev.date).toDateString()}`)
  );

  const filteredCaseEvents = caseEvents.filter(ce => {
    const key = `${ce.caseRef._id}-${new Date(ce.date).toDateString()}`;
    return !linkedCaseIds.has(key);
  });

  const allEvents = [...realEvents, ...filteredCaseEvents]
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  res.json(allEvents);
});

// ... rest of the file unchanged (getEventById, createEvent, updateEvent, deleteEvent)

export const getEventById = asyncHandler(async (req, res) => {
  const ev = await CalendarEvent.findById(req.params.id)
    .populate('caseRef', 'caseName clientFullName').lean();
  if (!ev) { res.status(404); throw new Error('Événement introuvable'); }
  res.json(ev);
});

export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, date, endDate, type, caseRef, color } = req.body;
  if (!title || !date) { res.status(400); throw new Error('Titre et date requis'); }
  const ev = await CalendarEvent.create({ title, description, date, endDate, type, caseRef, color });
  await logAction(req, 'CREATE', 'EVENT', ev._id, ev.title, { date: ev.date, type: ev.type });
  res.status(201).json(ev);
});

export const updateEvent = asyncHandler(async (req, res) => {
  const ev = await CalendarEvent.findById(req.params.id);
  if (!ev) { res.status(404); throw new Error('Événement introuvable'); }
  const fields = ['title', 'description', 'date', 'endDate', 'type', 'caseRef', 'color'];
  fields.forEach((f) => { if (req.body[f] !== undefined) ev[f] = req.body[f]; });
  const updated = await ev.save();
  await logAction(req, 'UPDATE', 'EVENT', ev._id, ev.title, { changes: req.body });
  res.json(updated);
});

export const deleteEvent = asyncHandler(async (req, res) => {
  if (req.user?.usertype === 'admin') {
    res.status(403); throw new Error('Admins cannot delete events');
  }
  const ev = await CalendarEvent.findById(req.params.id);
  if (!ev) { res.status(404); throw new Error('Événement introuvable'); }
  await logAction(req, 'DELETE', 'EVENT', ev._id, ev.title, { date: ev.date });
  await CalendarEvent.deleteOne({ _id: req.params.id });
  res.json({ message: 'Événement supprimé' });
});