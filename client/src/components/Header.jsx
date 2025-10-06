// Header.jsx

import React from 'react';
// Removed Font Awesome imports
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faChevronDown } from '@fortawesome/free-solid-svg-icons'; 
// Import both necessary icons from Lucide React
import { Search, ChevronDown } from 'lucide-react'; 
import stnLogo from '/src/assets/stnlogo.svg'; //

const Header = () => {
  return (
    // Header Container: Dark background retained
    <header className="w-full py-4 bg-[#212121]">
      
      {/* Content Wrapper: Max width, centered horizontally */}
      <div className="max-w-7xl w-full mx-auto flex justify-center items-center px-4 sm:px-6 lg:px-8">
        
        <img src = {stnLogo} className='text-center w-16' />
      </div>
    </header>
  );
};

export default Header;