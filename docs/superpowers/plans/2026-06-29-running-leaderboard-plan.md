# ORR FIT Running Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비개발자 직원이 비밀번호로 진입하여 회원의 러닝 기록을 추가하고, 회원들은 본인의 모바일 폰으로 실시간 순위와 대시보드를 조회하는 스포츠 다크 테마의 Single-Page 웹 앱을 구축합니다.

**Architecture:** React + Vite + TypeScript를 프론트엔드로 삼고, Supabase를 실시간 DB로 연동하여 데이터가 입력되는 즉시 모든 기기에 반영되도록 설계합니다. Tailwind CSS를 활용해 스포티 오렌지 다크 테마를 일관성 있게 디자인합니다.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, `@supabase/supabase-js`, `@phosphor-icons/react`, Lucide React (또는 Phosphor Icons)

## Global Constraints
- **Primary Color:** Vibrant Orange (`#FF6B00`)
- **Theme:** Dark Mode by default (`#0B0C0E` background)
- **Font:** Pretendard
- **Database:** Supabase (Realtime enabled on `runs` and `members` tables)
- **Security:** Passcode (`0000` or custom env) for Admin Panel access

---

### Task 1: Project Scaffolding & Tailwind CSS Setup

**Files:**
- Create: `package.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `vite.config.ts`
- Create: `src/index.css`
- Create: `src/main.tsx`
- Create: `index.html`

**Interfaces:**
- Produces: React + Vite boilerplate with Tailwind CSS configured and Pretendard font loaded.

- [ ] **Step 1: Scaffold Vite project in workspace root**
  Since Vite create-vite was checked, we will initialize the project.
  Run:
  ```powershell
  npx -y create-vite@latest temp-project --template react-ts --no-interactive
  # Move files to root (excluding conflicting folders)
  Robocopy temp-project . /E /XD .git .agents
  Remove-Item -Recurse -Force temp-project
  ```

- [ ] **Step 2: Install required packages**
  Run:
  ```powershell
  npm install @supabase/supabase-js @phosphor-icons/react lucide-react classnames
  npm install -D tailwindcss postcss autoprefixer @types/react @types/react-dom
  ```

- [ ] **Step 3: Initialize Tailwind Config**
  Create/Overwrite: `c:\Users\home\github\orr-fit\tailwind.config.js`
  ```javascript
  /** @type {import('tailwindcss').Config} */
  export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          brand: {
            orange: '#FF6B00',
            darkBg: '#0B0C0E',
            darkSurface: '#121318',
            darkCard: 'rgba(25, 27, 34, 0.7)',
            gold: '#FFC700',
            silver: '#A0AEC0',
            bronze: '#ED8936',
          }
        },
        fontFamily: {
          sans: ['Pretendard', '-apple-system', 'sans-serif'],
        },
        boxShadow: {
          orangeGlow: '0 0 15px rgba(255, 107, 0, 0.35)',
        }
      },
    },
    plugins: [],
  }
  ```

- [ ] **Step 4: Configure PostCSS**
  Create: `c:\Users\home\github\orr-fit\postcss.config.js`
  ```javascript
  export default {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  }
  ```

- [ ] **Step 5: Setup main CSS & Fonts**
  Modify: `c:\Users\home\github\orr-fit\src/index.css`
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  body {
    @apply bg-brand-darkBg text-gray-100 font-sans antialiased;
    margin: 0;
  }

  /* Custom scrollbar for premium feel */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #0B0C0E;
  }
  ::-webkit-scrollbar-thumb {
    background: #FF6B00;
    border-radius: 3px;
  }
  ```

- [ ] **Step 6: Update index.html**
  Modify: `c:\Users\home\github\orr-fit\index.html` to load Pretendard font CDN and set title.
  ```html
  <!doctype html>
  <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>ORR FIT — 실시간 러닝 랭킹 대시보드</title>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
      />
    </head>
    <body class="bg-brand-darkBg text-gray-100">
      <div id="root"></div>
      <script type="module" src="/src/main.tsx"></script>
    </body>
  </html>
  ```

- [ ] **Step 7: Verify installation**
  Run compilation to make sure everything resolves:
  ```powershell
  npm run build
  ```
  Expected: Success without errors.

- [ ] **Step 8: Commit Setup**
  Run:
  ```powershell
  git add .
  git commit -m "chore: setup project scaffolding with vite + tailwind + pretendard"
  ```

---

### Task 2: Supabase Integration & Mock Schema

**Files:**
- Create: `supabase_schema.sql` (Save sql reference in workspace for user config)
- Create: `src/lib/supabase.ts`

**Interfaces:**
- Produces: `supabase` instance for db calls.
- Schema: `members`, `runs`, `settings` tables on Supabase.

- [ ] **Step 1: Save SQL Database Schema in root**
  Create: `c:\Users\home\github\orr-fit\supabase_schema.sql`
  ```sql
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
  ```

- [ ] **Step 2: Create Supabase Client Config**
  Create: `c:\Users\home\github\orr-fit\src/lib/supabase.ts`
  ```typescript
  import { createClient } from '@supabase/supabase-js';

  // Read environment variables (will fall back to empty strings for compilation, 
  // but users will enter their own credentials in .env file)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
  ```

- [ ] **Step 3: Create dotenv template**
  Create: `c:\Users\home\github\orr-fit\.env.example`
  ```
  VITE_SUPABASE_URL=your_supabase_project_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
  ```

- [ ] **Step 4: Commit DB client**
  Run:
  ```powershell
  git add supabase_schema.sql src/lib/supabase.ts .env.example
  git commit -m "feat: add supabase schema definition and client config template"
  ```

---

### Task 3: State Management & Realtime Sync Hook

**Files:**
- Create: `src/types/index.ts`
- Create: `src/hooks/useDashboardData.ts`

**Interfaces:**
- Consumes: `src/lib/supabase.ts`
- Produces: `useDashboardData` hook returning `members`, `runs`, `settings`, `isLoading`, `refetch`, and real-time state sync.

- [ ] **Step 1: Create TS types file**
  Create: `c:\Users\home\github\orr-fit\src/types/index.ts`
  ```typescript
  export interface Member {
    id: string;
    name: string;
    gender: 'M' | 'F';
    created_at: string;
  }

  export interface Run {
    id: string;
    member_id: string;
    distance: number; // in km
    duration: number; // in seconds
    notes?: string;
    run_date: string;
    created_at: string;
  }

  export interface GymSettings {
    monthly_target: number; // cumulative distance target in km
  }

  export interface LeaderboardEntry {
    memberId: string;
    name: string;
    gender: 'M' | 'F';
    totalDistance: number;
    totalRuns: number;
    averagePace: string; // format: MM'SS"
    totalDuration: number; // in seconds
    lastRunDate: string;
  }
  ```

- [ ] **Step 2: Implement state hook with real-time subscriptions**
  Create: `c:\Users\home\github\orr-fit\src/hooks/useDashboardData.ts`
  ```typescript
  import { useEffect, useState, useCallback } from 'react';
  import { supabase } from '../lib/supabase';
  import { Member, Run } from '../types';

  export const useDashboardData = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [runs, setRuns] = useState<Run[]>([]);
    const [monthlyTarget, setMonthlyTarget] = useState<number>(2000);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchData = useCallback(async () => {
      try {
        setIsLoading(true);
        
        // Fetch settings
        const { data: settingsData } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'monthly_target')
          .single();
        
        if (settingsData && settingsData.value) {
          setMonthlyTarget(settingsData.value.distance || 2000);
        }

        // Fetch members
        const { data: membersData } = await supabase
          .from('members')
          .select('*')
          .order('name', { ascending: true });

        if (membersData) {
          setMembers(membersData as Member[]);
        }

        // Fetch runs
        const { data: runsData } = await supabase
          .from('runs')
          .select('*')
          .order('run_date', { ascending: false });

        if (runsData) {
          setRuns(runsData.map(r => ({
            ...r,
            distance: Number(r.distance),
            duration: Number(r.duration)
          })) as Run[]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchData();

      // Subscribe to members channel
      const membersSubscription = supabase
        .channel('public:members')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
          fetchData();
        })
        .subscribe();

      // Subscribe to runs channel
      const runsSubscription = supabase
        .channel('public:runs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'runs' }, () => {
          fetchData();
        })
        .subscribe();

      // Subscribe to settings channel
      const settingsSubscription = supabase
        .channel('public:settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
          fetchData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(membersSubscription);
        supabase.removeChannel(runsSubscription);
        supabase.removeChannel(settingsSubscription);
      };
    }, [fetchData]);

    return {
      members,
      runs,
      monthlyTarget,
      isLoading,
      refetch: fetchData
    };
  };
  ```

- [ ] **Step 3: Commit hook**
  Run:
  ```powershell
  git add src/types/index.ts src/hooks/useDashboardData.ts
  git commit -m "feat: add types and custom hook for real-time dashboard data sync"
  ```

---

### Task 4: Layout Shell & Header Implementation

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/Header.tsx`

**Interfaces:**
- Consumes: `src/types` and `@phosphor-icons/react` (or `lucide-react`)
- Produces: Header bar containing title, global stats, and Admin locks. App shell rendering columns responsive layout.

- [ ] **Step 1: Create Header Component**
  Create: `c:\Users\home\github\orr-fit\src/components/Header.tsx`
  ```tsx
  import React from 'react';
  import { Flame, Lock, Unlock } from 'lucide-react';

  interface HeaderProps {
    totalDistance: number;
    activeCount: number;
    isAdmin: boolean;
    onAdminToggle: () => void;
  }

  export const Header: React.FC<HeaderProps> = ({
    totalDistance,
    activeCount,
    isAdmin,
    onAdminToggle,
  }) => {
    return (
      <header className="border-b border-brand-orange/10 bg-brand-darkSurface/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 md:px-8 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-brand-orange/20 p-2 rounded-xl border border-brand-orange/30 animate-pulse">
            <Flame className="w-6 h-6 text-brand-orange" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              ORR FIT <span className="text-brand-orange">RUNNING</span>
            </h1>
            <p className="text-xs text-gray-400 font-semibold hidden md:block">
              젬스톤피트니스 서면점 유산소 챌린지
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-gray-400 bg-brand-darkBg/60 px-4 py-2 rounded-xl border border-gray-800">
            <div className="text-center">
              <span className="block text-white font-black text-sm">{totalDistance.toFixed(1)} km</span>
              <span>총 누적 거리</span>
            </div>
            <div className="h-6 w-px bg-gray-800"></div>
            <div className="text-center">
              <span className="block text-white font-black text-sm">{activeCount} 명</span>
              <span>참여 회원</span>
            </div>
          </div>

          <button
            onClick={onAdminToggle}
            className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-xl text-xs md:text-sm font-bold border transition-all duration-300 ${
              isAdmin
                ? 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
                : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20 hover:bg-brand-orange/20 shadow-orangeGlow/20 shadow-sm'
            }`}
          >
            {isAdmin ? (
              <>
                <Unlock className="w-4 h-4" />
                <span className="hidden sm:inline">관리자 로그아웃</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">관리자 모드</span>
              </>
            )}
          </button>
        </div>
      </header>
    );
  };
  ```

- [ ] **Step 2: Commit Header**
  Run:
  ```powershell
  git add src/components/Header.tsx
  git commit -m "feat: implement header component with global stats and admin state control"
  ```

---

### Task 5: Statistics & Goal Progress (Left Column)

**Files:**
- Create: `src/components/GoalProgress.tsx`

**Interfaces:**
- Consumes: runs, monthlyTarget.
- Produces: Progress card showing total monthly target progress in a visually stunning radial/circular indicator, along with mini challenge completion lists.

- [ ] **Step 1: Implement GoalProgress Component**
  Create: `c:\Users\home\github\orr-fit\src/components/GoalProgress.tsx`
  ```tsx
  import React from 'react';
  import { Trophy, Target, Sparkles } from 'lucide-react';

  interface GoalProgressProps {
    currentDistance: number;
    targetDistance: number;
    weeklyChallengeCompleteCount: number;
  }

  export const GoalProgress: React.FC<GoalProgressProps> = ({
    currentDistance,
    targetDistance,
    weeklyChallengeCompleteCount,
  }) => {
    const percentage = Math.min(100, Math.round((currentDistance / targetDistance) * 100));
    
    // Circular SVG configurations
    const radius = 60;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col gap-6">
        {/* Monthly Goal Card */}
        <div className="bg-brand-darkSurface border border-brand-orange/10 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-orange" />
            월간 센터 공동 목표
          </h3>

          <div className="flex items-center justify-around my-4">
            {/* Circular Progress SVG */}
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-gray-800"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-brand-orange transition-all duration-1000 ease-out"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="block text-2xl font-black text-white">{percentage}%</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">달성도</span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-400">
              <span>현재 누적</span>
              <span>목표 거리</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black text-brand-orange">{currentDistance.toFixed(1)} km</span>
              <span className="text-sm font-bold text-white">{targetDistance} km</span>
            </div>
          </div>
        </div>

        {/* Weekly Challenge Card */}
        <div className="bg-brand-darkSurface border border-gray-800 p-6 rounded-2xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-gold" />
            주간 미니 챌린지
          </h3>
          <div className="border border-brand-gold/10 bg-brand-gold/5 p-4 rounded-xl mb-4">
            <span className="text-xs font-bold text-brand-gold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              이번 주 미션: 주간 10km 이상 완주하기!
            </span>
          </div>

          <div className="flex justify-between items-center bg-brand-darkBg/60 p-4 rounded-xl border border-gray-900">
            <div className="text-xs text-gray-400 font-semibold">
              <span className="block text-white text-base font-black">{weeklyChallengeCompleteCount} 명</span>
              챌린지 달성 완료
            </div>
            <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20">
              <Trophy className="w-6 h-6 text-brand-gold animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    );
  };
  ```

- [ ] **Step 2: Commit GoalProgress**
  Run:
  ```powershell
  git add src/components/GoalProgress.tsx
  git commit -m "feat: implement monthly target circular progress and weekly challenge components"
  ```

---

### Task 6: Hall of Fame & Leaderboard (Central Column)

**Files:**
- Create: `src/components/Leaderboard.tsx`

**Interfaces:**
- Consumes: leaderboard data (array of LeaderboardEntry), search query, callback to focus/highlight selected member.
- Produces: Visual Top-3 Podium podium blocks (1st gold, 2nd silver, 3rd bronze), a member search bar, and rank table from 4th place onwards.

- [ ] **Step 1: Implement Leaderboard Component**
  Create: `c:\Users\home\github\orr-fit\src/components/Leaderboard.tsx`
  ```tsx
  import React, { useState } from 'react';
  import { Search, Trophy, Medal, Star } from 'lucide-react';
  import { LeaderboardEntry } from '../types';

  interface LeaderboardProps {
    entries: LeaderboardEntry[];
  }

  export const Leaderboard: React.FC<LeaderboardProps> = ({ entries }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEntries = entries.filter((entry) =>
      entry.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const topThree = entries.slice(0, 3);
    const rest = filteredEntries.slice(3);

    // Arrange podium order: [2nd, 1st, 3rd]
    const podiumArrangement = [
      topThree[1] || null, // 2nd
      topThree[0] || null, // 1st
      topThree[2] || null, // 3rd
    ];

    return (
      <div className="flex flex-col gap-6">
        {/* Podium for top 3 */}
        <div className="bg-brand-darkSurface border border-brand-orange/5 p-6 rounded-2xl">
          <h3 className="text-lg font-black text-white text-center mb-6 uppercase tracking-wider flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-brand-gold" />
            Hall of Fame
          </h3>

          <div className="flex items-end justify-center gap-2 md:gap-4 pt-12 pb-2">
            {/* Podium Block Loop */}
            {podiumArrangement.map((entry, index) => {
              if (!entry) return <div key={index} className="flex-1"></div>;
              
              const isFirst = entry.memberId === topThree[0]?.memberId;
              const isSecond = entry.memberId === topThree[1]?.memberId;
              const isThird = entry.memberId === topThree[2]?.memberId;

              let podiumHeight = 'h-24';
              let badgeColor = 'bg-brand-silver';
              let textColor = 'text-brand-silver';
              let rankName = '2nd';
              let crownIcon = null;

              if (isFirst) {
                podiumHeight = 'h-36';
                badgeColor = 'bg-brand-gold';
                textColor = 'text-brand-gold';
                rankName = '1st';
                crownIcon = <Star className="w-5 h-5 text-brand-gold fill-brand-gold absolute -top-11 animate-pulse" />;
              } else if (isThird) {
                podiumHeight = 'h-20';
                badgeColor = 'bg-brand-bronze';
                textColor = 'text-brand-bronze';
                rankName = '3rd';
              }

              return (
                <div key={entry.memberId} className="flex flex-col items-center flex-1 relative group">
                  {crownIcon}
                  
                  {/* Member Name */}
                  <span className="text-sm font-black text-white text-center max-w-[90px] truncate mb-2 block">
                    {entry.name}
                  </span>
                  {/* Distance */}
                  <span className={`text-xs font-black ${textColor} mb-2 block`}>
                    {entry.totalDistance.toFixed(1)} km
                  </span>

                  {/* Visual Podium Base */}
                  <div
                    className={`w-full rounded-t-xl flex flex-col justify-center items-center shadow-lg border-t transition-all duration-500 ${podiumHeight} ${
                      isFirst
                        ? 'bg-brand-orange/20 border-brand-orange/40 shadow-orangeGlow/25'
                        : 'bg-brand-darkBg border-gray-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${badgeColor} flex items-center justify-center text-brand-darkBg font-black text-sm`}>
                      {rankName.substring(0, 1)}
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold mt-1">{entry.averagePace}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard list & search */}
        <div className="bg-brand-darkSurface border border-gray-800 p-6 rounded-2xl flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-base font-bold text-white">회원 순위 현황</h3>
            
            {/* Search Input */}
            <div className="relative w-full md:w-48">
              <input
                type="text"
                placeholder="회원 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-2 pl-9 text-xs focus:outline-none focus:border-brand-orange text-white"
              />
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-gray-400">
              <thead>
                <tr className="border-b border-gray-800 pb-2">
                  <th className="pb-2 text-center w-12">순위</th>
                  <th className="pb-2">이름</th>
                  <th className="pb-2 text-right">달린 횟수</th>
                  <th className="pb-2 text-right">평균 페이스</th>
                  <th className="pb-2 text-right text-white">누적 거리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {/* Display Top 3 in list too, for consistency */}
                {filteredEntries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  
                  let medalColor = '';
                  if (rank === 1) medalColor = 'text-brand-gold';
                  if (rank === 2) medalColor = 'text-brand-silver';
                  if (rank === 3) medalColor = 'text-brand-bronze';

                  return (
                    <tr key={entry.memberId} className="hover:bg-brand-darkBg/30 transition-colors">
                      <td className="py-3 text-center">
                        {isTop3 ? (
                          <Medal className={`w-5 h-5 mx-auto ${medalColor}`} />
                        ) : (
                          <span className="font-bold text-gray-500">{rank}</span>
                        )}
                      </td>
                      <td className="py-3 font-bold text-white flex items-center gap-1.5">
                        {entry.name}
                        <span className={`text-[9px] px-1 rounded-md font-extrabold ${entry.gender === 'M' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
                          {entry.gender}
                        </span>
                      </td>
                      <td className="py-3 text-right">{entry.totalRuns}회</td>
                      <td className="py-3 text-right text-gray-500 font-mono">{entry.averagePace}</td>
                      <td className="py-3 text-right text-brand-orange font-black text-sm">{entry.totalDistance.toFixed(1)} km</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  ```

- [ ] **Step 2: Commit Leaderboard**
  Run:
  ```powershell
  git add src/components/Leaderboard.tsx
  git commit -m "feat: implement hall of fame podium and rank list table with search filter"
  ```

---

### Task 7: Recent Activity Feed (Right Column)

**Files:**
- Create: `src/components/RecentActivity.tsx`

**Interfaces:**
- Consumes: runs list, members list.
- Produces: Timeline view of running logs. Simple local-storage clap button count.

- [ ] **Step 1: Implement RecentActivity Component**
  Create: `c:\Users\home\github\orr-fit\src/components/RecentActivity.tsx`
  ```tsx
  import React, { useState } from 'react';
  import { Heart, Activity } from 'lucide-react';
  import { Run, Member } from '../types';

  interface RecentActivityProps {
    runs: Run[];
    members: Member[];
  }

  export const RecentActivity: React.FC<RecentActivityProps> = ({ runs, members }) => {
    // Stores claps in local state. In real-world, this could be on the DB, but local-storage is fine for micro-reactions.
    const [cheers, setCheers] = useState<Record<string, number>>(() => {
      try {
        return JSON.parse(localStorage.getItem('orr_fit_cheers') || '{}');
      } catch {
        return {};
      }
    });

    const handleCheer = (runId: string) => {
      const updated = {
        ...cheers,
        [runId]: (cheers[runId] || 0) + 1,
      };
      setCheers(updated);
      localStorage.setItem('orr_fit_cheers', JSON.stringify(updated));
    };

    const getMemberName = (memberId: string) => {
      return members.find((m) => m.id === memberId)?.name || '알 수 없는 회원';
    };

    const formatPace = (distance: number, duration: number) => {
      if (!distance) return `00'00"`;
      const totalMin = duration / 60;
      const paceDecimal = totalMin / distance;
      const mins = Math.floor(paceDecimal);
      const secs = Math.round((paceDecimal - mins) * 60);
      return `${mins}'${secs.toString().padStart(2, '0')}"`;
    };

    const formatTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hrs > 0) {
        return `${hrs}시간 ${mins}분`;
      }
      return `${mins}분 ${secs}초`;
    };

    return (
      <div className="bg-brand-darkSurface border border-gray-800 p-6 rounded-2xl h-full flex flex-col">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-orange" />
          실시간 러닝 피드
        </h3>

        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 flex-1">
          {runs.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8 font-semibold">
              아직 등록된 러닝 활동이 없습니다.
            </p>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className="bg-brand-darkBg/60 border border-gray-900 rounded-xl p-4 transition-all duration-300 hover:border-brand-orange/20"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-black text-white block">
                      {getMemberName(run.member_id)}
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold">{run.run_date}</span>
                  </div>
                  <span className="text-xs font-black text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-lg">
                    {run.distance.toFixed(1)} km
                  </span>
                </div>

                {run.notes && (
                  <p className="text-xs text-gray-300 font-medium mb-3 italic">
                    "{run.notes}"
                  </p>
                )}

                <div className="flex justify-between items-center border-t border-gray-900 pt-3 mt-1">
                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 font-mono">
                    <div>
                      <span className="block text-gray-400 text-xs font-black">{formatTime(run.duration)}</span>
                      시간
                    </div>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <div>
                      <span className="block text-gray-400 text-xs font-black">{formatPace(run.distance, run.duration)}</span>
                      페이스
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheer(run.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-brand-orange/5 border border-brand-orange/10 text-brand-orange hover:bg-brand-orange/15 active:scale-95 transition-all"
                  >
                    <Heart className="w-3.5 h-3.5 fill-brand-orange text-brand-orange" />
                    응원 {cheers[run.id] || 0}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };
  ```

- [ ] **Step 2: Commit RecentActivity**
  Run:
  ```powershell
  git add src/components/RecentActivity.tsx
  git commit -m "feat: implement real-time activity feed timeline with like/cheer reaction counts"
  ```

---

### Task 8: Passcode Authorization Dialog

**Files:**
- Create: `src/components/AdminGate.tsx`

**Interfaces:**
- Consumes: `onSuccess`, `onClose`.
- Produces: Modal form verifying staff PIN (default `0000`).

- [ ] **Step 1: Implement AdminGate Component**
  Create: `c:\Users\home\github\orr-fit\src/components/AdminGate.tsx`
  ```tsx
  import React, { useState } from 'react';
  import { X, Lock } from 'lucide-react';

  interface AdminGateProps {
    onClose: () => void;
    onSuccess: () => void;
  }

  export const AdminGate: React.FC<AdminGateProps> = ({ onClose, onSuccess }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Super simple passcode for staff convenience
      if (pin === '0000') {
        onSuccess();
      } else {
        setError(true);
        setPin('');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-brand-darkSurface border border-gray-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-orange/15 border border-brand-orange/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-brand-orange" />
            </div>
            
            <h3 className="text-lg font-black text-white mb-1">직원 전용 모드</h3>
            <p className="text-xs text-gray-400 font-semibold mb-6">패스코드를 입력하세요.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="PIN 번호 (4자리)"
                  value={pin}
                  onChange={(e) => {
                    setError(false);
                    setPin(e.target.value.replace(/\D/g, ''));
                  }}
                  className={`w-full bg-brand-darkBg text-center text-xl tracking-widest font-black border rounded-xl py-3 text-white focus:outline-none ${
                    error ? 'border-red-500' : 'border-gray-800 focus:border-brand-orange'
                  }`}
                  autoFocus
                />
                {error && (
                  <span className="text-[10px] text-red-500 font-bold block mt-2">
                    올바르지 않은 패스코드입니다. (기본: 0000)
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow"
              >
                인증 완료
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };
  ```

- [ ] **Step 2: Commit AdminGate**
  Run:
  ```powershell
  git add src/components/AdminGate.tsx
  git commit -m "feat: implement passcode gate overlay for staff authentication"
  ```

---

### Task 9: Staff Administration Panel (Top Tabs/Modal)

**Files:**
- Create: `src/components/AdminPanel.tsx`

**Interfaces:**
- Consumes: `members`, `runs`, `onAddMember`, `onAddRun`, `onDeleteRun`, `onUpdateTarget`.
- Produces: UI options for creating new members, logging run logs, managing target distance, and importing/exporting database states.

- [ ] **Step 1: Implement AdminPanel Component**
  Create: `c:\Users\home\github\orr-fit\src/components/AdminPanel.tsx`
  ```tsx
  import React, { useState } from 'react';
  import { Plus, Trash2, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
  import { Member, Run } from '../types';

  interface AdminPanelProps {
    members: Member[];
    runs: Run[];
    monthlyTarget: number;
    onAddMember: (name: string, gender: 'M' | 'F') => Promise<void>;
    onAddRun: (memberId: string, distance: number, duration: number, notes: string, date: string) => Promise<void>;
    onDeleteRun: (runId: string) => Promise<void>;
    onUpdateTarget: (target: number) => Promise<void>;
  }

  export const AdminPanel: React.FC<AdminPanelProps> = ({
    members,
    runs,
    monthlyTarget,
    onAddMember,
    onAddRun,
    onDeleteRun,
    onUpdateTarget,
  }) => {
    // Tab State: 'run' | 'member' | 'settings' | 'history'
    const [activeTab, setActiveTab] = useState<'run' | 'member' | 'settings' | 'history'>('run');

    // New Run Form States
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [distance, setDistance] = useState('');
    const [durationMin, setDurationMin] = useState('');
    const [durationSec, setDurationSec] = useState('');
    const [runNotes, setRunNotes] = useState('');
    const [runDate, setRunDate] = useState(new Date().toISOString().substring(0, 10));

    // New Member Form States
    const [memberName, setMemberName] = useState('');
    const [memberGender, setMemberGender] = useState<'M' | 'F'>('M');

    // Target Setting State
    const [targetDistanceInput, setTargetDistanceInput] = useState(monthlyTarget.toString());

    // Submit Log
    const handleRunSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedMemberId || !distance || !durationMin) return;
      const totalSeconds = (Number(durationMin) * 60) + (Number(durationSec || 0));
      await onAddRun(selectedMemberId, Number(distance), totalSeconds, runNotes, runDate);
      
      // Reset Form
      setDistance('');
      setDurationMin('');
      setDurationSec('');
      setRunNotes('');
    };

    // Submit Member
    const handleMemberSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!memberName.trim()) return;
      await onAddMember(memberName.trim(), memberGender);
      setMemberName('');
    };

    // Submit Target
    const handleTargetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await onUpdateTarget(Number(targetDistanceInput));
      alert('목표 거리가 갱신되었습니다!');
    };

    return (
      <div className="bg-brand-darkSurface border border-red-500/20 p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          <h2 className="text-lg font-black text-white">직원 관리용 어드민 패널</h2>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {([
            { id: 'run', label: '활동 기록 등록' },
            { id: 'member', label: '신규 회원 가입' },
            { id: 'settings', label: '목표 설정' },
            { id: 'history', label: '전체 기록 관리' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-300 border ${
                activeTab === tab.id
                  ? 'bg-brand-orange text-white border-brand-orange'
                  : 'bg-brand-darkBg text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Run Registration */}
        {activeTab === 'run' && (
          <form onSubmit={handleRunSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">회원 선택</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  required
                >
                  <option value="">-- 회원명 선택 --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">러닝 날짜</label>
                <input
                  type="date"
                  value={runDate}
                  onChange={(e) => setRunDate(e.target.value)}
                  className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">러닝 거리 (km)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="예: 5.25"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">운동 시간 (분 / 초)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="분 (Min)"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className="w-1/2 bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                    required
                  />
                  <input
                    type="number"
                    placeholder="초 (Sec)"
                    value={durationSec}
                    onChange={(e) => setDurationSec(e.target.value)}
                    className="w-1/2 bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">메모 / 인증 증빙</label>
              <input
                type="text"
                placeholder="예: 나이키 런클럽 스크린샷 확인 완료"
                value={runNotes}
                onChange={(e) => setRunNotes(e.target.value)}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              활동 기록 추가 완료
            </button>
          </form>
        )}

        {/* Tab: Member Registration */}
        {activeTab === 'member' && (
          <form onSubmit={handleMemberSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">회원 이름 / 닉네임</label>
              <input
                type="text"
                placeholder="예: 홍길동"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">성별</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setMemberGender('M')}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl border transition-all ${
                    memberGender === 'M'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                      : 'bg-brand-darkBg border-gray-800 text-gray-500'
                  }`}
                >
                  남성 (M)
                </button>
                <button
                  type="button"
                  onClick={() => setMemberGender('F')}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl border transition-all ${
                    memberGender === 'F'
                      ? 'bg-pink-500/10 border-pink-500 text-pink-400'
                      : 'bg-brand-darkBg border-gray-800 text-gray-500'
                  }`}
                >
                  여성 (F)
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              신규 회원 등록 완료
            </button>
          </form>
        )}

        {/* Tab: Settings */}
        {activeTab === 'settings' && (
          <form onSubmit={handleTargetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">센터 월간 총 목표 거리 (km)</label>
              <input
                type="number"
                value={targetDistanceInput}
                onChange={(e) => setTargetDistanceInput(e.target.value)}
                className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm py-3 rounded-xl transition-all duration-300 shadow-orangeGlow flex items-center justify-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              목표 거리 업데이트
            </button>
          </form>
        )}

        {/* Tab: History List & Delete */}
        {activeTab === 'history' && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {runs.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">러닝 기록이 없습니다.</p>
            ) : (
              runs.map((run) => (
                <div
                  key={run.id}
                  className="flex justify-between items-center bg-brand-darkBg p-3 rounded-xl border border-gray-800"
                >
                  <div className="text-xs">
                    <span className="font-black text-white block">
                      {members.find((m) => m.id === run.member_id)?.name || '알 수 없음'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">
                      {run.distance.toFixed(2)}km ({run.run_date})
                    </span>
                  </div>

                  <button
                    onClick={async () => {
                      if (window.confirm('이 러닝 활동을 영구히 삭제하시겠습니까?')) {
                        await onDeleteRun(run.id);
                      }
                    }}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };
  ```

- [ ] **Step 2: Commit AdminPanel**
  Run:
  ```powershell
  git add src/components/AdminPanel.tsx
  git commit -m "feat: implement staff admin panel tabs for logs entry, member registration, goals, and deletes"
  ```

---

### Task 10: App Assembly & Data mutations

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Custom useDashboardData hook, Header, GoalProgress, Leaderboard, RecentActivity, AdminGate, AdminPanel.
- Produces: Main assembled dashboard screen layout, handles data insertion/deletion callbacks to Supabase.

- [ ] **Step 1: Write Main App integration**
  Modify: `c:\Users\home\github\orr-fit\src/App.tsx`
  ```tsx
  import React, { useState } from 'react';
  import { useDashboardData } from './hooks/useDashboardData';
  import { Header } from './components/Header';
  import { GoalProgress } from './components/GoalProgress';
  import { Leaderboard } from './components/Leaderboard';
  import { RecentActivity } from './components/RecentActivity';
  import { AdminGate } from './components/AdminGate';
  import { AdminPanel } from './components/AdminPanel';
  import { supabase } from './lib/supabase';
  import { LeaderboardEntry } from './types';

  export default function App() {
    const { members, runs, monthlyTarget, isLoading } = useDashboardData();
    const [isAdmin, setIsAdmin] = useState(false);
    const [showGate, setShowGate] = useState(false);

    // Compute Global Metrics
    const totalDistance = runs.reduce((acc, r) => acc + r.distance, 0);
    const activeCount = members.length;

    // Compute Weekly Challenge Completers (Distance >= 10km in current week)
    const getWeeklyChallengeCount = () => {
      // Basic implementation: find members with sum of distance in last 7 days >= 10
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const memberWeeklyDistances: Record<string, number> = {};
      runs.forEach((r) => {
        const runDate = new Date(r.run_date);
        if (runDate >= oneWeekAgo) {
          memberWeeklyDistances[r.member_id] = (memberWeeklyDistances[r.member_id] || 0) + r.distance;
        }
      });

      return Object.values(memberWeeklyDistances).filter(d => d >= 10).length;
    };

    // Calculate Leaderboard entries sorted by total distance descending
    const getLeaderboardEntries = (): LeaderboardEntry[] => {
      const memberMap: Record<string, {
        totalDistance: number;
        totalRuns: number;
        totalDuration: number;
        lastRunDate: string;
      }> = {};

      // Initialize all members with 0
      members.forEach((m) => {
        memberMap[m.id] = {
          totalDistance: 0,
          totalRuns: 0,
          totalDuration: 0,
          lastRunDate: '',
        };
      });

      // Sum runs
      runs.forEach((r) => {
        if (!memberMap[r.member_id]) return; // Skip if member not found in list
        const m = memberMap[r.member_id];
        m.totalDistance += r.distance;
        m.totalRuns += 1;
        m.totalDuration += r.duration;
        if (!m.lastRunDate || new Date(r.run_date) > new Date(m.lastRunDate)) {
          m.lastRunDate = r.run_date;
        }
      });

      const entries: LeaderboardEntry[] = members.map((m) => {
        const data = memberMap[m.id];
        
        // Calculate average pace
        let averagePace = `00'00"`;
        if (data.totalDistance > 0) {
          const totalMin = data.totalDuration / 60;
          const paceDecimal = totalMin / data.totalDistance;
          const mins = Math.floor(paceDecimal);
          const secs = Math.round((paceDecimal - mins) * 60);
          averagePace = `${mins}'${secs.toString().padStart(2, '0')}"`;
        }

        return {
          memberId: m.id,
          name: m.name,
          gender: m.gender,
          totalDistance: data.totalDistance,
          totalRuns: data.totalRuns,
          averagePace,
          totalDuration: data.totalDuration,
          lastRunDate: data.lastRunDate,
        };
      });

      return entries.sort((a, b) => b.totalDistance - a.totalDistance);
    };

    // Mutator: Add Member
    const handleAddMember = async (name: string, gender: 'M' | 'F') => {
      await supabase
        .from('members')
        .insert([{ name, gender }]);
    };

    // Mutator: Add Run
    const handleAddRun = async (
      memberId: string,
      distance: number,
      duration: number,
      notes: string,
      date: string
    ) => {
      await supabase
        .from('runs')
        .insert([{ member_id: memberId, distance, duration, notes, run_date: date }]);
    };

    // Mutator: Delete Run
    const handleDeleteRun = async (runId: string) => {
      await supabase
        .from('runs')
        .delete()
        .eq('id', runId);
    };

    // Mutator: Update Monthly Target
    const handleUpdateTarget = async (newTarget: number) => {
      await supabase
        .from('settings')
        .upsert([{ key: 'monthly_target', value: { distance: newTarget } }]);
    };

    if (isLoading) {
      return (
        <div className="min-h-screen bg-brand-darkBg flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-400">데이터를 실시간 동기화 중...</p>
          </div>
        </div>
      );
    }

    const leaderboardEntries = getLeaderboardEntries();

    return (
      <div className="min-h-screen bg-brand-darkBg pb-12 transition-all duration-300">
        <Header
          totalDistance={totalDistance}
          activeCount={activeCount}
          isAdmin={isAdmin}
          onAdminToggle={() => (isAdmin ? setIsAdmin(false) : setShowGate(true))}
        />

        <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 md:mt-8 space-y-6">
          {/* Admin panel displays at the top if logged in */}
          {isAdmin && (
            <AdminPanel
              members={members}
              runs={runs}
              monthlyTarget={monthlyTarget}
              onAddMember={handleAddMember}
              onAddRun={handleAddRun}
              onDeleteRun={handleDeleteRun}
              onUpdateTarget={handleUpdateTarget}
            />
          )}

          {/* Three-Column Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Column 1: Stats & Target (Span 3) */}
            <div className="lg:col-span-3">
              <GoalProgress
                currentDistance={totalDistance}
                targetDistance={monthlyTarget}
                weeklyChallengeCompleteCount={getWeeklyChallengeCount()}
              />
            </div>

            {/* Column 2: Hall of Fame & Leaderboard (Span 6) */}
            <div className="lg:col-span-6">
              <Leaderboard entries={leaderboardEntries} />
            </div>

            {/* Column 3: Recent Activity (Span 3) */}
            <div className="lg:col-span-3">
              <RecentActivity runs={runs} members={members} />
            </div>
          </div>
        </main>

        {/* Password Gates Modal overlay */}
        {showGate && (
          <AdminGate
            onClose={() => setShowGate(false)}
            onSuccess={() => {
              setIsAdmin(true);
              setShowGate(false);
            }}
          />
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit App Assembly**
  Run:
  ```powershell
  git add src/App.tsx
  git commit -m "feat: complete main dashboard integration with statistics calculations and data mutations"
  ```

---

### Task 11: End-to-End Verification & Validation

**Files:**
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: Correct react application builds.

- [ ] **Step 1: Check build success**
  Run:
  ```powershell
  npm run build
  ```
  Expected: Production build finishes in `./dist` directory without warnings or TS compilation errors.

- [ ] **Step 2: Complete Walkthrough document**
  Create: walkthrough documentation details for the user to understand deployment.
