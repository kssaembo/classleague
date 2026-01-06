
import React, { useMemo, useState } from 'react';
import { Team, Match, Settings } from '../types';
import { X, Trophy, MessageSquare, Star } from 'lucide-react';

interface RankingsProps {
  teams: Team[];
  matches: Match[];
  settings: Settings | null;
}

interface MatchDetail {
  id: string;
  date: string;
  opponent: string;
  myScore: number;
  opScore: number;
  result: 'W' | 'D' | 'L' | 'P'; // P for Pass
  memo: string;
}

const Rankings: React.FC<RankingsProps> = ({ teams, matches, settings }) => {
  const [selectedTeamHistory, setSelectedTeamHistory] = useState<{ teamName: string, history: MatchDetail[] } | null>(null);

  const leagueType = settings?.league_type || 'points';
  const unit = settings?.league_unit || '점';

  const stats = useMemo(() => {
    return teams.map(team => {
      const teamMatches = matches
        .filter(m => m.team1_id === team.id || m.team2_id === team.id);

      let wins = 0, draws = 0, losses = 0, bonusTotal = 0, totalScore = 0;
      let bestRecord = (leagueType === 'time') ? Infinity : -Infinity;
      const history: MatchDetail[] = [];

      teamMatches.forEach(m => {
        const isTeam1 = m.team1_id === team.id;
        const myScore = isTeam1 ? m.score1 : m.score2;
        const opScore = isTeam1 ? m.score2 : m.score1;
        const opponentId = isTeam1 ? m.team2_id : m.team1_id;
        const opponentName = teams.find(t => t.id === opponentId)?.name || '상대';
        
        bonusTotal += (isTeam1 ? (m.bonus_details1?.length || 0) : (m.bonus_details2?.length || 0));
        totalScore += myScore;

        if (leagueType === 'time') {
          if (myScore > 0 && myScore < bestRecord) bestRecord = myScore;
        } else if (leagueType === 'time_high' || leagueType === 'count') {
          if (myScore > bestRecord) bestRecord = myScore;
        }

        let result: 'W' | 'D' | 'L' | 'P';
        if (leagueType === 'points') {
          if (myScore > opScore) { wins++; result = 'W'; }
          else if (myScore === opScore) { draws++; result = 'D'; }
          else { losses++; result = 'L'; }
        } else {
          result = myScore > 0 ? 'P' : 'L';
        }

        history.push({ id: m.id, date: m.match_date, opponent: opponentName, myScore, opScore, result, memo: m.strategy_memo });
      });

      let rankingValue = 0;
      if (leagueType === 'points') {
        rankingValue = (wins * 3) + (draws * 2) + (losses * 1) + bonusTotal;
      } else if (leagueType === 'time') {
        rankingValue = bestRecord === Infinity ? 999999 : bestRecord;
      } else if (leagueType === 'time_high' || leagueType === 'count') {
        rankingValue = bestRecord === -Infinity ? -1 : bestRecord;
      } else if (leagueType === 'mission') {
        rankingValue = totalScore;
      }

      return {
        id: team.id,
        name: team.name,
        rankingValue,
        displayValue: leagueType === 'points' ? rankingValue : (rankingValue === 999999 || rankingValue === -1 ? '-' : rankingValue),
        totalGames: teamMatches.length,
        wins, draws, losses, bonusTotal,
        history: history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      };
    }).sort((a, b) => {
      if (leagueType === 'time') return Number(a.rankingValue) - Number(b.rankingValue);
      return Number(b.rankingValue) - Number(a.rankingValue);
    }).map((s, i) => ({ ...s, rank: i + 1 }));
  }, [teams, matches, leagueType]);

  const getIndicatorLabel = () => {
    if (leagueType === 'points') return '승점';
    if (leagueType === 'time') return '최고 기록(↓)';
    if (leagueType === 'time_high') return '최고 기록(↑)';
    if (leagueType === 'count') return '최고 기록';
    if (leagueType === 'mission') return '성공 횟수';
    return '기록';
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border-b-8 border-indigo-200">
      <div className="bg-indigo-600 text-white p-6 font-bold flex items-center justify-between">
        <h3 className="text-lg md:text-xl flex items-center gap-2">🏆 {getIndicatorLabel()} 순위표</h3>
        <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full text-white">단위: {unit}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] font-black uppercase border-b border-slate-100">
              <th className="p-4">순위</th>
              <th className="p-4 text-left">팀명</th>
              <th className="p-4">{getIndicatorLabel()}</th>
              <th className="p-4">참여</th>
              {leagueType === 'points' && <th className="p-4">승/무/패</th>}
              <th className="p-4">보너스</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 ? (
              <tr><td colSpan={6} className="p-20 text-slate-300 italic font-bold">기록이 쌓이면 순위가 나타나요!</td></tr>
            ) : (
              stats.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                  <td className="p-4 font-black text-lg">
                    {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : s.rank}
                  </td>
                  <td className="p-4 text-left">
                    <button onClick={() => setSelectedTeamHistory({ teamName: s.name, history: s.history })} className="font-bold text-slate-700 hover:text-indigo-600">
                      {s.name}
                    </button>
                  </td>
                  <td className="p-4 text-indigo-600 font-black text-xl">{s.displayValue}<span className="text-[10px] ml-1">{unit}</span></td>
                  <td className="p-4 text-slate-400 font-bold">{s.totalGames}</td>
                  {leagueType === 'points' && (
                    <td className="p-4 text-xs font-medium">
                      <span className="text-blue-500">{s.wins}</span>/{s.draws}/<span className="text-red-400">{s.losses}</span>
                    </td>
                  )}
                  <td className="p-4">
                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-[10px] font-black">+{s.bonusTotal}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTeamHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border-4 border-indigo-500 animate-in zoom-in duration-200">
            <div className="bg-indigo-500 p-6 flex items-center justify-between text-white">
              <h2 className="text-xl font-bold flex items-center gap-2"><Trophy size={20} /> {selectedTeamHistory.teamName} 상세 기록</h2>
              <button onClick={() => setSelectedTeamHistory(null)}><X size={24} /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {selectedTeamHistory.history.map((m) => (
                <div key={m.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400">{m.date}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${m.result === 'W' || m.result === 'P' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {m.result === 'W' ? '승리' : m.result === 'D' ? '무승부' : m.result === 'L' ? '패배' : '기록완료'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-600">{leagueType === 'mission' ? '도전 기록' : `상대: ${m.opponent}`}</span>
                    <span className="text-lg font-black text-slate-800">{m.myScore} {unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 text-center bg-slate-50">
              <button onClick={() => setSelectedTeamHistory(null)} className="px-10 py-3 bg-indigo-500 text-white font-bold rounded-xl shadow-lg">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rankings;
