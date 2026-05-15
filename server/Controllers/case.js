import asyncHandler from 'express-async-handler';
import Case from '../Models/Case.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// GET /cases  — list all, optional search & status filter
export const getCases = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { clientFullName: { $regex: search, $options: 'i' } },
      { caseName: { $regex: search, $options: 'i' } },
      { clientPhone: { $regex: search, $options: 'i' } },
    ];
  }
  const cases = await Case.find(query).sort({ createdAt: -1 }).lean();
  res.json(cases);
});

// GET /cases/:id
export const getCaseById = asyncHandler(async (req, res) => {
  const c = await Case.findById(req.params.id).lean();
  if (!c) { res.status(404); throw new Error('Dossier introuvable'); }
  res.json(c);
});

// POST /cases
export const createCase = asyncHandler(async (req, res) => {
  const { clientFullName, clientPhone, clientDescription, caseName, caseType,
    status, startDate, endDate, nextHearing, notes } = req.body;

  if (!clientFullName || !clientPhone || !caseName) {
    res.status(400);
    throw new Error('Nom, téléphone et nom du dossier sont requis');
  }

  const documents = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const url = await uploadToCloudinary(file);
      documents.push({
        url,
        originalName: file.originalname,
        fileType: file.mimetype,
      });
    }
  }

  const newCase = await Case.create({
    clientFullName, clientPhone,
    clientDescription: clientDescription || '',
    caseName, caseType: caseType || '',
    status: status || 'en_cours',
    startDate: startDate || null,
    endDate: endDate || null,
    nextHearing: nextHearing || null,
    notes: notes || '',
    documents,
  });

  res.status(201).json(newCase);
});

// PUT /cases/:id
export const updateCase = asyncHandler(async (req, res) => {
  const c = await Case.findById(req.params.id);
  if (!c) { res.status(404); throw new Error('Dossier introuvable'); }

  const fields = ['clientFullName', 'clientPhone', 'clientDescription',
    'caseName', 'caseType', 'status', 'startDate', 'endDate', 'nextHearing', 'notes'];
  fields.forEach((f) => { if (req.body[f] !== undefined) c[f] = req.body[f]; });

  // ── NEW: remove documents the client deleted ──
  if (req.body.removedDocIds) {
    const removed = JSON.parse(req.body.removedDocIds); // array of _id strings
    c.documents = c.documents.filter(
      (d) => !removed.includes(d._id.toString())
    );
  }

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const url = await uploadToCloudinary(file);
      c.documents.push({ url, originalName: file.originalname, fileType: file.mimetype });
    }
  }

  const updated = await c.save();
  res.json(updated);
});

// DELETE /cases/:id
export const deleteCase = asyncHandler(async (req, res) => {
  const c = await Case.findById(req.params.id);
  if (!c) { res.status(404); throw new Error('Dossier introuvable'); }
  await Case.deleteOne({ _id: req.params.id });
  res.json({ message: 'Dossier supprimé' });
});

// DELETE /cases/:id/documents/:docId  — remove a single document
export const deleteDocument = asyncHandler(async (req, res) => {
  const c = await Case.findById(req.params.id);
  if (!c) { res.status(404); throw new Error('Dossier introuvable'); }
  c.documents = c.documents.filter((d) => d._id.toString() !== req.params.docId);
  await c.save();
  res.json(c);
});