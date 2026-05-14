import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import Navbar from "./Components/Shared/NavBar";
import Footer from "./Components/Shared/Footer";

import Login from "./Pages/Login";
import ProtectedRoute from "./Components/Shared/ProtectedRoute";

import AdminDashboard from "./Components/Admin/AdminDashboard";

import NotFound from "./Pages/NotFound";
import ScrollToTop from "./Components/Shared/ScrollToTop";
import AdminCalendar from "./Components/Admin/AdminCalendar";
import AdminCases from "./Components/Admin/AdminCases";

function App() {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  let isAdmin = false;

  if (token) {
    try {
      const decoded = jwtDecode(token);

      if (decoded.usertype === "admin") {
        isAdmin = true;
      }
    } catch (error) {
      console.error("Invalid token");
    }
  }

  return (
    <Router>
      <ScrollToTop />
      <Navbar />

      <Routes>
        {/* Default Route */}
        

        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/cases" element={<AdminCases />} />
          <Route path="/admin/calendar" element={<AdminCalendar />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;