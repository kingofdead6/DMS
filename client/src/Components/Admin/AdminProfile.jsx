"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../../../api";
import { toast } from "react-toastify";
import { User, Mail, Lock, Eye, EyeOff, Shield, CheckCircle } from "lucide-react";

function getUserFromToken() {
  try {
    // Check both storages
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("🔑 Full JWT payload:", payload); // shows every field name
    return payload;
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export default function AdminProfile() {
  const tokenUser = getUserFromToken();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password form
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [pwLoading, setPwLoading]             = useState(false);

  // Replace the entire useEffect + user state logic:

useEffect(() => {
  // Build user info directly from the token — works for both admin and superadmin
  const userId = tokenUser?.id || tokenUser?._id || tokenUser?.sub;
  if (!userId) { setLoading(false); return; }

  // Fetch own profile via a dedicated endpoint, fallback to token data
  axios
    .get(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    .then((res) => setUser(res.data))
    .catch(() => {
      // Graceful fallback: use what's in the token
      if (tokenUser) {
        setUser({
          _id: userId,
          name: tokenUser.name || "—",
          email: tokenUser.email || "—",
          usertype: tokenUser.usertype || "admin",
        });
      }
    })
    .finally(() => setLoading(false));
}, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    const userId = tokenUser?.id || tokenUser?._id || tokenUser?.sub;

    setPwLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/auth/users/${userId}/password`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success("Mot de passe mis à jour avec succès");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Erreur lors de la mise à jour du mot de passe");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-gray-400"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        Chargement…
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center flex-col gap-2 text-gray-400"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        <p>Profil introuvable. Veuillez vous reconnecter.</p>
        <p className="text-xs text-gray-300">
          (Ouvrez la console pour voir les détails de débogage)
        </p>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      className="min-h-screen bg-gray-50/50 pb-24"
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <Shield size={20} className="text-gray-600" />
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Mon Profil
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 space-y-6">

        {/* ── Identity card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
        >
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-xl font-semibold shrink-0">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {user.name}
              </h2>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <span className="inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium capitalize">
                {user.usertype || "admin"}
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-3.5 rounded-xl">
              <User size={16} className="text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Nom complet</p>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-3.5 rounded-xl">
              <Mail size={16} className="text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Adresse e-mail</p>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Change password ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Lock size={17} className="text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">
              Changer le mot de passe
            </h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">

            {/* New password */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Minimum 6 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength indicator */}
              {newPassword.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3].map((lvl) => {
                    const strength =
                      newPassword.length >= 10
                        ? 3
                        : newPassword.length >= 6
                        ? 2
                        : 1;
                    return (
                      <div
                        key={lvl}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          lvl <= strength
                            ? strength === 1
                              ? "bg-red-400"
                              : strength === 2
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                            : "bg-gray-100"
                        }`}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Répéter le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword.length > 0 && (
                <p
                  className={`text-xs mt-1.5 flex items-center gap-1 ${
                    newPassword === confirmPassword
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  <CheckCircle size={11} />
                  {newPassword === confirmPassword
                    ? "Les mots de passe correspondent"
                    : "Les mots de passe ne correspondent pas"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors mt-2"
            >
              {pwLoading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}