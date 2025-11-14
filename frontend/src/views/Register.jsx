// src/views/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import { apiRequest } from '../config/api';
import { setAuth } from '../utils/auth';
import { UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registerData } = formData;
      const data = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify(registerData)
      });

      if (!data?.token || !data?.user) {
        throw new Error('Invalid response from server');
      }

      setAuth(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
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

      if (!data?.token || !data?.user) {
        throw new Error('Invalid response from server');
      }

      setAuth(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Google sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign up failed. Please try again or use email registration.');
  };

  return (
    <div className="container mx-auto px-4 pb-12 flex items-center justify-center min-h-[70vh]">
      <div className="neo-brutal bg-pastel-purple p-8 md:p-12 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <UserPlus className="w-8 h-8" />
          <h1 className="font-black text-4xl">REGISTER</h1>
        </div>

        {error && (
          <div className="neo-brutal-sm bg-pastel-orange p-4 mb-6">
            <p className="font-bold text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-bold text-lg mb-2 flex items-center gap-2">
              <User className="w-5 h-5" />
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              className="w-full px-4 py-3 border-4 border-black font-semibold focus:outline-none focus:ring-4 focus:ring-pastel-pink"
              placeholder="johndoe"
            />
          </div>

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
              minLength={6}
              className="w-full px-4 py-3 border-4 border-black font-semibold focus:outline-none focus:ring-4 focus:ring-pastel-pink"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="font-bold text-lg mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
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
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
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
            text="signup_with"
            shape="rectangular"
            width="100%"
          />
        </div>

        <p className="text-center mt-6 font-semibold">
          Already have an account?{' '}
          <Link to="/login" className="font-black underline decoration-4 hover:text-gray-700">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;