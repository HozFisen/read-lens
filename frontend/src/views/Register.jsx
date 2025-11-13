// src/views/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
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

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registerData } = formData;
      const data = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify(registerData)
      });

      setAuth(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // Placeholder for Google OAuth
    alert('Google OAuth integration coming soon!');
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

        <button
          onClick={handleGoogleRegister}
          className="neo-brutal-sm bg-white w-full py-3 font-bold neo-brutal-hover flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

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