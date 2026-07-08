import { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import { Header } from './components/Header';
import { GoalProgress } from './components/GoalProgress';
import { Leaderboard } from './components/Leaderboard';
import { RecentActivity } from './components/RecentActivity';
import { AdminGate } from './components/AdminGate';
import { AdminPanel } from './components/AdminPanel';
import { MemberDetailModal } from './components/MemberDetailModal';
import { StampsModal } from './components/StampsModal';
import { OrrRunBanner } from './components/OrrRunBanner';
import { supabase } from './lib/supabase';
import type { LeaderboardEntry, ChallengeTier, Member } from './types';

export default function App() {
  const { members, runs, monthlyTarget, monthlyChallenge, monthlyRankings, isLoading } = useDashboardData();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [selectedDetailMember, setSelectedDetailMember] = useState<Member | null>(null);
  const [showStamps, setShowStamps] = useState(false);

  // Compute Global Metrics
  const totalDistance = runs.reduce((acc, r) => acc + r.distance, 0);
  const activeCount = members.length;

  // Mutator: Update Monthly Challenge Tiers
  const handleUpdateChallenge = async (tiers: ChallengeTier[]) => {
    await supabase
      .from('settings')
      .upsert([{ key: 'monthly_challenge', value: { tiers } }])
      .throwOnError();
  };

  // Calculate Leaderboard entries sorted by total distance descending
  const getLeaderboardEntries = (): LeaderboardEntry[] => {
    const memberMap: Record<string, {
      totalDistance: number;
      totalRuns: number;
      totalDuration: number;
      lastRunDate: string;
      currentMonthDistance: number;
    }> = {};

    // Initialize all members with 0
    members.forEach((m) => {
      memberMap[m.id] = {
        totalDistance: 0,
        totalRuns: 0,
        totalDuration: 0,
        lastRunDate: '',
        currentMonthDistance: 0,
      };
    });

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Sum runs
    runs.forEach((r) => {
      if (!memberMap[r.member_id]) return; // Skip if member not found in list
      const m = memberMap[r.member_id];
      m.totalDistance += r.distance;
      m.totalRuns += 1;
      m.totalDuration += r.duration;
      
      // Calculate current calendar month distance for challenge tiers
      if (r.run_date.startsWith(yearMonth)) {
        m.currentMonthDistance += r.distance;
      }

      if (!m.lastRunDate || new Date(r.run_date) > new Date(m.lastRunDate)) {
        m.lastRunDate = r.run_date;
      }
    });

    const sortedTiers = monthlyChallenge
      ? [...monthlyChallenge.tiers].sort((a, b) => a.km - b.km)
      : [];

    const entries: LeaderboardEntry[] = members.map((m) => {
      const data = memberMap[m.id];
      
      let averagePace = `00'00"`;
      if (data.totalDistance > 0) {
        const totalSecondsPerKm = Math.round(data.totalDuration / data.totalDistance);
        const mins = Math.floor(totalSecondsPerKm / 60);
        const secs = totalSecondsPerKm % 60;
        averagePace = `${mins}'${secs.toString().padStart(2, '0')}"`;
      }

      // Check highest tier achieved this month
      let highestChallengeTier: 'gold' | 'silver' | 'bronze' | undefined = undefined;
      const tierLevels: ('bronze' | 'silver' | 'gold')[] = ['bronze', 'silver', 'gold'];
      sortedTiers.forEach((tier, index) => {
        if (data.currentMonthDistance >= tier.km) {
          highestChallengeTier = tierLevels[Math.min(index, tierLevels.length - 1)];
        }
      });

      return {
        memberId: m.id,
        name: m.name,
        nickname: m.nickname,
        gender: m.gender,
        totalDistance: data.totalDistance,
        totalRuns: data.totalRuns,
        averagePace,
        totalDuration: data.totalDuration,
        lastRunDate: data.lastRunDate,
        highestChallengeTier,
      };
    });

    return entries.sort((a, b) => b.totalDistance - a.totalDistance);
  };

  // Mutator: Add Member
  const handleAddMember = async (name: string, gender: 'M' | 'F', nickname?: string) => {
    await supabase
      .from('members')
      .insert([{ name, gender, nickname }])
      .throwOnError();
  };

  // Mutator: Add Run
  const handleAddRun = async (
    memberId: string,
    distance: number,
    duration: number,
    notes: string,
    date: string,
    type: string
  ) => {
    await supabase
      .from('runs')
      .insert([{ member_id: memberId, distance, duration, notes, run_date: date, type }])
      .throwOnError();
  };

  // Mutator: Delete Run
  const handleDeleteRun = async (runId: string) => {
    await supabase
      .from('runs')
      .delete()
      .eq('id', runId)
      .throwOnError();
  };

  // Mutator: Update Monthly Target
  const handleUpdateTarget = async (newTarget: number) => {
    await supabase
      .from('settings')
      .upsert([{ key: 'monthly_target', value: { distance: newTarget } }])
      .throwOnError();
  };

  // Mutator: Update Member Nickname
  const handleUpdateMemberNickname = async (memberId: string, nickname?: string) => {
    await supabase
      .from('members')
      .update({ nickname })
      .eq('id', memberId)
      .throwOnError();
  };

  // Mutator: 월별 순위 리스트 저장 (일괄 갱신)
  const handleSaveMonthlyRankings = async (
    yearMonth: string,
    rankings: { memberId: string; rank: number; distance: number }[]
  ) => {
    // 트랜잭션 대신, 기존 yearMonth에 해당하는 모든 기록 삭제 후 신규 upsert 처리
    const { error: deleteError } = await supabase
      .from('monthly_rankings')
      .delete()
      .eq('year_month', yearMonth);
      
    if (deleteError) throw deleteError;

    if (rankings.length === 0) return;

    const insertData = rankings.map(r => ({
      member_id: r.memberId,
      year_month: yearMonth,
      rank: r.rank,
      distance: r.distance
    }));

    const { error: insertError } = await supabase
      .from('monthly_rankings')
      .insert(insertData);

    if (insertError) throw insertError;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-darkBg flex flex-col items-center justify-center gap-8 relative overflow-hidden">
        {/* Background ambient glow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,106,0,0.12) 0%, transparent 70%)',
            animation: 'bgPulse 2s ease-in-out infinite',
          }}
        />

        {/* ORR Logo */}
        <div className="relative flex items-center gap-2 select-none">
          {['O', 'R', 'R'].map((letter, i) => (
            <div key={i} className="relative" style={{ lineHeight: 1 }}>
              <span
                className="block font-black leading-none"
                style={{
                  fontSize: '96px',
                  fontFamily: 'system-ui, sans-serif',
                  letterSpacing: '-0.03em',
                  color: '#ff6a00',
                  textShadow: '0 0 30px rgba(255,106,0,0.9), 0 0 60px rgba(255,106,0,0.5)',
                  animation: 'orrGlow 1.8s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                {letter}
              </span>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="text-center">
          <p className="text-[11px] font-black tracking-[0.3em] text-gray-500 uppercase">Running Club</p>
          <div className="flex items-center gap-2 mt-3 justify-center">
            <div className="h-px w-8 bg-brand-orange/40 rounded-full" />
            <p
              className="text-[10px] font-semibold text-gray-600"
              style={{ animation: 'dotBlink 1.2s ease-in-out infinite' }}
            >
              데이터를 불러오는 중...
            </p>
            <div className="h-px w-8 bg-brand-orange/40 rounded-full" />
          </div>
        </div>

        {/* Bottom progress bar */}
        <div
          className="absolute bottom-0 left-0 h-[2px] rounded-full"
          style={{
            background: 'linear-gradient(90deg, #ff6a00, #ffd700)',
            animation: 'progressBar 1.6s ease-in-out infinite',
          }}
        />

        <style>{`
          @keyframes orrGlow {
            0%   { color: #ff6a00; text-shadow: 0 0 30px rgba(255,106,0,0.9), 0 0 60px rgba(255,106,0,0.5); opacity: 1; }
            50%  { color: #ffaa55; text-shadow: 0 0 50px rgba(255,106,0,1),   0 0 100px rgba(255,106,0,0.7); opacity: 0.85; }
            100% { color: #ff6a00; text-shadow: 0 0 30px rgba(255,106,0,0.9), 0 0 60px rgba(255,106,0,0.5); opacity: 1; }
          }
          @keyframes bgPulse {
            0%, 100% { opacity: 0.6; }
            50%       { opacity: 1; }
          }
          @keyframes dotBlink {
            0%, 100% { opacity: 0.4; }
            50%       { opacity: 1; }
          }
          @keyframes progressBar {
            0%   { width: 0%;   left: 0%; }
            50%  { width: 55%;  left: 22%; }
            100% { width: 0%;   left: 100%; }
          }
        `}</style>
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
            monthlyChallenge={monthlyChallenge}
            monthlyRankings={monthlyRankings}
            onAddMember={handleAddMember}
            onAddRun={handleAddRun}
            onDeleteRun={handleDeleteRun}
            onUpdateTarget={handleUpdateTarget}
            onUpdateChallenge={handleUpdateChallenge}
            onUpdateMemberNickname={handleUpdateMemberNickname}
            onSaveMonthlyRankings={handleSaveMonthlyRankings}
          />
        )}

        {/* Three-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Stats & Target (Span 3) */}
          <div className="lg:col-span-3">
            <GoalProgress
              currentDistance={totalDistance}
              targetDistance={monthlyTarget}
              monthlyChallenge={monthlyChallenge}
              members={members}
              runs={runs}
            />
          </div>

          {/* Column 2: Hall of Fame & Leaderboard (Span 6) */}
          <div className="lg:col-span-6">
            <Leaderboard
              entries={leaderboardEntries}
              onSelectMember={(memberId) => {
                const mem = members.find((m) => m.id === memberId);
                if (mem) setSelectedDetailMember(mem);
              }}
              onOpenStamps={() => setShowStamps(true)}
            />
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

      {/* Member Detail Modal overlay */}
      {selectedDetailMember && (
        <MemberDetailModal
          member={selectedDetailMember}
          runs={runs}
          onClose={() => setSelectedDetailMember(null)}
          monthlyChallenge={monthlyChallenge}
          rank={leaderboardEntries.findIndex(e => e.memberId === selectedDetailMember.id) + 1}
        />
      )}

      {/* Stamps Modal overlay */}
      <StampsModal
        isOpen={showStamps}
        onClose={() => setShowStamps(false)}
        members={members}
        monthlyRankings={monthlyRankings}
      />

      {/* Orr Run Event Banner (Floating Button) */}
      <OrrRunBanner />
    </div>
  );
}
