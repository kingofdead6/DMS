import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { jwtDecode } from "jwt-decode";

const navItems = [
  { name: "Dashboard",  link: "/admin/dashboard" },
  { name: "Dossiers",   link: "/admin/cases"     },
  { name: "Calendrier", link: "/admin/calendar"  },
  { name: "Profil",     link: "/admin/profile"   },
];

export default function Navbar() {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [userName,   setUserName]   = useState("");
  const [scrolled,   setScrolled]   = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  /* close mobile menu on route change */
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  /* scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* check auth + decode name — re-runs on login/logout */
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      setIsLoggedIn(!!token);
      if (!token) { setUserName(""); return; }
      try {
        const { name } = jwtDecode(token);
        if (name) setUserName(name.split(" ")[0]);
      } catch { /* ignore */ }
    };
    checkAuth();
    window.addEventListener("authChanged", checkAuth);
    return () => window.removeEventListener("authChanged", checkAuth);
  }, []);

  /* ← hide everything when not logged in */
  if (!isLoggedIn) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.dispatchEvent(new Event("authChanged"));
    navigate("/login");
  };

  const active = (link) => location.pathname === link;

  return (
    <>
      <nav
        style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "shadow-[0_2px_24px_rgba(0,0,0,0.08)]" : ""
        }`}
      >
        <div className="w-full h-[3px] bg-gradient-to-r from-slate-800 via-slate-500 to-slate-300" />

        <div className="w-full bg-white/97 backdrop-blur-md border-b border-slate-100">
          <div className="w-full px-6 lg:px-10 flex items-center justify-between h-[62px]">

            <Link to="/admin/dashboard" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
                  <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".5" />
                  <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".5" />
                  <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" />
                </svg>
              </div>
              <span className="text-slate-900 font-semibold text-[15px] tracking-tight">DMS</span>
            </Link>

            <ul className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {navItems.map((item) => (
                <li key={item.link}>
                  <Link
                    to={item.link}
                    className={`relative px-4 py-2 text-[13.5px] font-medium rounded-lg transition-all duration-150 ${
                      active(item.link)
                        ? "text-slate-900 bg-slate-100"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {item.name}
                    {active(item.link) && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg bg-slate-100 -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden md:flex items-center gap-3 shrink-0">
              {userName && (
                <div className="flex items-center gap-2 pl-2">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-[11px] font-semibold flex items-center justify-center uppercase">
                    {userName[0]}
                  </div>
                  <span className="text-[13px] text-slate-600 font-medium">{userName}</span>
                </div>
              )}
              <div className="w-px h-4 bg-slate-200" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Déconnexion
              </button>
            </div>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            >
              {menuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="md:hidden bg-white border-b border-slate-100 shadow-lg"
            >
              <ul className="px-4 py-3 space-y-0.5">
                {navItems.map((item) => (
                  <li key={item.link}>
                    <Link
                      to={item.link}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                        active(item.link)
                          ? "text-slate-900 bg-slate-100"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="px-4 pb-4 pt-1 border-t border-slate-100 mt-1">
                <button
                  onClick={handleLogout}
                  className="cursor-pointer w-full flex items-center justify-center gap-2 py-2.5 text-[13.5px] font-medium text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Déconnexion
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="h-[65px]" />
    </>
  );
}