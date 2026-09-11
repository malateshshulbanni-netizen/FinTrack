import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = ({ setIsAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      toast.warning('Please enter the admin password');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', {
        password
      });

      if (response.data.success) {
        setIsAuthenticated(true);
        toast.success('Welcome to FinTrack Dashboard! 🎉', {
          className: 'text-sm'
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Invalid password. Please try again.', {
        className: 'text-sm'
      });
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fintrack-light-green to-white p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-fintrack-border">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-fintrack-light-green rounded-full mb-4">
            <FaLock className="text-fintrack-green text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-fintrack-navy">FinTrack</h1>
          <p className="text-fintrack-secondary mt-1">Admin Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 pr-12 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green focus:border-transparent transition-all duration-200"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fintrack-secondary hover:text-fintrack-green transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fintrack-green hover:bg-fintrack-dark-green text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-fintrack-secondary">
            <span className="inline-block w-2 h-2 bg-fintrack-green rounded-full mr-2"></span>
            Secure admin access
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;