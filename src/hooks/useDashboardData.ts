import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, Run, MonthlyChallenge } from '../types';

export const useDashboardData = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(2000);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [monthlyChallenge, setMonthlyChallenge] = useState<MonthlyChallenge | null>(null);

  const isInitialLoadRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      if (isInitialLoadRef.current) {
        setIsLoading(true);
      }
      
      const [settingsResult, challengeResult, membersResult, runsResult] = await Promise.all([
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
          .throwOnError()
      ]);

      // Handle settings
      if (settingsResult.error) {
        console.warn('Error fetching settings:', settingsResult.error);
      }
      if (settingsResult.data && settingsResult.data.value) {
        setMonthlyTarget(settingsResult.data.value.distance || 2000);
      } else {
        setMonthlyTarget(2000);
      }

      // Handle monthly challenge
      if (challengeResult.error) {
        console.warn('Error fetching monthly_challenge:', challengeResult.error);
      }
      if (challengeResult.data && challengeResult.data.value?.tiers) {
        setMonthlyChallenge({ tiers: challengeResult.data.value.tiers });
      } else {
        setMonthlyChallenge(null);
      }

      // Handle members
      if (membersResult.data) {
        setMembers(membersResult.data as Member[]);
      }

      // Handle runs
      if (runsResult.data) {
        setRuns(runsResult.data.map(r => ({
          ...r,
          distance: Number(r.distance),
          duration: Number(r.duration),
          type: r.type || 'outdoor'
        })) as Run[]);
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

    // Single channel subscribing to all three tables — reduces connections from 3→1 per user
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
    isLoading,
    refetch: fetchData
  };
};
