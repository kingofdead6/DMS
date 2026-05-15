"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../../../api";
import { toast } from "react-toastify";
import { ScrollText, ChevronLeft, ChevronRight, Filter, X, RefreshCw } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}
function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

const ACTION_CONFIG = {
  CREATE: { label: "Création",    color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  UPDATE: { label: "Modification", color: "bg-blue-50 text-blue-700 border-blue-200" },
  DELETE: { label: "Suppression", color: "bg-red-50 text-red-700 border-red-200" },
};

const RESOURCE_CONFIG = {
  CASE:  { label: "Dossier",    color: "bg-violet-50 text-violet-700" },
  EVENT: { label: "Événement",  color: "bg-amber-50 text-amber-700" },
  USER:  { label: "Utilisateur", color: "bg-slate-100 text-slate-600" },
};

export default function AdminLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({ action: "", resource: "", from: "", to: "" });
  const [showFilters, setShowFilters] = useState(false);

  // Guard
  useEffect(() => {
    const token = getToken();
    if (!token) { navigate("/login"); return; }
    try {
      const { usertype } = jwtDecode(token);
      if (usertype !== "superadmin") { toast.error("Accès refusé"); navigate("/admin/dashboard"); }
    } catch { navigate("/login"); }
  }, [navigate]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await axios.get(`${API_BASE_URL}/logs`, { headers: authHeader(), params });
      setLogs(res.data.logs);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch {
      toast.error("Erreur chargement des logs");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => { fetchLogs(); }, 60000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  const clearFilters = () => { setFilters({ action: "", resource: "", from: "", to: "" }); setPage(1); };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div
      className="min-h-screen bg-gray-50/50 pb-24"
      style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}
    >
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScrollText size={22} className="text-gray-700" />
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Journal d'Activité</h1>
            {total > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {total} entrée{total !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchLogs()}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors border bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw size={14} /> Rafraîchir
            </button>
            <button
              onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              hasActiveFilters
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Filter size={14} />
            Filtres
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-amber-400" />}
          </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Filters panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">Filtres</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-red-500 flex items-center gap-1 hover:underline">
                  <X size={12} /> Réinitialiser
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="">Toutes</option>
                  {Object.entries(ACTION_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Ressource</label>
                <select
                  value={filters.resource}
                  onChange={(e) => { setFilters(f => ({ ...f, resource: e.target.value })); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="">Toutes</option>
                  {Object.entries(RESOURCE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Du</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => { setFilters(f => ({ ...f, from: e.target.value })); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Au</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => { setFilters(f => ({ ...f, to: e.target.value })); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Logs list */}
        {loading ? (
          <div className="flex justify-center py-24 text-gray-400">Chargement…</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <ScrollText size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucune entrée trouvée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ACTION_CONFIG[log.action]?.color}`}>
                    {ACTION_CONFIG[log.action]?.label || log.action}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${RESOURCE_CONFIG[log.resource]?.color}`}>
                    {RESOURCE_CONFIG[log.resource]?.label || log.resource}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {log.resourceName || log.resourceId || "—"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Par <span className="text-gray-600 font-medium">{log.performedByName || "?"}</span>
                    {" · "}{log.performedByEmail}
                  </p>
                </div>

                <div className="text-xs text-gray-400 shrink-0">
                  {new Date(log.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                  {" "}
                  {new Date(log.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600">
              Page <span className="font-medium">{page}</span> sur <span className="font-medium">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}