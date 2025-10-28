-- ============================================
-- Shira Micro-Drama Platform - Database Schema
-- ============================================
-- This schema creates all tables needed for the demo
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SERIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  title_en VARCHAR(255),
  description TEXT NOT NULL,
  description_en TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  poster_url TEXT NOT NULL,
  logo_url TEXT,
  trailer_url TEXT NOT NULL,
  genres TEXT[] NOT NULL DEFAULT '{}',
  release_date DATE NOT NULL,
  total_episodes INTEGER NOT NULL DEFAULT 0,
  free_episodes_count INTEGER NOT NULL DEFAULT 10,
  season_pass_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'ILS',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('coming_soon', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster slug lookups
CREATE INDEX idx_series_slug ON series(slug);
CREATE INDEX idx_series_status ON series(status);

-- ============================================
-- EPISODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_en VARCHAR(255),
  description TEXT,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  is_free BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(series_id, episode_number)
);

-- Indexes for faster queries
CREATE INDEX idx_episodes_series ON episodes(series_id);
CREATE INDEX idx_episodes_number ON episodes(series_id, episode_number);
CREATE INDEX idx_episodes_free ON episodes(is_free);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, series_id)
);

-- Indexes for faster queries
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_series ON favorites(series_id);

-- ============================================
-- WATCH HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  last_position INTEGER NOT NULL DEFAULT 0, -- in seconds
  completed BOOLEAN NOT NULL DEFAULT false,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, episode_id)
);

-- Indexes for faster queries
CREATE INDEX idx_watch_history_user ON watch_history(user_id);
CREATE INDEX idx_watch_history_episode ON watch_history(episode_id);
CREATE INDEX idx_watch_history_series ON watch_history(series_id);
CREATE INDEX idx_watch_history_watched_at ON watch_history(watched_at DESC);

-- ============================================
-- PURCHASES TABLE (Season Pass)
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'ILS',
  transaction_id VARCHAR(255) NOT NULL,
  invoice_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'refunded')),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = lifetime access
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_series ON purchases(series_id);
CREATE INDEX idx_purchases_transaction ON purchases(transaction_id);
CREATE INDEX idx_purchases_status ON purchases(status);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON series
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watch_history_updated_at BEFORE UPDATE ON watch_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Series: Public read access
CREATE POLICY "Series are viewable by everyone" ON series
    FOR SELECT USING (true);

-- Episodes: Public read access
CREATE POLICY "Episodes are viewable by everyone" ON episodes
    FOR SELECT USING (true);

-- Users: Users can view and update their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Favorites: Users can manage their own favorites
CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Watch History: Users can manage their own watch history
CREATE POLICY "Users can view own watch history" ON watch_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add own watch history" ON watch_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch history" ON watch_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Purchases: Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON purchases
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Note: Create these buckets in Supabase Storage UI:
-- 1. 'videos' - for video files (make public)
-- 2. 'images' - for posters, thumbnails, logos (make public)

-- ============================================
-- DEMO DATA - 3 Series with 15 Episodes Each
-- ============================================

-- Series 1: Urban Dreams (דרמה עירונית)
INSERT INTO series (id, title, title_en, description, description_en, slug, poster_url, logo_url, trailer_url, genres, release_date, total_episodes, free_episodes_count, season_pass_price, currency, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'חלומות עירוניים',
  'Urban Dreams',
  'סדרת דרמה מרתקת על חיי העיר המודרנית, חלומות גדולים, וקשרים אנושיים מורכבים. עקבו אחרי הגיבורים שלנו בדרכם למימוש עצמי בלב תל אביב הגדולה.',
  'A captivating drama series about modern city life, big dreams, and complex human relationships. Follow our heroes on their journey to self-fulfillment in the heart of greater Tel Aviv.',
  'urban-dreams',
  '/images/series/urban-dreams-poster.jpg',
  '/images/series/urban-dreams-logo.png',
  '/videos/trailers/urban-dreams-trailer.mp4',
  ARRAY['דרמה', 'רומנטיקה', 'עירוני'],
  '2025-01-15',
  15,
  10,
  29.90,
  'ILS',
  'active'
);

-- Series 2: Love & Coffee (אהבה וקפה)
INSERT INTO series (id, title, title_en, description, description_en, slug, poster_url, logo_url, trailer_url, genres, release_date, total_episodes, free_episodes_count, season_pass_price, currency, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'אהבה וקפה',
  'Love & Coffee',
  'קומדיה רומנטית מתוקה על בית קפה קטן בשכונה, הלקוחות הקבועים שלו, והסיפורים הקטנים שמשנים חיים. כל כוס קפה מביאה איתה סיפור חדש.',
  'A sweet romantic comedy about a small neighborhood cafe, its regular customers, and the small stories that change lives. Every cup of coffee brings a new story.',
  'love-and-coffee',
  '/images/series/love-coffee-poster.jpg',
  '/images/series/love-coffee-logo.png',
  '/videos/trailers/love-coffee-trailer.mp4',
  ARRAY['רומנטיקה', 'קומדיה', 'דרמה'],
  '2025-02-01',
  15,
  10,
  29.90,
  'ILS',
  'active'
);

-- Series 3: Tech Life (חיי היי-טק)
INSERT INTO series (id, title, title_en, description, description_en, slug, poster_url, logo_url, trailer_url, genres, release_date, total_episodes, free_episodes_count, season_pass_price, currency, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'חיי היי-טק',
  'Tech Life',
  'סדרה קומית על עולם ההיי-טק הישראלי, סטארט-אפים מטורפים, והאנשים המיוחדים שמנסים לשנות את העולם (או לפחות לעשות אקזיט). משרדי היי-טק כמו שלא הכרתם.',
  'A comedic series about Israeli high-tech world, crazy startups, and the special people trying to change the world (or at least make an exit). High-tech offices like you have never known.',
  'tech-life',
  '/images/series/tech-life-poster.jpg',
  '/images/series/tech-life-logo.png',
  '/videos/trailers/tech-life-trailer.mp4',
  ARRAY['קומדיה', 'טכנולוגיה', 'עסקים'],
  '2025-02-15',
  15,
  10,
  29.90,
  'ILS',
  'active'
);

-- ============================================
-- EPISODES FOR SERIES 1: Urban Dreams
-- ============================================
-- Episodes 1-10 are FREE, 11-15 are PREMIUM

INSERT INTO episodes (series_id, episode_number, title, title_en, description, thumbnail_url, video_url, duration, is_free)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 1, 'התחלה חדשה', 'New Beginning', 'מיה עוברת לתל אביב עם חלומות גדולים ותיק קטן', '/images/episodes/urban-dreams-ep01.jpg', '/videos/urban-dreams/ep01.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440001', 2, 'דירה ראשונה', 'First Apartment', 'חיפוש הדירה הופך להרפתקה בלתי צפויה', '/images/episodes/urban-dreams-ep02.jpg', '/videos/urban-dreams/ep02.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440001', 3, 'יום ראשון בעבודה', 'First Day', 'היום הראשון במשרד מביא הפתעות', '/images/episodes/urban-dreams-ep03.jpg', '/videos/urban-dreams/ep03.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440001', 4, 'חברים חדשים', 'New Friends', 'מיה פוגשת את שכניה המיוחדים', '/images/episodes/urban-dreams-ep04.jpg', '/videos/urban-dreams/ep04.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440001', 5, 'אהבה במעלית', 'Love in Elevator', 'תקלה במעלית יוצרת מפגש גורלי', '/images/episodes/urban-dreams-ep05.jpg', '/videos/urban-dreams/ep05.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440001', 6, 'פרויקט גדול', 'Big Project', 'מיה מקבלת אחריות על פרויקט חשוב', '/images/episodes/urban-dreams-ep06.jpg', '/videos/urban-dreams/ep06.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440001', 7, 'לילה בעיר', 'Night Out', 'ערב יציאה הופך לבלתי נשכח', '/images/episodes/urban-dreams-ep07.jpg', '/videos/urban-dreams/ep07.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440001', 8, 'משבר זהות', 'Identity Crisis', 'מיה מפקפקת בבחירותיה', '/images/episodes/urban-dreams-ep08.jpg', '/videos/urban-dreams/ep08.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440001', 9, 'סוד מהעבר', 'Secret from Past', 'סוד מהעבר עולה על פני השטח', '/images/episodes/urban-dreams-ep09.jpg', '/videos/urban-dreams/ep09.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440001', 10, 'החלטה גדולה', 'Big Decision', 'מיה עומדת בפני בחירה קשה', '/images/episodes/urban-dreams-ep10.jpg', '/videos/urban-dreams/ep10.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440001', 11, 'פרק 11 - פרמיום', 'Episode 11 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/urban-dreams-ep11.jpg', '/videos/urban-dreams/ep11.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440001', 12, 'פרק 12 - פרמיום', 'Episode 12 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/urban-dreams-ep12.jpg', '/videos/urban-dreams/ep12.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440001', 13, 'פרק 13 - פרמיום', 'Episode 13 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/urban-dreams-ep13.jpg', '/videos/urban-dreams/ep13.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440001', 14, 'פרק 14 - פרמיום', 'Episode 14 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/urban-dreams-ep14.jpg', '/videos/urban-dreams/ep14.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440001', 15, 'פרק 15 - סיום העונה', 'Episode 15 - Season Finale', 'סיום העונה המרגש - זמין לבעלי מנוי', '/images/episodes/urban-dreams-ep15.jpg', '/videos/urban-dreams/ep15.mp4', 180, false);

-- ============================================
-- EPISODES FOR SERIES 2: Love & Coffee
-- ============================================

INSERT INTO episodes (series_id, episode_number, title, title_en, description, thumbnail_url, video_url, duration, is_free)
VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 1, 'כוס ראשונה', 'First Cup', 'דן פותח את בית הקפה החדש שלו', '/images/episodes/love-coffee-ep01.jpg', '/videos/love-coffee/ep01.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440002', 2, 'הלקוחה הסודית', 'Mystery Customer', 'לקוחה מסתורית מגיעה כל יום בדיוק באותה שעה', '/images/episodes/love-coffee-ep02.jpg', '/videos/love-coffee/ep02.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440002', 3, 'מתכון סודי', 'Secret Recipe', 'דן מנסה ליצור את המשקה המושלם', '/images/episodes/love-coffee-ep03.jpg', '/videos/love-coffee/ep03.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440002', 4, 'פגישה עיוורת', 'Blind Date', 'בית הקפה הופך לזירת פגישות היכרות', '/images/episodes/love-coffee-ep04.jpg', '/videos/love-coffee/ep04.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440002', 5, 'תחרות הבריסטה', 'Barista Competition', 'דן משתתף בתחרות ארצית', '/images/episodes/love-coffee-ep05.jpg', '/videos/love-coffee/ep05.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440002', 6, 'מכתב אהבה', 'Love Letter', 'מישהו משאיר מכתבי אהבה בבית הקפה', '/images/episodes/love-coffee-ep06.jpg', '/videos/love-coffee/ep06.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440002', 7, 'יום רע', 'Bad Day', 'כל דבר שיכול להשתבש משתבש', '/images/episodes/love-coffee-ep07.jpg', '/videos/love-coffee/ep07.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440002', 8, 'שותף עסקי', 'Business Partner', 'הצעה לשותפות מפתה', '/images/episodes/love-coffee-ep08.jpg', '/videos/love-coffee/ep08.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440002', 9, 'חגיגת יום הולדת', 'Birthday Party', 'בית הקפה עורך מסיבה מיוחדת', '/images/episodes/love-coffee-ep09.jpg', '/videos/love-coffee/ep09.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440002', 10, 'הודאה', 'Confession', 'דן מודה ברגשותיו', '/images/episodes/love-coffee-ep10.jpg', '/videos/love-coffee/ep10.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440002', 11, 'פרק 11 - פרמיום', 'Episode 11 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/love-coffee-ep11.jpg', '/videos/love-coffee/ep11.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440002', 12, 'פרק 12 - פרמיום', 'Episode 12 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/love-coffee-ep12.jpg', '/videos/love-coffee/ep12.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440002', 13, 'פרק 13 - פרמיום', 'Episode 13 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/love-coffee-ep13.jpg', '/videos/love-coffee/ep13.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440002', 14, 'פרק 14 - פרמיום', 'Episode 14 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/love-coffee-ep14.jpg', '/videos/love-coffee/ep14.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440002', 15, 'פרק 15 - סיום העונה', 'Episode 15 - Season Finale', 'סיום העונה המרגש - זמין לבעלי מנוי', '/images/episodes/love-coffee-ep15.jpg', '/videos/love-coffee/ep15.mp4', 180, false);

-- ============================================
-- EPISODES FOR SERIES 3: Tech Life
-- ============================================

INSERT INTO episodes (series_id, episode_number, title, title_en, description, thumbnail_url, video_url, duration, is_free)
VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 1, 'הפיץ' הגדול', 'The Big Pitch', 'יום הפיצ'ים של הסטארט-אפ', '/images/episodes/tech-life-ep01.jpg', '/videos/tech-life/ep01.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440003', 2, 'באג קריטי', 'Critical Bug', 'באג דרמטי יום לפני השקה', '/images/episodes/tech-life-ep02.jpg', '/videos/tech-life/ep02.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440003', 3, 'גיוס עובדים', 'Hiring', 'חיפוש המפתח המושלם', '/images/episodes/tech-life-ep03.jpg', '/videos/tech-life/ep03.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440003', 4, 'משא ומתן', 'Negotiation', 'משא ומתן עם משקיעים', '/images/episodes/tech-life-ep04.jpg', '/videos/tech-life/ep04.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440003', 5, 'חוויית משתמש', 'UX Crisis', 'משבר בעיצוב המוצר', '/images/episodes/tech-life-ep05.jpg', '/videos/tech-life/ep05.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440003', 6, 'רווחה במשרד', 'Office Perks', 'ניסיון ליצור תרבות ארגונית', '/images/episodes/tech-life-ep06.jpg', '/videos/tech-life/ep06.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440003', 7, 'תקיפת סייבר', 'Cyber Attack', 'התקפת האקרים', '/images/episodes/tech-life-ep07.jpg', '/videos/tech-life/ep07.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440003', 8, 'סבב גיוס', 'Funding Round', 'סבב השקעות גורלי', '/images/episodes/tech-life-ep08.jpg', '/videos/tech-life/ep08.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440003', 9, 'מתחרה חדש', 'New Competitor', 'מתחרה מסוכן נכנס לשוק', '/images/episodes/tech-life-ep09.jpg', '/videos/tech-life/ep09.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440003', 10, 'הרגע הגדול', 'Big Moment', 'השקת הגרסה הרשמית', '/images/episodes/tech-life-ep10.jpg', '/videos/tech-life/ep10.mp4', 180, true),
  ('550e8400-e29b-41d4-a716-446655440003', 11, 'פרק 11 - פרמיום', 'Episode 11 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/tech-life-ep11.jpg', '/videos/tech-life/ep11.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440003', 12, 'פרק 12 - פרמיום', 'Episode 12 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/tech-life-ep12.jpg', '/videos/tech-life/ep12.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440003', 13, 'פרק 13 - פרמיום', 'Episode 13 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/tech-life-ep13.jpg', '/videos/tech-life/ep13.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440003', 14, 'פרק 14 - פרמיום', 'Episode 14 - Premium', 'ההמשך המרתק - זמין לבעלי מנוי', '/images/episodes/tech-life-ep14.jpg', '/videos/tech-life/ep14.mp4', 180, false),
  ('550e8400-e29b-41d4-a716-446655440003', 15, 'פרק 15 - סיום העונה', 'Episode 15 - Season Finale', 'סיום העונה המרגש - זמין לבעלי מנוי', '/images/episodes/tech-life-ep15.jpg', '/videos/tech-life/ep15.mp4', 180, false);

-- ============================================
-- CREATE DEMO USER
-- ============================================
INSERT INTO users (id, email, name, phone)
VALUES (
  '550e8400-e29b-41d4-a716-446655440999',
  'demo@shira.app',
  'משתמש דמו',
  '0501234567'
);

-- ============================================
-- VIEWS FOR ANALYTICS (Optional)
-- ============================================

-- View: Popular Series
CREATE OR REPLACE VIEW popular_series AS
SELECT 
  s.id,
  s.title,
  s.slug,
  COUNT(DISTINCT wh.user_id) as unique_viewers,
  SUM(e.views) as total_views
FROM series s
LEFT JOIN episodes e ON s.id = e.series_id
LEFT JOIN watch_history wh ON s.id = wh.series_id
GROUP BY s.id, s.title, s.slug
ORDER BY total_views DESC;

-- View: User Activity Summary
CREATE OR REPLACE VIEW user_activity AS
SELECT 
  u.id,
  u.email,
  u.name,
  COUNT(DISTINCT wh.series_id) as series_watched,
  COUNT(DISTINCT f.series_id) as favorites_count,
  COUNT(DISTINCT p.series_id) as purchases_count,
  MAX(wh.watched_at) as last_watched_at
FROM users u
LEFT JOIN watch_history wh ON u.id = wh.user_id
LEFT JOIN favorites f ON u.id = f.user_id
LEFT JOIN purchases p ON u.id = p.user_id
GROUP BY u.id, u.email, u.name;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'Database schema created successfully!' as status,
       (SELECT COUNT(*) FROM series) as total_series,
       (SELECT COUNT(*) FROM episodes) as total_episodes,
       (SELECT COUNT(*) FROM users) as total_users;
