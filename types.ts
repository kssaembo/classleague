
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
  bonus1: boolean; // 하위 호환성 유지
  bonus2: boolean; // 하위 호환성 유지
  bonus_details1?: string[]; // 획득한 보너스 항목 리스트
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
  bonus_config?: string[]; // 보너스 항목 리스트 ['매너', '준비물', ...]
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
