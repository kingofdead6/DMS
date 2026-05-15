// src/pages/admin/Login.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../../api";
import { X, ChevronDown, UserCircle, Trash2, Check } from "lucide-react";

// ─── Saved profiles helpers ───────────────────────────────────────────────────

const STORAGE_KEY = "saved_login_profiles";

function getProfiles() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveProfile(email) {
  const profiles = getProfiles();
  if (profiles.includes(email)) return; // already saved
  profiles.unshift(email);              // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.slice(0, 5))); // max 5
}

function removeProfile(email) {
  const profiles = getProfiles().filter((e) => e !== email);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Login() {
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState({});
  const [saveEmail, setSaveEmail]     = useState(false);

  // Profiles dropdown
  const [profiles, setProfiles]             = useState(getProfiles());
  const [showProfiles, setShowProfiles]     = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null); // email string

  const dropdownRef = useRef(null);
  const navigate    = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfiles(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "L'e-mail est requis.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Le format de l'e-mail est invalide.";
    if (!password) e.password = "Le mot de passe est requis.";
    else if (password.length < 6) e.password = "Le mot de passe doit contenir au moins 6 caractères.";
    return e;
  };

  // ── Select a saved profile ──
  const handleSelectProfile = (profileEmail) => {
    setEmail(profileEmail);
    setSelectedProfile(profileEmail);
    setShowProfiles(false);
    setErrors({});
    // Focus password field after a tick
    setTimeout(() => document.getElementById("password-input")?.focus(), 80);
  };

  // ── Remove a profile ──
  const handleRemoveProfile = (e, profileEmail) => {
    e.stopPropagation();
    removeProfile(profileEmail);
    const updated = getProfiles();
    setProfiles(updated);
    if (selectedProfile === profileEmail) {
      setSelectedProfile(null);
      if (email === profileEmail) setEmail("");
    }
    toast.info("Profil supprimé");
  };

  // ── Clear selected profile (back to manual input) ──
  const clearSelectedProfile = () => {
    setSelectedProfile(null);
    setEmail("");
    setPassword("");
  };

  // ── Submit ──
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const { token, usertype } = response.data;

      if (remember) {
        localStorage.setItem("token", token);
      } else {
        sessionStorage.setItem("token", token);
      }

      // Save email to profiles if checkbox ticked
      if (saveEmail && email) {
        saveProfile(email);
      }

      window.dispatchEvent(new Event("authChanged"));
      setErrors({});
      toast.success("Connexion réussie !");
      navigate("/admin/dashboard");
    } catch (error) {
      const message = error.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.";
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const hasProfiles = profiles.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl font-light tracking-wider text-gray-900"
          >
            Bienvenue
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-lg text-gray-600 font-light"
          >
            Connectez-vous pour accéder à votre espace administrateur.
          </motion.p>
        </div>

        {/* ── Saved profiles button ── */}
        <AnimatePresence>
          {hasProfiles && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 relative"
              ref={dropdownRef}
            >
              <button
                type="button"
                onClick={() => setShowProfiles((v) => !v)}
                className="w-full flex items-center justify-between gap-3 bg-white border border-gray-200 hover:border-gray-400 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-700 transition-all shadow-sm"
              >
                <span className="flex items-center gap-2 text-gray-600">
                  <UserCircle size={18} className="text-gray-400" />
                  Comptes enregistrés
                  <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {profiles.length}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform duration-200 ${showProfiles ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {showProfiles && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 overflow-hidden"
                  >
                    <p className="text-xs text-gray-400 px-5 pt-4 pb-2 font-semibold uppercase tracking-widest">
                      Sélectionner un compte
                    </p>
                    {profiles.map((profileEmail) => (
                      <motion.button
                        key={profileEmail}
                        type="button"
                        whileHover={{ backgroundColor: "#f9fafb" }}
                        onClick={() => handleSelectProfile(profileEmail)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors group"
                      >
                        {/* Avatar circle */}
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-500 font-semibold text-sm uppercase">
                          {profileEmail[0]}
                        </div>

                        <span className="flex-1 text-sm text-gray-800 truncate">{profileEmail}</span>

                        {selectedProfile === profileEmail && (
                          <Check size={14} className="text-emerald-500 shrink-0" />
                        )}

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveProfile(e, profileEmail)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all shrink-0"
                          title="Supprimer ce compte"
                        >
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </motion.button>
                    ))}

                    <div className="border-t border-gray-100 px-5 py-3">
                      <button
                        type="button"
                        onClick={() => { clearSelectedProfile(); setShowProfiles(false); }}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        + Utiliser un autre compte
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100"
        >
          {errors.form && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center font-medium text-sm"
            >
              {errors.form}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">

            {/* ── Profile mode: shows avatar + email, password only ── */}
            <AnimatePresence mode="wait">
              {selectedProfile ? (
                <motion.div
                  key="profile-mode"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4"
                >
                  <div className="w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-base uppercase shrink-0">
                    {selectedProfile[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Connecté en tant que</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{selectedProfile}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedProfile}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Changer de compte"
                  >
                    <X size={15} className="text-gray-400" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="email-input"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-gray-500">
                      <FaUser className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
                      className={`w-full pl-12 pr-4 py-4 rounded-xl border ${
                        errors.email
                          ? "border-red-500 focus:border-red-600"
                          : "border-gray-300 focus:border-black"
                      } focus:outline-none focus:ring-4 focus:ring-black/10 transition-all text-lg`}
                      placeholder="Entrez votre adresse e-mail"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.email}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-gray-500">
                  <FaLock className="w-5 h-5" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                  className={`w-full pl-12 pr-12 py-4 rounded-xl border ${
                    errors.password
                      ? "border-red-500 focus:border-red-600"
                      : "border-gray-300 focus:border-black"
                  } focus:outline-none focus:ring-4 focus:ring-black/10 transition-all text-lg`}
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer absolute inset-y-0 end-0 pe-4 flex items-center text-gray-500 hover:text-gray-700 transition"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Options row: save email + remember session */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
              {/* Save email toggle — only shown when not in profile mode */}
              {!selectedProfile && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div
                    onClick={() => setSaveEmail((v) => !v)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      saveEmail
                        ? "bg-gray-900 border-gray-900"
                        : "border-gray-300 group-hover:border-gray-400"
                    }`}
                  >
                    {saveEmail && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-gray-600">Sauvegarder l'e-mail</span>
                </label>
              )}

              {/* Remember session */}
              <label className={`flex items-center gap-2.5 cursor-pointer select-none group ${selectedProfile ? "" : ""}`}>
                <div
                  onClick={() => setRemember((v) => !v)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    remember
                      ? "bg-gray-900 border-gray-900"
                      : "border-gray-300 group-hover:border-gray-400"
                  }`}
                >
                  {remember && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm text-gray-600">Se souvenir de moi</span>
              </label>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer w-full py-5 bg-black text-white text-xl font-bold rounded-2xl hover:bg-gray-900 disabled:bg-gray-400 transition-all shadow-lg"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}