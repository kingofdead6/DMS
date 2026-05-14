"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../../../api";
import { toast } from "react-toastify";
import {
  ChevronLeft, ChevronRight, Plus, X, Edit, Trash2,
  Clock, Tag, AlignLeft, Link2, Calendar
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const EVENT_TYPES = {
  audience: { label: "Audience",  color: "bg-blue-500",   light: "bg-blue-50 text-blue-700 border-blue-200" },
  réunion:  { label: "Réunion",   color: "bg-violet-500", light: "bg-violet-50 text-violet-700 border-violet-200" },
  délai:    { label: "Délai",     color: "bg-red-500",    light: "bg-red-50 text-red-700 border-red-200" },
  autre:    { label: "Autre",     color: "bg-gray-400",   light: "bg-gray-100 text-gray-600 border-gray-200" },
};

const EMPTY_EVENT = {
  title: "", description: "", date: "", endDate: "",
  type: "audience", caseRef: "", color: "#3b82f6",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  // Monday-based (0=Mon … 6=Sun)
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

function toYMD(date) {
  return date.toISOString().slice(0, 10);
}

function sameDay(a, b) {
  return toYMD(new Date(a)) === toYMD(new Date(b));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_EVENT);

  // Selected day detail panel
  const [selectedDay, setSelectedDay] = useState(null);

  // ── Fetch events for current month ──
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const month = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
      const res = await axios.get(`${API_BASE_URL}/events?month=${month}`);
      setEvents(res.data);
    } catch {
      toast.error("Erreur lors du chargement des événements");
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/cases`).then((r) => setCases(r.data)).catch(() => {});
  }, []);

  // ── Calendar grid ──
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDay + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    const date = new Date(viewYear, viewMonth, dayNum);
    const dayEvents = events.filter((ev) => sameDay(ev.date, date));
    return { dayNum, date, dayEvents };
  });

  // ── Navigation ──
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) { toast.error("Titre et date requis"); return; }
    try {
      const payload = { ...form, caseRef: form.caseRef || undefined };
      if (editingId) {
        const res = await axios.put(`${API_BASE_URL}/events/${editingId}`, payload);
        setEvents(prev => prev.map(ev => ev._id === editingId ? res.data : ev));
        toast.success("Événement mis à jour");
      } else {
        const res = await axios.post(`${API_BASE_URL}/events`, payload);
        setEvents(prev => [...prev, res.data]);
        toast.success("Événement créé");
      }
      resetForm();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const resetForm = () => { setForm(EMPTY_EVENT); setEditingId(null); setShowModal(false); };

  const openNew = (dateStr = "") => {
    setForm({ ...EMPTY_EVENT, date: dateStr });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (ev) => {
    setEditingId(ev._id);
    setForm({
      title: ev.title,
      description: ev.description || "",
      date: ev.date.slice(0, 16),
      endDate: ev.endDate ? ev.endDate.slice(0, 16) : "",
      type: ev.type,
      caseRef: ev.caseRef?._id || ev.caseRef || "",
      color: ev.color || "#3b82f6",
    });
    setShowModal(true);
  };

  const deleteEvent = async (id) => {
    if (!confirm("Supprimer cet événement ?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/events/${id}`);
      setEvents(prev => prev.filter(ev => ev._id !== id));
      setSelectedDay(sd => sd ? { ...sd, dayEvents: sd.dayEvents.filter(ev => ev._id !== id) } : null);
      toast.success("Événement supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const todayEvents = events.filter((ev) => sameDay(ev.date, today));

  return (
    <div className="min-h-screen bg-gray-50/40 pb-20" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft size={18} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                {MONTHS_FR[viewMonth]} {viewYear}
              </h1>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={goToday}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            >
              Aujourd'hui
            </button>
          </div>

          <button
            onClick={() => openNew()}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} /> Ajouter un événement
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex flex-col lg:flex-row gap-6">

        {/* ── Calendar Grid ── */}
        <div className="flex-1">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_FR.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell) return <div key={i} className="aspect-square sm:aspect-auto sm:min-h-[100px]" />;
              const { dayNum, date, dayEvents } = cell;
              const isToday = sameDay(date, today);
              const isSelected = selectedDay && sameDay(date, selectedDay.date);
              const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

              return (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedDay(cell)}
                  className={`
                    min-h-[80px] sm:min-h-[100px] rounded-xl p-2 cursor-pointer border transition-all
                    ${isSelected ? "border-gray-900 bg-gray-900 text-white" : "border-transparent bg-white hover:border-gray-200"}
                    ${isPast && !isToday ? "opacity-60" : ""}
                  `}
                >
                  <div className={`
                    text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mb-1
                    ${isToday && !isSelected ? "bg-gray-900 text-white" : ""}
                    ${isSelected ? "bg-white text-gray-900" : ""}
                  `}>
                    {dayNum}
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev._id}
                        className={`text-xs truncate px-1.5 py-0.5 rounded-md font-medium
                          ${isSelected
                            ? "bg-white/20 text-white"
                            : `${EVENT_TYPES[ev.type]?.color || "bg-gray-400"} text-white`
                          }`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className={`text-xs px-1.5 ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Side Panel ── */}
        <div className="lg:w-80 xl:w-96 space-y-4">

          {/* Today summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Aujourd'hui — {today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <button
                onClick={() => openNew(toYMD(today) + "T09:00")}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            {todayEvents.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Aucun événement aujourd'hui</p>
            ) : (
              <div className="space-y-2">
                {todayEvents.map((ev) => (
                  <EventRow key={ev._id} ev={ev} onEdit={openEdit} onDelete={deleteEvent} />
                ))}
              </div>
            )}
          </div>

          {/* Selected day */}
          <AnimatePresence>
            {selectedDay && !sameDay(selectedDay.date, today) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white rounded-2xl border border-gray-100 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {selectedDay.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openNew(toYMD(selectedDay.date) + "T09:00")}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                    <button onClick={() => setSelectedDay(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {selectedDay.dayEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Aucun événement ce jour</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDay.dayEvents.map((ev) => (
                      <EventRow key={ev._id} ev={ev} onEdit={openEdit} onDelete={deleteEvent} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upcoming events */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">À venir ce mois</h3>
            {events
              .filter((ev) => new Date(ev.date) >= today)
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .slice(0, 6)
              .map((ev) => (
                <div key={ev._id} className="flex items-start gap-3 mb-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${EVENT_TYPES[ev.type]?.color || "bg-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{ev.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(ev.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      {" · "}{formatTime(ev.date)}
                    </p>
                  </div>
                </div>
              ))}
            {events.filter((ev) => new Date(ev.date) >= today).length === 0 && (
              <p className="text-xs text-gray-400 italic">Aucun événement à venir</p>
            )}
          </div>
        </div>
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[90vh] shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingId ? "Modifier l'événement" : "Nouvel événement"}
                </h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <div className="overflow-y-auto px-6 py-6 flex-1">
                <form onSubmit={handleSubmit} id="event-form" className="space-y-5">

                  {/* Title */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Titre *</label>
                    <input
                      type="text"
                      placeholder="Titre de l'événement"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Type</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(EVENT_TYPES).map(([k, v]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setForm({ ...form, type: k })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                            ${form.type === k ? `${v.light} border-current` : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Date et heure *</label>
                      <input
                        type="datetime-local"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Fin (optionnel)</label>
                      <input
                        type="datetime-local"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Description (optionnel)</label>
                    <textarea
                      placeholder="Détails de l'événement…"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none resize-none h-24"
                    />
                  </div>

                  {/* Link to case */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Dossier lié (optionnel)</label>
                    <select
                      value={form.caseRef}
                      onChange={(e) => setForm({ ...form, caseRef: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                    >
                      <option value="">Aucun dossier</option>
                      {cases.map((c) => (
                        <option key={c._id} value={c._id}>{c.caseName} — {c.clientFullName}</option>
                      ))}
                    </select>
                  </div>

                </form>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                <button
                  type="submit"
                  form="event-form"
                  className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  {editingId ? "Mettre à jour" : "Créer l'événement"}
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
    </div>
  );
}

// ─── Sub-component: EventRow ──────────────────────────────────────────────────

function EventRow({ ev, onEdit, onDelete }) {
  const type = EVENT_TYPES[ev.type] || EVENT_TYPES.autre;
  const formatTime = (d) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-start gap-3 group">
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${type.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={10} /> {formatTime(ev.date)}
          {ev.endDate && <> – {formatTime(ev.endDate)}</>}
        </p>
        {ev.caseRef && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Link2 size={10} /> {ev.caseRef.caseName}
          </p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(ev)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <Edit size={13} className="text-gray-500" />
        </button>
        <button onClick={() => onDelete(ev._id)} className="p-1 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={13} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}