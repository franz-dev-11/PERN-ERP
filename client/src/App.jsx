/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
// App.js (FINAL FIX FOR DATA FLOW)

import React, { useState, useEffect } from "react";
// Ensure BrowserRouter, Routes, and Route are imported
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import ResetPassword from "./features/Auth/ResetPassword"; // New Import

// --- SYNCHRONOUS CHECK FUNCTION ---
const getInitialUserState = () => {
  const storedUserString = localStorage.getItem("user");
  const tokenExpiresAt = Number(localStorage.getItem("tokenExpiresAt"));

  if (storedUserString && tokenExpiresAt) {
    const now = Date.now();

    if (tokenExpiresAt > now) {
      try {
        // Returns the parsed user object from localStorage
        return JSON.parse(storedUserString);
      } catch (e) {
        // Clears data if JSON is malformed
        localStorage.removeItem("user");
        return null;
      }
    } else {
      // Clears all data if token has expired
      localStorage.removeItem("accessToken");
      localStorage.removeItem("tokenExpiresAt");
      localStorage.removeItem("user");
    }
  }
  return null;
};
// -----------------------------------------------------------------

function App() {
  const [user, setUser] = useState(getInitialUserState);

  // -----------------------------------------------------------------
  // Login/Logout Handlers
  // -----------------------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tokenExpiresAt");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  // -----------------------------------------------------------------
  // Render Logic (Uses React Router for all paths)
  // -----------------------------------------------------------------

  return (
    <BrowserRouter>
      <Routes>
        {/* Route for the root path ('/') - Conditionally renders Home or Login */}
        <Route
          path='/'
          element={
            user ? (
              // CRITICAL FIX: Pass the 'user' object to the Home component
              <Home onLogout={handleLogout} user={user} />
            ) : (
              // If user is not logged in, show Login
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Route for the login path ('/login') */}
        <Route
          path='/login'
          element={<Login onLoginSuccess={handleLoginSuccess} />}
        />

        {/* ROUTE TO DISPLAY THE RESET PASSWORD FORM */}
        <Route path='/reset-password/:token' element={<ResetPassword />} />

        {/* Add any other application routes here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
