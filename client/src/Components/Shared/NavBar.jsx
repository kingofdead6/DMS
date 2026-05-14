// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCartIcon, XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { jwtDecode } from "jwt-decode";
import Logo from "../../assets/Logo.png"; // Adjust path as needed
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userType, setUserType] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Check auth status
  const checkAuth = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserType(decoded.usertype);
      } catch {
        setUserType(null);
      }
    } else {
      setUserType(null);
    }
  };

  // Update cart count
  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setCartCount(total);
  };

  useEffect(() => {
    checkAuth();
    updateCartCount();

    const handleChange = () => {
      checkAuth();
      updateCartCount();
    };

    window.addEventListener("storage", handleChange);
    window.addEventListener("authChanged", handleChange);
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener("authChanged", handleChange);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setUserType(null);
    window.dispatchEvent(new Event("authChanged"));
    navigate("/login");
  };

  // Navigation for regular users
  const normalNavItems = [
    { name: "Accueil", link: "/" },
    { name: "À propos", link: "/about" },
    { name: "Produits", link: "/products" },
    { name: "Contact", link: "/sell-us-something" },
  ];

  // Admin navigation (kept as is)
  const adminNavItems = [
    { name: "Dashboard", link: "/admin/dashboard" },
    { name: "Commandes", link: "/admin/orders" },
    { name: "Produits", link: "/admin/products" },
  ];

  const superadminNavItems = [
    { name: "Dashboard", link: "/admin/dashboard" },
    { name: "Commandes", link: "/admin/orders" },
    { name: "Produits", link: "/admin/products" },
    { name: "Catégories", link: "/admin/categories" },
    { name: "Livraison", link: "/admin/delivery-areas" },
    { name: "Utilisateurs", link: "/admin/users" },
  ];

  const navItems =
    userType === "superadmin"
      ? superadminNavItems
      : userType === "admin"
      ? adminNavItems
      : normalNavItems;

  const isAdmin = userType === "admin" || userType === "superadmin";

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50">
        <div
          className={`max-w-7xl mx-auto px-6 py-5 flex items-center justify-between backdrop-blur-xl transition-all duration-300 shadow-lg rounded-b-3xl ${
            isAdmin
              ? "bg-[#ffffff]/95 text-stone-800 border-b border-stone-300"
              : "bg-white text-stone-800 border-b border-stone-100"
          }`}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/">
              <img
                src={Logo}   // Make sure path is correct
                alt="Logo"
                className="h-12 w-auto"
              />
            </Link>
          </motion.div>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-10 font-medium text-lg">
            {navItems.map((item, i) => {
              const isActive = location.pathname === item.link;
              return (
                <motion.li
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={item.link}
                    className={`pb-1 transition-all duration-200 ${
                      isActive
                        ? "text-blue-700 border-b-2 border-blue-700 font-semibold"
                        : "hover:text-blue-700"
                    }`}
                  >
                    {item.name}
                  </Link>
                </motion.li>
              );
            })}
          </ul>

          {/* Right Side */}
          <div className="flex items-center gap-6">
            {/* Cart Icon - Only for customers */}
           {/* {!isAdmin && (
              <Link to="/cart" className="relative group">
                <ShoppingCartIcon className="w-8 h-8 text-stone-700 group-hover:text-blue-700 transition" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                    {cartCount}
                  </span>
                )}
              </Link>
            )} */}
            

            {isAdmin && (
              <button
                onClick={handleLogout}
                className="cursor-pointer px-5 py-2 text-sm font-medium hover:text-blue-700 transition"
              >
                Déconnexion
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-3xl text-stone-700"
            >
              {menuOpen ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t shadow-xl px-6 py-8"
          >
            <ul className="space-y-6 text-xl font-medium">
              {navItems.map((item, i) => (
                <li key={i}>
                  <Link
                    to={item.link}
                    onClick={() => setMenuOpen(false)}
                    className={`block py-2 ${
                      location.pathname === item.link ? "text-blue-700 font-semibold" : "text-stone-700"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-20"></div>
    </>
  );
}