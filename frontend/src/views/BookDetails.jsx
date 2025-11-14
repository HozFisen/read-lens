// src/views/BookDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { apiRequest } from '../config/api';
import { isAuthenticated } from '../utils/auth';
import { ArrowLeft, Heart, BookOpen, Loader2 } from 'lucide-react';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likingInProgress, setLikingInProgress] = useState(false);

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiRequest(`/book/${id}`);
      
      // Validate that we got book data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid book data received');
      }
      
      setBook(data);
      setLiked(data?.isLiked || false);
    } catch (err) {
      setError(err?.message || 'Failed to load book details');
      setBook(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setLikingInProgress(true);
    
    try {
      await apiRequest(`/book/${id}/like`, { method: 'POST' });
      setLiked(!liked);
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setLikingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4">
        <div className="neo-brutal bg-pastel-orange p-8 text-center">
          <p className="font-bold text-xl mb-2">Oops! Something went wrong</p>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="neo-brutal-sm bg-white px-6 py-2 font-bold neo-brutal-hover"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-12">
      <button 
        onClick={() => navigate('/')}
        className="neo-brutal-sm bg-pastel-blue px-4 py-2 font-bold neo-brutal-hover flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Books
      </button>

      <div className="neo-brutal bg-white p-8 md:p-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Book Cover */}
          <div className="md:col-span-1">
            {book?.coverUrl ? (
              <img 
                src={book.coverUrl} 
                alt={book?.title || 'Book cover'}
                className="w-full border-4 border-black"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            <div className={`w-full aspect-[2/3] bg-pastel-yellow border-4 border-black items-center justify-center ${book?.coverUrl ? 'hidden' : 'flex'}`}>
              <BookOpen className="w-24 h-24 text-gray-400" />
            </div>

            <button 
              onClick={handleLike}
              disabled={likingInProgress}
              className={`neo-brutal-sm w-full mt-4 px-6 py-3 font-bold neo-brutal-hover flex items-center justify-center gap-2 ${
                liked ? 'bg-pastel-pink' : 'bg-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              {liked ? 'Liked!' : 'Add to Bookshelf'}
            </button>
          </div>

          {/* Book Info */}
          <div className="md:col-span-2">
            <h1 className="font-black text-4xl md:text-5xl mb-4">
              {book?.title || 'Untitled Book'}
            </h1>

            {book?.author && (
              <p className="text-2xl font-bold text-gray-700 mb-2">
                by {book.author}
              </p>
            )}

            {book?.publishYear && (
              <p className="text-xl font-semibold text-gray-600 mb-6">
                Published: {book.publishYear}
              </p>
            )}

            {book?.isbn && (
              <div className="neo-brutal-sm bg-pastel-green px-4 py-2 inline-block mb-6">
                <span className="font-bold">ISBN: {book.isbn}</span>
              </div>
            )}

            {book?.description && (
              <div className="mb-6">
                <h2 className="font-black text-2xl mb-3">Description</h2>
                <p className="text-lg leading-relaxed font-medium text-gray-800">
                  {book.description}
                </p>
              </div>
            )}

            {book?.subjects && Array.isArray(book.subjects) && book.subjects.length > 0 && (
              <div>
                <h2 className="font-black text-2xl mb-3">Subjects</h2>
                <div className="flex flex-wrap gap-2">
                  {book.subjects.map((subject, idx) => (
                    <span 
                      key={idx}
                      className="neo-brutal-sm bg-pastel-purple px-3 py-1 font-bold text-sm"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;