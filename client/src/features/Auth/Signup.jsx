// signup.jsx (Frontend - React with Tailwind CSS and Show/Hide Button)

import React, { useState, useEffect } from 'react';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleId: '', 
  });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  
  // STATE: Toggle visibility for password fields
  const [showPassword, setShowPassword] = useState(false); 

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };
  
  // Simulated function to fetch roles data
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        // Roles data from the PostgreSQL setup
        const rolesData = [
          { id: 1, name: 'System Administrator', description: 'Full control over all users, data, and system settings.' },
          { id: 6, name: 'Data Entry Clerk', description: 'Limited access to record basic transactions.' },
          { id: 2, name: 'Purchasing Agent', description: 'Manages the intake and procurement process.' },
          { id: 3, name: 'Sales Manager', description: 'Manages sales recording and pricing strategy.' },
          { id: 4, name: 'Warehouse Clerk', description: 'Handles the physical movement of goods.' },
          { id: 5, name: 'Executive / Analyst', description: 'Needs high-level oversight and reporting.' },
        ].sort((a, b) => a.id - b.id); 

        setRoles(rolesData);
        if (rolesData.length > 0) {
          setFormData(prevData => ({ ...prevData, roleId: rolesData.find(r => r.id === 6)?.id || rolesData[0].id }));
        }
      } catch (e) {
        setError('Failed to load user roles.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: name === 'roleId' ? parseInt(value, 10) : value,
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setError(''); 
    setLoading(true);

    const nameParts = formData.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      firstName: firstName, 
      lastName: lastName, 
      roleId: formData.roleId, 
    };

    try {
        const response = await fetch('/api/auth/signup', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
            setSuccess(`Success! User ${data.username} created.`);
            setFormData({ 
                username: '', fullName: '', email: '', password: '', confirmPassword: '', roleId: formData.roleId
            });
        } else {
            setError(data.error || 'Registration failed due to a server error.');
        }
    } catch (err) {
        setError('A network connection error occurred. Could not reach the server.');
    } finally {
        setLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.id === formData.roleId);

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-2xl rounded-xl border border-gray-100">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create Employee Accounts</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Role Selection (UI unchanged) */}
        <div>
          <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">Select Your Role:</label>
          <select
            id="roleId"
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          
          <p className={`mt-2 p-3 text-sm border-l-4 italic ${
                selectedRole?.id === 1 
                  ? 'text-red-700 border-red-500 bg-red-50 font-bold' 
                  : 'text-gray-600 border-blue-500 bg-blue-50'
          }`}>
             <span className="font-semibold">Description:</span> {selectedRole?.description || 'Select a role to see its description.'}
             {selectedRole?.id === 1 && (
                 <span className="ml-2">⚠️ **WARNING:** This role grants maximum privileges.</span>
             )}
          </p>
        </div>

        {/* Standard Input Fields */}
        <SignupInputField label="Username" id="username" type="text" value={formData.username} onChange={handleChange} />
        <SignupInputField label="Full Name (First and Last)" id="fullName" type="text" value={formData.fullName} onChange={handleChange} />
        <SignupInputField label="Email" id="email" type="email" value={formData.email} onChange={handleChange} />
        
        {/* --- PASSWORD FIELD WITH SHOW/HIDE BUTTON --- */}
        <PasswordInputField 
            label="Password" 
            id="password" 
            value={formData.password} 
            onChange={handleChange} 
            minLength="8" 
            showPassword={showPassword} 
            toggleVisibility={togglePasswordVisibility}
        />

        {/* --- CONFIRM PASSWORD FIELD WITH SHOW/HIDE BUTTON --- */}
        <PasswordInputField 
            label="Confirm Password" 
            id="confirmPassword" 
            value={formData.confirmPassword} 
            onChange={handleChange} 
            showPassword={showPassword} 
            toggleVisibility={togglePasswordVisibility}
        />
        
        {error && <p className="text-red-600 text-sm font-medium mt-2">{error}</p>}
        {success && <p className="text-green-600 text-sm font-medium mt-2">{success}</p>}

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition duration-150 ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {loading ? 'Processing...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

// Helper component for standard input fields (unchanged)
const SignupInputField = ({ label, id, type, value, onChange, minLength }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
        <input 
            type={type} 
            id={id} 
            name={id} 
            value={value} 
            onChange={onChange} 
            required 
            minLength={minLength}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black" 
        />
    </div>
);

// REVISED Helper component for password input fields
const PasswordInputField = ({ label, id, value, onChange, minLength, showPassword, toggleVisibility }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
        <div className="relative">
            <input 
                // Dynamically set type based on showPassword state
                type={showPassword ? 'text' : 'password'} 
                id={id} 
                name={id} 
                value={value} 
                onChange={onChange} 
                required 
                minLength={minLength}
                // Increased padding to make room for the button
                className="w-full pr-20 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black" 
            />
            
            {/* Toggle Button with Text */}
            <button 
                type="button" 
                onClick={toggleVisibility}
                className="absolute inset-y-0 right-0 px-2 my-1 mr-1 text-sm leading-5 font-semibold rounded bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none"
            >
                {/* Text changes based on the state */}
                {showPassword ? 'Hide' : 'Show'} 
            </button>
        </div>
    </div>
);

export default Signup;