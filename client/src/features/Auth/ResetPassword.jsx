import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Clear messages when user starts typing
  useEffect(() => {
    setError("");
    setMessage("");
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError(
        "Missing reset token. Please use the link provided in your email."
      );
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Calls the backend endpoint to complete the reset
      await axios.post(`http://localhost:5000/api/auth/reset-password`, {
        token,
        newPassword: password,
      });

      setMessage(
        "Password successfully reset! You will be redirected shortly."
      );

      // 🔑 CRITICAL FIX: Redirect to the root path ('/')
      // App.jsx will see no 'user' state and redirect to the Login component.
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      console.error("Password reset failed:", err.response?.data?.error || err);
      setError(
        err.response?.data?.error ||
          "Failed to reset password. The link may have expired or is invalid."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8 p-10 bg-white shadow-xl rounded-lg border border-gray-200'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Set a New Password
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Enter your new password below.
          </p>
        </div>

        {message && (
          <div className='p-3 text-sm font-medium text-green-700 bg-green-100 rounded-lg'>
            {message}
          </div>
        )}
        {error && (
          <div className='p-3 text-sm font-medium text-red-700 bg-red-100 rounded-lg'>
            {error}
          </div>
        )}

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='rounded-md shadow-sm -space-y-px'>
            <div>
              <label htmlFor='password' className='sr-only'>
                New Password
              </label>
              <input
                id='password'
                name='password'
                type='password'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                placeholder='New Password (min 8 characters)'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor='confirm-password' className='sr-only'>
                Confirm New Password
              </label>
              <input
                id='confirm-password'
                name='confirm-password'
                type='password'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                placeholder='Confirm New Password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              }`}
            >
              {loading ? "Processing..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
