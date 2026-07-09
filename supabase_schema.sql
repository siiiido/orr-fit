-- Drop existing tables if they exist
DROP TABLE IF EXISTS runs;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS settings;

-- 1. Members Table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('M', 'F')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Runs Table
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  distance NUMERIC(5,2) NOT NULL CHECK (distance > 0),
  duration INTEGER NOT NULL CHECK (duration > 0), -- in seconds
  notes TEXT,
  run_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Settings Table
CREATE TABLE settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable Realtime for all tables
alter publication supabase_realtime add table members;
alter publication supabase_realtime add table runs;
alter publication supabase_realtime add table settings;

-- Insert Initial Settings
INSERT INTO settings (key, value) VALUES ('monthly_target', '{"distance": 2000}') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES
  ('monthly_challenge', '{"tiers":[{"km":30,"reward_days":3},{"km":50,"reward_days":7},{"km":80,"reward_days":14}]}')
ON CONFLICT (key) DO NOTHING;

-- Insert Mock Members
INSERT INTO members (id, name, gender) VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '김철수', 'M'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '이영희', 'F'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '박지민', 'M'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', '최민수', 'M'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', '이지혜', 'F');

-- Insert Mock Runs
INSERT INTO runs (member_id, distance, duration, notes, run_date) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 12.5, 3900, '나이키 런클럽 인증', '2026-06-25'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 8.2, 2706, '스트라바 인증', '2026-06-26'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 15.0, 4800, '야외 러닝 완료', '2026-06-27'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 5.0, 1500, '런닝머신 페이스조절', '2026-06-28'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 10.0, 3200, '주말 아침 조깅', '2026-06-28');

-- Migration: Add nickname and workout type columns
ALTER TABLE members ADD COLUMN nickname VARCHAR(10);
ALTER TABLE runs ADD COLUMN type VARCHAR(20) DEFAULT 'outdoor' NOT NULL;
ALTER TABLE runs ADD CONSTRAINT check_run_type CHECK (type IN ('treadmill', 'outdoor', 'stairmaster', 'cycling', 'orr_run'));

-- 4. Monthly Rankings (Hall of Fame Stamps) Table
CREATE TABLE monthly_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  year_month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM' (e.g. '2026-07')
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 6),
  distance NUMERIC(6,2) NOT NULL CHECK (distance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT unique_year_month_rank UNIQUE (year_month, rank),
  CONSTRAINT unique_member_year_month UNIQUE (member_id, year_month)
);

-- Enable Realtime for monthly_rankings
alter publication supabase_realtime add table monthly_rankings;

