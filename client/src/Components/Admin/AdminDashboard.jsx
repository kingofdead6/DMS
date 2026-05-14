// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const titleRef = useRef(null);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        toast.error("Connexion requise");
        navigate("/login");
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (decoded.usertype === "admin" ) {
          setUserType(decoded.usertype);
        } else {
          toast.error("Non autorisé");
          navigate("/login");
        }
      } catch (error) {
        toast.error("Token invalide");
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    toast.success("Déconnexion réussie");
    navigate("/login");
  };

  const adminSections = [
   { path: "/admin/cases", title: "Gestion des Dossiers", description: "Créer et gérer les dossiers juridiques." },
   { path: "/admin/calendar", title: "Gestion du Calendrier", description: "Ajouter et suivre les événements importants." }
   
  ];



  const sections = userType === "superadmin" ? superadminSections : adminSections;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl font-light text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="min-h-screen py-20 pt-32 "
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-20">
            <motion.h1
              ref={titleRef}
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="text-6xl font-extralight tracking-widest text-gray-900"
            >
              {userType === "superadmin" ? "Bienvenue Super Administrateur" : "Bienvenue Administrateur"}
            </motion.h1>    
          </div>

          {/* Dashboard Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -12, scale: 1.03 }}
                className="group"
              >
                <Link to={section.path}>
                  <div className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all duration-400 h-full flex flex-col justify-between border border-gray-100">
                    <div>
                      <h2 className="text-3xl font-medium text-gray-900 group-hover:text-black transition-colors">
                        {section.title}
                      </h2>
                      <p className="mt-5 text-gray-600 font-light leading-relaxed text-lg">
                        {section.description}
                      </p>
                    </div>
                    <div className="mt-10 flex justify-end">
                      <span className="inline-flex items-center text-lg font-semibold text-gray-600 group-hover:text-black transition-all">
                        Gérer
                        <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Logout Button */}
          <div className="mt-24 text-center">
            <button
              onClick={handleLogout}
              className="cursor-pointer px-12 py-5 bg-red-600 text-white text-xl font-medium rounded-2xl hover:bg-red-700 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              Se Déconnecter
            </button>
          </div>
        </div>
      </motion.section>
    </>
  );
}