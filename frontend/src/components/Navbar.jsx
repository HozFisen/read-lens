// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router';
import { BookOpen, User, LogIn, LogOut, UserPlus } from 'lucide-react';
import { isAuthenticated, getUser, clearAuth } from '../utils/auth';
import { apiRequest } from '../config/api';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuth = isAuthenticated();
  const user = getUser();

  const handleLogout = async () => {
    try {
      await apiRequest('/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
      navigate('/');
    }
  };

  return (
    <nav className="neo-brutal bg-pastel-pink p-4 mb-8">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-2xl font-black hover:scale-105 transition-transform">
          <BookOpen className="w-8 h-8" />
          <span>BOOKSHELF</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="px-4 py-2 font-bold hover:underline decoration-4 transition-all"
          >
            Browse Books
          </Link>

          {isAuth ? (
            <>
              <Link 
                to={`/user/${user.username}`}
                className="neo-brutal-sm bg-pastel-blue px-4 py-2 font-bold neo-brutal-hover flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {user.username || 'Username'}
              </Link>
              <button 
                onClick={handleLogout}
                className="neo-brutal-sm bg-pastel-orange px-4 py-2 font-bold neo-brutal-hover flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login"
                className="neo-brutal-sm bg-pastel-green px-4 py-2 font-bold neo-brutal-hover flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link 
                to="/register"
                className="neo-brutal-sm bg-pastel-purple px-4 py-2 font-bold neo-brutal-hover flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;