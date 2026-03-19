import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import VerifySuccess from "./pages/VerifySuccess";
import VerifyFailed from "./pages/VerifyFailed";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="min-h-[calc(100vh-80px)] p-4">
        <Routes>
  {/* Public routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password/:token" element={<ResetPassword />} />
  <Route path="/verify-email/:token" element={<VerifyEmail />} />
  <Route path="/verify-success" element={<VerifySuccess />} />
  <Route path="/verify-failed" element={<VerifyFailed />} />

  {/* Protected routes */}
  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
  <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
</Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;