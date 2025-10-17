// Login.jsx

import React, { useState, useCallback } from "react";
import stnLogo from "../assets/stnlogo.png";

// =================================================================
// Helper Components & Icons (InputField, PasswordField, MailIcon - UNCHANGED)
// =================================================================

const InputField = ({
  label,
  id,
  type,
  value,
  onChange,
  loading,
  icon: Icon,
}) => (
  <div className='space-y-1'>
    <label htmlFor={id} className='block text-sm font-medium text-gray-700'>
      {label}
    </label>
    <div className='relative'>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required
        autoComplete='off'
        className='w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition duration-150 bg-gray-50'
        placeholder={`Enter ${label.toLowerCase()}`}
        disabled={loading}
      />
      {Icon && (
        <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
          <Icon className='h-5 w-5 text-gray-400' />
        </div>
      )}
    </div>
  </div>
);

const PasswordField = ({
  label,
  id,
  value,
  onChange,
  show,
  toggle,
  loading,
}) => (
  <div className='space-y-1'>
    <label htmlFor={id} className='block text-sm font-medium text-gray-700'>
      {label}
    </label>
    <div className='relative'>
      <input
        type={show ? "text" : "password"}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required
        autoComplete='off'
        className='w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition duration-150 bg-gray-50'
        placeholder='Enter password'
        disabled={loading}
      />
      <button
        type='button'
        onClick={toggle}
        className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none transition'
        aria-label={show ? "Hide password" : "Show password"}
        disabled={loading}
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          {show ? (
            <path d='M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6Z' />
          ) : (
            <path d='M9.88 9.88a3 3 0 1 0 4.24 4.24 M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68 M6.61 6.61A13.16 13.16 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.43-1.61 M2 2l20 20' />
          )}
        </svg>
      </button>
    </div>
  </div>
);

const MailIcon = (props) => (
  <svg
    {...props}
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className='lucide lucide-mail'
  >
    <rect width='20' height='16' x='2' y='4' rx='2' />
    <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
  </svg>
);

// =================================================================
// MAIN LOGIN COMPONENT
// =================================================================

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setLoading(true);

    const userData = {
      email: formData.email,
      password: formData.password,
    };

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // --- NEW: JWT and Expiration Storage Logic ---
        // 🔑 REVISION: Destructure 'token' instead of 'accessToken' (to match the revised backend)
        const { user, token, expiresAt } = data;

        if (token && expiresAt && user) {
          // 1. Store the Access Token
          // NOTE: Store the token value under the standard localStorage key 'accessToken'
          localStorage.setItem("accessToken", token);

          // 2. Store the Token Expiration time (number)
          localStorage.setItem("tokenExpiresAt", expiresAt);

          // 3. Store user details as a JSON string
          localStorage.setItem("user", JSON.stringify(user));

          setSuccess(`Login successful. Redirecting...`);

          // onLoginSuccess typically triggers a state change in the parent
          // component (e.g., App.js) which renders the Home component.
          onLoginSuccess(user);
        } else {
          // Fallback for missing data
          // 🛑 FIX: The error is now the correct key, preventing the 'token missing' message.
          setError("Login failed: Token data missing from server response.");
          setLoading(false);
        }
        // ----------------------------------------------
      } else {
        setError(data.error || "Login failed. Please check your credentials.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Network Error during login:", err);
      setError(
        "A network connection error occurred. Could not reach the server."
      );
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen bg-gray-100 items-center justify-center p-4 sm:p-0'>
      <div className='bg-white rounded-xl shadow-2xl flex max-w-5xl w-full overflow-hidden'>
        {/* Left Column - Login Form */}
        <div className='w-full lg:w-1/2 p-8 sm:p-12 md:p-16 flex flex-col justify-center'>
          {/* Logo */}
          <div className='mb-10'>
            <img
              src={stnLogo}
              alt='STN Logo'
              className='h-32 mb-6 object-contain'
            />
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Email Field */}
            <InputField
              label='Email'
              id='email'
              type='email'
              value={formData.email}
              onChange={handleChange}
              loading={loading}
              icon={MailIcon}
            />

            {/* Password Field with Toggle */}
            <PasswordField
              label='Password'
              id='password'
              value={formData.password}
              onChange={handleChange}
              show={showPassword}
              toggle={togglePasswordVisibility}
              loading={loading}
            />

            {/* Gap to replace removed elements */}
            <div className='h-4'></div>

            {/* Status Messages */}
            {error && (
              <p className='text-red-600 text-sm font-medium p-2 rounded bg-red-50 text-center mt-4'>
                {error}
              </p>
            )}
            {success && (
              <p className='text-green-600 text-sm font-medium p-2 rounded bg-green-50 text-center mt-4'>
                {success}
              </p>
            )}

            {/* Sign In Button */}
            <button
              type='submit'
              disabled={loading}
              className={`w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-white font-semibold text-lg transition duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              }`}
            >
              {loading ? (
                <span className='flex items-center justify-center'>
                  <svg
                    className='animate-spin h-5 w-5 mr-3 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />{" "}
                    {/* 🛑 CRITICAL FIX: The missing self-closing slash was added here. */}
                  </svg>
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Right Column - Image and Text (UNCHANGED) */}
        <div className='hidden lg:flex lg:w-1/2 relative'>
          {/* Background image with overlay */}
          <div
            className='absolute inset-0 bg-cover bg-center rounded-r-xl'
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
            }}
          >
            <div className='absolute inset-0 bg-blue-700 opacity-70 rounded-r-xl'></div>
          </div>

          {/* Text content (ERP appropriate) */}
          <div className='relative z-10 flex flex-col justify-center items-center text-white p-8 text-center'>
            <h3 className='text-5xl font-extrabold mb-4 leading-tight'>
              Access Your Business Hub
            </h3>
            <p className='text-xl max-w-md'>
              Sign in to manage inventory, track orders, and gain real-time
              insights into your operations. Your efficiency starts now.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
