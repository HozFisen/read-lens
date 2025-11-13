// src/components/BookCard.jsx
import { useNavigate } from 'react-router';
import { BookOpen } from 'lucide-react';

const BookCard = ({ book }) => {
  const navigate = useNavigate();

  const colors = ['pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-purple', 'pastel-orange', 'pastel-yellow'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const handleClick = () => {
    navigate(`/book/${book.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className={`neo-brutal bg-${randomColor} p-6 cursor-pointer neo-brutal-hover`}
    >
      <div className="flex flex-col h-full">
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={book.title}
            className="w-full h-48 object-cover border-4 border-black mb-4"
          />
        ) : (
          <div className="w-full h-48 bg-white border-4 border-black mb-4 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        <h3 className="font-black text-xl mb-2 line-clamp-2">
          {book.title}
        </h3>
        
        <p className="font-bold text-sm text-gray-700 mb-1">
          {book.author || 'Unknown Author'}
        </p>
        
        {book.publishYear && (
          <p className="text-sm text-gray-600 font-semibold">
            {book.publishYear}
          </p>
        )}
      </div>
    </div>
  );
};

export default BookCard;