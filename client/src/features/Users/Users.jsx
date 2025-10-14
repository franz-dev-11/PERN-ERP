// src/features/Users/Users.jsx (FINAL VERSION - Includes Row Editing and Password Reset)

import React, { useState, useEffect } from "react";
import axios from "axios";

// Static Role Mapping for display consistency
const USER_ROLES = {
  1: "System Administrator",
  2: "Purchasing Agent",
  3: "Sales Manager",
  4: "Warehouse Clerk",
  5: "Executive / Analyst",
  6: "Data Entry Clerk",
};

// Helper to get Status pill style
const getStatusPill = (status) => {
  switch (status) {
    case "Active":
      return (
        <span className='px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'>
          Active
        </span>
      );
    case "Inactive":
      return (
        <span className='px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800'>
          Inactive
        </span>
      );
    default:
      return (
        <span className='px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800'>
          {status}
        </span>
      );
  }
};

// Helper to reverse the role map for the <select> element
const ROLE_OPTIONS = Object.entries(USER_ROLES).map(([id, name]) => ({
  id: parseInt(id, 10),
  name: name,
}));

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the currently edited user row
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 🔑 NEW STATE: State to track password reset status per user ID
  // { [userId: number]: 'sending' | 'success' | 'error' | null, [`error_${userId}`]: string }
  const [resetStatus, setResetStatus] = useState({});

  // --- Data Fetching Logic ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetches user list from the backend
      const response = await axios.get("http://localhost:5000/api/users");
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      const errorMessage = err.response
        ? `Server error: ${err.response.status} (${err.response.statusText})`
        : "Network error. Could not connect to API.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Edit Handlers (Logic remains the same) ---
  const handleEdit = (user) => {
    setEditingUser({
      id: user.id,
      data: {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        roleId: user.roleId,
        status: user.status,
      },
    });
    setError(null);
  };

  const handleCancel = () => {
    setEditingUser(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingUser((prev) => ({
      ...prev,
      data: { ...prev.data, [name]: value },
    }));
  };

  const handleSave = async () => {
    if (!editingUser) return;

    const userId = editingUser.id;
    const editedData = editingUser.data;

    setIsSaving(true);
    setError(null);

    const originalUser = users.find((u) => u.id === userId);
    if (!originalUser) {
      setIsSaving(false);
      setError("Original user data not found.");
      return;
    }

    const payload = {};
    let changesMade = false;

    // --- 1. Compare and Build Patch Payload ---
    if (editedData.fullName !== originalUser.fullName) {
      if (!editedData.fullName || editedData.fullName.trim() === "") {
        setIsSaving(false);
        setError("Full Name cannot be empty.");
        return;
      }
      payload.full_name = editedData.fullName;
      changesMade = true;
    }

    if (editedData.username !== originalUser.username) {
      if (!editedData.username || editedData.username.trim() === "") {
        setIsSaving(false);
        setError("Username cannot be empty. (Not editable in current UI)");
        return;
      }
      payload.username = editedData.username;
      changesMade = true;
    }

    if (editedData.email !== originalUser.email) {
      if (!editedData.email || editedData.email.trim() === "") {
        setIsSaving(false);
        setError("Email cannot be empty.");
        return;
      }
      payload.email = editedData.email;
      changesMade = true;
    }

    const newRoleId = parseInt(editedData.roleId, 10);
    if (newRoleId !== originalUser.roleId) {
      payload.role_id = newRoleId;
      changesMade = true;
    }

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
      // Calls the PATCH /api/users/:id endpoint
      await axios.patch(`http://localhost:5000/api/users/${userId}`, payload);

      setUsers(
        users.map((u) =>
          u.id === userId
            ? {
                ...u,
                ...editedData,
                roleId: newRoleId,
              }
            : u
        )
      );

      setEditingUser(null);
    } catch (err) {
      console.error("Update failed:", err.response?.data?.error || err);
      setError(err.response?.data?.error || `Failed to update user ${userId}.`);
    } finally {
      setIsSaving(false);
    }
  };

  // 🔑 NEW Password Reset Handler
  const handleSendResetLink = async (user) => {
    const userId = user.id;

    // 1. Set status to sending
    setResetStatus((prev) => ({
      ...prev,
      [userId]: "sending",
      [`error_${userId}`]: null,
    }));

    try {
      // Calls the POST /api/users/:id/send-reset-link endpoint
      await axios.post(
        `http://localhost:5000/api/users/${userId}/send-reset-link`
      );

      // 2. Set status to success
      setResetStatus((prev) => ({ ...prev, [userId]: "success" }));

      // Clear success message after 5 seconds
      setTimeout(() => {
        setResetStatus((prev) => ({ ...prev, [userId]: null }));
      }, 5000);
    } catch (err) {
      console.error(`Failed to send reset link for user ${userId}:`, err);

      const backendError =
        err.response?.data?.error || "Failed to send link (Unknown Error).";

      // 3. Set status to error
      setResetStatus((prev) => ({
        ...prev,
        [userId]: "error",
        [`error_${userId}`]: backendError, // Store the specific error message
      }));

      // Clear error message after 10 seconds
      setTimeout(() => {
        setResetStatus((prev) => ({
          ...prev,
          [userId]: null,
          [`error_${userId}`]: null,
        }));
      }, 10000);
    }
  };

  // --- Component Rendering ---
  const ReadOnlyCell = ({ value }) => (
    <div className='text-sm font-medium text-gray-900'>{value}</div>
  );

  const RoleDisplay = ({ roleId }) => USER_ROLES[roleId] || "Unknown Role";

  const StatusDisplay = ({ status }) => getStatusPill(status);

  return (
    <div className='p-4 sm:p-6 lg:p-8'>
      <h1 className='text-3xl font-bold text-gray-800 mb-6'>User Management</h1>

      <div className='bg-white shadow-xl rounded-lg overflow-hidden'>
        <div className='p-4 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-700'>
            Existing Users ({users.length})
          </h2>
        </div>

        <div className='overflow-x-auto'>
          {/* Loading and Error States */}
          {loading && (
            <div className='p-6 text-center text-lg text-indigo-600'>
              Loading users...
            </div>
          )}
          {error && (
            <div className='p-6 text-center text-lg text-red-600'>
              Error: {error}
            </div>
          )}

          {/* User Table (Visible when not loading and no error) */}
          {!loading && !error && (
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    ID
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    User Name
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Email
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Role
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='relative px-6 py-3'>
                    <span className='sr-only'>Actions</span>
                  </th>
                  {/* 🔑 NEW COLUMN HEADER */}
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Password Reset
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {users.map((user) => {
                  const isEditing = editingUser && editingUser.id === user.id;
                  const currentData = isEditing ? editingUser.data : user;
                  // Get the specific reset status for this user
                  const status = resetStatus[user.id];
                  const statusError = resetStatus[`error_${user.id}`];

                  return (
                    <tr
                      key={user.id}
                      className='hover:bg-gray-50 transition duration-100'
                    >
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {user.id}
                      </td>

                      {/* Full Name Cell */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {isEditing ? (
                          <input
                            key={`${user.id}-fullName-input`}
                            type='text'
                            name='fullName'
                            value={currentData.fullName}
                            onChange={handleChange}
                            className='w-full border border-gray-300 rounded-md p-1 text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                          />
                        ) : (
                          <ReadOnlyCell value={user.fullName} />
                        )}
                        <div className='text-sm text-gray-500'>
                          @{user.username}
                        </div>
                      </td>

                      {/* Email Cell */}
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {isEditing ? (
                          <input
                            key={`${user.id}-email-input`}
                            type='email'
                            name='email'
                            value={currentData.email}
                            onChange={handleChange}
                            className='w-full border border-gray-300 rounded-md p-1 text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                          />
                        ) : (
                          user.email
                        )}
                      </td>

                      {/* Role Cell */}
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {isEditing ? (
                          <select
                            key={`${user.id}-roleId-select`}
                            name='roleId'
                            value={currentData.roleId}
                            onChange={handleChange}
                            className='w-full border border-gray-300 rounded-md p-1 text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <RoleDisplay roleId={user.roleId} />
                        )}
                      </td>

                      {/* Status Cell */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {isEditing ? (
                          <select
                            key={`${user.id}-status-select`}
                            name='status'
                            value={currentData.status}
                            onChange={handleChange}
                            className='w-full border border-gray-300 rounded-md p-1 text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                          >
                            <option value='Active'>Active</option>
                            <option value='Inactive'>Inactive</option>
                          </select>
                        ) : (
                          <StatusDisplay status={user.status} />
                        )}
                      </td>

                      {/* Actions Cell */}
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2'>
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSave}
                              className={`text-green-600 hover:text-green-900 font-medium transition duration-150 ${
                                isSaving ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              disabled={isSaving}
                            >
                              {isSaving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancel}
                              className='text-red-600 hover:text-red-900 font-medium transition duration-150'
                              disabled={isSaving}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(user)}
                            className='text-indigo-600 hover:text-indigo-900 font-medium transition duration-150'
                          >
                            Edit
                          </button>
                        )}
                      </td>

                      {/* 🔑 NEW PASSWORD RESET CELL */}
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-center'>
                        {status === "sending" && (
                          <span className='text-yellow-600 text-xs font-semibold'>
                            Sending...
                          </span>
                        )}
                        {status === "success" && (
                          <span className='text-green-600 text-xs font-semibold'>
                            Link Sent!
                          </span>
                        )}
                        {status === "error" && (
                          // Display the specific error message from the backend
                          <span className='text-red-600 text-xs font-semibold block mb-1'>
                            Error: {statusError || "Failed"}
                          </span>
                        )}

                        {status !== "sending" && (
                          <button
                            onClick={() => handleSendResetLink(user)}
                            // Disable if a row is currently being edited
                            disabled={!!editingUser}
                            className={`ml-2 px-3 py-1 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ${
                              !!editingUser
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            Send Link
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr className='text-center'>
                    {/* Note: colSpan is 7 to account for the new column */}
                    <td colSpan='7' className='py-8 text-lg text-gray-500'>
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
