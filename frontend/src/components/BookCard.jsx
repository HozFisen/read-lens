// src/components/BookCard.jsx
import { useNavigate } from 'react-router';
import { BookOpen } from 'lucide-react';

const BookCard = ({ book }) => {
  const navigate = useNavigate();

  // Safe defaults for book properties
  const bookId = book?.olid || `temp-${Math.random().toString(36).substr(2, 9)}`;
  const bookTitle = book?.title || 'Untitled Book';
  const bookAuthor = book?.author || 'Unknown Author';
  const bookYear = book?.publishYear || book?.year || null;
  const coverUrl = book?.coverUrl || book?.cover_url || null;

  const colors = ['pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-purple', 'pastel-orange', 'pastel-yellow'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const handleClick = () => {
    if (bookId) {
      navigate(`/book/${bookId}`);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`neo-brutal bg-${randomColor} p-6 cursor-pointer neo-brutal-hover`}
    >
      <div className="flex flex-col h-full">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={bookTitle}
            className="w-full h-68 object-cover border-4 border-black mb-4"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        <div className={`w-full h-48 bg-white border-4 border-black mb-4 items-center justify-center ${coverUrl ? 'hidden' : 'flex'}`}>
          <BookOpen className="w-16 h-16 text-gray-400" />
        </div>
        
        <h3 className="font-black text-xl mb-2 line-clamp-2">
          {bookTitle}
        </h3>
        
        <p className="font-bold text-sm text-gray-700 mb-1">
          {bookAuthor}
        </p>
        
        {bookYear && (
          <p className="text-sm text-gray-600 font-semibold">
            {bookYear}
          </p>
        )}
      </div>
    </div>
  );
};

export default BookCard;