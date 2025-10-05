import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx'; // Adjust path if necessary

// API URL for fetching all inventory items from the Express server
const API_URL = 'http://localhost:5000/api/inventory'; 

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect to fetch inventory data on initial component mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
          // If server is reached but returns a bad status (e.g., 500 from a query error)
          throw new Error(`HTTP error! Status: ${response.status}. Check Express server logs for details.`);
        }
        
        const data = await response.json();
        setItems(data);
      } catch (e) {
        // If fetch fails entirely (TypeError: Failed to fetch), the server is unreachable.
        setError("Network Connection Failed. Ensure the Express server is running on localhost:5000 in a separate terminal.");
        console.error("Fetching error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []); 

  // --- UI RENDERING ---

  if (loading && items.length === 0 && !error) {
    // Wrap the loading state in the main layout container as well
    return (
      <div className="flex min-h-screen"> 
        <Sidebar />
        <div className="flex-grow ml-64 p-6 flex justify-center items-center">
            <p className="text-xl font-medium text-blue-600 animate-pulse">
                Connecting to database and fetching data...
            </p>
        </div>
      </div>
    );
  }

  return (
    // 1. Main container uses flex to arrange Sidebar and Content side-by-side
    <div className="flex min-h-screen bg-gray-100"> 
        
      {/* 2. The Sidebar component is placed first */}
      <Sidebar />

      {/* 3. Main content area */}
      {/* - flex-grow: allows the main content to take up the remaining space.
        - ml-64: REQUIRED to offset the fixed-width Sidebar (which is w-64).
      */}
      <main className="flex-grow ml-64 p-8"> 
        <div className="w-full bg-white shadow-xl rounded-xl p-6">
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold text-gray-800">
              Inventory 📊
            </h1>
            <p className="text-gray-500 mt-2">
              Real-time data fetched from the PostgreSQL database via the Express API.
            </p>
          </header>

          {error && (
            <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg relative mb-8 font-medium shadow-sm">
              {error}
            </div>
          )}
          
          {/* --- Inventory Table --- */}
          <div>
            
            {items.length === 0 && !error ? (
              <p className="text-gray-500 italic p-6 border rounded-lg bg-gray-50 text-center shadow-inner">
                The database is connected but currently contains no inventory items.
              </p>
            ) : (
              <div className="overflow-x-auto shadow-xl rounded-lg border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-600 uppercase tracking-wider w-1/12">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-600 uppercase tracking-wider w-8/12">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-600 uppercase tracking-wider w-3/12">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition duration-150 ease-in-out">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-blue-700">
                          {item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Inventory;