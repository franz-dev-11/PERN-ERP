// Sidebar.jsx

import React from 'react';
// Lucide Imports removed as they are no longer used in the component
// Font Awesome imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartBar, faUserFriends, faSignOutAlt, faSignInAlt, 
    faFolder, faBoxes, faUser, faTags, faTruck, faHome,
    faLineChart
} from '@fortawesome/free-solid-svg-icons';

// Static Role Mapping
const USER_ROLES = {
    1: 'System Administrator',
    2: 'Purchasing Agent',
    3: 'Sales Manager',
    4: 'Warehouse Clerk',
    5: 'Executive / Analyst',
    6: 'Data Entry Clerk'
};

// Helper to get initials, using fullName (KEPT)
const getInitials = (fullName) => {
  if (!fullName) return 'User';
  const parts = fullName.split(' ').filter(n => n);
  if (parts.length > 1) {
    return parts.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return fullName.slice(0, 2).toUpperCase();
};

// IconComponent removed as Lucide is no longer used for the final structure

const getItemIcon = (id) => {
    if (id.includes('dashboard')) return faHome;
    if(id.includes('forecasting')) return faLineChart
    if (id.includes('inventory') || id.includes('purchasing') || id.includes('sales')) return faBoxes;
    if (id.includes('users') || id.includes('create')) return faUser;
    if (id.includes('pricing')) return faTags;
    if (id.includes('delivery')) return faTruck;
    return faFolder;
};

const navSections = [
  {
    title: 'Data & Analytics',
    icon: faChartBar,
    items: [
      { id: 'dashboard', text: 'Dashboard' },
      { id: 'inventory', text: 'Inventory' },
    ],
  },
  {
    title: 'Accounts',
    icon: faUserFriends,
    items: [
      { id: 'create-users', text: 'Create Users' },
      { id: 'show-users', text: 'Show Users' },
    ],
  },
  {
    title: 'Inbound',
    icon: faSignInAlt,
    items: [
      {id: 'purchasing', text: 'Purchasing'},
      {id: 'inbound-pricing', text: 'Inbound Pricing'},
      {id: 'inbound-delivery', text: 'Inbound Delivery'},
    ],
  },
  {
    title: 'Outbound',
    icon: faSignOutAlt,
    items: [
      {id: 'record-sales', text: 'Record Sales'},
      {id: 'outbound-pricing', text: 'Outbound Pricing'},
      {id: 'outbound-delivery', text: 'Outbound Delivery'},
    ],
  },
];


// FIXED: Sidebar now accepts activeItem and setActiveItem as props
function Sidebar({ onLogout, user, activeItem, setActiveItem }) {

  const fullName = user.full_name || 'Guest User';
  const roleId = user.role_id;
  const email = user.email || 'guest@dashboard.com';

  const roleName = USER_ROLES[roleId] || 'Role Undefined';
  const initials = getInitials(fullName);

  // REMOVED: const [activeItem, setActiveItem] = useState('dashboard');


  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-[#212121] text-white p-4 border-r border-gray-800 shadow-xl z-20 flex flex-col">

      {/* User Profile Section */}
      <div className="flex items-center pb-6 border-b border-gray-700 mb-6 relative">
          <div className="w-11 h-11 rounded-full bg-gray-600 text-white font-semibold flex items-center justify-center mr-3 overflow-hidden flex-shrink-0 shadow-md">
          <span className="text-md">{initials}</span>
          </div>
          <div className="flex-grow min-w-0">
              <div className="text-white text-sm font-bold truncate">
                  <span className="truncate">{fullName}</span>
              </div>
              <div className="text-xs text-gray-400 truncate mb-1" title={`Role: ${roleName}`}>
                  {roleName}
              </div>
              <div className="text-xs text-gray-400 truncate" title={email}>{email}</div>
          </div>
      </div>

      {/* Navigation Sections (Scrollable) */}
      <nav className="flex-grow overflow-y-auto pr-2">
          {navSections.map((section, index) => (
          <div key={section.title} className="mb-4">
              <div className="flex items-center text-xs text-gray-400 uppercase tracking-wide font-bold mb-3 pl-2">
                  <FontAwesomeIcon
                      icon={section.icon}
                      className="mr-2 w-3.5 h-3.5 text-white"
                  />
                  {section.title}
              </div>
              <ul>
              {section.items.map(item => (
                  <li key={item.id} className="mb-1 relative">
                  <a
                      href="#"
                      // FIXED: onClick now calls the prop setActiveItem
                      onClick={(e) => { e.preventDefault(); setActiveItem(item.id); }}
                      // FIXED: Uses the prop activeItem for comparison
                      className={`flex items-center py-2.5 pl-8 pr-3 rounded-xl text-sm transition-all duration-200 ease-in-out
                                  ${activeItem === item.id
                                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-black/30'
                                  : 'hover:bg-blue-600/30 hover:text-white text-gray-200'
                                  }`}
                  >
                      {/* Tree-view lines */}
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-700"></div>
                      <div className="absolute left-4 top-1/2 w-4 h-px bg-gray-700 -translate-y-1/2"></div>

                      {/* Font Awesome icon selected based on item ID */}
                      <FontAwesomeIcon
                          icon={getItemIcon(item.id)}
                          className={`mr-3 w-4 h-4 ${activeItem === item.id ? 'text-white' : 'text-gray-400'}`}
                      />
                      <span className="flex-grow">{item.text}</span>
                  </a>
                  </li>
              ))}
              </ul>
              {/* Divider */}
              {index < navSections.length - 1 && (
                  <hr className="my-5 border-gray-800" />
              )}
          </div>
          ))}
      </nav>

      {/* Static Logout Button */}
      <div className="mt-auto pt-4 border-t border-gray-700 flex-shrink-0">
          <button
              onClick={onLogout}
              className="flex items-center justify-center w-full py-2.5 px-3 text-sm font-semibold text-red-400 bg-red-900/40 rounded-xl hover:bg-red-900/60 transition duration-150 shadow-sm"
          >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 w-4 h-4" />
              Logout
          </button>
      </div>
    </aside>
  );
}

export default Sidebar;