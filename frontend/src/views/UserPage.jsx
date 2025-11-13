// src/views/UserPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import BookCard from '../components/BookCard';
import { apiRequest } from '../config/api';
import { getUser } from '../utils/auth';
import { BookMarked, Loader2 } from 'lucide-react';

const UserPage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserBookshelf();
  }, [username]);

  const fetchUserBookshelf = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiRequest(`/user/${username}/bookshelf`);
      setBooks(data.books || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isOwnProfile = currentUser?.username === username;

  if (loading) {
    return (
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-12">
      {/* User Header */}
      <div className="neo-brutal bg-pastel-green p-8 md:p-12 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <BookMarked className="w-12 h-12" />
          <h1 className="font-black text-4xl md:text-5xl">
            {username}'s Bookshelf
          </h1>
        </div>
        {isOwnProfile && (
          <p className="text-lg font-semibold text-gray-700">
            Your personal collection of liked books
          </p>
        )}
      </div>

      {/* Bookshelf */}
      {error ? (
        <div className="neo-brutal bg-pastel-orange p-8 text-center">
          <p className="font-bold text-xl mb-2">Oops! Something went wrong</p>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={fetchUserBookshelf}
            className="neo-brutal-sm bg-white px-6 py-2 font-bold neo-brutal-hover"
          >
            Try Again
          </button>
        </div>
      ) : books.length === 0 ? (
        <div className="neo-brutal bg-pastel-blue p-8 md:p-12 text-center">
          <BookMarked className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="font-bold text-2xl mb-2">
            {isOwnProfile ? 'Your bookshelf is empty' : 'No books yet'}
          </p>
          <p className="text-lg font-semibold text-gray-700 mb-6">
            {isOwnProfile 
              ? 'Start adding books by clicking the heart icon on book details pages' 
              : `${username} hasn't added any books to their bookshelf yet`
            }
          </p>
          {isOwnProfile && (
            <button 
              onClick={() => navigate('/')}
              className="neo-brutal-sm bg-pastel-purple px-6 py-3 font-bold neo-brutal-hover"
            >
              Browse Books
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserPage;