// Header.jsx

import React from 'react';
// Removed Font Awesome imports
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faChevronDown } from '@fortawesome/free-solid-svg-icons'; 
// Import both necessary icons from Lucide React
import { Search, ChevronDown } from 'lucide-react'; 

const Header = () => {
  return (
    // Header Container: Dark background retained
    <header className="w-full py-4 bg-[#212121]">
      
      {/* Content Wrapper: Max width, centered horizontally */}
      <div className="max-w-7xl w-full mx-auto flex justify-center items-center px-4 sm:px-6 lg:px-8">
        
        {/* Universal Search Bar Component */}
        <div className="w-full max-w-xl sm:max-w-2xl flex shadow-xl rounded-md overflow-hidden">
            
            {/* 1. Category Dropdown Button (Now uses Lucide React icon) */}
            <button 
                className="px-3 py-2 bg-gray-700 text-white text-sm font-semibold border-r border-gray-600 flex items-center whitespace-nowrap"
            >
                {/* Hide 'All categories' on tiny screens, show only the dropdown icon */}
                <span className="hidden sm:inline">All categories</span> 
                
                {/* Lucide React ChevronDown Icon */}
                <ChevronDown className="sm:ml-2 h-4 w-4" />
            </button>
            
            {/* 2. Search Input Field */}
            <input
                type="search"
                name="search"
                id="search"
                placeholder="Search mo pake ko"
                autocomplete="off" 
                // Styling for dark input field
                className="flex-1 px-4 py-2 border-none focus:ring-0 text-sm bg-gray-800 text-white placeholder-gray-400"
            />
            
            {/* 3. Search Button (Uses Lucide React Search icon) */}
            <button 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
            >
                {/* Lucide React Search Icon */}
                <Search className="h-5 w-5" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;