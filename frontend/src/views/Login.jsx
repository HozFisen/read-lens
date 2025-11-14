// src/views/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import { apiRequest } from '../config/api';
import { setAuth } from '../utils/auth';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (!data?.access_token || !data?.user) {
        throw new Error('Invalid response from server');
      }

      setAuth(data.access_token, data.user);
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          credential: credentialResponse.credential
        })
      });

      if (!data?.access_token || !data?.user) {
        throw new Error('Invalid response from server');
      }

      setAuth(data.access_token, data.user);
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again or use email login.');
  };

  return (
    <div className="container mx-auto px-4 pb-12 flex items-center justify-center min-h-[70vh]">
      <div className="neo-brutal bg-pastel-blue p-8 md:p-12 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <LogIn className="w-8 h-8" />
          <h1 className="font-black text-4xl">LOGIN</h1>
        </div>

        {error && (
          <div className="neo-brutal-sm bg-pastel-orange p-4 mb-6">
            <p className="font-bold text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-bold text-lg mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-4 border-black font-semibold focus:outline-none focus:ring-4 focus:ring-pastel-pink"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="font-bold text-lg mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-4 border-black font-semibold focus:outline-none focus:ring-4 focus:ring-pastel-pink"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="neo-brutal-sm bg-pastel-green w-full py-3 font-bold neo-brutal-hover flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Login
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-1 bg-black"></div>
          <span className="font-bold">OR</span>
          <div className="flex-1 h-1 bg-black"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="100%"
          />
        </div>

        <p className="text-center mt-6 font-semibold">
          Don't have an account?{' '}
          <Link to="/register" className="font-black underline decoration-4 hover:text-gray-700">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;