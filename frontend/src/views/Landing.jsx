// src/views/Landing.jsx
import { useState, useEffect } from 'react';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';
import { apiRequest } from '../config/api';
import { BookOpen, Loader2 } from 'lucide-react';

const Landing = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const booksPerPage = 12;

  useEffect(() => {
    fetchBooks();
  }, [currentPage]);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiRequest(`/?page=${currentPage}&limit=${booksPerPage}`);
      
      // Safe access with defaults
      const booksArray = Array.isArray(data?.books) ? data.books : [];
      const pages = typeof data?.totalPages === 'number' && data.totalPages > 0 ? data.totalPages : 1;
      
      setBooks(booksArray);
      setTotalPages(pages);
    } catch (err) {
      setError(err?.message || 'Failed to fetch books. Please try again.');
      setBooks([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 pb-12">
      {/* Hero Section */}
      <div className="neo-brutal bg-pastel-purple p-8 md:p-12 mb-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <BookOpen className="w-16 h-16" />
          <h1 className="font-black text-5xl md:text-6xl">BOOKSHELF</h1>
        </div>
        <p className="text-xl font-bold text-gray-800 mb-2">
          Discover your next favorite read
        </p>
        <p className="text-lg font-semibold text-gray-700">
          Browse thousands of books, create your personal library, and share your favorites
        </p>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 animate-spin" />
        </div>
      ) : error ? (
        <div className="neo-brutal bg-pastel-orange p-8 text-center">
          <p className="font-bold text-xl mb-2">Oops! Something went wrong</p>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={fetchBooks}
            className="neo-brutal-sm bg-white px-6 py-2 font-bold mt-4 neo-brutal-hover"
          >
            Try Again
          </button>
        </div>
      ) : books.length === 0 ? (
        <div className="neo-brutal bg-pastel-blue p-8 text-center">
          <p className="font-bold text-xl">No books found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default Landing;