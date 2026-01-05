
import React, { useMemo, useState } from 'react';
import { Team, Match, TeamStats } from '../types';
import { X, Trophy, MessageSquare } from 'lucide-react';

interface RankingsProps {
  teams: Team[];
  matches: Match[];
}

interface MatchDetail {
  id: string;
  date: string;
  opponent: string;
  myScore: number;
  opScore: number;
  result: 'W' | 'D' | 'L';
  memo: string;
}

const Rankings: React.FC<RankingsProps> = ({ teams, matches }) => {
  const [tooltip, setTooltip] = useState<{ teamId: string, matchIdx: number, content: MatchDetail } | null>(null);
  const [selectedTeamHistory, setSelectedTeamHistory] = useState<{ teamName: string, history: MatchDetail[] } | null>(null);

  const statsWithDetails = useMemo(() => {
    return teams.map(team => {
      const teamMatches = matches
        .filter(m => m.team1_id === team.id || m.team2_id === team.id)
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

      let wins = 0;
      let draws = 0;
      let losses = 0;
      let bonusTotal = 0;
      const allMatchesDetails: MatchDetail[] = [];

      teamMatches.forEach((m) => {
        const isTeam1 = m.team1_id === team.id;
        const myScore = isTeam1 ? m.score1 : m.score2;
        const opScore = isTeam1 ? m.score2 : m.score1;
        const opponentId = isTeam1 ? m.team2_id : m.team1_id;
        const opponentName = teams.find(t => t.id === opponentId)?.name || '상대팀';
        
        const myBonusList = isTeam1 ? (m.bonus_details1 || []) : (m.bonus_details2 || []);
        bonusTotal += myBonusList.length;

        let result: 'W' | 'D' | 'L';
        if (myScore > opScore) {
          wins++;
          result = 'W';
        } else if (myScore === opScore) {
          draws++;
          result = 'D';
        } else {
          losses++;
          result = 'L';
        }

        allMatchesDetails.push({ 
          id: m.id,
          date: m.match_date, 
          opponent: opponentName, 
          myScore, 
          opScore, 
          result,
          memo: m.strategy_memo || ''
        });
      });

      const points = (wins * 3) + (draws * 2) + (losses * 1) + bonusTotal;

      return {
        id: team.id,
        name: team.name,
        points,
        totalGames: teamMatches.length,
        wins,
        draws,
        losses,
        bonusTotal,
        history: allMatchesDetails
      };
    }).sort((a, b) => b.points - a.points || (b.wins - a.wins))
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [teams, matches]);

  return (
    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border-b-8 border-green-200">
      <div className="bg-green-600 text-white p-6 font-bold flex items-center justify-between">
        <h3 className="text-lg md:text-xl flex items-center gap-2">🏆 실시간 리그 순위</h3>
        <span className="text-[9px] md:text-[10px] bg-green-700/50 px-3 py-1 rounded-full text-green-100">승 3 / 무 2 / 패 1 / 보너스 +1</span>
      </div>
      <div className="overflow-x-auto relative">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-wider border-b border-slate-100">
              <th className="p-3 md:p-4">순위</th>
              <th className="p-3 md:p-4 text-left">팀명</th>
              <th className="p-3 md:p-4">승점</th>
              <th className="p-3 md:p-4">경기</th>
              <th className="p-3 md:p-4">승/무/패</th>
              <th className="p-3 md:p-4">보너스</th>
              <th className="p-3 md:p-4 whitespace-nowrap hidden md:table-cell">최근 경기</th>
            </tr>
          </thead>
          <tbody>
            {statsWithDetails.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-16 text-slate-400 font-medium italic">경기를 진행하면 순위표가 완성돼요! ⚽️</td>
              </tr>
            ) : (
              statsWithDetails.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-green-50/50 transition-colors">
                  <td className="p-3 md:p-5 font-black text-base md:text-lg">
                    {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : s.rank}
                  </td>
                  <td className="p-3 md:p-5 text-left">
                    <button 
                      onClick={() => setSelectedTeamHistory({ teamName: s.name, history: s.history })}
                      className="font-bold text-slate-700 hover:text-green-600 hover:underline transition-all underline-offset-4"
                    >
                      {s.name}
                    </button>
                  </td>
                  <td className="p-3 md:p-5 text-green-600 font-black text-lg md:text-xl">{s.points}</td>
                  <td className="p-3 md:p-5 text-slate-400 font-bold">{s.totalGames}</td>
                  <td className="p-3 md:p-5 text-[10px] md:text-sm font-medium">
                    <span className="text-blue-500">{s.wins}</span> / {s.draws} / <span className="text-red-400">{s.losses}</span>
                  </td>
                  <td className="p-3 md:p-5">
                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-[10px] font-black">+{s.bonusTotal}</span>
                  </td>
                  <td className="p-3 md:p-5 hidden md:table-cell">
                    <div className="flex justify-center gap-1 relative">
                      {s.history.slice(0, 3).reverse().map((r, i) => (
                        <div 
                          key={i} 
                          className="relative group"
                          onMouseEnter={() => setTooltip({ teamId: s.id, matchIdx: i, content: r })}
                          onMouseLeave={() => setTooltip(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTooltip(tooltip?.teamId === s.id && tooltip?.matchIdx === i ? null : { teamId: s.id, matchIdx: i, content: r });
                          }}
                        >
                          <span 
                            className={`w-5 h-5 md:w-6 md:h-6 rounded-lg text-[9px] md:text-[10px] flex items-center justify-center font-black text-white shadow-sm transition-transform active:scale-90 cursor-pointer
                              ${r.result === 'W' ? 'bg-green-500' : r.result === 'D' ? 'bg-slate-300' : r.result === 'L' ? 'bg-red-400' : 'bg-red-400'}`}
                          >
                            {r.result}
                          </span>
                          
                          {tooltip && tooltip.teamId === s.id && tooltip.matchIdx === i && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-800 text-white p-2 rounded-xl text-[10px] z-[60] shadow-xl animate-in fade-in zoom-in slide-in-from-bottom-2 pointer-events-none">
                              <p className="font-bold border-b border-white/20 pb-1 mb-1 truncate">vs {r.opponent}</p>
                              <p className="font-black text-sm">{r.myScore} : {r.opScore}</p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 팀 경기 이력 팝업 모달 */}
      {selectedTeamHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border-4 border-green-500 transform animate-in zoom-in slide-in-from-bottom-4">
            <div className="bg-green-500 p-6 flex items-center justify-between text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy size={20} /> {selectedTeamHistory.teamName} 경기 이력
              </h2>
              <button onClick={() => setSelectedTeamHistory(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {selectedTeamHistory.history.length === 0 ? (
                <p className="text-center py-10 text-slate-400 font-medium italic">아직 기록된 경기가 없습니다.</p>
              ) : (
                selectedTeamHistory.history.map((m) => (
                  <div key={m.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-100">{m.date}</span>
                      <span className={`text-xs font-black px-3 py-1 rounded-full shadow-sm
                        ${m.result === 'W' ? 'bg-green-100 text-green-700' : m.result === 'D' ? 'bg-slate-200 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                        {m.result === 'W' ? '승리' : m.result === 'D' ? '무승부' : '패배'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm font-black text-slate-600">상대: {m.opponent}</span>
                      <span className="text-xl font-black text-slate-800">{m.myScore} : {m.opScore}</span>
                    </div>
                    {m.memo && (
                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-start gap-2">
                        <MessageSquare size={12} className="text-slate-400 mt-1 shrink-0" />
                        <p className="text-[11px] text-slate-500 italic leading-relaxed">{m.memo}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-slate-50 text-center">
              <button onClick={() => setSelectedTeamHistory(null)} className="px-8 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition-colors">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rankings;
