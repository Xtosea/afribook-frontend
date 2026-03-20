// src/api/api.js

export const API_BASE = "https://afribook-backend.onrender.com";

export const fetchWithToken = async (url, token, options = {}) => {
  try {
    const headers = {};

    // ✅ Only set JSON headers if NOT sending FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    // ✅ Add Authorization if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    // ✅ Auto logout if token expired / invalid
    if (res.status === 401) {
      console.warn("🔒 Session expired. Logging out...");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/login";
      return;
    }

    // ✅ Handle no-content responses
    if (res.status === 204) return null;

    // ✅ Safe JSON parsing (prevents crash)
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    // ✅ Handle errors properly
    if (!res.ok) {
      const message =
        data?.error ||
        data?.message ||
        "Something went wrong";

      throw new Error(`HTTP ${res.status}: ${message}`);
    }

    return data;

  } catch (err) {
    console.error("❌ fetchWithToken ERROR:", err.message);
    throw err;
  }
};