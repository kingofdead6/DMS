"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../../../api";
import { toast } from "react-toastify";
import { Plus, X, Edit, Trash2, Search, Users, KeyRound, Eye, EyeOff } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}
function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

const EMPTY_FORM = { name: "", email: "", password: "" };

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);
  const [pwModal, setPwModal] = useState(null); // userId
  const [newPw, setNewPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);

  // Guard: superadmin only
  useEffect(() => {
    const token = getToken();
    if (!token) { navigate("/login"); return; }
    try {
      const { usertype } = jwtDecode(token);
      if (usertype !== "superadmin") { toast.error("Accès refusé"); navigate("/admin/dashboard"); }
    } catch { navigate("/login"); }
  }, [navigate]);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    setFiltered(
      users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [users, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/users`, { headers: authHeader() });
      setUsers(res.data);
    } catch {
      toast.error("Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error("Nom et email requis"); return; }
    if (!editingId && (!form.password || form.password.length < 6)) {
      toast.error("Mot de passe ≥ 6 caractères"); return;
    }
    try {
      if (editingId) {
        await axios.put(
          `${API_BASE_URL}/auth/users/${editingId}`,
          { name: form.name, email: form.email },
          { headers: authHeader() }
        );
        toast.success("Admin mis à jour");
      } else {
        await axios.post(`${API_BASE_URL}/auth/register`, form, { headers: authHeader() });
        toast.success("Admin créé");
      }
      reset();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cet admin ?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/auth/users/${id}`, { headers: authHeader() });
      setUsers((p) => p.filter((u) => u._id !== id));
      toast.success("Admin supprimé");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPw || newPw.length < 6) { toast.error("Mot de passe ≥ 6 caractères"); return; }
    try {
      await axios.put(
        `${API_BASE_URL}/auth/users/${pwModal}/password`,
        { password: newPw },
        { headers: authHeader() }
      );
      toast.success("Mot de passe mis à jour");
      setPwModal(null); setNewPw("");
    } catch {
      toast.error("Erreur");
    }
  };

  const reset = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(false); setShowPw(false); };

  const openEdit = (u) => {
    setEditingId(u._id);
    setForm({ name: u.name, email: u.email, password: "" });
    setShowModal(true);
  };

  return (
    <div
      className="min-h-screen bg-gray-50/50 pb-24"
      style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}
    >
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={22} className="text-gray-700" />
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Gestion des Admins</h1>
          </div>
          <span className="text-sm text-gray-400">{filtered.length} admin{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            <Plus size={16} /> Nouvel Admin
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-24 text-gray-400">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucun admin trouvé</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nom</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Créé le</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <motion.tr
                    key={u._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center uppercase shrink-0">
                          {u.name?.[0] || "?"}
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">{u.email}</td>
                    <td className="px-6 py-4 text-gray-400 hidden md:table-cell text-xs">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setPwModal(u._id); setNewPw(""); }}
                          className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-500"
                          title="Changer mot de passe"
                        >
                          <KeyRound size={14} />
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingId ? "Modifier l'admin" : "Nouvel administrateur"}
                </h2>
                <button onClick={reset} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Nom complet *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Mohamed Kader"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="admin@exemple.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                    required
                  />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Mot de passe *</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Min. 6 caractères"
                        className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    {editingId ? "Mettre à jour" : "Créer l'admin"}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 py-3.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {pwModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Nouveau mot de passe</h2>
                <button onClick={() => { setPwModal(null); setNewPw(""); }} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handlePasswordChange} className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Mot de passe *</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Min. 6 caractères"
                      className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Mettre à jour
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPwModal(null); setNewPw(""); }}
                    className="flex-1 py-3.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}