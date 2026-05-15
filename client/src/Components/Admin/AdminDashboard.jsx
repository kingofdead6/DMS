import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import {
  FolderOpen, CalendarDays, UserCircle,
  Users, ScrollText, ShieldCheck, Shield,
} from "lucide-react";

const ADMIN_SECTIONS = [
  {
    path: "/admin/cases",
    title: "Dossiers Clients",
    description: "Créer, consulter et gérer l'ensemble des dossiers juridiques.",
    icon: FolderOpen,
    color: "from-blue-50 to-blue-100/60",
    iconColor: "text-blue-600",
  },
  {
    path: "/admin/calendar",
    title: "Calendrier",
    description: "Planifier et suivre les audiences, réunions et délais importants.",
    icon: CalendarDays,
    color: "from-violet-50 to-violet-100/60",
    iconColor: "text-violet-600",
  },
  {
    path: "/admin/profile",
    title: "Mon Profil",
    description: "Consulter et mettre à jour vos informations personnelles.",
    icon: UserCircle,
    color: "from-slate-50 to-slate-100/60",
    iconColor: "text-slate-600",
  },
];

const SUPERADMIN_EXTRA = [
  {
    path: "/admin/users",
    title: "Gestion des Admins",
    description: "Créer, modifier et supprimer les comptes administrateurs.",
    icon: Users,
    color: "from-emerald-50 to-emerald-100/60",
    iconColor: "text-emerald-600",
    badge: "Superadmin",
  },
  {
    path: "/admin/logs",
    title: "Journal d'Activité",
    description: "Consulter l'historique de toutes les actions effectuées.",
    icon: ScrollText,
    color: "from-amber-50 to-amber-100/60",
    iconColor: "text-amber-600",
    badge: "Superadmin",
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) { toast.error("Connexion requise"); navigate("/login"); return; }
    try {
      const decoded = jwtDecode(token);
      if (!["admin", "superadmin"].includes(decoded.usertype)) {
        toast.error("Non autorisé"); navigate("/login"); return;
      }
      setUserInfo(decoded);
    } catch {
      toast.error("Token invalide"); navigate("/login");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.dispatchEvent(new Event("authChanged"));
    toast.success("Déconnexion réussie");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const isSuperadmin = userInfo?.usertype === "superadmin";
  const sections = isSuperadmin ? [...ADMIN_SECTIONS, ...SUPERADMIN_EXTRA] : ADMIN_SECTIONS;
  const firstName = userInfo?.name?.split(" ")[0] || "Administrateur";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-20"
      style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}
    >
      {/* Hero */}
      <div className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-400 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isSuperadmin
                ? "bg-amber-400/20 border-amber-400/40 text-amber-300"
                : "bg-white/10 border-white/20 text-white/70"
            }`}>
              {isSuperadmin ? <ShieldCheck size={13} /> : <Shield size={13} />}
              {isSuperadmin ? "Super Administrateur" : "Administrateur"}
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-light tracking-tight mb-3"
          >
            Bonjour, <span className="font-semibold">{firstName}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-slate-400 text-lg"
          >
            {isSuperadmin
              ? "Accès complet — gestion des admins et journaux inclus."
              : "Gérez vos dossiers, événements et profil."}
          </motion.p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-12">
        {isSuperadmin && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Accès général
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.path}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Link to={section.path} className="block h-full">
                  <div className={`h-full bg-gradient-to-br ${section.color} border border-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-xl bg-white shadow-sm ${section.iconColor}`}>
                        <Icon size={22} />
                      </div>
                      {section.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">{section.title}</h2>
                    <p className="text-sm text-slate-500 leading-relaxed flex-1">{section.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-700">
                      Accéder
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-14 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-8 py-3.5 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Se déconnecter
          </button>
        </div>
      </div>
    </motion.div>
  );
}