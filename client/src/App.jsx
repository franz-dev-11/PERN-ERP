/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
// App.js (FINAL REVISION: Corrected Router structure)

import React, { useState, useEffect } from "react";
// Ensure BrowserRouter, Routes, and Route are imported
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import ResetPassword from "./features/Auth/ResetPassword"; // 🔑 New Import

// --- SYNCHRONOUS CHECK FUNCTION ---
const getInitialUserState = () => {
  const storedUserString = localStorage.getItem("user");
  const tokenExpiresAt = Number(localStorage.getItem("tokenExpiresAt"));

  if (storedUserString && tokenExpiresAt) {
    const now = Date.now();

    if (tokenExpiresAt > now) {
      try {
        return JSON.parse(storedUserString);
      } catch (e) {
        localStorage.removeItem("user");
        return null;
      }
    } else {
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

  // NOTE: The previous hard-coded 'if/else' return block is now removed
  // to ensure the <BrowserRouter> is always executed.

  return (
    <BrowserRouter>
      <Routes>
        {/* Route for the root path ('/') - Conditionally renders Home or Login */}
        <Route
          path='/'
          element={
            user ? (
              <Home onLogout={handleLogout} />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Route for the login path ('/login') */}
        <Route
          path='/login'
          element={<Login onLoginSuccess={handleLoginSuccess} />}
        />

        {/* 🔑 NEW ROUTE TO DISPLAY THE RESET PASSWORD FORM */}
        <Route path='/reset-password/:token' element={<ResetPassword />} />

        {/* Add any other application routes here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
