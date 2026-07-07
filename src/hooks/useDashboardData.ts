import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, Run, MonthlyChallenge, MonthlyRanking } from '../types';

export const useDashboardData = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(2000);
  const [monthlyChallenge, setMonthlyChallenge] = useState<MonthlyChallenge | null>(null);
  const [monthlyRankings, setMonthlyRankings] = useState<MonthlyRanking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isInitialLoadRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      if (isInitialLoadRef.current) {
        setIsLoading(true);
      }
      
      const [settingsResult, challengeResult, membersResult, runsResult, rankingsResult] = await Promise.all([
        supabase
          .from('settings')
          .select('*')
          .eq('key', 'monthly_target')
          .maybeSingle(),
        supabase
          .from('settings')
          .select('*')
          .eq('key', 'monthly_challenge')
          .maybeSingle(),
        supabase
          .from('members')
          .select('id, name, gender, nickname, created_at')
          .order('name', { ascending: true })
          .throwOnError(),
        supabase
          .from('runs')
          .select('id, member_id, distance, duration, notes, run_date, type, created_at')
          .order('run_date', { ascending: false })
          .throwOnError(),
        supabase
          .from('monthly_rankings')
          .select('id, member_id, year_month, rank, distance, created_at')
          .order('year_month', { ascending: false })
          .order('rank', { ascending: true })
          .throwOnError()
      ]);

      if (settingsResult.data && settingsResult.data.value) {
        setMonthlyTarget(settingsResult.data.value.distance || 2000);
      }
      if (challengeResult.data && challengeResult.data.value?.tiers) {
        setMonthlyChallenge({ tiers: challengeResult.data.value.tiers });
      }
      if (membersResult.data) {
        setMembers(membersResult.data as Member[]);
      }
      if (runsResult.data) {
        setRuns(runsResult.data.map(r => ({
          ...r,
          distance: Number(r.distance),
          duration: Number(r.duration),
          type: r.type || 'outdoor'
        })) as Run[]);
      }
      if (rankingsResult.data) {
        setMonthlyRankings(rankingsResult.data.map(rk => ({
          ...rk,
          distance: Number(rk.distance)
        })) as MonthlyRanking[]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
      isInitialLoadRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();

    const realtimeChannel = supabase
      .channel('orr-fit-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runs' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_rankings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [fetchData]);

  return {
    members,
    runs,
    monthlyTarget,
    monthlyChallenge,
    monthlyRankings,
    isLoading,
    refetch: fetchData
  };
};
