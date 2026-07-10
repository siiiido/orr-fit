export interface Member {
  id: string;
  name: string;
  gender: 'M' | 'F';
  nickname?: string;
  created_at: string;
}

export interface Run {
  id: string;
  member_id: string;
  distance: number; // in km
  duration: number; // in seconds
  notes?: string;
  run_date: string;
  type: 'treadmill' | 'outdoor' | 'stairmaster' | 'cycling' | 'orr_run';
  created_at: string;
}

export interface GymSettings {
  monthly_target: number; // cumulative distance target in km
}

export interface LeaderboardEntry {
  memberId: string;
  name: string;
  nickname?: string;
  gender: 'M' | 'F';
  totalDistance: number;
  currentMonthDistance: number;
  totalRuns: number;
  averagePace: string; // format: MM'SS"
  totalDuration: number; // in seconds
  lastRunDate: string;
  highestChallengeTier?: 'gold' | 'silver' | 'bronze';
}

export interface ChallengeTier {
  km: number;
  reward_days: number;
}

export interface MonthlyChallenge {
  tiers: ChallengeTier[];
}

export interface MonthlyRanking {
  id: string;
  member_id: string;
  year_month: string; // 'YYYY-MM'
  rank: number; // 1-6
  distance: number;
  created_at: string;
}

export interface HealthPassReward {
  id: string;
  member_id: string;
  year_month: string; // 'YYYY-MM'
  reward_days: number;
  distance: number;
  created_at: string;
}

