import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, Run } from '../types';

export const useDashboardData = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(2000);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isInitialLoadRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      if (isInitialLoadRef.current) {
        setIsLoading(true);
      }
      
      const [settingsResult, membersResult, runsResult] = await Promise.all([
        supabase
          .from('settings')
          .select('*')
          .eq('key', 'monthly_target')
          .maybeSingle(),
        supabase
          .from('members')
          .select('*')
          .order('name', { ascending: true })
          .throwOnError(),
        supabase
          .from('runs')
          .select('*')
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

      // Handle members
      if (membersResult.data) {
        setMembers(membersResult.data as Member[]);
      }

      // Handle runs
      if (runsResult.data) {
        setRuns(runsResult.data.map(r => ({
          ...r,
          distance: Number(r.distance),
          duration: Number(r.duration)
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
