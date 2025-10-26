import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  full_name?: string;
  bio?: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  reputation_score: number;
  total_exchanges: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Book = {
  id: string;
  owner_id: string;
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  description?: string;
  cover_image_url?: string;
  availability_type: 'lend' | 'swap' | 'giveaway';
  is_available: boolean;
  location_lat?: number;
  location_lng?: number;
  created_at: string;
  updated_at: string;
};

export type Exchange = {
  id: string;
  book_id: string;
  requester_id: string;
  owner_id: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  exchange_type: 'lend' | 'swap' | 'giveaway';
  swap_book_id?: string;
  message?: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
};

export type Rating = {
  id: string;
  exchange_id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
  comment?: string;
  created_at: string;
};
