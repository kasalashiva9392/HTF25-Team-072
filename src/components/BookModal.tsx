import { useState } from 'react';
import { X, MapPin, User, Star, MessageCircle } from 'lucide-react';
import { Book } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type BookModalProps = {
  book: Book & { owner?: { username: string; reputation_score: number; full_name?: string } };
  onClose: () => void;
  onRequestExchange?: () => void;
};

export default function BookModal({ book, onClose, onRequestExchange }: BookModalProps) {
  const { user, profile } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequestExchange = async () => {
    if (!user || !profile) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('exchanges').insert({
        book_id: book.id,
        requester_id: profile.id,
        owner_id: book.owner_id,
        exchange_type: book.availability_type,
        message: message || undefined,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onRequestExchange?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error requesting exchange:', err);
    } finally {
      setLoading(false);
    }
  };

  const conditionColors = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    fair: 'text-yellow-600',
    poor: 'text-red-600',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{book.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="aspect-[2/3] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg overflow-hidden">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📚</div>
                      <div className="text-sm">No cover</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Author</h3>
                <p className="text-gray-900">{book.author}</p>
              </div>

              {book.genre && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Genre</h3>
                  <p className="text-gray-900">{book.genre}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-700">Condition</h3>
                <p className={`${conditionColors[book.condition]} font-medium capitalize`}>
                  {book.condition}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700">Availability</h3>
                <p className="text-gray-900 capitalize">{book.availability_type}</p>
              </div>

              {book.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Description</h3>
                  <p className="text-gray-900">{book.description}</p>
                </div>
              )}

              {book.owner && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Owner</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {book.owner.full_name || book.owner.username}
                        </p>
                        <p className="text-sm text-gray-500">@{book.owner.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{book.owner.reputation_score}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {user && book.owner_id !== profile?.id && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              {!success ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Request Exchange</h3>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a message to the owner (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleRequestExchange}
                    disabled={loading}
                    className="mt-3 w-full bg-emerald-600 text-white py-3 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {loading ? 'Sending Request...' : `Request to ${book.availability_type}`}
                  </button>
                </>
              ) : (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-md text-center">
                  <p className="font-semibold">Request sent successfully!</p>
                  <p className="text-sm">The owner will be notified.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
