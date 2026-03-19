import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to send reset email");
        return;
      }

      alert(data.message || "Password reset email sent!");
    } catch (err) {
      console.error(err);
      alert("Error sending reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Enter your registered email"
          className="p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-yellow-600 text-white p-2 rounded hover:bg-yellow-700 flex justify-center items-center"
          disabled={loading}
        >
          {loading && <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 mr-2"></span>}
          {loading ? "Sending..." : "Send Reset Email"}
        </button>
      </form>
      <div className="mt-4 text-sm text-gray-600 flex justify-between">
        <span>
          Remembered? <Link to="/login" className="text-blue-600">Login</Link>
        </span>
        <span>
          Need an account? <Link to="/register" className="text-blue-600">Register</Link>
        </span>
      </div>
    </div>
  );
}