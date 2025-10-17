// Sidebar.jsx (Frontend - React)

import React, { useState } from "react";
// Font Awesome imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faUserFriends,
  faSignOutAlt,
  faSignInAlt,
  faFolder,
  faBoxes,
  faUser,
  faTags,
  faTruck,
  faHome,
  faLineChart,
  faSearch,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";

// --- HELPER DATA & FUNCTIONS ---

// Static Role Mapping
const USER_ROLES = {
  1: "System Administrator",
  2: "Purchasing Agent",
  3: "Sales Manager",
  4: "Warehouse Clerk",
  5: "Executive / Analyst",
  6: "Data Entry Clerk",
};

// Helper to get initials
const getInitials = (fullName) => {
  if (!fullName) return "U";
  const parts = fullName.split(" ").filter((n) => n);
  if (parts.length > 1) {
    return parts
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return fullName.slice(0, 2).toUpperCase();
};

// Original Icon Mapping Logic
const getItemIcon = (id) => {
  if (id.includes("dashboard")) return faHome;
  if (id.includes("forecasting")) return faLineChart;
  if (
    id.includes("inventory") ||
    id.includes("purchasing") ||
    id.includes("sales")
  )
    return faBoxes;
  if (id.includes("users") || id.includes("create")) return faUser;
  if (id.includes("pricing")) return faTags;
  if (id.includes("delivery")) return faTruck;
  return faFolder;
};

// Original Navigation Sections (RESTORED)
const navSections = [
  {
    title: "Data & Analytics",
    icon: faChartBar,
    items: [
      { id: "dashboard", text: "Dashboard" },
      { id: "inventory", text: "Inventory" },
    ],
  },
  {
    title: "Accounts",
    icon: faUserFriends,
    items: [
      { id: "create-users", text: "Create Users" },
      { id: "show-users", text: "Show Users" },
    ],
  },
  {
    title: "Inbound",
    icon: faSignInAlt,
    items: [
      { id: "purchasing", text: "Purchasing" },
      { id: "inbound-pricing", text: "Inbound Pricing" },
      { id: "inbound-delivery", text: "Inbound Delivery" },
    ],
  },
  {
    title: "Outbound",
    icon: faSignOutAlt,
    items: [
      { id: "record-sales", text: "Record Sales" },
      { id: "outbound-pricing", text: "Outbound Pricing" },
      { id: "outbound-delivery", text: "Outbound Delivery" },
    ],
  },
];

// ------------------------------------
// MAIN SIDEBAR COMPONENT
// ------------------------------------

function Sidebar({ onLogout, user, activeItem, setActiveItem }) {
  // State to control the visibility of the profile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper function to toggle the menu
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // --- Profile Bar Component ---
  const ProfileBar = () => {
    // Uses the 'fullName' property created in authRoutes.js
    const fullName = user?.fullName;
    const roleId = user?.roleId;

    // CRITICAL: Convert roleId to a number for lookup
    const roleName = USER_ROLES[Number(roleId)] || "Role Undefined";
    const initials = getInitials(fullName);

    // Check if the user prop or essential fields are missing
    if (!user || (!fullName && !roleId)) {
      // Placeholder/Loading State
      return (
        <div className='flex items-center justify-between p-2 rounded-xl bg-gray-800/50'>
          <div className='flex items-center min-w-0'>
            <div className='w-10 h-10 rounded-full bg-gray-600 animate-pulse mr-3'></div>
            <div>
              <div className='text-white text-sm font-semibold'>
                User Data Missing
              </div>
              <div className='text-xs text-gray-400'>Please re-login</div>
            </div>
          </div>
        </div>
      );
    }

    // Render the actual user profile bar
    return (
      <div className='flex items-center justify-between p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition'>
        {/* User Info */}
        <div className='flex items-center min-w-0'>
          {/* Profile Picture container shows initials */}
          <div
            className='w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-md mr-3 
                                  border border-white/10 bg-gray-600 flex items-center justify-center text-sm font-bold'
          >
            <span className='text-white'>{initials}</span>
          </div>
          <div className='flex-grow min-w-0'>
            <div className='text-white text-sm font-semibold truncate'>
              <span className='truncate'>{fullName || "User"}</span>
            </div>
            <div
              className='text-xs text-gray-400 truncate'
              title={`Role: ${roleName}`}
            >
              {roleName}
            </div>
          </div>
        </div>
        {/* Three-dot button to toggle the menu */}
        <button
          onClick={toggleMenu}
          className={`text-gray-400 hover:text-white transition flex-shrink-0 ml-2 p-1 rounded-full ${
            isMenuOpen ? "bg-gray-700" : ""
          }`}
        >
          <FontAwesomeIcon icon={faEllipsisV} className='w-4 h-4' />
        </button>
      </div>
    );
  };
  // --- End Profile Bar Component ---

  return (
    <aside className='fixed top-0 left-0 h-screen w-64 bg-[#181818] text-white p-4 border-r border-gray-900 shadow-2xl z-20 flex flex-col'>
      {/* ⭐️ LOGOUT DROPDOWN MENU */}
      {isMenuOpen && (
        <div className='fixed left-64 bottom-4 w-40 p-1 rounded-lg bg-gray-700 shadow-2xl z-50'>
          <button
            onClick={() => {
              onLogout();
              setIsMenuOpen(false);
            }}
            className='flex items-center w-full py-2 px-2 text-sm font-medium text-red-400 rounded-md hover:bg-red-900/40 transition duration-150'
          >
            <FontAwesomeIcon icon={faSignOutAlt} className='mr-3 w-4 h-4' />
            Logout
          </button>
        </div>
      )}

      {/* Search Bar Container */}
      <div className='flex-shrink-0 pb-4 mb-4 border-b border-gray-700/50'>
        <h1 className='text-xs font-bold mb-4 text-gray-400 uppercase tracking-wide mt-4 ml-2'>
          Navigation
        </h1>
        <div className='relative'>
          <input
            type='text'
            placeholder='Search...'
            className='w-full py-2.5 pl-10 pr-4 text-sm bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 border-none placeholder-gray-400'
          />
          <FontAwesomeIcon
            icon={faSearch}
            className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400'
          />
        </div>
      </div>

      {/* Navigation Sections (Scrollable) */}
      <nav className='flex-grow overflow-y-auto pr-2'>
        {navSections.map((section, index) => (
          <div key={section.title} className='mb-4'>
            {/* Section Title Style */}
            <div className='flex items-center text-xs text-gray-400 uppercase tracking-wide font-bold mb-3 pl-2'>
              <FontAwesomeIcon
                icon={section.icon}
                className='mr-2 w-3.5 h-3.5 text-blue-400'
              />
              {section.title}
            </div>
            <ul>
              {section.items.map((item) => (
                <li key={item.id} className='mb-1 relative'>
                  <a
                    href='#'
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveItem(item.id);
                    }}
                    className={`flex items-center py-2.5 pl-4 pr-3 rounded-xl text-sm transition-all duration-200 ease-in-out
                                  ${
                                    activeItem === item.id
                                      ? "bg-blue-600 text-white font-semibold shadow-lg shadow-black/30"
                                      : "hover:bg-gray-800 text-gray-200"
                                  }`}
                  >
                    <FontAwesomeIcon
                      icon={getItemIcon(item.id)}
                      className={`mr-3 w-5 h-5 ${
                        activeItem === item.id ? "text-white" : "text-gray-400"
                      }`}
                    />
                    <span className='flex-grow'>{item.text}</span>
                  </a>
                </li>
              ))}
            </ul>
            {/* Divider */}
            {index < navSections.length - 1 && (
              <hr className='my-5 border-gray-800' />
            )}
          </div>
        ))}
      </nav>

      {/* Profile Section (PINNED TO BOTTOM) */}
      <div className='mt-auto pt-2 border-t border-gray-700/50 flex-shrink-0 relative'>
        {/* Renders the Profile Bar logic */}
        <ProfileBar />
      </div>
    </aside>
  );
}

export default Sidebar;
