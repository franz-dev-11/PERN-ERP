// src/features/Users/Users.jsx (REVISED FOR INDEPENDENT ROW EDIT DATA)

import React, { useState, useEffect } from 'react';
import axios from 'axios'; 

// Static Role Mapping for display consistency
const USER_ROLES = {
    1: 'System Administrator',
    2: 'Purchasing Agent',
    3: 'Sales Manager',
    4: 'Warehouse Clerk',
    5: 'Executive / Analyst',
    6: 'Data Entry Clerk'
};

// Helper to get Status pill style
const getStatusPill = (status) => {
    switch (status) {
        case 'Active':
            return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
        case 'Inactive':
            return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>;
        default:
            return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
};

// Helper to reverse the role map for the <select> element
const ROLE_OPTIONS = Object.entries(USER_ROLES).map(([id, name]) => ({
    id: parseInt(id, 10),
    name: name
}));


function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Reworked state to combine the ID and the data for the currently edited user.
  // { id: number, data: { fullName: string, username: string, ... } }
  const [editingUser, setEditingUser] = useState(null); 
  const [isSaving, setIsSaving] = useState(false);


  // --- Data Fetching Logic ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:5000/api/users'); 
      setUsers(response.data); 

    } catch (err) {
      console.error("Failed to fetch users:", err);
      const errorMessage = err.response 
                         ? `Server error: ${err.response.status} (${err.response.statusText})`
                         : 'Network error. Could not connect to API.';
      setError(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); 

  // --- Edit Handlers ---

  const handleEdit = (user) => {
    // Initialize temporary state with current user data, coupled with its ID
    setEditingUser({
      id: user.id,
      data: {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        roleId: user.roleId,
        status: user.status
      }
    });
    // Clear any previous general error message
    setError(null); 
  };

  const handleCancel = () => {
    setEditingUser(null); // Clear the editing user state
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Update only the 'data' part of the editingUser object
    setEditingUser(prev => ({ 
      ...prev, 
      data: { ...prev.data, [name]: value } 
    }));
  };

  const handleSave = async () => {
    if (!editingUser) return;
    
    const userId = editingUser.id;
    const editedData = editingUser.data;

    setIsSaving(true);
    setError(null);
    
    const originalUser = users.find(u => u.id === userId);
    if (!originalUser) {
        setIsSaving(false);
        setError("Original user data not found.");
        return;
    }

    const payload = {};
    let changesMade = false;

    // --- 1. Compare and Build Patch Payload (Only include fields that changed) ---
    
    // Full Name
    if (editedData.fullName !== originalUser.fullName) {
        if (!editedData.fullName || editedData.fullName.trim() === '') {
            setIsSaving(false);
            setError("Full Name cannot be empty.");
            return;
        }
        payload.full_name = editedData.fullName; // Use snake_case for backend
        changesMade = true;
    }
    
    // Username
    if (editedData.username !== originalUser.username) {
        // NOTE: Username logic is disabled since we only display it, but it was in the original payload builder
        // For this revision, we will remove username editing from the UI as it was only shown as a subtext.
        // If it were editable, we'd add validation here.
        // For consistency with the original intent, we'll keep the validation logic for now, even if the input is only for Full Name in the current UI template.
        if (!editedData.username || editedData.username.trim() === '') {
            setIsSaving(false);
            setError("Username cannot be empty. (Not editable in current UI)");
            return;
        }
        payload.username = editedData.username;
        changesMade = true;
    }
    
    // Email
    if (editedData.email !== originalUser.email) {
        if (!editedData.email || editedData.email.trim() === '') {
            setIsSaving(false);
            setError("Email cannot be empty.");
            return;
        }
        payload.email = editedData.email;
        changesMade = true;
    }

    // Role ID
    const newRoleId = parseInt(editedData.roleId, 10);
    if (newRoleId !== originalUser.roleId) {
        payload.role_id = newRoleId; // Use snake_case for backend
        changesMade = true;
    }

    // Status
    if (editedData.status !== originalUser.status) {
        payload.status = editedData.status;
        changesMade = true;
    }

    if (!changesMade) {
        setEditingUser(null);
        setIsSaving(false);
        return;
    }

    // --- 2. Execute Patch Request ---
    try {
      await axios.patch(`http://localhost:5000/api/users/${userId}`, payload);

      // Update the local state with the saved data
      setUsers(users.map(u => 
        u.id === userId ? { 
            ...u, 
            ...editedData,   
            roleId: newRoleId // Ensure the roleId is stored as a number
        } : u
      ));

      setEditingUser(null);

    } catch (err) {
      console.error('Update failed:', err.response?.data?.error || err);
      // Display the detailed error returned by the backend
      setError(err.response?.data?.error || `Failed to update user ${userId}.`);
    } finally {
      setIsSaving(false);
    }
};


  // --- Component Rendering (Read-Only Helpers Only) ---

  // Component for Read-Only Text Display
  const ReadOnlyCell = ({ value }) => (
      <div className="text-sm font-medium text-gray-900">
          {value} 
      </div>
  );

  // Component for Read-Only Role Display
  const RoleDisplay = ({ roleId }) => (
      USER_ROLES[roleId] || 'Unknown Role'
  );

  // Component for Read-Only Status Display (Pill)
  const StatusDisplay = ({ status }) => (
      getStatusPill(status)
  );


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>
      
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">Existing Users ({users.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          {/* Loading and Error States */}
          {loading && <div className="p-6 text-center text-lg text-indigo-600">Loading users...</div>}
          {error && <div className="p-6 text-center text-lg text-red-600">Error: {error}</div>}

          {/* User Table (Visible when not loading and no error) */}
          {!loading && !error && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                    // Determine if this specific row is being edited
                    const isEditing = editingUser && editingUser.id === user.id;
                    // Get the data for the row: edited data if editing, otherwise the original user data
                    const currentData = isEditing ? editingUser.data : user;

                    return (
                        <tr key={user.id} className="hover:bg-gray-50 transition duration-100">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                            
                            {/* Full Name Cell - Conditionally Renders Input/Read-Only */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                {isEditing ? (
                                    <input
                                        key={`${user.id}-fullName-input`} 
                                        type="text"
                                        name="fullName"
                                        // The value comes from the specific row's edited data
                                        value={currentData.fullName} 
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md p-1 text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                ) : (
                                    <ReadOnlyCell value={user.fullName} />
                                )}
                                {/* Display username read-only, regardless of edit mode */}
                                <div className="text-sm text-gray-500">@{user.username}</div> 
                            </td>
                            
                            {/* Email Cell - Conditionally Renders Input/Read-Only */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {isEditing ? (
                                    <input
                                        key={`${user.id}-email-input`} 
                                        type="email"
                                        name="email"
                                        // The value comes from the specific row's edited data
                                        value={currentData.email}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md p-1 text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                ) : (
                                    user.email
                                )}
                            </td>

                            {/* Role Cell - Conditionally Renders Select/Read-Only */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {isEditing ? (
                                    <select
                                        key={`${user.id}-roleId-select`} 
                                        name="roleId"
                                        // The value comes from the specific row's edited data
                                        value={currentData.roleId} 
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md p-1 text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {ROLE_OPTIONS.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <RoleDisplay roleId={user.roleId} />
                                )}
                            </td>

                            {/* Status Cell - Conditionally Renders Select/Read-Only */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                {isEditing ? (
                                    <select
                                        key={`${user.id}-status-select`} 
                                        name="status"
                                        // The value comes from the specific row's edited data
                                        value={currentData.status}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md p-1 text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                ) : (
                                    <StatusDisplay status={user.status} />
                                )}
                            </td>

                            {/* Actions Cell */}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                {isEditing ? (
                                    <>
                                        <button
                                            // handleSave now works on the entire editingUser object
                                            onClick={handleSave} 
                                            className={`text-green-600 hover:text-green-900 font-medium transition duration-150 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="text-red-600 hover:text-red-900 font-medium transition duration-150"
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium transition duration-150"
                                    >
                                        Edit
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
                {users.length === 0 && (
                  <tr className="text-center">
                    <td colSpan="6" className="py-8 text-lg text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;