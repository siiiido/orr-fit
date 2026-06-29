import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, Run } from '../types';

export const useDashboardData = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(2000);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const membersRef = useRef<Member[]>([]);
  const runsRef = useRef<Run[]>([]);

  membersRef.current = members;
  runsRef.current = runs;

  const fetchData = useCallback(async () => {
    try {
      const isInitial = membersRef.current.length === 0 && runsRef.current.length === 0;
      if (isInitial) {
        setIsLoading(true);
      }
      
      // Fetch settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'monthly_target')
        .single()
        .throwOnError();
      
      if (settingsData && settingsData.value) {
        setMonthlyTarget(settingsData.value.distance || 2000);
      }

      // Fetch members
      const { data: membersData } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true })
        .throwOnError();

      if (membersData) {
        setMembers(membersData as Member[]);
      }

      // Fetch runs
      const { data: runsData } = await supabase
        .from('runs')
        .select('*')
        .order('run_date', { ascending: false })
        .throwOnError();

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
