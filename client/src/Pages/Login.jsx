// src/pages/admin/Login.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "L'e-mail est requis.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Le format de l'e-mail est invalide.";
    if (!password) e.password = "Le mot de passe est requis.";
    else if (password.length < 6) e.password = "Le mot de passe doit contenir au moins 6 caractères.";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email,
          password,
        });

        const { token, usertype } = response.data;

        if (remember) {
          localStorage.setItem("token", token);
        } else {
          sessionStorage.setItem("token", token);
        }

        window.dispatchEvent(new Event("authChanged"));
        setErrors({});

        toast.success("Connexion réussie !");

        if (usertype === "admin" || usertype === "superadmin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/admin/dashboard");
        }
      } catch (error) {
        const message = error.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.";
        setErrors({ form: message });
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 ">
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
            {/* Email */}
            <div>
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
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border ${
                    errors.email
                      ? "border-red-500 focus:border-red-600"
                      : "border-gray-300 focus:border-black"
                  } focus:outline-none focus:ring-4 focus:ring-black/10 transition-all text-lg`}
                  placeholder="Entrez votre adresse e-mail"
                />
              </div>

              {errors.email && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {errors.email}
                </p>
              )}
            </div>

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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  {showPassword ? (
                    <FaEyeSlash className="w-5 h-5" />
                  ) : (
                    <FaEye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer w-full py-5 bg-black text-white text-xl font-bold rounded-2xl hover:bg-gray-900 disabled:bg-gray-400 transition-all shadow-lg"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
