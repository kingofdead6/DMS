import asyncHandler from 'express-async-handler';
import Case from '../Models/Case.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { logAction } from '../Middleware/logger.js';

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

export const getCaseById = asyncHandler(async (req, res) => {
  const c = await Case.findById(req.params.id).lean();
  if (!c) { res.status(404); throw new Error('Dossier introuvable'); }
  res.json(c);
});

export const createCase = asyncHandler(async (req, res) => {
  const { clientFullName, clientPhone, clientDescription, caseName,
    caseDescription, caseType, status, startDate, endDate, nextHearing, notes } = req.body;

  if (!clientFullName || !clientPhone || !caseName) {
    res.status(400); throw new Error('Nom, téléphone et nom du dossier sont requis');
  }

  const documents = [];
  if (req.files?.length > 0) {
    for (const file of req.files) {
      const url = await uploadToCloudinary(file);
      documents.push({ url, originalName: file.originalname, fileType: file.mimetype });
    }
  }

  const newCase = await Case.create({
    clientFullName, clientPhone,
    clientDescription: clientDescription || '',
    caseName, caseDescription: caseDescription || '',
    caseType: caseType || '',
    status: status || 'en_cours',
    startDate: startDate || null, endDate: endDate || null,
    nextHearing: nextHearing || null,
    notes: notes || '', documents,
  });

  await logAction(req, 'CREATE', 'CASE', newCase._id, newCase.caseName, {
    client: clientFullName, status: newCase.status,
  });
  res.status(201).json(newCase);
});

export const updateCase = asyncHandler(async (req, res) => {
  const c = await Case.findById(req.params.id);
  if (!c) { res.status(404); throw new Error('Dossier introuvable'); }

  const fields = ['clientFullName', 'clientPhone', 'clientDescription',
    'caseName', 'caseDescription', 'caseType', 'status',
    'startDate', 'endDate', 'nextHearing', 'notes'];
  const before = {};
  fields.forEach((f) => {
    before[f] = c[f];
    if (req.body[f] !== undefined) c[f] = req.body[f];
  });

  if (req.body.removedDocIds) {
    const removed = JSON.parse(req.body.removedDocIds);
    c.documents = c.documents.filter((d) => !removed.includes(d._id.toString()));
  }

  if (req.files?.length > 0) {
    for (const file of req.files) {
      const url = await uploadToCloudinary(file);
      c.documents.push({ url, originalName: file.originalname, fileType: file.mimetype });
    }
  }

  const updated = await c.save();
  await logAction(req, 'UPDATE', 'CASE', c._id, c.caseName, { changes: req.body });
  res.json(updated);
});

export const deleteCase = asyncHandler(async (req, res) => {
  // Block admin from deleting
  if (req.user?.usertype === 'admin') {
    res.status(403); throw new Error('Admins cannot delete cases');
  }
  const c = await Case.findById(req.params.id);
  if (!c) { res.status(404); throw new Error('Dossier introuvable'); }
  await logAction(req, 'DELETE', 'CASE', c._id, c.caseName, { client: c.clientFullName });
  await Case.deleteOne({ _id: req.params.id });
  res.json({ message: 'Dossier supprimé' });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  if (req.user?.usertype === 'admin') {
    res.status(403); throw new Error('Admins cannot delete documents');
  }
  const c = await Case.findById(req.params.id);
  if (!c) { res.status(404); throw new Error('Dossier introuvable'); }
  c.documents = c.documents.filter((d) => d._id.toString() !== req.params.docId);
  await c.save();
  res.json(c);
});