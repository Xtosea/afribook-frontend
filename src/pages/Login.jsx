import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../api/api"; // ✅ Correct

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data, "STATUS:", res.status);

      if (!res.ok) {
        if (res.status === 403) {
          const confirmResend = window.confirm(
            "Email not verified. Resend verification email?"
          );
          if (confirmResend) {
            await fetch(`${API_BASE}/api/auth/resend-verification`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });
            alert("Verification email sent!");
          }
        } else {
          alert(data.error || "Login failed");
        }
        return;
      }

      // ✅ Save token + userId
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user._id);

      // ✅ Navigate to Home
      navigate("/", { replace: true });

    } catch (err) {
      console.error("LOGIN ERROR:", err);
      alert("Error logging in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          className="p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="p-2 border rounded w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-2 text-sm text-gray-600"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white p-2 rounded hover:bg-green-700 flex justify-center items-center"
        >
          {loading && (
            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 mr-2"></span>
          )}
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="mt-4 text-sm text-gray-600 flex justify-between">
        <span>
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600">
            Register
          </Link>
        </span>
        <span>
          <Link to="/forgot-password" className="text-blue-600">
            Forgot Password?
          </Link>
        </span>
      </div>
    </div>
  );
}