// Home.jsx (Frontend - React) - REVISED to include Inventory component

import React, { useEffect, useState } from 'react'; 
import Sidebar from './Sidebar';
import Header from './Header'; 
// Assuming the feature components are located here:
import Dashboard from '../features/Dashboard/Dashboard'; 
import Users from '../features/Users/Users'; 
import Signup from '../features/Auth/Signup'; 
// --- NEW IMPORT ---
import Inventory from '../features/Inventory/Inventory'; 


/**
 * Home Component
 * @param {object} props
 * @param {function} props.onLogout - Handler for logging the user out
 */
function Home({ onLogout }) {
  
  // --- RETRIEVE DATA FROM LOCAL STORAGE ---
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null; 
  const tokenExpiresAt = Number(localStorage.getItem('tokenExpiresAt'));
  // ----------------------------------------
  
  // --- ROUTING STATE ---
  const [activeItem, setActiveItem] = useState('dashboard'); 
  // ---------------------

  
  // LOGIC TO HANDLE TIME-LIMITED TOKEN EXPIRATION (Omitted for brevity, but it's present in your file)
  useEffect(() => {
    if (!user || !tokenExpiresAt || isNaN(tokenExpiresAt) || (tokenExpiresAt - Date.now() <= 1000)) {
        onLogout();
        return;
    }
    
    const expiresInMs = tokenExpiresAt - Date.now();
    const timerId = setTimeout(onLogout, expiresInMs);

    return () => clearTimeout(timerId);
    
  }, [onLogout, user.user_id, tokenExpiresAt, user]);


  // LOGIC TO RENDER ACTIVE COMPONENT
  const renderContent = () => {
    switch (activeItem) {
        case 'dashboard':
            return <Dashboard />; 
        case 'inventory': // <-- NEW CASE: Render Inventory component
            return <Inventory />;
        case 'show-users':
            return <Users />;
        case 'create-users':
            // The Signup component is reused here to create a new user.
            return (
                <div className="flex justify-center items-start pt-10 h-full w-full">
                    {/* Note: The Signup component may need props like 'isAdminCreation' 
                        or a simpler title passed to it for proper context. */}
                    <Signup 
                        title="Create New System User" 
                        isInternalCreation={true}
                    />
                </div>
            );
        default:
            // Placeholder for all other routes
            return (
                <div className="h-full w-full bg-white rounded-xl shadow-lg p-10 flex items-center justify-center">
                    <h2 className="text-3xl font-bold text-gray-500">
                        {activeItem.toUpperCase().replace('-', ' ')} feature coming soon!
                    </h2>
                </div>
            );
    }
  };


  // Constants for readability
  const SIDEBAR_WIDTH = '256px'; 

  // Check if we have a user before rendering the protected content
  if (!user) {
    return <div>Redirecting or Loading...</div>; 
  }

  return (
    // Outer container: Full screen, gray background
    <div className="h-screen bg-gray-100 font-sans">
        
        {/* 1. Sidebar Content - PASSING ROUTING PROPS */}
        <Sidebar 
            onLogout={onLogout} 
            user={user} 
            activeItem={activeItem} 
            setActiveItem={setActiveItem} 
        />

        {/* 2. Main Content Wrapper: ... */}
        <div 
            className="flex flex-col"
            style={{ 
                marginLeft: `calc(${SIDEBAR_WIDTH})`, 
                width: `calc(100vw - ${SIDEBAR_WIDTH})`,
                height: `calc(100vh)` 
            }}
        >
            
            {/* 3. Header Area */}
            <div className="w-full">
                <Header />
            </div>

            {/* 4. Main Content Area */}
            <main className="flex-1 overflow-y-auto py-4 px-4"> 
                {/* Inner Content Box */}
                <div className="h-full w-full">
                    {renderContent()} {/* <-- Conditional content rendering */}
                </div>
            </main>
        </div>
    </div>
  );
}

export default Home;