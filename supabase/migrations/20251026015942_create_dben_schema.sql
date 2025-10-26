/*
  # Decentralized Book Exchange Network Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique, required)
      - `full_name` (text)
      - `bio` (text)
      - `location_lat` (numeric)
      - `location_lng` (numeric)
      - `location_name` (text)
      - `reputation_score` (integer, default 0)
      - `total_exchanges` (integer, default 0)
      - `avatar_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `books`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references profiles)
      - `title` (text, required)
      - `author` (text, required)
      - `isbn` (text)
      - `genre` (text)
      - `condition` (text: excellent, good, fair, poor)
      - `description` (text)
      - `cover_image_url` (text)
      - `availability_type` (text: lend, swap, giveaway)
      - `is_available` (boolean, default true)
      - `location_lat` (numeric)
      - `location_lng` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `exchanges`
      - `id` (uuid, primary key)
      - `book_id` (uuid, references books)
      - `requester_id` (uuid, references profiles)
      - `owner_id` (uuid, references profiles)
      - `status` (text: pending, accepted, completed, cancelled)
      - `exchange_type` (text: lend, swap, giveaway)
      - `swap_book_id` (uuid, references books, nullable)
      - `message` (text)
      - `qr_code` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `completed_at` (timestamptz)
    
    - `ratings`
      - `id` (uuid, primary key)
      - `exchange_id` (uuid, references exchanges)
      - `rater_id` (uuid, references profiles)
      - `rated_id` (uuid, references profiles)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can read all profiles but only update their own
    - Users can manage their own books
    - Users can view all available books
    - Users can manage exchanges they're involved in
    - Users can create ratings for completed exchanges
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  bio text,
  location_lat numeric,
  location_lng numeric,
  location_name text,
  reputation_score integer DEFAULT 0,
  total_exchanges integer DEFAULT 0,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  isbn text,
  genre text,
  condition text CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  description text,
  cover_image_url text,
  availability_type text CHECK (availability_type IN ('lend', 'swap', 'giveaway')) NOT NULL,
  is_available boolean DEFAULT true,
  location_lat numeric,
  location_lng numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exchanges table
CREATE TABLE IF NOT EXISTS exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')) DEFAULT 'pending',
  exchange_type text CHECK (exchange_type IN ('lend', 'swap', 'giveaway')) NOT NULL,
  swap_book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  message text,
  qr_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid REFERENCES exchanges(id) ON DELETE CASCADE NOT NULL,
  rater_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rated_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(exchange_id, rater_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Books policies
CREATE POLICY "Anyone can view available books"
  ON books FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own books"
  ON books FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own books"
  ON books FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Exchanges policies
CREATE POLICY "Users can view exchanges they're involved in"
  ON exchanges FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create exchange requests"
  ON exchanges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update exchanges they're involved in"
  ON exchanges FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = owner_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = owner_id);

-- Ratings policies
CREATE POLICY "Anyone can view ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ratings for their exchanges"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM exchanges
      WHERE exchanges.id = exchange_id
      AND exchanges.status = 'completed'
      AND (exchanges.requester_id = auth.uid() OR exchanges.owner_id = auth.uid())
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_owner ON books(owner_id);
CREATE INDEX IF NOT EXISTS idx_books_available ON books(is_available);
CREATE INDEX IF NOT EXISTS idx_books_location ON books(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_exchanges_requester ON exchanges(requester_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_owner ON exchanges(owner_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_book ON exchanges(book_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated ON ratings(rated_id);