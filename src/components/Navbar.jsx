import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();
  const ws = useRef(null);
  const dropdownRef = useRef(null);

  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    if (token) {
      ws.current = new WebSocket("ws://localhost:5000");

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (
          data.type === "NEW_POST" ||
          data.type === "LIKE" ||
          data.type === "FOLLOW"
        ) {
          if (data.userId !== currentUserId) {
            setNotifications((prev) => [data, ...prev]);
          }
        }
      };
    }

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [currentUserId]);

  // 🔥 Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // 🔔 Format notification message
  const formatNotification = (n) => {
    switch (n.type) {
      case "LIKE":
        return "❤️ Someone liked your post";
      case "FOLLOW":
        return "👤 Someone followed you";
      case "NEW_POST":
        return "📝 New post created";
      default:
        return "🔔 New notification";
    }
  };

  return (
    <nav className="bg-white shadow px-4 py-3 flex justify-between items-center relative">
      {/* Logo */}
      <Link to="/" className="font-bold text-xl">
        Afribook
      </Link>

      {/* Right side */}
      <div className="space-x-4 flex items-center">
        {isLoggedIn ? (
          <>
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/profile" className="hover:underline">Profile</Link>

            {/* 🔔 Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <div className="cursor-pointer" onClick={toggleDropdown}>
                <span className="text-2xl">🔔</span>

                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>

              {/* 🔽 Dropdown */}
              {showDropdown && (
  <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
    <div className="p-2 font-bold border-b">Notifications</div>

    {notifications.length === 0 ? (
      <p className="p-3 text-gray-500 text-sm">
        No new notifications
      </p>
    ) : (
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((n, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 p-3 border-b hover:bg-gray-100 cursor-pointer"
          >
            {/* 👤 Profile Picture */}
            <img
              src={n.user?.profilePic || "/default-profile.png"}
              alt={n.user?.name}
              className="w-10 h-10 rounded-full object-cover"
            />

            {/* 📢 Message */}
            <div className="text-sm">
              <span className="font-semibold">
                {n.user?.name || "Someone"}
              </span>{" "}
              {n.type === "LIKE" && "liked your post ❤️"}
              {n.type === "FOLLOW" && "started following you 👤"}
              {n.type === "NEW_POST" && "created a new post 📝"}
            </div>
          </div>
        ))}
      </div>
    )}

    {notifications.length > 0 && (
      <button
        onClick={() => setNotifications([])}
        className="w-full text-center text-blue-500 p-2 hover:bg-gray-100"
      >
        Clear All
      </button>
    )}
  </div>
)}
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="hover:underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;