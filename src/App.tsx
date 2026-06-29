import { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import { Header } from './components/Header';
import { GoalProgress } from './components/GoalProgress';
import { Leaderboard } from './components/Leaderboard';
import { RecentActivity } from './components/RecentActivity';
import { AdminGate } from './components/AdminGate';
import { AdminPanel } from './components/AdminPanel';
import { supabase } from './lib/supabase';
import type { LeaderboardEntry } from './types';

export default function App() {
  const { members, runs, monthlyTarget, isLoading } = useDashboardData();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showGate, setShowGate] = useState(false);

  // Compute Global Metrics
  const totalDistance = runs.reduce((acc, r) => acc + r.distance, 0);
  const activeCount = members.length;

  // Compute Weekly Challenge Completers (Distance >= 10km in current week)
  const getWeeklyChallengeCount = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setHours(0, 0, 0, 0);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const memberWeeklyDistances: Record<string, number> = {};
    runs.forEach((r) => {
      const runDate = new Date(r.run_date + 'T00:00:00');
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
      
      let averagePace = `00'00"`;
      if (data.totalDistance > 0) {
        const totalSecondsPerKm = Math.round(data.totalDuration / data.totalDistance);
        const mins = Math.floor(totalSecondsPerKm / 60);
        const secs = totalSecondsPerKm % 60;
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
      .insert([{ name, gender }])
      .throwOnError();
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
      .insert([{ member_id: memberId, distance, duration, notes, run_date: date }])
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
