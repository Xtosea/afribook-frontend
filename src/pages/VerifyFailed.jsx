// src/pages/VerifyFailed.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function VerifyFailed() {
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow text-center">
      <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
      <p>Link is invalid or expired. You can resend the verification email.</p>
      <Link to="/resend-verification" className="mt-4 inline-block text-blue-600">
        Resend Verification Email
      </Link>
    </div>
  );
}