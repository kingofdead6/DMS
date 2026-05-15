"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../../../api";
import { toast } from "react-toastify";
import {
  Plus, Search, X, Edit, Trash2, Phone,
  User, Calendar, Clock, ChevronDown, Paperclip, Eye,
  Download, FolderOpen, Scale, FileText,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
// Add near the top of AdminCases.jsx (after imports)
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}
function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}
const STATUS_CONFIG = {
  en_cours: { label: "En cours",  color: "bg-blue-50 text-blue-700 border-blue-200" },
  suspendu: { label: "Suspendu",  color: "bg-amber-50 text-amber-700 border-amber-200" },
  clôturé:  { label: "Clôturé",   color: "bg-gray-100 text-gray-600 border-gray-200" },
  gagné:    { label: "Gagné",     color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  perdu:    { label: "Perdu",     color: "bg-red-50 text-red-700 border-red-200" },
};

const CASE_TYPES = ["Civil", "Pénal", "Commercial", "Administratif", "Familial", "Travail", "Autre"];

const EMPTY_FORM = {
  clientFullName: "", clientPhone: "", clientDescription: "",
  caseName: "", caseDescription: "", caseType: "", status: "en_cours",
  startDate: "", endDate: "", nextHearing: "", notes: "",
  documents: [],       // { url, name, existing, _id?, file? }
  removedDocIds: [],   // _ids of existing docs to delete on save
};

export default function AdminCases() {
  const [cases, setCases]           = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading]       = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
// Add inside AdminCases, after useState declarations:
const [userType, setUserType] = useState("admin");
useEffect(() => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    try { setUserType(jwtDecode(token).usertype); } catch { /* */ }
  }
}, []);
  useEffect(() => { fetchCases(); }, []);

  useEffect(() => {
    const f = cases.filter((c) => {
      const matchSearch =
        !searchTerm ||
        c.clientFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.caseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clientPhone.includes(searchTerm);
      const matchStatus = !statusFilter || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
    setFiltered(f);
  }, [cases, searchTerm, statusFilter]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cases`, { headers: authHeader() });
      setCases(res.data);
    } catch {
      toast.error("Erreur lors du chargement des dossiers");
    } finally {
      setLoading(false);
    }
  };

  // ── SUBMIT (create or update) ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    const textFields = [
      "clientFullName", "clientPhone", "clientDescription",
      "caseName", "caseDescription", "caseType", "status",
      "startDate", "endDate", "nextHearing", "notes",
    ];
    textFields.forEach((f) => { if (form[f]) fd.append(f, form[f]); });

    // Tell the backend which existing docs to remove
    if (form.removedDocIds.length > 0) {
      fd.append("removedDocIds", JSON.stringify(form.removedDocIds));
    }

    // Only attach truly new files
    form.documents
      .filter((d) => d.file)
      .forEach((d) => fd.append("documents", d.file));

    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/cases/${editingId}`, fd, { headers: authHeader() });
        toast.success("Dossier mis à jour");
      } else {
        await axios.post(`${API_BASE_URL}/cases`, fd, { headers: authHeader() });
        toast.success("Dossier créé avec succès");
      }
      resetForm();
      fetchCases();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(false);
  };

  // ── OPEN EDIT MODAL ────────────────────────────────────────────────────────
  const handleEdit = (c) => {
    setEditingId(c._id);
    setForm({
      clientFullName:    c.clientFullName,
      clientPhone:       c.clientPhone,
      clientDescription: c.clientDescription || "",
      caseName:          c.caseName,
      caseDescription:   c.caseDescription   || "",
      caseType:          c.caseType          || "",
      status:            c.status,
      startDate:         c.startDate    ? c.startDate.slice(0, 10)    : "",
      endDate:           c.endDate      ? c.endDate.slice(0, 10)      : "",
      nextHearing:       c.nextHearing  ? c.nextHearing.slice(0, 10)  : "",
      notes:             c.notes        || "",
      // existing docs carry their Mongo _id so we can delete them selectively
      documents: c.documents.map((d) => ({
        url:      d.url,
        name:     d.originalName,
        _id:      d._id,
        existing: true,
      })),
      removedDocIds: [],
    });
    setShowModal(true);
  };

  // ── FILE HELPERS ───────────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map((file) => ({
      file,
      name: file.name,
      existing: false,
    }));
    setForm((prev) => ({
      ...prev,
      documents: [...prev.documents, ...newDocs].slice(0, 20),
    }));
    // reset input so the same file can be re-added after removal
    e.target.value = "";
  };

  // Removing a doc: if it was already saved on the server, queue its _id for deletion
  const removeDoc = (idx) => {
    const doc = form.documents[idx];
    setForm((prev) => {
      const updatedDocs = prev.documents.filter((_, i) => i !== idx);
      const updatedRemoved =
        doc.existing && doc._id
          ? [...prev.removedDocIds, doc._id]
          : prev.removedDocIds;
      return { ...prev, documents: updatedDocs, removedDocIds: updatedRemoved };
    });
  };

  // ── DELETE WHOLE CASE ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce dossier définitivement ?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/cases/${id}`, { headers: authHeader() });
      setCases((prev) => prev.filter((c) => c._id !== id));
      toast.success("Dossier supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  // ── UTILS ──────────────────────────────────────────────────────────────────
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

  const getFileIcon = (name = "") => {
    const ext = name.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "🖼️";
    if (ext === "pdf") return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    return "📎";
  };

  const accentColor = (status) =>
    status === "gagné"    ? "bg-emerald-400"
    : status === "perdu"  ? "bg-red-400"
    : status === "suspendu" ? "bg-amber-400"
    : status === "clôturé"  ? "bg-gray-300"
    : "bg-blue-400";

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50 pb-24" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale size={22} className="text-gray-700" />
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dossiers Clients</h1>
          </div>
          <span className="text-sm text-gray-400">
            {filtered.length} dossier{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">

        {/* ── Controls ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            <Plus size={18} /> Nouveau Dossier
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, dossier, téléphone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full sm:w-48 pl-4 pr-10 py-3.5 border border-gray-200 rounded-xl bg-white text-sm focus:border-gray-400 focus:outline-none"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Cases grid ── */}
        {loading && cases.length === 0 ? (
          <div className="flex justify-center py-24 text-gray-400">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucun dossier trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((c) => (
              <motion.div
                key={c._id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className={`h-1 w-full ${accentColor(c.status)}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_CONFIG[c.status]?.color}`}>
                      {STATUS_CONFIG[c.status]?.label}
                    </span>
                    {c.documents?.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Paperclip size={12} /> {c.documents.length}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 line-clamp-2">
                    {c.caseName}
                  </h3>
                  {c.caseType && <p className="text-xs text-gray-400 mb-1">{c.caseType}</p>}

                  {/* ── NEW: case description preview ── */}
                  {c.caseDescription && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 italic">{c.caseDescription}</p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <User size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{c.clientFullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span>{c.clientPhone}</span>
                  </div>

                  {c.nextHearing && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-amber-50 px-3 py-1.5 rounded-lg mb-3">
                      <Calendar size={12} className="text-amber-500" />
                      <span>Audience : {formatDate(c.nextHearing)}</span>
                    </div>
                  )}
                  {c.startDate && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                      <Clock size={12} />
                      <span>Depuis le {formatDate(c.startDate)}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => setShowDetail(c)}
                      className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye size={13} className="inline mr-1" /> Détails
                    </button>
                    <button
                      onClick={() => handleEdit(c)}
                      className="flex-1 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit size={13} className="inline mr-1" /> Modifier
                    </button>
                    {userType === "superadmin" && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="py-2 px-2.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[92vh] shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingId ? "Modifier le dossier" : "Nouveau dossier client"}
                </h2>
                <button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-6 flex-1">
                <form onSubmit={handleSubmit} className="space-y-5" id="case-form">

                  {/* Client */}
                  <section>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Informations client
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">Nom complet *</label>
                        <input
                          type="text"
                          placeholder="Ex: Ahmed Benali"
                          value={form.clientFullName}
                          onChange={(e) => setForm({ ...form, clientFullName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">Téléphone *</label>
                        <input
                          type="text"
                          placeholder="0555 123 456"
                          value={form.clientPhone}
                          onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-xs text-gray-500 mb-1.5">Description client (optionnel)</label>
                      <textarea
                        placeholder="Notes sur le client…"
                        value={form.clientDescription}
                        onChange={(e) => setForm({ ...form, clientDescription: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none resize-none h-20"
                      />
                    </div>
                  </section>

                  {/* Dossier */}
                  <section>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Informations du dossier
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1.5">Nom du dossier *</label>
                        <input
                          type="text"
                          placeholder="Ex: Affaire succession Benali"
                          value={form.caseName}
                          onChange={(e) => setForm({ ...form, caseName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                          required
                        />
                      </div>

                      {/* ── NEW: case description ── */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1.5">Description du dossier (optionnel)</label>
                        <textarea
                          placeholder="Résumé de l'affaire, faits importants…"
                          value={form.caseDescription}
                          onChange={(e) => setForm({ ...form, caseDescription: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none resize-none h-24"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">Type</label>
                        <div className="relative">
                          <select
                            value={form.caseType}
                            onChange={(e) => setForm({ ...form, caseType: e.target.value })}
                            className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                          >
                            <option value="">Sélectionner…</option>
                            {CASE_TYPES.map((t) => <option key={t}>{t}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">Statut</label>
                        <div className="relative">
                          <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                          >
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs text-gray-500 mb-1.5">Notes (optionnel)</label>
                      <textarea
                        placeholder="Observations, stratégie, remarques…"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none resize-none h-24"
                      />
                    </div>
                  </section>

                  {/* Dates */}
                  <section>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Dates (optionnel)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { key: "startDate",   label: "Date d'ouverture" },
                        { key: "endDate",     label: "Date de clôture" },
                        { key: "nextHearing", label: "Prochaine audience" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
                          <input
                            type="date"
                            value={form[key]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Documents */}
                  <section>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Documents (max 20)
                    </p>
                    <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-400 transition-colors text-sm text-gray-500">
                      <Paperclip size={16} />
                      Cliquer pour ajouter des fichiers
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                    </label>

                    {form.documents.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {form.documents.map((doc, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 px-3 py-2.5 rounded-xl">
                            <span className="text-base">{getFileIcon(doc.name)}</span>
                            <span className="flex-1 text-xs text-gray-700 truncate">
                              {doc.name || "Fichier existant"}
                            </span>
                            {doc.existing && doc.url && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-600"
                              >
                                <Download size={13} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => removeDoc(i)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                </form>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                <button
                  type="submit"
                  form="case-form"
                  disabled={loading}
                  className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
                >
                  {loading ? "Enregistrement…" : editingId ? "Mettre à jour" : "Créer le dossier"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDetail && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl"
            >
              <div className={`h-1.5 w-full rounded-t-2xl ${accentColor(showDetail.status)}`} />

              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 truncate">{showDetail.caseName}</h2>
                <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-5 space-y-5">
                {/* Status + type */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_CONFIG[showDetail.status]?.color}`}>
                    {STATUS_CONFIG[showDetail.status]?.label}
                  </span>
                  {showDetail.caseType && <span className="text-xs text-gray-400">{showDetail.caseType}</span>}
                </div>

                {/* ── NEW: case description in detail ── */}
                {showDetail.caseDescription && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <FileText size={11} /> Description du dossier
                    </p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl leading-relaxed">
                      {showDetail.caseDescription}
                    </p>
                  </div>
                )}

                {/* Client grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Client</p>
                    <p className="font-medium text-gray-800">{showDetail.clientFullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
                    <p className="font-medium text-gray-800">{showDetail.clientPhone}</p>
                  </div>
                  {showDetail.startDate && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Ouverture</p>
                      <p className="font-medium text-gray-800">{formatDate(showDetail.startDate)}</p>
                    </div>
                  )}
                  {showDetail.nextHearing && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Prochaine audience</p>
                      <p className="font-medium text-amber-700">{formatDate(showDetail.nextHearing)}</p>
                    </div>
                  )}
                  {showDetail.endDate && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Clôture prévue</p>
                      <p className="font-medium text-gray-800">{formatDate(showDetail.endDate)}</p>
                    </div>
                  )}
                </div>

                {showDetail.clientDescription && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Description client</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">{showDetail.clientDescription}</p>
                  </div>
                )}
                {showDetail.notes && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">{showDetail.notes}</p>
                  </div>
                )}

                {showDetail.documents?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Documents ({showDetail.documents.length})</p>
                    <div className="space-y-2">
                      {showDetail.documents.map((doc, i) => (
                        <a
                          key={i}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 px-3 py-2.5 rounded-xl transition-colors"
                        >
                          <span>{getFileIcon(doc.originalName)}</span>
                          <span className="flex-1 text-xs text-gray-700 truncate">{doc.originalName || "Document"}</span>
                          <Download size={13} className="text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100">
                <button
                  onClick={() => { setShowDetail(null); handleEdit(showDetail); }}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Edit size={14} className="inline mr-1.5" /> Modifier ce dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}