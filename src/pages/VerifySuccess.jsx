// src/pages/VerifySuccess.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function VerifySuccess() {
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow text-center">
      <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
      <p>Your email has been successfully verified. You can now log in.</p>
      <Link to="/login" className="mt-4 inline-block text-blue-600">
        Go to Login
      </Link>
    </div>
  );
}