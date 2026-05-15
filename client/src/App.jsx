import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import Navbar from "./Components/Shared/NavBar";

import Login from "./Pages/Login";
import{ ProtectedRoute} from "./Components/Shared/ProtectedRoute";

import AdminDashboard from "./Components/Admin/AdminDashboard";

import NotFound from "./Pages/NotFound";
import ScrollToTop from "./Components/Shared/ScrollToTop";
import AdminCalendar from "./Components/Admin/AdminCalendar";
import AdminCases from "./Components/Admin/AdminCases";
import AdminProfile from "./Components/Admin/AdminProfile";
import AdminUsers from "./Components/Admin/AdminUsers";
import AdminLogs from "./Components/Admin/AdminLogs";
import {SuperadminRoute }from "./Components/Shared/ProtectedRoute";
import Footer from "./Components/Shared/Footer";

function App() {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  let isAdmin = false;

  if (token) {
    try {
      const decoded = jwtDecode(token);


// To this:
if (decoded.usertype === "admin" || decoded.usertype === "superadmin") {
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
        <Route
          path="/"
          element={
            <Navigate
              to={isAdmin ? "/admin/dashboard" : "/login"}
              replace
            />
          }
        />  
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/cases" element={<AdminCases />} />
          <Route path="/admin/calendar" element={<AdminCalendar />} />
          <Route path="/admin/profile" element={<AdminProfile />} />

          <Route element={<SuperadminRoute />}>
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
          <Footer />
    </Router>
  );
}

export default App;