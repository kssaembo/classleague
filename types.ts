
export type LeagueType = 'points' | 'time' | 'time_high' | 'count' | 'mission';

export interface Team {
  id: string;
  teacher_id: string;
  name: string;
  members: string;
  created_at: string;
}

export interface Match {
  id: string;
  teacher_id: string;
  match_date: string;
  team1_id: string;
  team2_id: string;
  score1: number;
  score2: number;
  strategy_memo: string;
  bonus1: boolean;
  bonus2: boolean;
  bonus_details1?: string[];
  bonus_details2?: string[];
  created_at: string;
}

export interface Settings {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  notice: string;
  bonus_label: string;
  access_code: string;
  bonus_config?: string[];
  league_type?: LeagueType;
  league_unit?: string;
}

export interface TeamStats {
  rank: number;
  name: string;
  points: number;
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
  bonusTotal: number;
  recent: ('W' | 'D' | 'L')[];
}
