import { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase, Exchange } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ExchangeWithDetails = Exchange & {
  book: { title: string; author: string };
  requester: { username: string; full_name?: string };
  owner: { username: string; full_name?: string };
};

export default function ExchangesPage() {
  const { profile } = useAuth();
  const [exchanges, setExchanges] = useState<ExchangeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    if (profile) {
      loadExchanges();
    }
  }, [profile, activeTab]);

  const loadExchanges = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const query = supabase
        .from('exchanges')
        .select(`
          *,
          book:books!exchanges_book_id_fkey(title, author),
          requester:profiles!exchanges_requester_id_fkey(username, full_name),
          owner:profiles!exchanges_owner_id_fkey(username, full_name)
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'received') {
        query.eq('owner_id', profile.id);
      } else {
        query.eq('requester_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setExchanges(data || []);
    } catch (err) {
      console.error('Error loading exchanges:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateExchangeStatus = async (
    exchangeId: string,
    status: Exchange['status']
  ) => {
    try {
      const { error } = await supabase
        .from('exchanges')
        .update({ status })
        .eq('id', exchangeId);

      if (error) throw error;
      loadExchanges();
    } catch (err) {
      console.error('Error updating exchange:', err);
    }
  };

  const getStatusColor = (status: Exchange['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Exchange['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <MessageCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exchanges</h1>
          <p className="text-gray-600">Manage your book exchange requests</p>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'received'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Received Requests
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'sent'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sent Requests
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : exchanges.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  {activeTab === 'received'
                    ? 'No exchange requests received yet'
                    : 'No exchange requests sent yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {exchanges.map((exchange) => (
                  <div
                    key={exchange.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {exchange.book.title}
                        </h3>
                        <p className="text-gray-600 text-sm">{exchange.book.author}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          exchange.status
                        )} flex items-center gap-1`}
                      >
                        {getStatusIcon(exchange.status)}
                        {exchange.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">
                        {activeTab === 'received' ? 'From' : 'To'}:
                      </span>{' '}
                      {activeTab === 'received'
                        ? exchange.requester.full_name || exchange.requester.username
                        : exchange.owner.full_name || exchange.owner.username}
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Type:</span>{' '}
                      <span className="capitalize">{exchange.exchange_type}</span>
                    </div>

                    {exchange.message && (
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <p className="text-sm text-gray-700">{exchange.message}</p>
                      </div>
                    )}

                    {activeTab === 'received' && exchange.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateExchangeStatus(exchange.id, 'accepted')}
                          className="flex-1 bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateExchangeStatus(exchange.id, 'cancelled')}
                          className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {exchange.status === 'accepted' && (
                      <button
                        onClick={() => updateExchangeStatus(exchange.id, 'completed')}
                        className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
