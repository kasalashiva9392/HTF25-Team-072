import { Book } from '../lib/supabase';
import { MapPin, BookOpen, Tag } from 'lucide-react';

type BookCardProps = {
  book: Book & { owner?: { username: string; reputation_score: number } };
  onSelect: (book: Book) => void;
};

export default function BookCard({ book, onSelect }: BookCardProps) {
  const availabilityColors = {
    lend: 'bg-blue-100 text-blue-800',
    swap: 'bg-amber-100 text-amber-800',
    giveaway: 'bg-emerald-100 text-emerald-800',
  };

  const conditionLabels = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  };

  return (
    <div
      onClick={() => onSelect(book)}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="w-16 h-16 text-slate-400" />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{book.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${availabilityColors[book.availability_type]} whitespace-nowrap ml-2`}>
            {book.availability_type}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3">{book.author}</p>

        {book.genre && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <Tag className="w-3 h-3" />
            <span>{book.genre}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Nearby
          </span>
          <span>Condition: {conditionLabels[book.condition]}</span>
        </div>

        {book.owner && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">@{book.owner.username}</span>
              <span className="text-emerald-600 font-medium">
                {book.owner.reputation_score} pts
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
