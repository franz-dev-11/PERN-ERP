/* eslint-disable no-unused-vars */
// App.js (Revised for flicker-free refresh)

import React, { useState, useEffect } from 'react';
import Login from './components/Login'; 
import Home from './components/Home';

// --- SYNCHRONOUS CHECK FUNCTION (Defined outside App component) ---
// (Copy the function from Step 1 here)
const getInitialUserState = () => {
    const storedUserString = localStorage.getItem('user');
    const tokenExpiresAt = Number(localStorage.getItem('tokenExpiresAt'));
    
    if (storedUserString && tokenExpiresAt) {
        const now = Date.now();
        
        if (tokenExpiresAt > now) {
            try {
                return JSON.parse(storedUserString);
            } catch (e) {
                localStorage.removeItem('user');
                return null;
            }
        } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('tokenExpiresAt');
            localStorage.removeItem('user');
        }
    }
    return null;
};
// -----------------------------------------------------------------


function App() {
    // 🔑 State is initialized directly using the synchronous check function
    // This prevents the state from starting at 'null' and then switching.
    const [user, setUser] = useState(getInitialUserState); 

    // -----------------------------------------------------------------
    // Login/Logout Handlers (UNCHANGED)
    // -----------------------------------------------------------------
    
    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenExpiresAt');
        localStorage.removeItem('user');
        setUser(null); 
    };

    const handleLoginSuccess = (userData) => {
        // User data is already in localStorage; we just update the state
        setUser(userData); 
    };

    // NOTE: The expiration timer is now solely managed inside Home.jsx's useEffect,
    // which calls handleLogout when the time is up.

    // -----------------------------------------------------------------
    // Render Logic (Simplified)
    // -----------------------------------------------------------------

    // We no longer need an 'isLoading' check. The component immediately renders
    // based on the 'user' state set by getInitialUserState().
    if (user) {
        return <Home onLogout={handleLogout} />;
    } else {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }
}

export default App;