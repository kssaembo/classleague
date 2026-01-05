
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Match, Team } from '../types';
import { Search, Trash2, AlertCircle, Edit, ShieldQuestion } from 'lucide-react';

interface MatchHistoryProps {
  teams: Team[];
  matches: Match[];
  onUpdate: () => void;
  teacherId: string;
  onEdit: (match: Match) => void;
  accessCode: string;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ teams, matches, onUpdate, teacherId, onEdit, accessCode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [passInput, setPassInput] = useState('');

  const filteredMatches = matches.filter(m => {
    const t1 = teams.find(t => t.id === m.team1_id)?.name || '';
    const t2 = teams.find(t => t.id === m.team2_id)?.name || '';
    return t1.includes(searchTerm) || t2.includes(searchTerm) || m.strategy_memo?.includes(searchTerm);
  });

  const handleDelete = async (matchId: string) => {
    if (passInput !== accessCode) {
      alert("교사 비밀번호가 일치하지 않습니다.");
      return;
    }
    const { error } = await supabase.from('matches').delete().eq('id', matchId);
    if (error) alert(error.message);
    else {
      setDeleteTarget(null);
      setPassInput('');
      onUpdate();
      alert("기록이 성공적으로 삭제되었습니다. ✅");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-100 flex items-center gap-3 sticky top-[4.5rem] md:top-16 z-30">
        <Search className="text-slate-300" size={20} />
        <input 
          type="text" 
          placeholder="팀 이름이나 경기 메모로 검색..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full outline-none text-slate-700 font-bold placeholder:font-medium text-sm"
        />
      </div>

      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-24 text-slate-300 font-bold">
            기록된 경기가 없어요! ⚽️
          </div>
        ) : (
          filteredMatches.map(m => {
            const t1 = teams.find(t => t.id === m.team1_id);
            const t2 = teams.find(t => t.id === m.team2_id);
            const isDeleting = deleteTarget === m.id;

            return (
              <div key={m.id} className="bg-white rounded-[2rem] p-6 shadow-md border-b-4 border-slate-200 relative overflow-hidden">
                {isDeleting && (
                  <div className="absolute inset-0 bg-red-600/98 z-[100] flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-200">
                    <ShieldQuestion size={32} className="mb-2" />
                    <p className="font-bold mb-4 text-sm">기록을 삭제하시려면 교사 비밀번호를 입력해주세요.</p>
                    <input 
                      type="password" 
                      value={passInput}
                      onChange={e => setPassInput(e.target.value)}
                      placeholder="교사 비밀번호 입력"
                      className="w-full max-w-xs p-3 bg-white/20 border-2 border-white/30 rounded-xl text-center font-bold mb-4 outline-none focus:bg-white/40"
                    />
                    <div className="flex gap-4 w-full max-w-xs">
                      <button onClick={() => handleDelete(m.id)} className="flex-1 py-3 bg-white text-red-600 font-black rounded-xl shadow-lg">삭제</button>
                      <button onClick={() => { setDeleteTarget(null); setPassInput(''); }} className="flex-1 py-3 bg-red-400 text-white font-black rounded-xl">취소</button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">{m.match_date}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEdit(m)}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100"
                    >
                      <Edit size={12} /> 수정
                    </button>
                    <button 
                      onClick={() => setDeleteTarget(m.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100"
                    >
                      <Trash2 size={12} /> 삭제
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-around gap-2 mb-6 px-2">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] md:text-xs font-black text-slate-500 mb-1 truncate">{t1?.name || '삭제된 팀'}</p>
                    <p className={`text-4xl md:text-5xl font-black ${m.score1 > m.score2 ? 'text-blue-600' : 'text-slate-300'}`}>
                      {m.score1}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1 mt-3">
                      {(m.bonus_details1 || []).map((b, i) => (
                        <span key={i} className="text-[8px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-bold">#{b}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-lg md:text-xl font-black text-slate-200">VS</div>
                  
                  <div className="flex-1 text-center">
                    <p className="text-[10px] md:text-xs font-black text-slate-500 mb-1 truncate">{t2?.name || '삭제된 팀'}</p>
                    <p className={`text-4xl md:text-5xl font-black ${m.score2 > m.score1 ? 'text-red-600' : 'text-slate-300'}`}>
                      {m.score2}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1 mt-3">
                      {(m.bonus_details2 || []).map((b, i) => (
                        <span key={i} className="text-[8px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">#{b}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {m.strategy_memo && (
                  <div className="pt-5 border-t border-slate-50">
                    <p className="text-xs text-slate-500 leading-relaxed italic text-center font-medium">“{m.strategy_memo}”</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MatchHistory;
